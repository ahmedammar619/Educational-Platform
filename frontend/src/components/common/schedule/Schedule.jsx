import { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, MapPin, User, Filter, ChevronLeft, ChevronRight, BookOpen, Users, GraduationCap, RefreshCw } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, parseISO, addDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { studentsService, teachersService, parentsService } from '../../../services';
import { showErrorToast } from '../../../utils/errorHandler';
import { AlertDialog, ConfirmationDialog } from '../../ui';
import useAlert from '../../../hooks/useAlert';
import useConfirmation from '../../../hooks/useConfirmation';
import { useTimezone } from '../../../hooks/useTimezone';
import { convertTimeByOffset } from '../../../utils/timezoneUtils';

const Schedule = ({ user, userRole }) => {
  const { alertState, showAlert, hideAlert } = useAlert();
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();
  const { timezoneInfo, toLocalTime, formatMeetingDateTime } = useTimezone();
  
  const [schedule, setSchedule] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState('timeGridWeek');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [childrenSummary, setChildrenSummary] = useState([]);
  const [selectedChildFilter, setSelectedChildFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  const calendarRef = useRef(null);
  const carouselRef = useRef(null);


  useEffect(() => {
    if (user) {
      const config = getRoleConfig();
      config.loadData();
    }
  }, [user, userRole]);

  // Calculate dynamic time range based on actual sessions in the current week
  const calculateDynamicTimeRange = (events) => {
    if (!events || events.length === 0) {
      return { minTime: '08:00:00', maxTime: '20:00:00' };
    }

    let earliestHour = 23;
    let latestHour = 0;

    events.forEach(event => {
      let startTime, endTime;
      
      // Use timezone-converted times if available
      if (toLocalTime && timezoneInfo?.timezone) {
        try {
          startTime = new Date(event.start_time);
          endTime = new Date(event.end_time);
        } catch (error) {
          startTime = new Date(event.start_time);
          endTime = new Date(event.end_time);
        }
      } else {
        startTime = new Date(event.start_time);
        endTime = new Date(event.end_time);
      }
      
      const startHour = startTime.getHours();
      const endHour = endTime.getHours();

      if (startHour < earliestHour) {
        earliestHour = startHour;
      }

      if (endHour > latestHour) {
        latestHour = endHour;
      }
    });

    const minTime = `${earliestHour.toString().padStart(2, '0')}:00:00`;
    const maxTime = `${latestHour.toString().padStart(2, '0')}:00:00`;

    return { minTime, maxTime };
  };

  // Load schedule data based on user role
  const loadStudentSchedule = async () => {
    setLoading(true);
    try {
      if (!user || !user.id) {
        setSchedule([]);
        setCourses([]);
        return;
      }

      const studentClasses = await studentsService.getStudentClasses(user.id);
      if (!studentClasses || studentClasses.length === 0) {
        setSchedule([]);
        setCourses([]);
        return;
      }

      const enrolledCourses = [];
      studentClasses.forEach(classItem => {
        if (classItem.courses && classItem.courses.length > 0) {
          enrolledCourses.push(...classItem.courses.map(course => ({
            ...course,
            classId: classItem.id,
            className: classItem.name,
            classStartDate: classItem.startDate,
            classEndDate: classItem.endDate
          })));
        }
      });

      const courseEvents = convertCoursesToEvents(enrolledCourses);
      const sortedEvents = courseEvents.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

      setSchedule(sortedEvents);
      setCourses(enrolledCourses);
    } catch (error) {
      console.error('Error loading student schedule:', error);
      showErrorToast(error, 'Failed to load schedule. Please try again.');
      setSchedule([]);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTeacherSchedule = async () => {
    setLoading(true);
    try {
      if (!user || !user.id) {
        setSchedule([]);
        setCourses([]);
        return;
      }

      const response = await teachersService.getTeacherClasses();
      
      let classesArray = [];
      
      if (Array.isArray(response)) {
        classesArray = response;
      } else if (response && typeof response === 'object') {
        if (response.classes && Array.isArray(response.classes)) {
          classesArray = response.classes;
        } else {
          classesArray = Object.values(response).filter(item => 
            item && typeof item === 'object' && item.id && !item._rateLimitInfo
          );
        }
      }

      if (classesArray.length === 0) {
        setSchedule([]);
        setCourses([]);
        return;
      }

      const allCourses = [];
      classesArray.forEach(classItem => {
        if (classItem.courses && Array.isArray(classItem.courses)) {
          classItem.courses.forEach(course => {
            allCourses.push({
              ...course,
              classInfo: {
                id: classItem.id,
                name: classItem.name,
                startDate: classItem.startDate,
                endDate: classItem.endDate
              }
            });
          });
        }
      });

      const courseEvents = convertCoursesToEvents(allCourses);

      const sortedEvents = courseEvents.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

      setSchedule(sortedEvents);
      setCourses(allCourses);
    } catch (error) {
      console.error('Error loading teacher schedule:', error);
      showErrorToast(error, 'Failed to load schedule. Please try again.');
      setSchedule([]);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadParentSchedule = async (forceRefresh = false) => {
    if (refreshing && !forceRefresh) return;
    
    setLoading(true);
    setRefreshing(true);
    
    try {
      if (!user || !user.id) {
        setSchedule([]);
        setCourses([]);
        setChildrenSummary([]);
        return;
      }

      const response = await parentsService.getMyChildrenDetailed(user.id);
      const children = response?.children || response?.data || [];

      if (children.length === 0) {
        setSchedule([]);
        setCourses([]);
        setChildrenSummary([]);
        return;
      }

      const childrenSummaryData = children.map(child => ({
        id: child.id,
        name: `${child.firstName} ${child.lastName}`,
        email: child.email
      }));

      setChildrenSummary(childrenSummaryData);

      const allCourses = [];
      children.forEach(child => {
        if (child.classes && Array.isArray(child.classes)) {
          child.classes.forEach(classItem => {
            if (classItem.courses && Array.isArray(classItem.courses)) {
              classItem.courses.forEach(course => {
                allCourses.push({
                  ...course,
                  classInfo: {
                    id: classItem.id,
                    name: classItem.name,
                    startDate: classItem.startDate,
                    endDate: classItem.endDate
                  },
                  childInfo: {
                    id: child.id,
                    name: `${child.firstName} ${child.lastName}`
                  }
                });
              });
            }
          });
        }
      });

      const courseEvents = convertCoursesToEvents(allCourses);
      const sortedEvents = courseEvents.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

      setSchedule(sortedEvents);
      setCourses(allCourses);
    } catch (error) {
      console.error('Error loading parent schedule:', error);
      showErrorToast(error, 'Failed to load schedule. Please try again.');
      setSchedule([]);
      setCourses([]);
      setChildrenSummary([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Role-specific configuration (defined after all load functions)
  const getRoleConfig = () => {
    switch (userRole) {
      case 'student':
        return {
          title: 'My Schedule',
          description: 'View your enrolled class schedule and upcoming events',
          loadData: loadStudentSchedule,
          canEdit: false,
          canSelect: false
        };
      case 'teacher':
        return {
          title: 'My Teaching Schedule',
          description: 'View your class schedule and teaching sessions',
          loadData: loadTeacherSchedule,
          canEdit: true,
          canSelect: true
        };
      case 'parent':
        return {
          title: 'Children\'s Schedule',
          description: 'View your children\'s class schedules and upcoming events',
          loadData: loadParentSchedule,
          canEdit: false,
          canSelect: false
        };
      default:
        return {
          title: 'Schedule',
          description: 'View your schedule',
          loadData: () => {},
          canEdit: false,
          canSelect: false
        };
    }
  };

  const roleConfig = getRoleConfig();

  // Get role-specific colors
  const getRoleColors = () => {
    switch (userRole) {
      case 'student':
        return {
          primary: '#dc2626', // red-600
          primaryHover: '#b91c1c', // red-700
          primaryBg: '#fef2f2', // red-50
          primaryBorder: '#fecaca', // red-200
          primaryText: '#991b1b', // red-800
          loading: '#dc2626' // red-600
        };
      case 'teacher':
        return {
          primary: '#2563eb', // blue-600
          primaryHover: '#1d4ed8', // blue-700
          primaryBg: '#eff6ff', // blue-50
          primaryBorder: '#bfdbfe', // blue-200
          primaryText: '#1e40af', // blue-800
          loading: '#2563eb' // blue-600
        };
      case 'parent':
        return {
          primary: '#9333ea', // purple-600
          primaryHover: '#7c3aed', // purple-700
          primaryBg: '#faf5ff', // purple-50
          primaryBorder: '#e9d5ff', // purple-200
          primaryText: '#6b21a8', // purple-800
          loading: '#9333ea' // purple-600
        };
      default:
        return {
          primary: '#6b7280', // gray-500
          primaryHover: '#4b5563', // gray-600
          primaryBg: '#f9fafb', // gray-50
          primaryBorder: '#e5e7eb', // gray-200
          primaryText: '#374151', // gray-700
          loading: '#6b7280' // gray-500
        };
    }
  };

  const roleColors = getRoleColors();

  // Convert courses to calendar events
  const convertCoursesToEvents = (courses) => {
    const events = [];

    courses.forEach((course) => {
      const classStartDate = new Date(course.classInfo?.startDate || course.classStartDate);
      const classEndDate = new Date(course.classInfo?.endDate || course.classEndDate);

      const courseEvents = generateCourseEvents(course, classStartDate, classEndDate);
      events.push(...courseEvents);
    });

    return events;
  };

  // Generate events for a course
  const generateCourseEvents = (course, classStartDate, classEndDate) => {
    const events = [];
    const scheduleInfo = parseScheduleFromCourse(course);

    if (!scheduleInfo || !scheduleInfo.sessions) {
      return events;
    }

    scheduleInfo.sessions.forEach(session => {
      // Start from the class start date, but if the class has already started,
      // include the current week's session if it falls within the class period
      let firstOccurrence = new Date(classStartDate);
      
      // Find the first occurrence of the session day
      while (firstOccurrence.getDay() !== session.day && isBefore(firstOccurrence, classEndDate)) {
        firstOccurrence = addDays(firstOccurrence, 1);
      }

      let currentOccurrence = new Date(firstOccurrence);

      if (isBefore(currentOccurrence, classEndDate) || isSameDay(currentOccurrence, classEndDate)) {
        while (isBefore(currentOccurrence, classEndDate) || isSameDay(currentOccurrence, classEndDate)) {
          const eventDate = new Date(currentOccurrence);
          eventDate.setHours(session.startHour, session.startMinute, 0, 0);

          const eventEndDate = new Date(eventDate);
          eventEndDate.setHours(session.endHour, session.endMinute, 0, 0);

          if (isBefore(eventDate, classEndDate) || isSameDay(eventDate, classEndDate)) {
            events.push({
              id: `course-${course.id}-${session.dayName}-${eventDate.getTime()}`,
              title: course.name,
              type: 'lecture',
              start_time: eventDate.toISOString(),
              end_time: eventEndDate.toISOString(),
              location: `Room ${getRoomForClass(course.id)}`,
              instructor_name: course.teacherName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'You',
              course_title: course.name,
              description: userRole === 'parent' ? 
                `${course.name} - ${course.childInfo?.name}` : 
                `Teaching ${course.name} in ${course.classInfo?.name || course.className}`,
              classId: course.classInfo?.id || course.classId,
              courseId: course.id,
              isRecurring: true,
              weekNumber: Math.floor((eventDate.getTime() - classStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1,
              sessionDay: session.dayName,
              sessionTime: `${session.startTime}-${session.endTime}`,
              childId: course.childInfo?.id,
              childName: course.childInfo?.name
            });
          }

          currentOccurrence = addDays(currentOccurrence, 7);
        }
      }
    });

    return events;
  };

  // Parse schedule from course data with timezone conversion
  const parseScheduleFromCourse = (course) => {
    if (course.sessions && Array.isArray(course.sessions) && course.sessions.length > 0) {
      const creatorTimezone = course.creatorTimezone;
      const viewerTimezone = timezoneInfo?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      const sessions = course.sessions.map(session => {
        if (!session.day || !session.startTime || !session.endTime) {
          return null;
        }

        // Convert times if creator timezone is different
        let startTime = session.startTime;
        let endTime = session.endTime;
        let isConverted = false;

        if (creatorTimezone && creatorTimezone !== viewerTimezone) {
          try {
            const convertedStartTime = convertTimeByOffset(session.startTime, creatorTimezone, viewerTimezone);
            const convertedEndTime = convertTimeByOffset(session.endTime, creatorTimezone, viewerTimezone);
            
            if (convertedStartTime !== session.startTime || convertedEndTime !== session.endTime) {
              startTime = convertedStartTime;
              endTime = convertedEndTime;
              isConverted = true;
            }
          } catch (error) {
            console.error('Error converting session times:', error);
          }
        }

        const startTimeMatch = startTime.match(/^(\d{1,2}):(\d{2})$/);
        const endTimeMatch = endTime.match(/^(\d{1,2}):(\d{2})$/);

        if (!startTimeMatch || !endTimeMatch) {
          return null;
        }

        const startHour = parseInt(startTimeMatch[1], 10);
        const startMinute = parseInt(startTimeMatch[2], 10);
        const endHour = parseInt(endTimeMatch[1], 10);
        const endMinute = parseInt(endTimeMatch[2], 10);

        if (startHour < 0 || startHour > 23 || startMinute < 0 || startMinute > 59 ||
            endHour < 0 || endHour > 23 || endMinute < 0 || endMinute > 59) {
          return null;
        }

        const startTimeMinutes = startHour * 60 + startMinute;
        const endTimeMinutes = endHour * 60 + endMinute;
        if (endTimeMinutes <= startTimeMinutes) {
          return null;
        }
        
        return {
          day: getDayNumber(session.day),
          dayName: session.day,
          startHour,
          startMinute,
          endHour,
          endMinute,
          startTime: startTime,
          endTime: endTime,
          originalStartTime: session.startTime,
          originalEndTime: session.endTime,
          isConverted: isConverted
        };
      }).filter(session => session !== null);

      if (sessions.length === 0) {
        return null;
      }

      const firstSession = sessions[0];
      return {
        sessions,
        days: sessions.map(s => s.day),
        hour: firstSession.startHour,
        minute: firstSession.startMinute,
        endTime: firstSession.endTime
      };
    }

    return null;
  };

  // Helper function to convert day names to day numbers
  const getDayNumber = (dayName) => {
    const dayMap = {
      'Sunday': 0,
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6
    };
    return dayMap[dayName] || 0;
  };

  // Helper function to get room for class
  const getRoomForClass = (classId) => {
    const rooms = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2'];
    return rooms[classId % rooms.length];
  };

  // Navigation functions
  const navigateWeek = (direction) => {
    if (direction === 'prev') {
      setCurrentWeek(subWeeks(currentWeek, 1));
    } else {
      setCurrentWeek(addWeeks(currentWeek, 1));
    }
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
    setSelectedDate(new Date());
  };

  // FullCalendar event handlers
  const handleDateSelect = (selectInfo) => {
    if (!getRoleConfig().canSelect) return;
    
    const title = prompt('Please enter a title for your event');
    if (title) {
      const calendarApi = selectInfo.view.calendar;
      calendarApi.unselect();

      if (selectInfo.allDay) {
        calendarApi.addEvent({
          id: createEventId(),
          title,
          start: selectInfo.startStr,
          end: selectInfo.endStr,
          allDay: selectInfo.allDay
        });
      } else {
        calendarApi.addEvent({
          id: createEventId(),
          title,
          start: selectInfo.startStr,
          end: selectInfo.endStr
        });
      }
    }
  };

  const handleEventClick = (clickInfo) => {
    if (!getRoleConfig().canEdit) return;
    
    showConfirmation({
      title: 'Delete Event',
      message: `Are you sure you want to delete the event '${clickInfo.event.title}'?`,
      type: 'danger',
      confirmText: 'Delete Event',
      confirmButtonVariant: 'danger',
      onConfirm: () => {
        clickInfo.event.remove();
      }
    });
  };

  const createEventId = () => {
    return String(Math.random()).replace(/\D/g, '');
  };

  // Convert events to FullCalendar format
  const getFullCalendarEvents = () => {
    return schedule.map(event => {
      // FullCalendar expects ISO date strings, so we use the original times
      // The timezone conversion is handled by FullCalendar's timeZone property
      const fullCalendarEvent = {
        id: event.id,
        title: event.title,
        start: event.start_time,
        end: event.end_time,
        extendedProps: {
          location: event.location,
          instructor: event.instructor_name,
          description: event.description,
          isRecurring: event.isRecurring,
          classId: event.classId,
          childName: event.childName
        }
      };
      
      return fullCalendarEvent;
    });
  };

  // Filter events by selected child (for parent role)
  const getFilteredEvents = () => {
    if (userRole !== 'parent' || !selectedChildFilter) {
      return schedule;
    }
    return schedule.filter(event => event.childId === selectedChildFilter);
  };

  const filteredSchedule = getFilteredEvents();

  return (
    <div className="space-y-6 h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{getRoleConfig().title}</h1>
        </div>

        <div className="flex items-center justify-between gap-3">
          {/* Child Filter for Parent Role */}
          {userRole === 'parent' && childrenSummary.length > 1 && (
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedChildFilter}
                onChange={(e) => setSelectedChildFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-2 py-1"
              >
                <option value="">All Children</option>
                {childrenSummary.map(child => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Refresh Button for Parent Role */}
          {userRole === 'parent' && (
            <button
              onClick={() => loadParentSchedule(true)}
              disabled={refreshing}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm">Refresh</span>
            </button>
          )}

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('timeGridWeek')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${viewMode === 'timeGridWeek'
                ? 'text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              style={viewMode === 'timeGridWeek' ? { backgroundColor: roleColors.primary } : {}}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('timeGridDay')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${viewMode === 'timeGridDay'
                ? 'text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              style={viewMode === 'timeGridDay' ? { backgroundColor: roleColors.primary } : {}}
            >
              Day
            </button>
          </div>

          <button
            onClick={goToToday}
            className="px-4 py-2 text-white rounded-md text-sm font-medium"
            style={{ 
              backgroundColor: roleColors.primary,
              ':hover': { backgroundColor: roleColors.primaryHover }
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = roleColors.primaryHover}
            onMouseLeave={(e) => e.target.style.backgroundColor = roleColors.primary}
          >
            Today
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigateWeek('prev')}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-sm md:text-base">Previous</span>
          </button>

          <div className="text-center">
            <h2 className="text-base md:text-lg font-semibold text-gray-900">
              {viewMode === 'timeGridWeek'
                ? `Week of ${format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM dd, yyyy')}`
                : viewMode === 'timeGridDay'
                  ? format(selectedDate, 'EEEE, MMM dd, yyyy')
                  : format(currentWeek, 'MMMM yyyy')
              }
            </h2>
            <p className="text-xs md:text-sm text-gray-600">
              {viewMode === 'timeGridWeek'
                ? `${format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM dd')} - ${format(endOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM dd, yyyy')}`
                : viewMode === 'timeGridDay'
                  ? format(selectedDate, 'EEEE, MMMM dd, yyyy')
                  : format(currentWeek, 'MMMM yyyy')
              }
            </p>
          </div>

          <button
            onClick={() => navigateWeek('next')}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            <span className="text-sm md:text-base">Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Schedule View */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div 
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderBottomColor: roleColors.loading }}
          ></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto scrollbar-hide md:overflow-x-visible" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
            <style>{`
              .fc { font-family: inherit; background: white; }
              .fc-header-toolbar { display: none; }
              .fc-timegrid-slot { height: 3rem !important; border-bottom: 1px solid #e5e7eb; }
              @media (min-width: 768px) { .fc-timegrid-slot { height: 4rem !important; } }
              .fc-timegrid-slot-label { font-size: 0.75rem; font-weight: 500; color: #374151; padding: 0rem; text-align: center; }
              @media (min-width: 768px) { .fc-timegrid-slot-label { font-size: 0.875rem; padding: 0rem; } }
              .fc-col-header-cell { background-color: #f9fafb; border-right: 1px solid #e5e7eb; padding: 0.5rem; text-align: center; }
              @media (min-width: 768px) { .fc-col-header-cell { padding: 1rem; } }
              .fc-col-header-cell:last-child { border-right: none; }
              .fc-col-header-cell-cushion { font-size: 0.75rem; font-weight: 500; color: #111827; text-decoration: none; }
              @media (min-width: 768px) { .fc-col-header-cell-cushion { font-size: 0.875rem; } }
              .fc-col-header-cell-cushion:hover { text-decoration: none; }
              .fc-timegrid-now-indicator-line { border-color: ${roleColors.primary}; border-width: 2px; }
              .fc-timegrid-now-indicator-arrow { border-color: ${roleColors.primary}; border-width: 5px; }
              .fc-timegrid-event { margin: 0 !important; border-radius: 6px !important; width: 100% !important; height: 100% !important; box-sizing: border-box !important; background-color: ${roleColors.primaryBg} !important; border-left-color: ${roleColors.primary} !important; border-top-color: ${roleColors.primaryBorder} !important; border-right-color: ${roleColors.primaryBorder} !important; border-bottom-color: ${roleColors.primaryBorder} !important; }
              .fc-timegrid-event:hover { margin: 0 !important; }
              @media (min-width: 768px) {
                .fc-timegrid-event { font-size: 0.9rem !important; padding: 2px !important; margin: 0 !important; border-radius: 6px !important; min-height: 30px !important; width: 100% !important; height: 100% !important; }
                .fc-timegrid-event .fc-event-title { font-size: 0.9rem !important; line-height: 1.2 !important; font-weight: 600 !important; color: ${roleColors.primary} !important; }
                .fc-timegrid-event .fc-event-time { font-size: 0.8rem !important; line-height: 1.1 !important; color: ${roleColors.primary} !important; opacity: 0.8 !important; }
                .fc-timegrid-event .fc-event-instructor { font-size: 0.75rem !important; line-height: 1.1 !important; color: ${roleColors.primary} !important; opacity: 0.7 !important; }
              }
              @media (max-width: 767px) {
                .fc { min-width: 600px; }
                .fc-timegrid-cols { min-width: 600px; }
                .fc-timegrid-body { min-width: 600px; }
                .fc-timegrid-slots { min-width: 600px; }
                .fc-col-header-cell { min-width: 85px; }
                .fc-timegrid-event { font-size: 0.6rem !important; padding: 2px !important; margin: 0 !important; border-radius: 6px !important; min-height: 100% !important; max-height: 100% !important; overflow: hidden !important; width: 100% !important; height: 100% !important; position: absolute !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; box-sizing: border-box !important; }
                .fc-timegrid-event .fc-event-title { font-size: 0.6rem !important; line-height: 1.1 !important; font-weight: 600 !important; margin-bottom: 1px !important; color: ${roleColors.primary} !important; }
                .fc-timegrid-event .fc-event-time { font-size: 0.45rem !important; line-height: 1 !important; color: ${roleColors.primary} !important; opacity: 0.8 !important; }
                .fc-timegrid-event .fc-event-instructor { font-size: 0.5rem !important; line-height: 1 !important; color: ${roleColors.primary} !important; opacity: 0.7 !important; }
              }
            `}</style>
            <FullCalendar
              ref={calendarRef}
              plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
              headerToolbar={false}
              initialView={viewMode}
              initialDate={currentWeek}
              editable={getRoleConfig().canEdit}
              selectable={getRoleConfig().canSelect}
              selectMirror={getRoleConfig().canSelect}
              dayMaxEvents={true}
              weekends={true}
              events={getFullCalendarEvents()}
              select={handleDateSelect}
              eventClick={handleEventClick}
              height="auto"
              slotMinTime={calculateDynamicTimeRange(filteredSchedule).minTime}
              slotMaxTime={calculateDynamicTimeRange(filteredSchedule).maxTime}
              allDaySlot={false}
              slotDuration="01:00:00"
              slotLabelFormat={{
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }}
              eventTimeFormat={{
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }}
              eventDisplay="block"
              eventOverlap={false}
              slotEventOverlap={false}
              nowIndicator={true}
              businessHours={{
                daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
                startTime: calculateDynamicTimeRange(filteredSchedule).minTime.slice(0, 5),
                endTime: calculateDynamicTimeRange(filteredSchedule).maxTime.slice(0, 5),
              }}
              dayHeaderFormat={{
                weekday: 'short',
                day: 'numeric'
              }}
              weekNumbers={false}
              weekNumberCalculation="ISO"
              firstDay={1}
              locale="en"
              timeZone="local"
              eventClassNames={(arg) => {
                const baseClasses = 'rounded-md border-l-4 text-xs font-medium p-1 m-0.5 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md';
                
                // Use role-specific colors
                const colorClasses = `border-l-4`;
                
                return [baseClasses, colorClasses];
              }}
              eventContent={(arg) => {
                const event = arg.event;
                const location = event.extendedProps.location || 'Not specified';
                const instructor = event.extendedProps.instructor || 'Not assigned';
                const childName = event.extendedProps.childName;

                // Role-specific text colors
                let textColor;
                switch (userRole) {
                  case 'student':
                    textColor = '#dc2626'; // red-600
                    break;
                  case 'teacher':
                    textColor = '#2563eb'; // blue-600
                    break;
                  case 'parent':
                    textColor = '#9333ea'; // purple-600
                    break;
                  default:
                    textColor = '#6b7280'; // gray-500
                }

                return {
                  html: `
                    <div class="event-content" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: flex-start;">
                      <div class="fc-event-title" style="color: ${textColor}; font-weight: 600;">${event.title}</div>
                      <div class="fc-event-time" style="color: ${textColor}; opacity: 0.8;">${arg.timeText}</div>
                      <div class="fc-event-instructor" style="color: ${textColor}; opacity: 0.7;">${instructor}</div>
                      ${childName ? `<div class="fc-event-child" style="color: ${textColor}; opacity: 0.6; font-size: 0.7rem;">${childName}</div>` : ''}
                    </div>
                  `
                };
              }}
            />
          </div>
        </div>
      )}

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertState.isOpen}
        onClose={hideAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />

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
    </div>
  );
};

export default Schedule;
