import { useState, useEffect } from 'react';
import zoomService from '../../../services/zoomService';
import { materialsService } from '../../../services';

const ZoomTab = ({ currentUser, theme, courseId }) => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
    invitationLink: '',
    date: '',
    time: '',
    period: 'AM'
  });
  const [errors, setErrors] = useState({});
  const [filter, setFilter] = useState('all'); // all, upcoming, live, ended
  const [searchTerm, setSearchTerm] = useState('');

  // Role-based access control functions
  const canManageZoom = () => {
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
    
    const endDateTime = new Date(meetingDateTime.getTime() + 60 * 60000); // Default 60 minutes
    
    if (now < meetingDateTime) return 'upcoming';
    if (now >= meetingDateTime && now <= endDateTime) return 'live';
    return 'ended';
  };

  // Validate meeting form
  const validateMeeting = (meeting) => {
    const errors = {};
    
    if (!meeting.title.trim()) {
      errors.title = 'Meeting title is required';
    }
    
    if (!meeting.invitationLink.trim()) {
      errors.invitationLink = 'Zoom invitation link is required';
    } else if (!meeting.invitationLink.includes('zoom.us')) {
      errors.invitationLink = 'Please enter a valid Zoom invitation link';
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

  // Handle creating a new meeting
  const handleCreateMeeting = async () => {
    const validationErrors = validateMeeting(newMeeting);
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length === 0) {
      try {
        setLoading(true);
        const meetingData = {
          ...newMeeting,
          courseId: courseId
        };
        const createdMeeting = await zoomService.createMeeting(meetingData);
        setMeetings([createdMeeting, ...meetings]);
        setNewMeeting({ 
          title: '', 
          description: '', 
          invitationLink: '', 
          date: '', 
          time: '', 
          period: 'AM'
        });
        setShowCreateForm(false);
        setErrors({});
      } catch (error) {
        console.error('Error creating meeting:', error);
        setErrors({ general: 'Failed to create meeting. Please try again.' });
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle joining a meeting
  const handleJoinMeeting = async (meeting) => {
    const status = getMeetingStatus(meeting);
    
    if (status === 'ended') {
      alert('This meeting has already ended.');
      return;
    }
    
    try {
      // Track join count in backend and pass courseId for attendance marking
      const updatedMeeting = await zoomService.joinMeeting(meeting.id, courseId);
      
      // Update local state
      setMeetings(meetings.map(m => 
        m.id === meeting.id ? updatedMeeting : m
      ));
      
      // Open meeting link
      window.open(meeting.invitationLink, '_blank');
    } catch (error) {
      console.error('Error joining meeting:', error);
      // Still open the link even if tracking fails
      window.open(meeting.invitationLink, '_blank');
    }
  };



  // Get course schedule for a specific date
  const getCourseScheduleForDate = (date) => {
    const dayOfWeek = new Date(date).getDay();
    
    // Map day numbers to day names and times (matching AttendanceTab schedule)
    const scheduleMap = {
      1: { day: 'Monday', time: '09:00-11:00' },    // Monday
      3: { day: 'Wednesday', time: '14:00-16:00' }, // Wednesday  
      5: { day: 'Friday', time: '10:00-12:00' }     // Friday
    };
    
    return scheduleMap[dayOfWeek] || null;
  };

  // Handle opening Zoom to create a meeting
  const handleOpenZoom = () => {
    window.open('https://zoom.us/meeting/schedule', '_blank');
  };

  // Handle deleting a meeting
  const handleDeleteMeeting = async (meetingId) => {
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      try {
        setLoading(true);
        await zoomService.deleteMeeting(meetingId);
        setMeetings(meetings.filter(m => m.id !== meetingId));
      } catch (error) {
        console.error('Error deleting meeting:', error);
        alert('Failed to delete meeting. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle editing a meeting
  const handleEditMeeting = (meeting) => {
    setNewMeeting({
      title: meeting.title,
      description: meeting.description || '',
      invitationLink: meeting.invitationLink,
      date: meeting.date || '',
      time: meeting.time || '',
      period: meeting.period || 'AM'
    });
    setShowCreateForm(true);
  };

  // Handle ending a meeting
  const handleEndMeeting = async (meetingId) => {
    if (window.confirm('Are you sure you want to end this meeting?')) {
      try {
        setLoading(true);
        const updatedMeeting = await zoomService.endMeeting(meetingId);
        setMeetings(meetings.map(m => 
          m.id === meetingId ? updatedMeeting : m
        ));
      } catch (error) {
        console.error('Error ending meeting:', error);
        alert('Failed to end meeting. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle canceling a meeting
  const handleCancelMeeting = async (meetingId) => {
    if (window.confirm('Are you sure you want to cancel this meeting?')) {
      try {
        setLoading(true);
        const updatedMeeting = await zoomService.cancelMeeting(meetingId);
        setMeetings(meetings.map(m => 
          m.id === meetingId ? updatedMeeting : m
        ));
      } catch (error) {
        console.error('Error canceling meeting:', error);
        alert('Failed to cancel meeting. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Load meetings from backend
  const loadMeetings = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (filter !== 'all') filters.status = filter;
      if (searchTerm) filters.search = searchTerm;
      if (courseId) filters.courseId = courseId;
      
      const meetingsData = await zoomService.getMeetings(filters);
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

  // Initialize attendance records for scheduled class days
  useEffect(() => {
    if (courseId && currentUser?.role === 'admin') {
      initializeAttendanceRecords();
    }
  }, [courseId, currentUser]);

  // Initialize attendance records for scheduled class days with all students absent
  const initializeAttendanceRecords = async () => {
    try {
      const today = new Date();
      const lastThreeSessions = getLastThreeSessions();
      
      for (const session of lastThreeSessions) {
        // Check if attendance record already exists for this date
        const existingAttendance = await materialsService.getCourseAttendance(courseId);
        const hasRecord = existingAttendance.some(record => record.date === session.date);
        
        if (!hasRecord) {
          // Get actual students enrolled in the course
          const students = await getCourseStudents();
          
          // Create attendance record with all students marked as absent
          const attendanceData = {
            date: session.date,
            day: session.day,
            time: session.time,
            students: students.map(student => ({
              id: student.id,
              name: `${student.firstName} ${student.lastName}`,
              status: 'absent'
            }))
          };
          
          await materialsService.markAttendance(courseId, attendanceData);
        }
      }
    } catch (error) {
      console.error('Error initializing attendance records:', error);
    }
  };

  // Get students enrolled in the course
  const getCourseStudents = async () => {
    try {
      return await materialsService.getCourseStudents(courseId);
    } catch (error) {
      console.error('Error getting course students:', error);
      return [];
    }
  };

  // Get the last 3 scheduled sessions including today if it's a scheduled class day (matching AttendanceTab logic)
  const getLastThreeSessions = () => {
    const today = new Date();
    const sessions = [];
    let currentDate = new Date(today);

    // First check if today is a scheduled class day
    const todayDayOfWeek = currentDate.getDay();
    const todayDateString = currentDate.toISOString().split('T')[0];
    
    if (todayDayOfWeek === 1) { // Monday
      sessions.push({
        day: 'Monday',
        time: '09:00-11:00',
        date: todayDateString
      });
    } else if (todayDayOfWeek === 3) { // Wednesday
      sessions.push({
        day: 'Wednesday',
        time: '14:00-16:00',
        date: todayDateString
      });
    } else if (todayDayOfWeek === 5) { // Friday
      sessions.push({
        day: 'Friday',
        time: '10:00-12:00',
        date: todayDateString
      });
    }

    // If we need more sessions, go back in time to find the remaining ones
    if (sessions.length < 3) {
      for (let i = 1; i <= 30; i++) { // Look back up to 30 days
        currentDate.setDate(currentDate.getDate() - 1);
        const dayOfWeek = currentDate.getDay();
        const dateString = currentDate.toISOString().split('T')[0];

        if (dayOfWeek === 1) { // Monday
          sessions.push({
            day: 'Monday',
            time: '09:00-11:00',
            date: dateString
          });
        } else if (dayOfWeek === 3) { // Wednesday
          sessions.push({
            day: 'Wednesday',
            time: '14:00-16:00',
            date: dateString
          });
        } else if (dayOfWeek === 5) { // Friday
          sessions.push({
            day: 'Friday',
            time: '10:00-12:00',
            date: dateString
          });
        }

        if (sessions.length >= 3) break;
      }
    }

    // Return the last 3 sessions in chronological order (oldest first)
    return sessions.reverse().slice(-3);
  };

  // Auto-update meeting statuses every minute
  useEffect(() => {
    const interval = setInterval(() => {
      loadMeetings();
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-[450px] flex flex-col">
      {/* Fixed height container with scroll */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2">
        {/* Zoom Actions for Teachers/Admins */}
        {canManageZoom() && (
          <div className="flex gap-3 justify-end mb-6">
            <button 
              onClick={handleOpenZoom}
              className={`px-4 py-2 border-2 border-${theme.primary}-600 text-${theme.primary}-600 rounded-lg hover:bg-${theme.primary}-50 transition-colors flex items-center gap-2 text-sm`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Start Meeting
            </button>
            <button 
              onClick={() => setShowCreateForm(true)}
              className={`px-4 py-2 border-2 border-${theme.primary}-600 text-${theme.primary}-600 rounded-lg hover:bg-${theme.primary}-50 transition-colors flex items-center gap-2 text-sm`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Meeting Link
            </button>
          </div>
        )}

        {/* Create Meeting Form */}
        {showCreateForm && canManageZoom() && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-gray-900 mb-3">Create New Meeting</h4>
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Meeting Title *"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({...newMeeting, title: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              </div>
              
              <input
                type="text"
                placeholder="Description (optional)"
                value={newMeeting.description}
                onChange={(e) => setNewMeeting({...newMeeting, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <div>
                <input
                  type="url"
                  placeholder="Zoom Invitation Link *"
                  value={newMeeting.invitationLink}
                  onChange={(e) => setNewMeeting({...newMeeting, invitationLink: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.invitationLink ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.invitationLink && <p className="text-red-500 text-xs mt-1">{errors.invitationLink}</p>}
              </div>
              
              <div className="flex gap-3">
                {/* Date Input */}
                <div className="flex-1 relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={newMeeting.date}
                      onChange={(e) => setNewMeeting({...newMeeting, date: e.target.value})}
                      className={`w-full px-3 py-2 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                </div>
                
                {/* Time Input */}
                <div className="flex-1 relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <select
                        value={newMeeting.time}
                        onChange={(e) => setNewMeeting({...newMeeting, time: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                      >
                        <option value="">Select time</option>
                        {generateTimeOptions().map((timeOption) => (
                          <option key={timeOption.value} value={timeOption.value}>
                            {timeOption.label}
                          </option>
                        ))}
                      </select>
                      <svg className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <div className="w-20">
                      <select
                        value={newMeeting.period || 'AM'}
                        onChange={(e) => setNewMeeting({...newMeeting, period: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              

              
              {errors.general && (
                <div className="text-red-500 text-sm text-center">{errors.general}</div>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setErrors({});
                  }}
                  disabled={loading}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateMeeting}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Meeting'}
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
                  ? (canManageZoom() ? 'No meetings created yet. Start by creating your first meeting!' : 'No meetings available at the moment.')
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
              
              return (
                <div key={meeting.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{meeting.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
                          {status === 'upcoming' ? 'Upcoming' : 
                           status === 'live' ? 'Live Now' : 
                           status === 'ended' ? 'Ended' : 
                           status === 'cancelled' ? 'Cancelled' : 'Scheduled'}
                        </span>
                      </div>
                      
                      {meeting.description && (
                        <p className="text-gray-600 text-sm mb-2">{meeting.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                        {meeting.date && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {meeting.date} {meeting.time} {meeting.period}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {meeting.createdBy ? `${meeting.createdBy.firstName} ${meeting.createdBy.lastName}` : 'Host'}
                        </span>
                        {meeting.joinCount > 0 && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            {meeting.joinCount} joined
                          </span>
                        )}
                      </div>
                      

                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {/* Main action button - different for creator vs other users */}
                      {meeting.createdBy?.id === currentUser?.id ? (
                        // Meeting creator sees Cancel/End Meeting button based on status
                        <button
                          onClick={() => {
                            if (status === 'upcoming' || status === 'scheduled') {
                              handleCancelMeeting(meeting.id);
                            } else if (status === 'live') {
                              handleEndMeeting(meeting.id);
                            }
                          }}
                          disabled={status === 'ended' || status === 'cancelled'}
                          className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 text-sm ${
                            status === 'ended' || status === 'cancelled'
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                              : status === 'upcoming' || status === 'scheduled'
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-orange-600 text-white hover:bg-orange-700'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {status === 'ended' ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            ) : status === 'cancelled' ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : status === 'upcoming' || status === 'scheduled' ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            )}
                          </svg>
                          {status === 'ended' ? 'Ended' : 
                           status === 'cancelled' ? 'Cancelled' :
                           status === 'upcoming' || status === 'scheduled' ? 'Cancel Meeting' : 
                           'End Meeting'}
                        </button>
                      ) : (
                        // Other users see Join Now button
                        <button
                          onClick={() => handleJoinMeeting(meeting)}
                          disabled={status === 'ended' || status === 'cancelled'}
                          className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 text-sm ${
                            status === 'ended' || status === 'cancelled'
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          {status === 'ended' ? 'Ended' : 
                           status === 'cancelled' ? 'Cancelled' : 'Join Now'}
                        </button>
                      )}
                      
                      {/* Management buttons - only visible to teachers and admins */}
                      {canManageZoom() && (
                        <>
                          <button
                            onClick={() => handleEditMeeting(meeting)}
                            className="bg-blue-600 text-white px-2 py-1 rounded-md hover:bg-blue-700 transition-colors"
                            title="Edit Meeting"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteMeeting(meeting.id)}
                            className="bg-red-600 text-white px-2 py-1 rounded-md hover:bg-red-700 transition-colors"
                            title="Delete Meeting"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ZoomTab;
