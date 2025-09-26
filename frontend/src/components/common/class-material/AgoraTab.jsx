import { useState, useEffect } from 'react';
import agoraService from '../../../services/agoraService';
import { materialsService } from '../../../services';
import { Edit, Trash2, Calendar, User, Users, Play, Square, X, Video, Mic, MicOff, VideoOff, Monitor } from 'lucide-react';
import { ConfirmationDialog, AlertDialog } from '../../ui';
import useConfirmation from '../../../hooks/useConfirmation';
import useAlert from '../../../hooks/useAlert';
import AgoraMeetingRoom from '../../meetings/AgoraMeetingRoom';

const AgoraTab = ({ currentUser, theme, courseId }) => {
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();
  const { alertState, showAlert, hideAlert } = useAlert();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [startedMeetings, setStartedMeetings] = useState(new Set());
  const [showMeetingRoom, setShowMeetingRoom] = useState(false);
  const [currentMeetingId, setCurrentMeetingId] = useState(null);
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    period: 'AM'
  });
  const [errors, setErrors] = useState({});
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Role-based access control functions
  const canManageAgora = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'teacher';
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
    if (meeting.status === 'ended') return 'ended';
    if (meeting.status === 'cancelled') return 'cancelled';
    if (meeting.status === 'started') return 'live';
    
    if (!meeting.date || !meeting.time || !meeting.period) return 'scheduled';
    
    const now = new Date();
    const [hours, minutes] = meeting.time.split(':').map(Number);
    let hour24 = hours;
    
    if (meeting.period === 'PM' && hours !== 12) {
      hour24 = hours + 12;
    } else if (meeting.period === 'AM' && hours === 12) {
      hour24 = 0;
    }
    
    const meetingDateTime = new Date(meeting.date);
    meetingDateTime.setHours(hour24, minutes, 0, 0);
    
    if (now < meetingDateTime) return 'upcoming';
    if (now >= meetingDateTime) return 'live';
    
    return 'scheduled';
  };

  // Load meetings
  const loadMeetings = async () => {
    setLoading(true);
    try {
      const data = await agoraService.getMeetingsByCourse(courseId);
      setMeetings(data);
    } catch (error) {
      console.error('Error loading meetings:', error);
      showAlert('error', 'Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, [courseId]);

  // Handle create/edit meeting
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors = {};
    if (!newMeeting.title.trim()) newErrors.title = 'Title is required';
    if (!newMeeting.date) newErrors.date = 'Date is required';
    if (!newMeeting.time) newErrors.time = 'Time is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const meetingData = {
        ...newMeeting,
        courseId: courseId
      };

      if (editingMeeting) {
        await agoraService.updateMeeting(editingMeeting.id, meetingData);
        showAlert('success', 'Meeting updated successfully');
      } else {
        await agoraService.createMeeting(meetingData);
        showAlert('success', 'Meeting created successfully');
      }

      setShowCreateForm(false);
      setEditingMeeting(null);
      setNewMeeting({ title: '', description: '', date: '', time: '', period: 'AM' });
      loadMeetings();
    } catch (error) {
      console.error('Error saving meeting:', error);
      showAlert('error', 'Failed to save meeting');
    }
  };

  // Handle delete meeting
  const handleDelete = async (meetingId) => {
    try {
      await agoraService.deleteMeeting(meetingId);
      showAlert('success', 'Meeting deleted successfully');
      loadMeetings();
    } catch (error) {
      console.error('Error deleting meeting:', error);
      showAlert('error', 'Failed to delete meeting');
    }
  };

  // Handle start meeting
  const handleStartMeeting = async (meetingId) => {
    try {
      await agoraService.startMeeting(meetingId);
      setStartedMeetings(prev => new Set([...prev, meetingId]));
      showAlert('success', 'Meeting started successfully');
      loadMeetings();
    } catch (error) {
      console.error('Error starting meeting:', error);
      showAlert('error', 'Failed to start meeting');
    }
  };

  // Handle end meeting
  const handleEndMeeting = async (meetingId) => {
    try {
      await agoraService.endMeeting(meetingId);
      setStartedMeetings(prev => {
        const newSet = new Set(prev);
        newSet.delete(meetingId);
        return newSet;
      });
      showAlert('success', 'Meeting ended successfully');
      loadMeetings();
    } catch (error) {
      console.error('Error ending meeting:', error);
      showAlert('error', 'Failed to end meeting');
    }
  };

  // Handle cancel meeting
  const handleCancelMeeting = async (meetingId) => {
    try {
      await agoraService.cancelMeeting(meetingId);
      showAlert('success', 'Meeting cancelled successfully');
      loadMeetings();
    } catch (error) {
      console.error('Error cancelling meeting:', error);
      showAlert('error', 'Failed to cancel meeting');
    }
  };

  // Handle join meeting
  const handleJoinMeeting = async (meetingId) => {
    try {
      await agoraService.joinMeeting(meetingId, courseId);
      // Show meeting room modal
      setCurrentMeetingId(meetingId);
      setShowMeetingRoom(true);
    } catch (error) {
      console.error('Error joining meeting:', error);
      showAlert('error', 'Failed to join meeting');
    }
  };

  // Handle leaving meeting room
  const handleLeaveMeetingRoom = () => {
    setShowMeetingRoom(false);
    setCurrentMeetingId(null);
  };

  // Edit meeting
  const handleEdit = (meeting) => {
    setEditingMeeting(meeting);
    setNewMeeting({
      title: meeting.title,
      description: meeting.description || '',
      date: meeting.date || '',
      time: meeting.time || '',
      period: meeting.period || 'AM'
    });
    setShowCreateForm(true);
  };

  // Filter meetings
  const filteredMeetings = meetings.filter(meeting => {
    const status = getMeetingStatus(meeting);
    
    if (filter === 'all') return true;
    if (filter === 'upcoming') return status === 'upcoming';
    if (filter === 'live') return status === 'live';
    if (filter === 'ended') return status === 'ended';
    
    return true;
  }).filter(meeting => {
    if (!searchTerm) return true;
    return meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (meeting.description && meeting.description.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'live': return 'bg-green-100 text-green-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!canManageAgora() && meetings.length === 0) {
    return (
      <div className="text-center py-8">
        <Video className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Agora Meetings</h3>
        <p className="text-gray-500">No video meetings have been scheduled for this course yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Agora Video Meetings</h2>
          <p className="text-sm text-gray-600">Schedule and manage video conferencing sessions</p>
        </div>
        
        {canManageAgora() && (
          <button
            onClick={() => setShowCreateForm(true)}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-${theme.primary}-600 hover:bg-${theme.primary}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${theme.primary}-500`}
          >
            <Video className="w-4 h-4 mr-2" />
            Create Meeting
          </button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search meetings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'upcoming', 'live', 'ended'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-3 py-2 text-sm font-medium rounded-md capitalize ${
                filter === filterOption
                  ? `bg-${theme.primary}-100 text-${theme.primary}-700 border border-${theme.primary}-300`
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {filterOption}
            </button>
          ))}
        </div>
      </div>

      {/* Meetings List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading meetings...</p>
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="text-center py-8">
          <Video className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings found</h3>
          <p className="text-gray-500">
            {filter === 'all' ? 'No meetings have been created yet.' : `No ${filter} meetings found.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredMeetings.map((meeting) => {
            const status = getMeetingStatus(meeting);
            const isStarted = startedMeetings.has(meeting.id);
            const canManage = canManageAgora() && meeting.createdById === currentUser.id;
            
            return (
              <div key={meeting.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(status)}`}>
                        {status}
                      </span>
                    </div>
                    
                    {meeting.description && (
                      <p className="text-gray-600 mb-3">{meeting.description}</p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      {meeting.date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(meeting.date).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      {meeting.time && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{meeting.time} {meeting.period}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>Created by {meeting.createdBy?.name || 'Unknown'}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{meeting.joinCount} joined</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {/* Join/Start/End buttons */}
                    {status === 'live' || status === 'upcoming' ? (
                      <button
                        onClick={() => handleJoinMeeting(meeting.id)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <Video className="w-4 h-4 mr-1" />
                        Join
                      </button>
                    ) : null}
                    
                    {canManage && (
                      <>
                        {status === 'upcoming' && (
                          <button
                            onClick={() => handleStartMeeting(meeting.id)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Start
                          </button>
                        )}
                        
                        {status === 'live' && (
                          <button
                            onClick={() => handleEndMeeting(meeting.id)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <Square className="w-4 h-4 mr-1" />
                            End
                          </button>
                        )}
                        
                        {status === 'upcoming' && (
                          <button
                            onClick={() => showConfirmation(
                              'Cancel Meeting',
                              'Are you sure you want to cancel this meeting? This action cannot be undone.',
                              () => handleCancelMeeting(meeting.id)
                            )}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleEdit(meeting)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => showConfirmation(
                            'Delete Meeting',
                            'Are you sure you want to delete this meeting? This action cannot be undone.',
                            () => handleDelete(meeting.id)
                          )}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Meeting Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingMeeting ? 'Edit Meeting' : 'Create New Meeting'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newMeeting.title}
                    onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter meeting title"
                  />
                  {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newMeeting.description}
                    onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter meeting description (optional)"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={newMeeting.date}
                      onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time *
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={newMeeting.time}
                        onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
                        className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.time ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select time</option>
                        {generateTimeOptions().map((time) => (
                          <option key={time.value} value={time.value}>
                            {time.label}
                          </option>
                        ))}
                      </select>
                      
                      <select
                        value={newMeeting.period}
                        onChange={(e) => setNewMeeting({ ...newMeeting, period: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                    {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time}</p>}
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingMeeting(null);
                      setNewMeeting({ title: '', description: '', date: '', time: '', period: 'AM' });
                      setErrors({});
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {editingMeeting ? 'Update' : 'Create'} Meeting
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationState.isOpen}
        title={confirmationState.title}
        message={confirmationState.message}
        onConfirm={handleConfirm}
        onCancel={hideConfirmation}
      />

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertState.isOpen}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onClose={hideAlert}
      />

      {/* Agora Meeting Room Modal */}
      {showMeetingRoom && currentMeetingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative w-full h-full max-w-7xl mx-auto">
            <AgoraMeetingRoom
              meetingId={currentMeetingId}
              user={currentUser}
              onLeave={handleLeaveMeetingRoom}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AgoraTab;
