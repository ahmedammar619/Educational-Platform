import { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, MapPin, User, Filter, ChevronLeft, ChevronRight, X, BookOpen, Users } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, parseISO, addDays, isAfter, isBefore } from 'date-fns';
import { teachersService } from '../../services';
import { showErrorToast } from '../../utils/errorHandler';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

const TeacherSchedule = ({ user }) => {
  const [schedule, setSchedule] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState('timeGridWeek'); // FullCalendar view modes
  const [selectedDate, setSelectedDate] = useState(new Date());
  const calendarRef = useRef(null);

  useEffect(() => {
    if (user) {
      loadTeacherSchedule();
    }
  }, [user]);

  // Regenerate events when currentWeek changes (for navigation)
  useEffect(() => {
    if (courses.length > 0 && currentWeek) {
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

      // Generate events for the current week
      const weekEvents = generateEventsForDateRange(weekStart, weekEnd);

      // Update schedule with new week events
      setSchedule(prevSchedule => {
        // Remove old recurring events and add new ones
        const nonRecurringEvents = prevSchedule.filter(event => !event.isRecurring);
        const allEvents = [...nonRecurringEvents, ...weekEvents];
        return allEvents.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
      });

      // Update selectedDate to match the first day of the new week
      setSelectedDate(weekStart);

      // Navigate FullCalendar to the correct week
      if (calendarRef.current && calendarRef.current.getApi) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.gotoDate(weekStart);
      }
    }
  }, [currentWeek, courses]);

  const loadTeacherSchedule = async () => {
    setLoading(true);

    try {
      // Get teacher's classes from backend
      if (!user || !user.id) {
        console.log('No valid user ID, using empty data');
        setSchedule([]);
        setCourses([]);
        return;
      }

      console.log('Loading schedule for teacher:', user.id);

      // Fetch teacher's classes from backend
      const response = await teachersService.getTeacherClasses();
      console.log('Raw response from backend:', response);
      
      // Handle different response formats - convert object to array if needed
      let classesArray = [];
      if (Array.isArray(response)) {
        classesArray = response;
      } else if (response && typeof response === 'object') {
        // Check if response has a 'classes' property (new format)
        if (response.classes && Array.isArray(response.classes)) {
          classesArray = response.classes;
        } else {
          // Convert object with numeric keys to array (old format)
          classesArray = Object.values(response).filter(item => 
            item && typeof item === 'object' && item.id && !item._rateLimitInfo
          );
        }
      }
      
      console.log('Parsed classes array:', classesArray);

      if (classesArray.length === 0) {
        console.log('No classes found for teacher');
        setSchedule([]);
        setCourses([]);
        return;
      }

      // Extract all courses from all classes
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

      console.log('All courses for teacher:', allCourses);

      if (allCourses.length === 0) {
        console.log('No courses found for teacher');
        setSchedule([]);
        setCourses([]);
        return;
      }

      // Convert course schedules to calendar events
      const courseEvents = convertCoursesToEvents(allCourses);
      console.log('Course events:', courseEvents);

      // Sort events by start time
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

  const convertCoursesToEvents = (courses) => {
    const events = [];

    courses.forEach((course) => {
      // Use the class's actual start and end dates
      const classStartDate = new Date(course.classInfo.startDate);
      const classEndDate = new Date(course.classInfo.endDate);

      // Generate events for the entire class duration (including past events for display)
      const courseEvents = generateCourseEvents(course, classStartDate, classEndDate);
      events.push(...courseEvents);
    });

    return events;
  };

  const generateCourseEvents = (course, classStartDate, classEndDate) => {
    const events = [];

    // Parse schedule using the course sessions data
    const scheduleInfo = parseScheduleFromCourse(course);

    if (!scheduleInfo) return events;

    console.log(`Generating events for course: ${course.name}`);
    console.log(`Class duration: ${classStartDate.toDateString()} to ${classEndDate.toDateString()}`);

    // Find the first occurrence of each scheduled day within the class period
    const firstOccurrences = scheduleInfo.days.map(dayOfWeek => {
      let date = new Date(classStartDate);
      while (date.getDay() !== dayOfWeek && isBefore(date, classEndDate)) {
        date = addDays(date, 1);
      }
      return date;
    });

    // Generate events for each scheduled day, repeating weekly but only within class duration
    firstOccurrences.forEach(firstDate => {
      let currentOccurrence = new Date(firstDate);

      // Only generate events if the first occurrence is within the class period
      if (isBefore(currentOccurrence, classEndDate) || isSameDay(currentOccurrence, classEndDate)) {
        while (isBefore(currentOccurrence, classEndDate) || isSameDay(currentOccurrence, classEndDate)) {
          // Set the time for this occurrence
          const eventDate = new Date(currentOccurrence);
          eventDate.setHours(scheduleInfo.hour, scheduleInfo.minute, 0, 0);

          // Calculate end time based on session duration (60 minutes default)
          const eventEndDate = new Date(eventDate);
          eventEndDate.setMinutes(eventEndDate.getMinutes() + 60);

          // Only add the event if it's within the class period
          if (isBefore(eventDate, classEndDate) || isSameDay(eventDate, classEndDate)) {
            events.push({
              id: `course-${course.id}-${eventDate.getTime()}`,
              title: course.name,
              type: 'lecture',
              start_time: eventDate.toISOString(),
              end_time: eventEndDate.toISOString(),
              location: `Room ${getRoomForClass(course.id)}`,
              instructor_name: course.teacherName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'You',
              course_title: course.name,
              description: `Teaching ${course.name} in ${course.classInfo.name}`,
              classId: course.classInfo.id,
              courseId: course.id,
              isRecurring: true,
              weekNumber: Math.floor((eventDate.getTime() - classStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
            });
          }

          // Move to next week (7 days later)
          currentOccurrence = addDays(currentOccurrence, 7);
        }
      }
    });

    console.log(`Generated ${events.length} events for course: ${course.name}`);
    return events;
  };

  // Parse schedule using the course sessions data structure
  const parseScheduleFromCourse = (course) => {
    if (course.sessions && Array.isArray(course.sessions)) {
      // Use the sessions data from the backend
      const days = course.sessions.map(session => getDayNumber(session.day));

      // Parse startTime (e.g., "08:00" -> hour: 8, minute: 0)
      if (course.sessions.length > 0) {
        const [startHour, startMinute] = course.sessions[0].startTime.split(':').map(Number);

        if (startHour !== undefined && startMinute !== undefined) {
          return {
            days,
            hour: startHour,
            minute: startMinute
          };
        }
      }
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

  // Generate events for a specific date range (for navigation)
  const generateEventsForDateRange = (startDate, endDate) => {
    if (courses.length === 0) return [];

    console.log('Generating events for date range:', format(startDate, 'yyyy-MM-dd'), 'to', format(endDate, 'yyyy-MM-dd'));
    console.log('Available courses:', courses.map(c => ({ name: c.name, sessions: c.sessions })));

    const events = [];
    courses.forEach((course) => {
      const scheduleInfo = parseScheduleFromCourse(course);
      if (scheduleInfo) {
        console.log('Parsed schedule for', course.name, ':', scheduleInfo);

        // Get class start and end dates
        const classStartDate = new Date(course.classInfo.startDate);
        const classEndDate = new Date(course.classInfo.endDate);

        // Only generate events if the requested date range overlaps with the class period
        const rangeStart = isAfter(startDate, classStartDate) ? startDate : classStartDate;
        const rangeEnd = isBefore(endDate, classEndDate) ? endDate : classEndDate;

        if (isBefore(rangeStart, rangeEnd) || isSameDay(rangeStart, rangeEnd)) {
          // Find the first occurrence of each scheduled day in the range
          scheduleInfo.days.forEach(dayOfWeek => {
            let currentDate = new Date(rangeStart);

            // Find the first occurrence of this day in the range
            while (currentDate.getDay() !== dayOfWeek && isBefore(currentDate, rangeEnd)) {
              currentDate = addDays(currentDate, 1);
            }

            // Generate events for this day and subsequent weeks within the range
            while (isBefore(currentDate, rangeEnd) || isSameDay(currentDate, rangeEnd)) {
              const eventDate = new Date(currentDate);
              eventDate.setHours(scheduleInfo.hour, scheduleInfo.minute, 0, 0);

              // Calculate end time based on session duration (60 minutes)
              const eventEndDate = new Date(eventDate);
              eventEndDate.setMinutes(eventEndDate.getMinutes() + 60);

              // Only add the event if it's within the class period
              if ((isAfter(eventDate, classStartDate) || isSameDay(eventDate, classStartDate)) && 
                  (isBefore(eventDate, classEndDate) || isSameDay(eventDate, classEndDate))) {
                events.push({
                  id: `course-${course.id}-${eventDate.getTime()}`,
                  title: course.name,
                  type: 'lecture',
                  start_time: eventDate.toISOString(),
                  end_time: eventEndDate.toISOString(),
                  location: `Room ${getRoomForClass(course.id)}`,
                  instructor_name: course.teacherName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'You',
                  course_title: course.name,
                  description: `Teaching ${course.name} in ${course.classInfo.name}`,
                  classId: course.classInfo.id,
                  courseId: course.id,
                  isRecurring: true,
                  weekNumber: Math.floor((eventDate.getTime() - classStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
                });
              }

              // Move to next week
              currentDate = addDays(currentDate, 7);
            }
          });
        }
      } else {
        console.warn('Could not parse schedule for course:', course.name, course.sessions);
      }
    });

    console.log('Generated events:', events.length);

    // Remove duplicate events before returning
    const uniqueEvents = events.filter((event, index, self) =>
      index === self.findIndex(e =>
        e.id === event.id ||
        (e.title === event.title && e.start_time === event.start_time)
      )
    );

    console.log('Unique events after deduplication:', uniqueEvents.length);
    return uniqueEvents;
  };

  const getEventColor = (type, isRecurring = false) => {
    if (isRecurring) {
      return 'bg-blue-100 border-blue-300 text-blue-800';
    }

    const colors = {
      'lecture': 'bg-blue-100 border-blue-300 text-blue-800',
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

  // FullCalendar event handlers
  const handleDateSelect = (selectInfo) => {
    const title = prompt('Please enter a title for your event');
    if (title) {
      const calendarApi = selectInfo.view.calendar;
      calendarApi.unselect(); // clear date selection

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
    if (confirm(`Are you sure you want to delete the event '${clickInfo.event.title}'`)) {
      clickInfo.event.remove();
    }
  };

  const createEventId = () => {
    return String(Math.random()).replace(/\D/g, '');
  };

  // Convert our events to FullCalendar format
  const getFullCalendarEvents = () => {
    console.log('getFullCalendarEvents called');
    console.log('Current schedule length:', schedule.length);
    console.log('Schedule sample:', schedule.slice(0, 3));

    const fullCalendarEvents = schedule.map(event => ({
      id: event.id,
      title: event.title,
      start: event.start_time,
      end: event.end_time,
      extendedProps: {
        location: event.location,
        instructor: event.instructor_name,
        description: event.description,
        isRecurring: event.isRecurring,
        classId: event.classId
      }
    }));

    console.log('FullCalendar events:', fullCalendarEvents.length);
    return fullCalendarEvents;
  };

  return (
    <div className="space-y-6 h-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Teaching Schedule</h1>
          <p className="text-gray-600">View your class schedule and teaching sessions (8 AM - 8 PM)</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('timeGridWeek')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${viewMode === 'timeGridWeek'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('timeGridDay')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${viewMode === 'timeGridDay'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Day
            </button>
          </div>

          <button
            onClick={goToToday}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
                    isSameDay(parseISO(event.start_time), day)
                  );
                  const isSelected = isSameDay(day, selectedDate);

                  days.push(
                    <button
                      key={i}
                      onClick={() => setSelectedDate(day)}
                      className={`w-full p-3 text-left rounded-lg transition-colors ${isSelected
                          ? 'bg-blue-100 border-2 border-blue-300'
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
                  isSameDay(parseISO(event.start_time), selectedDate)
                ).length} events scheduled
              </p>
            </div>

            <div className="p-4">
              {(() => {
                const dayEvents = schedule.filter(event =>
                  isSameDay(parseISO(event.start_time), selectedDate)
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
                  <div className="space-y-4 h-full">
                    {dayEvents.map((event, index) => (
                      <div key={event.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                            <h3 className="text-base font-semibold text-gray-900">{event.title}</h3>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                              Teaching Class
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
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">{event.location}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">{event.instructor_name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">Students</span>
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
          <style jsx>{`
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
              border-color: #3b82f6;
              border-width: 2px;
            }
            .fc-timegrid-now-indicator-arrow {
              border-color: #3b82f6;
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
            editable={false}
            selectable={true}
            selectMirror={true}
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

              // Base Tailwind classes for all events
              const baseClasses = 'rounded-md border-l-4 text-xs font-medium p-1 m-0.5 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md';

              // Color classes using Tailwind
              let colorClasses = 'bg-blue-100 border-blue-300 text-blue-800';

              return [baseClasses, colorClasses];
            }}
            eventContent={(arg) => {
              return {
                html: `
                  <div class="p-1">
                    <div class="font-semibold text-xs mb-0.5 text-blue-700">${arg.event.title}</div>
                    <div class="text-xs opacity-75 mb-0.5 text-blue-700">${arg.timeText}</div>
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

export default TeacherSchedule;