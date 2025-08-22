import { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, MapPin, User, Filter, ChevronLeft, ChevronRight, BookOpen, Users } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, parseISO, addDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { mockUsers, mockClasses } from '../../data/mockData';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

const StudentSchedule = ({ user }) => {
  const [schedule, setSchedule] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState('timeGridWeek'); // FullCalendar view modes
  const [selectedDate, setSelectedDate] = useState(new Date());
  const calendarRef = useRef(null);

  useEffect(() => {
    if (user) {
      loadStudentSchedule();
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

  const loadStudentSchedule = () => {
    setLoading(true);

    try {
      // Get student's enrolled classes from mock data
      if (!user || !user.id) {
        console.log('No valid user ID, using mock data');
        setSchedule([]);
        setCourses([]);
        return;
      }

      // Find student in mock data
      const student = mockUsers.students.find(s => s.id === user.id);
      if (!student) {
        console.log('Student not found in mock data');
        setSchedule([]);
        setCourses([]);
        return;
      }

      // Get enrolled classes - check both ways to ensure we get the data
      const enrolledClasses = mockClasses.filter(c =>
        c.students && c.students.includes(user.id)
      );

      console.log('User ID:', user.id);
      console.log('Student found:', student);
      console.log('Student courseIds:', student.courseIds);
      console.log('Enrolled classes:', enrolledClasses);

      if (enrolledClasses.length === 0) {
        console.log('No enrolled classes found, trying alternative method');
        // Try alternative method using student.courseIds
        if (student.courseIds && student.courseIds.length > 0) {
          const classesByIds = student.courseIds.map(id =>
            mockClasses.find(c => c.id === id)
          ).filter(Boolean);

          console.log('Classes found by IDs:', classesByIds);
          if (classesByIds.length > 0) {
            setCourses(classesByIds);
            const classEvents = convertClassesToEvents(classesByIds);
            const sortedEvents = classEvents.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
            setSchedule(sortedEvents);
            setLoading(false);
            return;
          }
        }

        console.log('No enrolled classes found');
        setSchedule([]);
        setCourses([]);
        return;
      }

      // Convert class schedules to calendar events
      const classEvents = convertClassesToEvents(enrolledClasses);
      console.log('Class events:', classEvents);

      // Sort events by start time
      const sortedEvents = classEvents.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

      setSchedule(sortedEvents);
      setCourses(enrolledClasses);
    } catch (error) {
      console.error('Error loading student schedule:', error);
      setSchedule([]);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const convertClassesToEvents = (enrolledClasses) => {
    const events = [];
    const today = new Date();

    enrolledClasses.forEach((classItem) => {
      // Use the course's actual start and end dates
      const courseStartDate = new Date(classItem.startDate);
      const courseEndDate = new Date(classItem.endDate);

      // Only generate events if the course is active (end date is in the future)
      if (courseEndDate > today) {
        const classEvents = generateClassEvents(classItem, courseStartDate, courseEndDate);
        events.push(...classEvents);
      }
    });

    return events;
  };

  const generateClassEvents = (classItem, startDate, endDate) => {
    const events = [];

    // Parse schedule using the new data structure
    const scheduleInfo = parseScheduleFromCourse(classItem);

    if (!scheduleInfo) {
      console.log('No schedule info for class:', classItem.name, classItem.schedule);
      return events;
    }

    console.log('Generating events for class:', classItem.name, 'with schedule:', scheduleInfo);

    // Get teacher name from mockUsers
    const teacher = mockUsers.teachers.find(t => t.id === classItem.teacherId);
    const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Teacher TBD';

    // Find the first occurrence of each scheduled day
    const firstOccurrences = scheduleInfo.days.map(dayOfWeek => {
      let date = new Date(startDate);
      while (date.getDay() !== dayOfWeek) {
        date = addDays(date, 1);
      }
      return date;
    });

    console.log('First occurrences for days:', firstOccurrences.map(d => format(d, 'EEEE yyyy-MM-dd')));

    // Generate events for each scheduled day, repeating weekly
    firstOccurrences.forEach(firstDate => {
      let currentOccurrence = new Date(firstDate);

      while (isBefore(currentOccurrence, endDate)) {
        // Set the time for this occurrence
        const eventDate = new Date(currentOccurrence);
        eventDate.setHours(scheduleInfo.hour, scheduleInfo.minute, 0, 0);

        // Calculate end time based on session duration (120 minutes)
        const eventEndDate = new Date(eventDate);
        eventEndDate.setMinutes(eventEndDate.getMinutes() + 120);

        // Add all events within the course period (including past events for display purposes)
        events.push({
          id: `class-${classItem.id}-${eventDate.getTime()}`,
          title: classItem.name,
          type: 'lecture',
          start_time: eventDate.toISOString(),
          end_time: eventEndDate.toISOString(),
          location: `Room ${getRoomForClass(classItem.id)}`,
          instructor_name: teacherName,
          course_title: classItem.name,
          description: classItem.description,
          classId: classItem.id,
          isRecurring: true,
          weekNumber: Math.floor((eventDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
        });

        // Move to next week (7 days later)
        currentOccurrence = addDays(currentOccurrence, 7);
      }
    });

    console.log('Generated events for class:', classItem.name, ':', events.length);
    return events;
  };

  // Parse schedule using the new data structure
  const parseScheduleFromCourse = (course) => {
    console.log('Parsing schedule for course:', course.name, 'Schedule data:', course.schedule);

    if (course.schedule && Array.isArray(course.schedule)) {
      // Use the new structured schedule data
      const days = course.schedule.map(item => getDayNumber(item.day));

      console.log('Parsed days:', days, 'from schedule items:', course.schedule.map(s => s.day));

      // Parse startTime (e.g., "16:00" -> hour: 16, minute: 0)
      if (course.schedule.length > 0) {
        const [startHour, startMinute] = course.schedule[0].startTime.split(':').map(Number);

        console.log('Parsed time:', { hour: startHour, minute: startMinute });

        if (startHour !== undefined && startMinute !== undefined) {
          return {
            days,
            hour: startHour,
            minute: startMinute
          };
        }
      }
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

  const getRoomForClass = (classId) => {
    // Simple room assignment based on class ID
    const rooms = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2'];
    return rooms[classId % rooms.length];
  };

  const getUpcomingClasses = () => {
    if (courses.length === 0) return [];

    const upcoming = [];
    const today = new Date();
    const nextWeek = addDays(today, 7);

    courses.forEach(course => {
      const scheduleInfo = parseScheduleFromCourse(course);
      if (scheduleInfo) {
        // Find next occurrence of this class
        scheduleInfo.days.forEach(dayOfWeek => {
          let nextDate = new Date(today);
          while (nextDate.getDay() !== dayOfWeek) {
            nextDate = addDays(nextDate, 1);
          }

          if (isAfter(nextDate, today)) {
            const teacher = mockUsers.teachers.find(t => t.id === course.teacherId);
            const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Teacher TBD';

            upcoming.push({
              course: course.name,
              day: format(nextDate, 'EEEE'),
              time: `${scheduleInfo.hour}:${scheduleInfo.minute.toString().padStart(2, '0')}`,
              teacher: teacherName
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
    if (courses.length === 0) {
      console.log('No courses available for event generation');
      return [];
    }

    console.log('Generating events for date range:', format(startDate, 'yyyy-MM-dd'), 'to', format(endDate, 'yyyy-MM-dd'));
    console.log('Available courses:', courses.map(c => ({ name: c.name, schedule: c.schedule })));

    const events = [];
    courses.forEach((classItem) => {
      const scheduleInfo = parseScheduleFromCourse(classItem);
      if (scheduleInfo) {
        console.log('Parsed schedule for', classItem.name, ':', scheduleInfo);

        // Get teacher name
        const teacher = mockUsers.teachers.find(t => t.id === classItem.teacherId);
        const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Teacher TBD';

        // Find the first occurrence of each scheduled day in the range
        scheduleInfo.days.forEach(dayOfWeek => {
          let currentDate = new Date(startDate);

          // Find the first occurrence of this day in the range
          while (currentDate.getDay() !== dayOfWeek && isBefore(currentDate, endDate)) {
            currentDate = addDays(currentDate, 1);
          }

          // Generate events for this day and subsequent weeks within the range
          while (isBefore(currentDate, endDate)) {
            const eventDate = new Date(currentDate);
            eventDate.setHours(scheduleInfo.hour, scheduleInfo.minute, 0, 0);

            // Calculate end time based on session duration (120 minutes)
            const eventEndDate = new Date(eventDate);
            eventEndDate.setMinutes(eventEndDate.getMinutes() + 120);

            events.push({
              id: `class-${classItem.id}-${eventDate.getTime()}`,
              title: classItem.name,
              type: 'lecture',
              start_time: eventDate.toISOString(),
              end_time: eventEndDate.toISOString(),
              location: `Room ${getRoomForClass(classItem.id)}`,
              instructor_name: teacherName,
              course_title: classItem.name,
              description: classItem.description,
              classId: classItem.id,
              isRecurring: true,
              weekNumber: Math.floor((eventDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
            });

            // Move to next week
            currentDate = addDays(currentDate, 7);
          }
        });
      } else {
        console.warn('Could not parse schedule for class:', classItem.name, classItem.schedule);
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
      return 'bg-red-100 border-red-300 text-red-800';
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

  // FullCalendar event handlers - Students can only view, not modify
  const handleDateSelect = (selectInfo) => {
    // Students cannot add events - just clear the selection
    selectInfo.view.calendar.unselect();
  };

  const handleEventClick = (clickInfo) => {
    // Students cannot delete events - just show event info
    const event = clickInfo.event;
    alert(`Class: ${event.title}\nTime: ${event.start.toLocaleString()}\nLocation: ${event.extendedProps.location || 'TBD'}\nInstructor: ${event.extendedProps.instructor || 'TBD'}`);
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
          <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
          <p className="text-gray-600">View your enrolled class schedule and upcoming events (8 AM - 8 PM)</p>
          <p className="text-sm text-gray-500 mt-1">📚 Read-only view • Contact your teacher or administrator for schedule changes</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('timeGridWeek')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${viewMode === 'timeGridWeek'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('timeGridDay')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${viewMode === 'timeGridDay'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Day
            </button>
          </div>

          <button
            onClick={goToToday}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
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
                          ? 'bg-red-100 border-2 border-red-300'
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
                      <div key={event.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            <BookOpen className="h-4 w-4 text-red-600" />
                            <h3 className="text-base font-semibold text-gray-900">{event.title}</h3>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
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
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">{event.location}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">{event.instructor_name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">You</span>
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
              border-color: #dc2626;
              border-width: 2px;
            }
            .fc-timegrid-now-indicator-arrow {
              border-color: #dc2626;
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
            editable={false} // Students cannot edit events
            selectable={false} // Students cannot select dates to add events
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

              // Base Tailwind classes for all events - read-only for students
              const baseClasses = 'rounded-md border-l-4 text-xs font-medium p-1 m-0.5 cursor-pointer transition-all duration-200 hover:shadow-md';

              // Color classes using Tailwind - red theme for students
              let colorClasses = 'bg-red-100 border-red-300 text-red-800';

              return [baseClasses, colorClasses];
            }}
            eventContent={(arg) => {
              const event = arg.event;
              const location = event.extendedProps.location || 'TBD';
              const instructor = event.extendedProps.instructor || 'TBD';

              return {
                html: `
                  <div class="p-1">
                    <div class="font-semibold text-xs mb-0.5 text-red-700">${event.title}</div>
                    <div class="text-xs opacity-75 mb-0.5 text-red-700">${arg.timeText}</div>
                    <div class="text-xs opacity-60 text-red-600">${location} • ${instructor}</div>
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

export default StudentSchedule;