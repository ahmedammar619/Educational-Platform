import { useState, useEffect } from 'react';
import zoomService from '../../../services/zoomService';
import { materialsService } from '../../../services';
import { Edit, Trash2, Calendar, User, Users, Play, Square, X } from 'lucide-react';

const ZoomTab = ({ currentUser, theme, courseId }) => {
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

  // Check if students can join a meeting (10 minutes before start time)
  const canStudentJoin = (meeting) => {
    // If user is not a student, they can always join
    if (currentUser?.role !== 'student') return true;
    
    // If meeting is ended or cancelled, students cannot join
    const status = getMeetingStatus(meeting);
    if (status === 'ended' || status === 'cancelled') return false;
    
    // If meeting is live, students can join
    if (status === 'live') return true;
    
    // For upcoming meetings, check if it's within 10 minutes of start time
    if (status === 'upcoming' || status === 'scheduled') {
      if (!meeting.date || !meeting.time || !meeting.period) return false;
      
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
      
      // Calculate 10 minutes before meeting start
      const tenMinutesBefore = new Date(meetingDateTime.getTime() - 10 * 60000);
      
      // Students can join if current time is within 10 minutes of start time
      return now >= tenMinutesBefore;
    }
    
    return false;
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
          ...newMeeting,
          courseId: courseId
        };

        if (editingMeeting) {
          // Update existing meeting
          const updatedMeeting = await zoomService.updateMeeting(editingMeeting.id, meetingData);
          
          // Update the meeting in the list
          setMeetings(meetings.map(m => 
            m.id === editingMeeting.id ? updatedMeeting : m
          ));
          
          // Reset editing state
          setEditingMeeting(null);
        } else {
          // Create new meeting
          const createdMeeting = await zoomService.createMeeting(meetingData);
          
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
      alert('This meeting has already ended.');
      return;
    }
    
    // Check if students can join (10-minute rule)
    if (!canStudentJoin(meeting)) {
      alert('You can only join this meeting 10 minutes before it starts.');
      return;
    }
    
    try {
      // Track join count in backend and pass courseId for attendance marking
      // The backend should handle unique student counting
      const updatedMeeting = await zoomService.joinMeeting(meeting.id, courseId);
      
      // Update local state
      setMeetings(meetings.map(m => 
        m.id === meeting.id ? updatedMeeting : m
      ));
      
      // Determine which URL to use based on user role
      const isCreator = meeting.createdBy?.id === currentUser?.id || canManageZoom();
      const meetingUrl = isCreator && meeting.zoomStartUrl ? meeting.zoomStartUrl : meeting.invitationLink;
      
      // If this is the creator/admin and they haven't started this meeting before, mark it as started
      if (isCreator && !startedMeetings.has(meeting.id)) {
        setStartedMeetings(prev => new Set([...prev, meeting.id]));
      }
      
      // Open meeting link
      window.open(meetingUrl, '_blank');
    } catch (error) {
      console.error('Error joining meeting:', error);
      // Still open the link even if tracking fails
      const isCreator = meeting.createdBy?.id === currentUser?.id || canManageZoom();
      const meetingUrl = isCreator && meeting.zoomStartUrl ? meeting.zoomStartUrl : meeting.invitationLink;
      
      // If this is the creator/admin and they haven't started this meeting before, mark it as started
      if (isCreator && !startedMeetings.has(meeting.id)) {
        setStartedMeetings(prev => new Set([...prev, meeting.id]));
      }
      
      window.open(meetingUrl, '_blank');
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

  // Note: Attendance records are now created automatically when Zoom meetings are created
  // No need to initialize attendance records for course sessions
  // useEffect(() => {
  //   if (courseId && currentUser?.role === 'admin') {
  //     initializeAttendanceRecords();
  //   }
  // }, [courseId, currentUser]);

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
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-gray-900 mb-3">
              {editingMeeting ? 'Edit Zoom Meeting' : 'Create New Zoom Meeting'}
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              {editingMeeting 
                ? 'Update the meeting details below. The Zoom meeting link and password will remain the same.'
                : 'A Zoom meeting will be automatically created with a join link and password. Students will receive notifications about the meeting.'
              }
            </p>
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Meeting Title *"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              </div>
              
              <input
                type="text"
                placeholder="Description (optional)"
                value={newMeeting.description}
                onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <div className="flex gap-3">
                {/* Date Input */}
                <div className="flex-1 relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={newMeeting.date}
                      onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                      className={`w-full px-3 py-2 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.date ? 'border-red-500' : 'border-gray-300'
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
                        onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
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
                        onChange={(e) => setNewMeeting({ ...newMeeting, period: e.target.value })}
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
                    setEditingMeeting(null); // Reset editing state
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
                  {loading 
                    ? (editingMeeting ? 'Updating Meeting...' : 'Creating Zoom Meeting...') 
                    : (editingMeeting ? 'Update Meeting' : 'Create Zoom Meeting')
                  }
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
              
              // Debug logging to understand the meeting creator issue
              console.log('Meeting data:', {
                id: meeting.id,
                title: meeting.title,
                createdById: meeting.createdBy?.id,
                currentUserId: currentUser?.id,
                isCreator: meeting.createdBy?.id === currentUser?.id,
                canManage: canManageZoom(),
                status: status
              });
              
              return (
                <div key={meeting.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{meeting.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${statusColors[status]}`}>
                            {status === 'upcoming' ? 'Upcoming' : 
                             status === 'live' ? 'Live Now' : 
                             status === 'ended' ? 'Ended' : 
                             status === 'cancelled' ? 'Cancelled' : 'Scheduled'}
                          </span>
                        </div>
                        
                        {meeting.description && (
                          <p className="text-gray-600 text-sm mb-2">{meeting.description}</p>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 sm:ml-4">
                        {/* Management buttons - only visible to teachers and admins */}
                        {canManageZoom() && (
                          <>
                            <button
                              onClick={() => handleEditMeeting(meeting)}
                              className="text-blue-600 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
                              title="Edit Meeting"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMeeting(meeting.id)}
                              className="text-red-600 px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
                              title="Delete Meeting"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Single row with time/teacher at start and buttons at end - Full width */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-4">
                            {meeting.date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{meeting.date} {meeting.time} {meeting.period}</span>
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{meeting.createdBy && meeting.createdBy.firstName && meeting.createdBy.lastName 
                                ? `${meeting.createdBy.firstName} ${meeting.createdBy.lastName}` 
                                : 'Host'}</span>
                            </span>
                            {meeting.joinCount > 0 && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3 flex-shrink-0" />
                                <span>{meeting.joinCount} joined</span>
                              </span>
                            )}
                          </div>
                          
                          {/* Start/End Meeting buttons at the end */}
                          <div className="flex items-center gap-2">
                            {/* Main action button - Start Meeting (first time) or Join Meeting (subsequent) for creator, Join Now for others */}
                            {(meeting.createdBy?.id === currentUser?.id || canManageZoom()) ? (
                              // Meeting creator or admin sees Start Meeting (first time) or Join Meeting (subsequent)
                              <button
                                onClick={() => handleJoinMeeting(meeting)}
                                disabled={status === 'ended' || status === 'cancelled'}
                                className={`px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 text-sm border-2 ${status === 'ended' || status === 'cancelled'
                                    ? 'border-gray-300 text-gray-500 cursor-not-allowed bg-gray-50'
                                    : 'border-blue-600 text-blue-600 hover:bg-blue-50'
                                  }`}
                              >
                                <Play className="w-4 h-4" />
                                {status === 'ended' ? 'Ended' :
                                  status === 'cancelled' ? 'Cancelled' : 
                                  startedMeetings.has(meeting.id) ? 'Join Meeting' : 'Start Meeting'}
                              </button>
                            ) : (
                              // Other users see Join Now button
                              <button
                                onClick={() => handleJoinMeeting(meeting)}
                                disabled={status === 'ended' || status === 'cancelled' || !canStudentJoin(meeting)}
                                className={`px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 text-sm border-2 ${status === 'ended' || status === 'cancelled' || !canStudentJoin(meeting)
                                    ? 'border-gray-300 text-gray-500 cursor-not-allowed bg-gray-50'
                                    : 'border-green-600 text-green-600 hover:bg-green-50'
                                  }`}
                              >
                                <Play className="w-4 h-4" />
                                {status === 'ended' ? 'Ended' :
                                  status === 'cancelled' ? 'Cancelled' : 
                                  !canStudentJoin(meeting) ? 'Join Soon' : 'Join Now'}
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
                                className={`px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 text-sm border-2 ${status === 'ended' || status === 'cancelled'
                                    ? 'border-gray-300 text-gray-500 cursor-not-allowed bg-gray-50'
                                    : status === 'upcoming' || status === 'scheduled'
                                      ? 'border-red-600 text-red-600 hover:bg-red-50'
                                      : 'border-orange-600 text-orange-600 hover:bg-orange-50'
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
                                    status === 'upcoming' || status === 'scheduled' ? 'Cancel Meeting' :
                                      'End Meeting'}
                              </button>
                            )}
                          </div>
                    </div>
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
    </div>
  );
};

export default ZoomTab;
