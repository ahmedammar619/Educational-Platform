import { useState, useEffect } from 'react';
import { announcementsService, zoomService } from '../../../services';
import { Edit, Trash2, Calendar, User, Users, Play, Square, X } from 'lucide-react';
import { ConfirmationDialog, AlertDialog } from '../../ui';
import useConfirmation from '../../../hooks/useConfirmation';
import useAlert from '../../../hooks/useAlert';

const AnnouncementsZoomTab = ({ currentUser, theme }) => {
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();
  const { alertState, showAlert, hideAlert } = useAlert();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null); // Track which meeting is being edited
  const [startedMeetings, setStartedMeetings] = useState(new Set()); // Track which meetings have been started
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    period: 'AM'
  });
  const [errors, setErrors] = useState({});
  const [filter, setFilter] = useState('all'); // all, upcoming, live, ended
  const [searchTerm, setSearchTerm] = useState('');

  // Role-based access control functions - Only admin can manage
  const canManageZoom = () => {
    return currentUser?.role === 'admin';
  };

  // Generate time options dynamically
  const generateTimeOptions = () => {
    const times = [];
    
    // Add 12:00 and 12:30 first
    times.push({ value: '12:00', label: '12:00' });
    times.push({ value: '12:30', label: '12:30' });
    
    // Add 1:00 to 11:30
    for (let hour = 1; hour <= 11; hour++) {
      times.push({ value: `${hour.toString().padStart(2, '0')}:00`, label: `${hour.toString().padStart(2, '0')}:00` });
      times.push({ value: `${hour.toString().padStart(2, '0')}:30`, label: `${hour.toString().padStart(2, '0')}:30` });
    }
    
    return times;
  };

  // Meeting status calculation
  const getMeetingStatus = (meeting) => {
    if (!meeting.date || !meeting.time || !meeting.period) return 'scheduled';
    
    // If meeting was manually ended or cancelled, keep it as is
    if (meeting.status === 'ended') return 'ended';
    if (meeting.status === 'cancelled') return 'cancelled';
    
    const now = new Date();
    
    // Parse time with AM/PM period
    const [hours, minutes] = meeting.time.split(':').map(Number);
    let hour24 = hours;
    
    if (meeting.period === 'PM' && hours !== 12) {
      hour24 = hours + 12;
    } else if (meeting.period === 'AM' && hours === 12) {
      hour24 = 0;
    }
    
    // Create meeting datetime
    const meetingDateTime = new Date(meeting.date);
    meetingDateTime.setHours(hour24, minutes, 0, 0);
    
    // Only check if meeting has started, not when it should end
    // Meeting continues until manually ended
    if (now < meetingDateTime) return 'upcoming';
    if (now >= meetingDateTime) return 'live';
    
    return 'scheduled';
  };

  // Validate meeting form
  const validateMeeting = (meeting) => {
    const errors = {};
    
    if (!meeting.title.trim()) {
      errors.title = 'Meeting title is required';
    }
    
    if (meeting.date && meeting.time) {
      const meetingDateTime = new Date(`${meeting.date}T${meeting.time}:00`);
      const now = new Date();
      // Allow meetings for today and future dates
      if (meetingDateTime < now.setHours(0, 0, 0, 0)) {
        errors.date = 'Meeting cannot be scheduled in the past';
      }
    }
    
    return errors;
  };

  // Handle creating a new meeting or updating an existing one
  const handleCreateMeeting = async () => {
    const validationErrors = validateMeeting(newMeeting);
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length === 0) {
      try {
        setLoading(true);
        const meetingData = {
          ...newMeeting
        };

        if (editingMeeting) {
          // Update existing meeting
          const updatedMeeting = await announcementsService.updateAnnouncementMeeting(editingMeeting.id, meetingData);
          
          // Update the meeting in the list
          setMeetings(meetings.map(m => 
            m.id === editingMeeting.id ? updatedMeeting : m
          ));
          
          // Reset editing state
          setEditingMeeting(null);
        } else {
          // Create new meeting
          const createdMeeting = await announcementsService.createAnnouncementMeeting(meetingData);
          
          // Ensure createdBy is populated with current user data if not present
          if (!createdMeeting.createdBy && currentUser) {
            createdMeeting.createdBy = {
              id: currentUser.id,
              firstName: currentUser.firstName,
              lastName: currentUser.lastName,
              email: currentUser.email,
              role: currentUser.role
            };
          }
          
          setMeetings([createdMeeting, ...meetings]);
        }
        
        // Reset form
        setNewMeeting({ 
          title: '', 
          description: '', 
          date: '', 
          time: '', 
          period: 'AM'
        });
        setShowCreateForm(false);
        setEditingMeeting(null); // Reset editing state
        setErrors({});
      } catch (error) {
        console.error('Error saving meeting:', error);
        setErrors({ general: `Failed to ${editingMeeting ? 'update' : 'create'} meeting. Please try again.` });
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle joining a meeting
  const handleJoinMeeting = async (meeting) => {
    const status = getMeetingStatus(meeting);
    
    if (status === 'ended') {
      showAlert({
        title: 'Meeting Ended',
        message: 'This meeting has already ended.',
        type: 'info'
      });
      return;
    }
    
    try {
      console.log('🎯 Joining announcement meeting:', {
        meetingId: meeting.id,
        currentUserId: currentUser?.id,
        currentUserRole: currentUser?.role
      });
      
      // Track join count in backend
      const updatedMeeting = await announcementsService.joinAnnouncementMeeting(meeting.id);
      
      // Update local state
      setMeetings(meetings.map(m => 
        m.id === meeting.id ? updatedMeeting : m
      ));
      
      // Determine which URL to use based on user role
      const isCreator = meeting.createdBy?.id === currentUser?.id || canManageZoom();
      const meetingUrl = isCreator && meeting.zoomStartUrl ? meeting.zoomStartUrl : meeting.invitationLink;
      
      // If this is the creator/admin and they haven't started this meeting before, call start meeting API
      if (isCreator && !startedMeetings.has(meeting.id)) {
        try {
          console.log('🚀 Starting announcement meeting and notifying users:', meeting.id);
          await announcementsService.startAnnouncementMeeting(meeting.id);
          setStartedMeetings(prev => new Set([...prev, meeting.id]));
          console.log('✅ Announcement meeting started successfully and users notified');
        } catch (error) {
          console.error('❌ Failed to start announcement meeting:', error);
          // Still mark as started locally even if API call fails
          setStartedMeetings(prev => new Set([...prev, meeting.id]));
        }
      }
      
      // Open meeting link
      window.open(meetingUrl, '_blank');
    } catch (error) {
      console.error('Error joining meeting:', error);
      // Still open the link even if tracking fails
      const isCreator = meeting.createdBy?.id === currentUser?.id || canManageZoom();
      const meetingUrl = isCreator && meeting.zoomStartUrl ? meeting.zoomStartUrl : meeting.invitationLink;
      
      // If this is the creator/admin and they haven't started this meeting before, call start meeting API
      if (isCreator && !startedMeetings.has(meeting.id)) {
        try {
          console.log('🚀 Starting announcement meeting and notifying users (error fallback):', meeting.id);
          await announcementsService.startAnnouncementMeeting(meeting.id);
          setStartedMeetings(prev => new Set([...prev, meeting.id]));
          console.log('✅ Announcement meeting started successfully and users notified (error fallback)');
        } catch (startError) {
          console.error('❌ Failed to start announcement meeting (error fallback):', startError);
          // Still mark as started locally even if API call fails
          setStartedMeetings(prev => new Set([...prev, meeting.id]));
        }
      }
      
      window.open(meetingUrl, '_blank');
    }
  };

  // Handle deleting a meeting
  const handleDeleteMeeting = async (meetingId) => {
    showConfirmation({
      title: 'Delete Meeting',
      message: 'Are you sure you want to delete this meeting?',
      type: 'danger',
      confirmText: 'Delete Meeting',
      confirmButtonVariant: 'danger',
      onConfirm: async () => {
        try {
          setLoading(true);
          await announcementsService.deleteAnnouncementMeeting(meetingId);
          setMeetings(meetings.filter(m => m.id !== meetingId));
        } catch (error) {
          console.error('Error deleting meeting:', error);
          showAlert({
            title: 'Error',
            message: 'Failed to delete meeting. Please try again.',
            type: 'error'
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Handle editing a meeting
  const handleEditMeeting = (meeting) => {
    setEditingMeeting(meeting); // Set the meeting being edited
    setNewMeeting({
      title: meeting.title,
      description: meeting.description || '',
      date: meeting.date || '',
      time: meeting.time || '',
      period: meeting.period || 'AM'
    });
    setShowCreateForm(true);
  };

  // Handle ending a meeting
  const handleEndMeeting = async (meetingId) => {
    showConfirmation({
      title: 'End Meeting',
      message: 'Are you sure you want to end this meeting?',
      type: 'warning',
      confirmText: 'End Meeting',
      confirmButtonVariant: 'warning',
      onConfirm: async () => {
        try {
          setLoading(true);
          const updatedMeeting = await announcementsService.endAnnouncementMeeting(meetingId);
          setMeetings(meetings.map(m => 
            m.id === meetingId ? updatedMeeting : m
          ));
        } catch (error) {
          console.error('Error ending meeting:', error);
          showAlert({
            title: 'Error',
            message: 'Failed to end meeting. Please try again.',
            type: 'error'
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Handle canceling a meeting
  const handleCancelMeeting = async (meetingId) => {
    showConfirmation({
      title: 'Cancel Meeting',
      message: 'Are you sure you want to cancel this meeting?',
      type: 'warning',
      confirmText: 'Cancel Meeting',
      confirmButtonVariant: 'warning',
      onConfirm: async () => {
        try {
          setLoading(true);
          const updatedMeeting = await announcementsService.cancelAnnouncementMeeting(meetingId);
          setMeetings(meetings.map(m => 
            m.id === meetingId ? updatedMeeting : m
          ));
        } catch (error) {
          console.error('Error canceling meeting:', error);
          showAlert({
            title: 'Error',
            message: 'Failed to cancel meeting. Please try again.',
            type: 'error'
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Load meetings from backend
  const loadMeetings = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (filter !== 'all') filters.status = filter;
      if (searchTerm) filters.search = searchTerm;
      // Don't set courseId filter - we'll filter on frontend for announcement meetings (courseId === null)
      
      const meetingsData = await announcementsService.getAnnouncementMeetings(filters);
      console.log('🔍 Announcement meetings from backend:', meetingsData);
      setMeetings(meetingsData);
    } catch (error) {
      console.error('Error loading meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter meetings based on status and search
  const getFilteredMeetings = () => {
    return meetings;
  };

  // Load meetings on component mount and when filters change
  useEffect(() => {
    loadMeetings();
  }, [filter, searchTerm]);

  // Auto-update meeting statuses (disabled when meetings are manually ended)
  useEffect(() => {
    const interval = setInterval(() => {
      // Only auto-refresh if there are no manually ended meetings
      const hasEndedMeetings = meetings.some(meeting => meeting.status === 'ended');
      
      if (!hasEndedMeetings) {
        // Safe to refresh - no manually ended meetings to preserve
        loadMeetings();
      }
      // If there are ended meetings, skip auto-refresh to preserve manual endings
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [meetings]);

  return (
    <div className="h-[700px] lg:h-[450px] flex flex-col">
      {/* Fixed height container with scroll */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2">

        {/* Create/Edit Meeting Form */}
        {showCreateForm && canManageZoom() && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 mb-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-full">
                <h4 className="text-xl text-center font-semibold text-gray-900">
                  {editingMeeting ? 'Edit Announcement Meeting' : 'Create New Announcement Meeting'}
                </h4>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Meeting Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  placeholder="Enter meeting title (e.g., Important School Announcement)"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.title ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  maxLength={100}
                />
                {errors.title && (
                  <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span>{errors.title}</span>
                  </div>
                )}
              </div>
              
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="Add meeting description, agenda, or special instructions..."
                  value={newMeeting.description}
                  onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
                  maxLength={500}
                />
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-gray-500">
                    {newMeeting.description.length}/500 characters
                  </span>
                </div>
              </div>
              
              {/* Date and Time Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Meeting Date *
                  </label>
                  <input
                    type="date"
                    value={newMeeting.date}
                    onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errors.date ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.date && (
                    <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span>{errors.date}</span>
                    </div>
                  )}
                </div>
                
                {/* Time Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Meeting Time *
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <select
                        value={newMeeting.time}
                        onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors appearance-none bg-white"
                      >
                        <option value="">Select time</option>
                        {generateTimeOptions().map((timeOption) => (
                          <option key={timeOption.value} value={timeOption.value}>
                            {timeOption.label}
                          </option>
                        ))}
                      </select>
                      <svg className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <div className="w-20">
                      <select
                        value={newMeeting.period || 'AM'}
                        onChange={(e) => setNewMeeting({ ...newMeeting, period: e.target.value })}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors appearance-none bg-white text-center font-medium"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                  {errors.time && (
                    <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span>{errors.time}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Meeting Preview */}
              {newMeeting.title && newMeeting.date && newMeeting.time && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-900 mb-2">Meeting Preview</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <p><strong>Title:</strong> {newMeeting.title}</p>
                        <p><strong>Date:</strong> {new Date(newMeeting.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</p>
                        <p><strong>Time:</strong> {newMeeting.time} {newMeeting.period} (Duration: Until manually ended)</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* General Error */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span>{errors.general}</span>
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingMeeting(null);
                    setErrors({});
                  }}
                  disabled={loading}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateMeeting}
                  disabled={loading}
                  className={`flex-1 px-6 py-3 bg-${theme.primary}-600 text-white rounded-lg hover:bg-${theme.primary}-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      {editingMeeting ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {editingMeeting ? 'Update Meeting' : 'Create Meeting'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Meetings List - Visible to all users */}
        <div className="space-y-3">
          {loading && meetings.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-500 text-sm">Loading meetings...</p>
            </div>
          ) : getFilteredMeetings().length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">
                {meetings.length === 0 
                  ? (canManageZoom() ? 'No announcement meetings created yet. Start by creating your first meeting!' : 'No announcement meetings available at the moment.')
                  : 'No meetings match your current filter.'
                }
              </p>
            </div>
          ) : (
            getFilteredMeetings().map((meeting) => {
              const status = getMeetingStatus(meeting);
              const statusColors = {
                upcoming: 'bg-blue-100 text-blue-800',
                live: 'bg-green-100 text-green-800',
                ended: 'bg-gray-100 text-gray-800',
                scheduled: 'bg-yellow-100 text-yellow-800',
                cancelled: 'bg-red-100 text-red-800'
              };
              
              // Debug logging to understand the meeting creator issue
              console.log('Announcement Meeting data:', {
                id: meeting.id,
                title: meeting.title,
                createdById: meeting.createdBy?.id,
                currentUserId: currentUser?.id,
                isCreator: meeting.createdBy?.id === currentUser?.id,
                canManage: canManageZoom(),
                status: status
              });
              
              return (
                <div key={meeting.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6">
                  {/* Header Section */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900 text-lg truncate">{meeting.title}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium w-fit flex-shrink-0 ${statusColors[status]}`}>
                          {status === 'upcoming' ? 'Upcoming' : 
                           status === 'live' ? 'Live Now' : 
                           status === 'ended' ? 'Ended' : 
                           status === 'cancelled' ? 'Cancelled' : 'Scheduled'}
                        </span>
                      </div>
                      
                      {meeting.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{meeting.description}</p>
                      )}
                    </div>
                    
                    {/* Management buttons - only visible to admins */}
                    {canManageZoom() && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleEditMeeting(meeting)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Meeting"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMeeting(meeting.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Meeting"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Meeting Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                    {meeting.date && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 flex-shrink-0 text-gray-400" />
                        <span className="truncate">{meeting.date} {meeting.time} {meeting.period}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4 flex-shrink-0 text-gray-400" />
                      <span className="truncate">{meeting.createdBy && meeting.createdBy.firstName && meeting.createdBy.lastName 
                        ? `${meeting.createdBy.firstName} ${meeting.createdBy.lastName}` 
                        : 'Host'}</span>
                    </div>
                    {meeting.joinCount > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4 flex-shrink-0 text-gray-400" />
                        <span>{meeting.joinCount} joined</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    {/* Main action button */}
                    {(meeting.createdBy?.id === currentUser?.id || canManageZoom()) ? (
                      <button
                        onClick={() => handleJoinMeeting(meeting)}
                        disabled={status === 'ended' || status === 'cancelled'}
                        className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium ${
                          status === 'ended' || status === 'cancelled'
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <Play className="w-4 h-4" />
                        {status === 'ended' ? 'Ended' :
                          status === 'cancelled' ? 'Cancelled' : 
                          startedMeetings.has(meeting.id) ? 'Join Meeting' : 'Start Meeting'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinMeeting(meeting)}
                        disabled={status === 'ended' || status === 'cancelled'}
                        className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium ${
                          status === 'ended' || status === 'cancelled'
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        <Play className="w-4 h-4" />
                        {status === 'ended' ? 'Ended' :
                          status === 'cancelled' ? 'Cancelled' : 'Join Now'}
                      </button>
                    )}

                    {/* Cancel/End Meeting button - only visible to meeting creator or admin */}
                    {(meeting.createdBy?.id === currentUser?.id || canManageZoom()) && (
                      <button
                        onClick={() => {
                          if (status === 'upcoming' || status === 'scheduled') {
                            handleCancelMeeting(meeting.id);
                          } else if (status === 'live') {
                            handleEndMeeting(meeting.id);
                          }
                        }}
                        disabled={status === 'ended' || status === 'cancelled'}
                        className={`px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium ${
                          status === 'ended' || status === 'cancelled'
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : status === 'upcoming' || status === 'scheduled'
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-orange-600 text-white hover:bg-orange-700'
                        }`}
                      >
                        {status === 'ended' ? (
                          <Square className="w-4 h-4" />
                        ) : status === 'cancelled' ? (
                          <X className="w-4 h-4" />
                        ) : status === 'upcoming' || status === 'scheduled' ? (
                          <X className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                        {status === 'ended' ? 'Ended' :
                          status === 'cancelled' ? 'Cancelled' :
                            status === 'upcoming' || status === 'scheduled' ? 'Cancel' :
                              'End'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom Zoom Actions - Fixed at bottom */}
      {canManageZoom() && (
        <div className="text-center pt-3 border-t border-gray-200">
          <div className="flex gap-3">
            <button 
              onClick={() => setShowCreateForm(true)}
              className={`px-3 py-2 border-2 border-${theme.primary}-600 text-${theme.primary}-600 rounded-lg hover:bg-${theme.primary}-50 transition-colors flex items-center gap-2`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Create A Meeting
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationState.isOpen}
        onClose={hideConfirmation}
        onConfirm={handleConfirm}
        title={confirmationState.title}
        message={confirmationState.message}
        type={confirmationState.type}
        confirmText={confirmationState.confirmText}
        cancelText={confirmationState.cancelText}
        confirmButtonVariant={confirmationState.confirmButtonVariant}
        isLoading={confirmationState.isLoading}
      />

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertState.isOpen}
        onClose={hideAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        buttonText={alertState.buttonText}
      />
    </div>
  );
};

export default AnnouncementsZoomTab;

