import { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, User, Filter, ChevronLeft, ChevronRight, Users, BookOpen, GraduationCap } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, parseISO, addDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { mockUsers, mockCourses } from '../../data/mockData';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { parentsService } from '../../services';
import { showErrorToast } from '../../utils/errorHandler';


const ParentSchedule = ({ user }) => {
  const [schedule, setSchedule] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState('timeGridWeek'); // FullCalendar view modes
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [childrenSummary, setChildrenSummary] = useState([]);
  const [selectedChildFilter, setSelectedChildFilter] = useState(''); // specific child ID or empty
  const calendarRef = useRef(null);

  useEffect(() => {
    if (user) {
      loadParentSchedule();
    }
  }, [user]);

  // Auto-select child when childrenSummary changes
  useEffect(() => {
    if (childrenSummary.length > 0 && !selectedChildFilter) {
      console.log('Auto-selecting first child:', childrenSummary[0]);
      setSelectedChildFilter(childrenSummary[0].id);
    }
  }, [childrenSummary, selectedChildFilter]);

  // Navigate calendar when currentWeek changes (without regenerating events)
  useEffect(() => {
    if (currentWeek) {
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
      
      // Update selectedDate to match the first day of the new week
      setSelectedDate(weekStart);

      // Navigate FullCalendar to the correct week
      if (calendarRef.current && calendarRef.current.getApi) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.gotoDate(weekStart);
      }
    }
  }, [currentWeek]);

  // Generate events for all children when courses change
  useEffect(() => {
    if (courses.length > 0) {
      console.log('=== EVENT GENERATION DEBUG ===');
      console.log('Generating events for all courses:', courses.length);
      console.log('Courses data:', courses.map(c => ({ 
        name: c.name, 
        childId: c.childId, 
        childName: c.childName, 
        schedule: c.schedule 
      })));
      
      // Generate events for a broader date range to ensure we have events for navigation
      // Include past events (30 days back) and future events (90 days forward)
      const startDate = addDays(new Date(), -30); // 30 days ago
      const endDate = addDays(new Date(), 90);   // 90 days from now
      
      const allEvents = generateEventsForDateRange(startDate, endDate);
      console.log('Generated events for all children:', allEvents.length);
      console.log('Date range:', format(startDate, 'yyyy-MM-dd'), 'to', format(endDate, 'yyyy-MM-dd'));
      
      // Debug: Show events by child
      const eventsByChild = allEvents.reduce((acc, event) => {
        if (!acc[event.childId]) {
          acc[event.childId] = [];
        }
        acc[event.childId].push({
          title: event.title,
          start_time: event.start_time,
          childName: event.childName
        });
        return acc;
      }, {});
      console.log('Generated events by child:', eventsByChild);
      
      setSchedule(allEvents.sort((a, b) => new Date(a.start_time) - new Date(b.start_time)));
      console.log('=== END EVENT GENERATION DEBUG ===');
    }
  }, [courses]);

  const loadParentSchedule = async () => {
    if (!user?.id) {
      console.error('No user ID available');
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      console.log('Loading parent schedule for user:', user.id);
      
      // Call the real API
      const response = await parentsService.getParentSchedule(user.id);
      console.log('API Response:', response);

      const { children, schedule: scheduleEvents } = response;
      console.log('Children from API:', children);
      console.log('Children details:', children.map(child => ({ 
        id: child.id, 
        name: child.name, 
        classesCount: child.classesCount,
        classes: child.classes.map(c => ({ name: c.name, schedule: c.schedule }))
      })));

      // Transform the API response to match our component's expected format
      const transformedCourses = [];
      children.forEach(child => {
        child.classes.forEach(classItem => {
          transformedCourses.push({
            id: classItem.id,
            name: classItem.name,
            description: classItem.description,
            teacherId: classItem.teacherId,
            teacherName: classItem.teacher, // Include teacher name from API (backend returns 'teacher' field)
            startDate: classItem.startDate || new Date().toISOString().split('T')[0], // Use actual start date
            endDate: classItem.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Use actual end date
            schedule: classItem.schedule,
            childId: child.id,
            childName: child.name
          });
        });
      });

      // Set courses and children data - events will be generated by useEffect
      setCourses(transformedCourses);
      setChildrenSummary(children);
      
      console.log('Courses and children set, events will be generated by useEffect');

      console.log('Children from API:', children);
      console.log('Current selectedChildFilter:', selectedChildFilter);

      // Auto-select the first child if only one child or no child is selected
      if (children.length === 1 && !selectedChildFilter) {
        console.log('Auto-selecting first child:', children[0].id);
        setSelectedChildFilter(children[0].id);
      }
    } catch (error) {
      console.error('Error loading parent schedule:', error);
      showErrorToast('Failed to load schedule. Please try again.');
      setSchedule([]);
      setCourses([]);
      setChildrenSummary([]);
    } finally {
      setLoading(false);
    }
  };

  const convertClassesToEvents = (enrolledClasses) => {
    const events = [];

    enrolledClasses.forEach((classItem) => {
      // Use the course's actual start and end dates
      const courseStartDate = new Date(classItem.startDate);
      const courseEndDate = new Date(classItem.endDate);

      // Generate events for the entire course duration (from start date to end date)
        const classEvents = generateClassEvents(classItem, courseStartDate, courseEndDate);
        events.push(...classEvents);
    });

    return events;
  };

  const generateClassEvents = (classItem, startDate, endDate) => {
    const events = [];

    // Parse schedule using the new data structure
    const scheduleInfo = parseScheduleFromCourse(classItem);

    if (!scheduleInfo || !scheduleInfo.sessions) {
      console.log('No schedule info for class:', classItem.name, classItem.schedule);
      return events;
    }

    // Get teacher name from course data (preferred) or fallback to mockUsers
    const teacherName = classItem.teacherName || (() => {
      const teacher = mockUsers.find(t => t.id === classItem.teacherId && t.role === 'teacher');
      return teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Teacher TBD';
    })();

    // Generate events for each session
    scheduleInfo.sessions.forEach(session => {
      // Find the first occurrence of this session's day
      let firstOccurrence = new Date(startDate);
      while (firstOccurrence.getDay() !== session.day) {
        firstOccurrence = addDays(firstOccurrence, 1);
      }

      console.log(`First occurrence for ${session.dayName}:`, format(firstOccurrence, 'EEEE yyyy-MM-dd'));

      // Generate events for this session, repeating weekly
      let currentOccurrence = new Date(firstOccurrence);

      while (isBefore(currentOccurrence, endDate)) {
        // Set the time for this occurrence using the session's specific time
        const eventDate = new Date(currentOccurrence);
        eventDate.setHours(session.startHour, session.startMinute, 0, 0);

        // Calculate end time using the session's end time
        const eventEndDate = new Date(currentOccurrence);
        eventEndDate.setHours(session.endHour, session.endMinute, 0, 0);

        // Add all events within the course period (including past events for display purposes)
        events.push({
          id: `class-${classItem.id}-${session.dayName}-${eventDate.getTime()}-${classItem.childId}`,
          title: classItem.name,
          type: 'lecture',
          start_time: eventDate.toISOString(),
          end_time: eventEndDate.toISOString(),
          instructor_name: teacherName,
          course_title: classItem.name,
          description: classItem.description,
          classId: classItem.id,
          childId: classItem.childId,
          childName: classItem.childName,
          isRecurring: true,
          weekNumber: Math.floor((eventDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1,
          sessionDay: session.dayName,
          sessionTime: `${session.startTime}-${session.endTime}`
        });

        // Move to next week (7 days later)
        currentOccurrence = addDays(currentOccurrence, 7);
      }
    });

    return events;
  };

  // Parse schedule using the new data structure
  const parseScheduleFromCourse = (course) => {
    console.log('Parsing schedule for course:', course.name, 'Schedule data:', course.schedule);

    if (course.schedule && Array.isArray(course.schedule) && course.schedule.length > 0) {
      // Return all sessions as an array of session objects
      const sessions = course.schedule.map(session => {
        // Validate session data
        if (!session.day || !session.startTime || !session.endTime) {
          console.warn('Invalid session data:', session);
          return null;
        }

        // Parse time strings (format: "HH:MM")
        const startTimeMatch = session.startTime.match(/^(\d{1,2}):(\d{2})$/);
        const endTimeMatch = session.endTime.match(/^(\d{1,2}):(\d{2})$/);

        if (!startTimeMatch || !endTimeMatch) {
          console.warn('Invalid time format:', session.startTime, session.endTime);
          return null;
        }

        const startHour = parseInt(startTimeMatch[1], 10);
        const startMinute = parseInt(startTimeMatch[2], 10);
        const endHour = parseInt(endTimeMatch[1], 10);
        const endMinute = parseInt(endTimeMatch[2], 10);

        // Validate time values
        if (startHour < 0 || startHour > 23 || startMinute < 0 || startMinute > 59 ||
            endHour < 0 || endHour > 23 || endMinute < 0 || endMinute > 59) {
          console.warn('Invalid time values:', { startHour, startMinute, endHour, endMinute });
          return null;
        }

        // Validate that end time is after start time
        const startTimeMinutes = startHour * 60 + startMinute;
        const endTimeMinutes = endHour * 60 + endMinute;
        if (endTimeMinutes <= startTimeMinutes) {
          console.warn('End time must be after start time:', session.startTime, session.endTime);
          return null;
        }
        
        return {
          day: getDayNumber(session.day),
          dayName: session.day,
          startHour,
          startMinute,
          endHour,
          endMinute,
          startTime: session.startTime,
          endTime: session.endTime,
          duration: endTimeMinutes - startTimeMinutes // duration in minutes
        };
      }).filter(session => session !== null); // Remove invalid sessions

      if (sessions.length === 0) {
        console.warn('No valid sessions found for course:', course.name);
        return null;
      }

      console.log('Parsed sessions:', sessions);

      // For backward compatibility, also return the first session's data
      const firstSession = sessions[0];
      return {
        sessions, // New: array of all sessions
        days: sessions.map(s => s.day), // Legacy: array of day numbers
        startHour: firstSession.startHour, // Legacy: first session hour
        startMinute: firstSession.startMinute, // Legacy: first session minute
        endHour: firstSession.endHour, // Legacy: first session end hour
        endMinute: firstSession.endMinute, // Legacy: first session end minute
        duration: firstSession.duration // Legacy: first session duration
      };
    }

    console.log('Failed to parse schedule for course:', course.name);
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

  // Function to get a user-friendly schedule display
  const getScheduleDisplay = (course) => {
    if (course.schedule && Array.isArray(course.schedule)) {
      return course.schedule.map(item =>
        `${item.day} ${item.startTime}-${item.endTime}`
      ).join(', ');
    }
    return 'Schedule TBD';
  };


  const getUpcomingClasses = () => {
    if (courses.length === 0) return [];

    const upcoming = [];
    const today = new Date();
    const nextWeek = addDays(today, 7);

    courses.forEach(course => {
      const scheduleInfo = parseScheduleFromCourse(course);
      if (scheduleInfo && scheduleInfo.sessions) {
        // Find next occurrence of each session
        scheduleInfo.sessions.forEach(session => {
          let nextDate = new Date(today);
          while (nextDate.getDay() !== session.day) {
            nextDate = addDays(nextDate, 1);
          }

          if (isAfter(nextDate, today)) {
            // Get teacher name from course data (preferred) or fallback to mockUsers
            const teacherName = course.teacherName || (() => {
              const teacher = mockUsers.find(t => t.id === course.teacherId && t.role === 'teacher');
              return teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Teacher TBD';
            })();

            upcoming.push({
              course: course.name,
              child: course.childName,
              day: session.dayName,
              time: `${session.startTime}-${session.endTime}`,
              teacher: teacherName,
              sessionDay: session.dayName,
              sessionTime: `${session.startTime}-${session.endTime}`
            });
          }
        });
      }
    });

    return upcoming.sort((a, b) => {
      const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
    });
  };

  // Generate events for a specific date range (for navigation)
  const generateEventsForDateRange = (startDate, endDate) => {
    if (courses.length === 0) return [];

    console.log('=== generateEventsForDateRange DEBUG ===');
    console.log('Generating events for date range:', format(startDate, 'yyyy-MM-dd'), 'to', format(endDate, 'yyyy-MM-dd'));
    console.log('Available courses:', courses.map(c => ({ 
      name: c.name, 
      childId: c.childId, 
      childName: c.childName,
      schedule: c.schedule, 
      startDate: c.startDate, 
      endDate: c.endDate 
    })));

    const events = [];
    courses.forEach((classItem) => {
      console.log(`Processing course: ${classItem.name} for child: ${classItem.childName} (${classItem.childId})`);
      
      const scheduleInfo = parseScheduleFromCourse(classItem);
      if (scheduleInfo && scheduleInfo.sessions) {
        console.log('Parsed schedule for', classItem.name, ':', scheduleInfo);

        // Get teacher name from course data (preferred) or fallback to mockUsers
        const teacherName = classItem.teacherName || (() => {
          const teacher = mockUsers.find(t => t.id === classItem.teacherId && t.role === 'teacher');
          return teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Teacher TBD';
        })();

        // Get course start and end dates
        const courseStartDate = new Date(classItem.startDate);
        const courseEndDate = new Date(classItem.endDate);
        
        console.log(`Course ${classItem.name} date range: ${format(courseStartDate, 'yyyy-MM-dd')} to ${format(courseEndDate, 'yyyy-MM-dd')}`);

        // Only generate events if the course period overlaps with the requested date range
        const effectiveStartDate = isAfter(startDate, courseStartDate) ? startDate : courseStartDate;
        const effectiveEndDate = isBefore(endDate, courseEndDate) ? endDate : courseEndDate;

        console.log(`Effective date range for ${classItem.name}: ${format(effectiveStartDate, 'yyyy-MM-dd')} to ${format(effectiveEndDate, 'yyyy-MM-dd')}`);

        if (isBefore(effectiveStartDate, effectiveEndDate)) {
          console.log(`Generating events for ${classItem.name} (${classItem.childName})`);
          
          // Generate events for each session
          scheduleInfo.sessions.forEach(session => {
            let currentDate = new Date(effectiveStartDate);

            // Find the first occurrence of this session's day in the range
            while (currentDate.getDay() !== session.day && isBefore(currentDate, effectiveEndDate)) {
              currentDate = addDays(currentDate, 1);
            }

            // Generate events for this session and subsequent weeks within the range
            while (isBefore(currentDate, effectiveEndDate)) {
              const eventDate = new Date(currentDate);
              eventDate.setHours(session.startHour, session.startMinute, 0, 0);

              // Calculate end time using the session's end time
              const eventEndDate = new Date(currentDate);
              eventEndDate.setHours(session.endHour, session.endMinute, 0, 0);

              events.push({
                id: `class-${classItem.id}-${session.dayName}-${eventDate.getTime()}-${classItem.childId}`,
                title: classItem.name,
                type: 'lecture',
                start_time: eventDate.toISOString(),
                end_time: eventEndDate.toISOString(),
                instructor_name: teacherName,
                course_title: classItem.name,
                description: classItem.description,
                classId: classItem.id,
                childId: classItem.childId,
                childName: classItem.childName,
                isRecurring: true,
                weekNumber: Math.floor((eventDate.getTime() - courseStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1,
                sessionDay: session.dayName,
                sessionTime: `${session.startTime}-${session.endTime}`
              });

              // Move to next week
              currentDate = addDays(currentDate, 7);
            }
          });
        } else {
          console.log(`Skipping ${classItem.name} - no overlap with date range`);
        }
      } else {
        console.warn('Could not parse schedule for class:', classItem.name, classItem.schedule);
      }
    });

    console.log('Generated events:', events.length);
    console.log('Events by child:', events.reduce((acc, event) => {
      acc[event.childId] = (acc[event.childId] || 0) + 1;
      return acc;
    }, {}));

    // Remove duplicate events before returning
    const uniqueEvents = events.filter((event, index, self) =>
      index === self.findIndex(e =>
        e.id === event.id ||
        (e.title === event.title && e.start_time === event.start_time && e.childId === event.childId)
      )
    );

    console.log('Unique events after deduplication:', uniqueEvents.length);
    console.log('=== END generateEventsForDateRange DEBUG ===');
    return uniqueEvents;
  };

  // Convert our events to FullCalendar format
  const getFullCalendarEvents = () => {
    console.log('=== getFullCalendarEvents DEBUG ===');
    console.log('selectedChildFilter:', selectedChildFilter);
    console.log('Current schedule length:', schedule.length);
    console.log('Schedule sample:', schedule.slice(0, 3));
    
    // Debug: Show all unique childIds in schedule
    const uniqueChildIds = [...new Set(schedule.map(event => event.childId))];
    console.log('Unique childIds in schedule:', uniqueChildIds);
    
    // Debug: Show events by child
    const eventsByChild = schedule.reduce((acc, event) => {
      if (!acc[event.childId]) {
        acc[event.childId] = [];
      }
      acc[event.childId].push({
        title: event.title,
        start_time: event.start_time,
        childName: event.childName
      });
      return acc;
    }, {});
    console.log('Events by child:', eventsByChild);

    if (!selectedChildFilter) {
      console.log('No child selected, returning empty array');
      return [];
    }

    const filteredEvents = schedule.filter(event => {
      // Fix: Compare strings directly instead of converting to int
      const matches = event.childId === selectedChildFilter;
      console.log(`Checking event: ${event.title} (childId: "${event.childId}", type: ${typeof event.childId}) vs selectedChildFilter: "${selectedChildFilter}" (type: ${typeof selectedChildFilter}) - Match: ${matches}`);
      return matches;
    });

    console.log('Filtered events for child:', selectedChildFilter, filteredEvents.length, 'events');
    console.log('Filtered events details:', filteredEvents.map(e => ({ title: e.title, childId: e.childId, childName: e.childName, start_time: e.start_time })));

    const fullCalendarEvents = filteredEvents.map(event => ({
      id: event.id,
      title: event.title,
      start: event.start_time,
      end: event.end_time,
      extendedProps: {
        instructor: event.instructor_name,
        childName: event.childName,
        description: event.description,
        isRecurring: event.isRecurring,
        childId: event.childId
      }
    }));

    console.log('FullCalendar events:', fullCalendarEvents.length, 'events');
    console.log('=== END DEBUG ===');
    return fullCalendarEvents;
  };

  const getEventColor = (type, isRecurring = false, childId = null) => {
    if (isRecurring) {
      // Different colors for different children to distinguish them
      if (childId) {
        const colors = [
          'bg-purple-100 border-purple-300 text-purple-800',
          'bg-green-100 border-green-300 text-green-800',
          'bg-blue-100 border-blue-300 text-blue-800',
          'bg-orange-100 border-orange-300 text-orange-800',
          'bg-pink-100 border-pink-300 text-pink-800',
          'bg-indigo-100 border-indigo-300 text-indigo-800'
        ];
        return colors[childId % colors.length];
      }
      return 'bg-purple-100 border-purple-300 text-purple-800';
    }

    const colors = {
      'lecture': 'bg-red-100 border-red-300 text-red-800',
      'lab': 'bg-green-100 border-green-300 text-green-800',
      'tutorial': 'bg-purple-100 border-purple-300 text-purple-800',
      'seminar': 'bg-yellow-100 border-yellow-300 text-yellow-800',
      'exam': 'bg-red-100 border-red-300 text-red-800',
      'assignment_due': 'bg-orange-100 border-orange-300 text-orange-800',
      'office_hours': 'bg-gray-100 border-gray-300 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 border-gray-300 text-gray-800';
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'lecture': return '📚';
      case 'lab': return '🔬';
      case 'tutorial': return '👨‍🏫';
      case 'seminar': return '💬';
      case 'exam': return '📝';
      case 'assignment_due': return '📋';
      case 'office_hours': return '🏢';
      default: return '📅';
    }
  };

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

  // FullCalendar event handlers - Parents can only view, not modify
  const handleDateSelect = (selectInfo) => {
    // Parents cannot add events - just clear the selection
    selectInfo.view.calendar.unselect();
  };

  const handleEventClick = (clickInfo) => {
    // Parents cannot delete events - just show event info
    const event = clickInfo.event;
    const childName = event.extendedProps.childName || 'Child';
    const instructor = event.extendedProps.instructor || 'TBD';

    alert(`Class: ${event.title}\nTime: ${event.start.toLocaleString()}\nInstructor: ${instructor}`);
  };

  const createEventId = () => {
    return String(Math.random()).replace(/\D/g, '');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Children's Schedule</h1>
          <p className="text-gray-600">View your children's class schedules and upcoming events</p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Child Filter */}
          {childrenSummary.length > 1 && (
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Filter by child:</label>
              <select
                value={selectedChildFilter}
                onChange={(e) => setSelectedChildFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {childrenSummary.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('timeGridWeek')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${viewMode === 'timeGridWeek'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('timeGridDay')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${viewMode === 'timeGridDay'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Day
            </button>

          </div>

          <button
            onClick={goToToday}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium"
          >
            Today
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigateWeek('prev')}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {viewMode === 'timeGridWeek'
                ? `Week of ${format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM dd, yyyy')}`
                : viewMode === 'timeGridDay'
                  ? format(selectedDate, 'EEEE, MMM dd, yyyy')
                  : format(currentWeek, 'MMMM yyyy')
              }
            </h2>
            <p className="text-sm text-gray-600">
              {viewMode === 'timeGridWeek'
                ? `${format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM dd')} - ${format(endOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM dd, yyyy')}`
                : viewMode === 'timeGridDay'
                  ? format(selectedDate, 'EEEE, MMMM dd, yyyy')
                  : format(currentWeek, 'MMMM yyyy')
              }
            </p>
            {selectedChildFilter && (
              <p className="text-xs text-purple-600 mt-1">
                Showing classes for: {childrenSummary.find(c => c.id === selectedChildFilter)?.name}
              </p>
            )}
          </div>

          <button
            onClick={() => navigateWeek('next')}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Schedule View */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : !selectedChildFilter ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="text-gray-500">
            <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Child</h3>
            <p className="text-gray-600">Please select a child from the dropdown above to view their schedule.</p>
            {childrenSummary.length > 0 && (
              <button
                onClick={() => setSelectedChildFilter(childrenSummary[0].id)}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium"
              >
                View {childrenSummary[0].name}'s Schedule
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'timeGridDay' ? (
        // Day View with Sidebar Layout
        <div className="flex gap-6">
          {/* Left Sidebar - Day Selection */}
          <div className="w-64 bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Day</h3>
            <div className="space-y-2">
              {(() => {
                const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
                const days = [];
                for (let i = 0; i < 7; i++) {
                  const day = addDays(weekStart, i);
                  const dayEvents = schedule.filter(event =>
                    isSameDay(parseISO(event.start_time), day) &&
                    event.childId === selectedChildFilter
                  );
                  const isSelected = isSameDay(day, selectedDate);

                  days.push(
                    <button
                      key={i}
                      onClick={() => setSelectedDate(day)}
                      className={`w-full p-3 text-left rounded-lg transition-colors ${isSelected
                        ? 'bg-purple-100 border-2 border-purple-300'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                        }`}
                    >
                      <div className="font-medium text-gray-900">
                        {format(day, 'EEEE MMM dd')}
                      </div>
                      <div className="text-sm text-gray-600">
                        {dayEvents.length} events
                      </div>
                    </button>
                  );
                }
                return days;
              })()}
            </div>
          </div>

          {/* Right Section - Day Schedule */}
          <div className="flex-1 bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {format(selectedDate, 'EEEE, MMMM dd, yyyy')}
              </h2>
              <p className="text-gray-600">
                {schedule.filter(event =>
                  isSameDay(parseISO(event.start_time), selectedDate) &&
                event.childId === selectedChildFilter
                ).length} events scheduled
              </p>
            </div>

            <div className="p-4">
              {(() => {
                const dayEvents = schedule.filter(event =>
                  isSameDay(parseISO(event.start_time), selectedDate) &&
                  event.childId === selectedChildFilter
                ).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

                if (dayEvents.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No events scheduled for this day</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {dayEvents.map((event, index) => (
                      <div key={event.id} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            <BookOpen className="h-4 w-4 text-purple-600" />
                            <h3 className="text-base font-semibold text-gray-900">{event.title}</h3>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                              Enrolled Class
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-600 mb-2 text-sm">{event.description}</p>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">
                              {format(parseISO(event.start_time), 'HH:mm')} - {format(parseISO(event.end_time), 'HH:mm')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">{event.instructor_name}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      ) : (
        // Week View with FullCalendar
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Custom Tailwind styles for FullCalendar */}
          <style>{`
             .fc {
               font-family: inherit;
               background: white;
             }
             .fc-header-toolbar {
               display: none;
             }
             .fc-timegrid-slot {
               height: 4rem !important;
               border-bottom: 1px solid #e5e7eb;
             }
             .fc-timegrid-slot-label {
               font-size: 0.875rem;
               font-weight: 500;
               color: #374151;
               padding: 0.5rem;
               text-align: center;
             }
             .fc-col-header-cell {
               background-color: #f9fafb;
               border-right: 1px solid #e5e7eb;
               padding: 1rem;
               text-align: center;
             }
             .fc-col-header-cell:last-child {
               border-right: none;
             }
             .fc-col-header-cell-cushion {
               font-size: 0.875rem;
               font-weight: 500;
               color: #111827;
               text-decoration: none;
             }
             .fc-col-header-cell-cushion:hover {
               text-decoration: none;
             }
             .fc-timegrid-now-indicator-line {
               border-color: #8b5cf6;
               border-width: 2px;
             }
             .fc-timegrid-now-indicator-arrow {
               border-color: #8b5cf6;
               border-width: 5px;
             }
             .fc-scroller::-webkit-scrollbar {
               width: 8px;
               height: 8px;
             }
             .fc-scroller::-webkit-scrollbar-track {
               background: #f1f1f1;
               border-radius: 4px;
             }
             .fc-scroller::-webkit-scrollbar-thumb {
               background: #c1c1c1;
               border-radius: 4px;
             }
             .fc-scroller::-webkit-scrollbar-thumb:hover {
               background: #a8a8a8;
             }
             /* Ensure 8 PM and later rows are visible */
             .fc-timegrid-slot:nth-child(n+13) {
               background-color: #fefefe;
             }
             .fc-timegrid-slot:nth-child(n+13):hover {
               background-color: #f3f4f6;
             }
           `}</style>
          <FullCalendar
            ref={calendarRef}
            plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
            headerToolbar={false} // We're using our custom header
            initialView={viewMode}
            initialDate={currentWeek}
            editable={false} // Parents cannot edit events
            selectable={false} // Parents cannot select dates to add events
            selectMirror={false}
            dayMaxEvents={true}
            weekends={true}
            events={getFullCalendarEvents()}
            select={handleDateSelect}
            eventClick={handleEventClick}
            height="auto"
            slotMinTime="08:00:00"
            slotMaxTime="20:00:00"
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
              daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // Monday through Sunday
              startTime: '08:00',
              endTime: '20:00',
            }}
            dayHeaderFormat={{
              weekday: 'short',
              day: 'numeric'
            }}
            weekNumbers={false}
            weekNumberCalculation="ISO"
            firstDay={1} // Monday
            locale="en"
            timeZone="local"
            eventClassNames={(arg) => {
              const event = arg.event;
              const isRecurring = event.extendedProps.isRecurring;
              const childId = event.extendedProps.childId;

              // Base Tailwind classes for all events - read-only for parents
              const baseClasses = 'rounded-md border-l-4 text-xs font-medium p-1 m-0.5 cursor-pointer transition-all duration-200 hover:shadow-md';

              // Child-specific color classes using Tailwind - purple theme for parents
              let colorClasses = 'bg-purple-100 border-purple-300 text-purple-800';

              return [baseClasses, colorClasses];
            }}
            eventContent={(arg) => {
              const event = arg.event;
              const instructor = event.extendedProps.instructor || 'TBD';
              const childName = event.extendedProps.childName || 'Child';

              return {
                html: `
                   <div class="p-1">
                     <div class="font-semibold text-xs mb-0.5 text-purple-700">${event.title}</div>
                     <div class="text-xs opacity-75 mb-0.5 text-purple-700">${arg.timeText}</div>
                     <div class="text-xs opacity-60 text-purple-600">${instructor}</div>
                   </div>
                 `
              };
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ParentSchedule;