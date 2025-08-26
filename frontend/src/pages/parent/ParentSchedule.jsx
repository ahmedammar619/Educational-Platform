import { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, MapPin, User, Filter, ChevronLeft, ChevronRight, Users, BookOpen, GraduationCap } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, parseISO, addDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { mockUsers, mockCourses } from '../../data/mockData';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';


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
      setSelectedChildFilter(childrenSummary[0].id.toString());
    }
  }, [childrenSummary, selectedChildFilter]);

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

  const loadParentSchedule = () => {
    setLoading(true);

    try {
      // Mock children schedule data for demonstration
      const mockChildrenSchedule = [
        {
          id: 1,
          name: "Ahmad Al-Noor",
          age: 12,
          classesCount: 3,
          classes: [
            {
              id: 1,
              name: "Quran Memorization - Juz 1",
              teacher: "Sheikh Abdullah Al-Mahmoud",
              schedule: [
                { day: "Monday", startTime: "16:00", endTime: "18:00" },
                { day: "Wednesday", startTime: "16:00", endTime: "18:00" }
              ]
            },
            {
              id: 2,
              name: "Islamic Studies - Level 1",
              teacher: "Ustadha Fatima Al-Rashid",
              schedule: [
                { day: "Tuesday", startTime: "14:00", endTime: "16:00" },
                { day: "Thursday", startTime: "14:00", endTime: "16:00" }
              ]
            },
            {
              id: 3,
              name: "Arabic Language - Beginner",
              teacher: "Ustadh Omar Al-Zahra",
              schedule: [
                { day: "Saturday", startTime: "10:00", endTime: "12:00" }
              ]
            }
          ]
        },
        {
          id: 2,
          name: "Aisha Al-Noor",
          age: 10,
          classesCount: 2,
          classes: [
            {
              id: 4,
              name: "Quran Recitation - Tajweed",
              teacher: "Ustadha Zainab Al-Khalil",
              schedule: [
                { day: "Monday", startTime: "14:00", endTime: "16:00" },
                { day: "Wednesday", startTime: "14:00", endTime: "16:00" }
              ]
            },
            {
              id: 5,
              name: "Islamic History - Stories of Prophets",
              teacher: "Ustadh Khalid Al-Sabah",
              schedule: [
                { day: "Friday", startTime: "15:00", endTime: "17:00" }
              ]
            }
          ]
        }
      ];

      // Mock enrolled classes with proper schedule structure
      const mockEnrolledClasses = [
        {
          id: 1,
          name: "Quran Memorization - Juz 1",
          description: "Learn to memorize the first Juz of the Holy Quran with proper tajweed rules",
          teacherId: "teacher-1",
          startDate: "2025-01-01",
          endDate: "2025-12-31",
          schedule: [
            { day: "Monday", startTime: "16:00", endTime: "18:00" },
            { day: "Wednesday", startTime: "16:00", endTime: "18:00" }
          ],
          childId: 1,
          childName: "Ahmad Al-Noor"
        },
        {
          id: 2,
          name: "Islamic Studies - Level 1",
          description: "Comprehensive Islamic education covering basic principles and practices",
          teacherId: "teacher-2",
          startDate: "2025-01-01",
          endDate: "2025-12-31",
          schedule: [
            { day: "Tuesday", startTime: "14:00", endTime: "16:00" },
            { day: "Thursday", startTime: "14:00", endTime: "16:00" }
          ],
          childId: 1,
          childName: "Ahmad Al-Noor"
        },
        {
          id: 3,
          name: "Arabic Language - Beginner",
          description: "Learn basic Arabic reading, writing, and conversation skills",
          teacherId: "teacher-3",
          startDate: "2025-01-01",
          endDate: "2025-12-31",
          schedule: [
            { day: "Saturday", startTime: "10:00", endTime: "12:00" }
          ],
          childId: 1,
          childName: "Ahmad Al-Noor"
        },
        {
          id: 4,
          name: "Quran Recitation - Tajweed",
          description: "Master the rules of tajweed for beautiful Quran recitation",
          teacherId: "teacher-4",
          startDate: "2025-01-01",
          endDate: "2025-12-31",
          schedule: [
            { day: "Monday", startTime: "14:00", endTime: "16:00" },
            { day: "Wednesday", startTime: "14:00", endTime: "16:00" }
          ],
          childId: 2,
          childName: "Aisha Al-Noor"
        },
        {
          id: 5,
          name: "Islamic History - Stories of Prophets",
          description: "Learn about the lives and teachings of the prophets in Islamic tradition",
          teacherId: "teacher-5",
          startDate: "2025-01-01",
          endDate: "2025-12-31",
          schedule: [
            { day: "Friday", startTime: "15:00", endTime: "17:00" }
          ],
          childId: 2,
          childName: "Aisha Al-Noor"
        }
      ];

      console.log('Using mock children schedule data');
      console.log('Mock children:', mockChildrenSchedule);
      console.log('Mock enrolled classes:', mockEnrolledClasses);

      // Convert class schedules to calendar events
      const classEvents = convertClassesToEvents(mockEnrolledClasses);
      console.log('Class events:', classEvents);

      // Sort events by start time
      const sortedEvents = classEvents.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

      setSchedule(sortedEvents);
      setCourses(mockEnrolledClasses);
      setChildrenSummary(mockChildrenSchedule);

      // Auto-select the first child if only one child or no child is selected
      if (mockChildrenSchedule.length === 1 && !selectedChildFilter) {
        setSelectedChildFilter(mockChildrenSchedule[0].id.toString());
      }
    } catch (error) {
      console.error('Error loading parent schedule:', error);
      setSchedule([]);
      setCourses([]);
      setChildrenSummary([]);
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

    if (!scheduleInfo) return events;

    // Get teacher name from mockUsers
    const teacher = mockUsers.find(t => t.id === classItem.teacherId && t.role === 'teacher');
    const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Teacher TBD';

    // Find the first occurrence of each scheduled day
    const firstOccurrences = scheduleInfo.days.map(dayOfWeek => {
      let date = new Date(startDate);
      while (date.getDay() !== dayOfWeek) {
        date = addDays(date, 1);
      }
      return date;
    });

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
          id: `class-${classItem.id}-${eventDate.getTime()}-${classItem.childId}`,
          title: classItem.name,
          type: 'lecture',
          start_time: eventDate.toISOString(),
          end_time: eventEndDate.toISOString(),
          location: `Room ${getRoomForClass(classItem.id)}`,
          instructor_name: teacherName,
          course_title: classItem.name,
          description: classItem.description,
          classId: classItem.id,
          childId: classItem.childId,
          childName: classItem.childName,
          isRecurring: true,
          weekNumber: Math.floor((eventDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
        });

        // Move to next week (7 days later)
        currentOccurrence = addDays(currentOccurrence, 7);
      }
    });

    return events;
  };

  // Parse schedule using the new data structure
  const parseScheduleFromCourse = (course) => {
    if (course.schedule && Array.isArray(course.schedule)) {
      // Use the new structured schedule data
      const days = course.schedule.map(item => getDayNumber(item.day));

      // Parse startTime (e.g., "16:00" -> hour: 16, minute: 0)
      if (course.schedule.length > 0) {
        const [startHour, startMinute] = course.schedule[0].startTime.split(':').map(Number);

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
            const teacher = mockUsers.find(t => t.id === course.teacherId && t.role === 'teacher');
            const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Teacher TBD';

            upcoming.push({
              course: course.name,
              child: course.childName,
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
    if (courses.length === 0) return [];

    console.log('Generating events for date range:', format(startDate, 'yyyy-MM-dd'), 'to', format(endDate, 'yyyy-MM-dd'));
    console.log('Available courses:', courses.map(c => ({ name: c.name, schedule: c.schedule, child: c.childName })));

    const events = [];
    courses.forEach((classItem) => {
      const scheduleInfo = parseScheduleFromCourse(classItem);
      if (scheduleInfo) {
        console.log('Parsed schedule for', classItem.name, ':', scheduleInfo);

        // Get teacher name
        const teacher = mockUsers.find(t => t.id === classItem.teacherId && t.role === 'teacher');
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
              id: `class-${classItem.id}-${eventDate.getTime()}-${classItem.childId}`,
              title: classItem.name,
              type: 'lecture',
              start_time: eventDate.toISOString(),
              end_time: eventEndDate.toISOString(),
              location: `Room ${getRoomForClass(classItem.id)}`,
              instructor_name: teacherName,
              course_title: classItem.name,
              description: classItem.description,
              classId: classItem.id,
              childId: classItem.childId,
              childName: classItem.childName,
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
        (e.title === event.title && e.start_time === event.start_time && e.childId === event.childId)
      )
    );

    console.log('Unique events after deduplication:', uniqueEvents.length);
    return uniqueEvents;
  };

  // Convert our events to FullCalendar format
  const getFullCalendarEvents = () => {
    console.log('getFullCalendarEvents called with selectedChildFilter:', selectedChildFilter);
    console.log('Current schedule length:', schedule.length);
    console.log('Schedule sample:', schedule.slice(0, 3));

    if (!selectedChildFilter) {
      console.log('No child selected, returning empty array');
      return [];
    }

    const filteredEvents = schedule.filter(event => {
      const matches = event.childId === parseInt(selectedChildFilter);
      console.log(`Event ${event.title} (childId: ${event.childId}) matches ${selectedChildFilter}: ${matches}`);
      return matches;
    });

    console.log('Filtered events for child:', selectedChildFilter, filteredEvents);

    const fullCalendarEvents = filteredEvents.map(event => ({
      id: event.id,
      title: event.title,
      start: event.start_time,
      end: event.end_time,
      extendedProps: {
        location: event.location,
        instructor: event.instructor_name,
        childName: event.childName,
        description: event.description,
        isRecurring: event.isRecurring,
        childId: event.childId
      }
    }));

    console.log('FullCalendar events:', fullCalendarEvents);
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
    const location = event.extendedProps.location || 'TBD';
    const instructor = event.extendedProps.instructor || 'TBD';

    alert(`Class: ${event.title}\nChild: ${childName}\nTime: ${event.start.toLocaleString()}\nLocation: ${location}\nInstructor: ${instructor}`);
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
                Showing classes for: {childrenSummary.find(c => c.id === parseInt(selectedChildFilter))?.name}
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
                onClick={() => setSelectedChildFilter(childrenSummary[0].id.toString())}
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
                    event.childId === parseInt(selectedChildFilter)
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
                  event.childId === parseInt(selectedChildFilter)
                ).length} events scheduled
              </p>
            </div>

            <div className="p-4">
              {(() => {
                const dayEvents = schedule.filter(event =>
                  isSameDay(parseISO(event.start_time), selectedDate) &&
                  event.childId === parseInt(selectedChildFilter)
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
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">{event.location}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">{event.instructor_name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span className="text-purple-700 font-bold">{event.childName}</span>
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
              const location = event.extendedProps.location || 'TBD';
              const instructor = event.extendedProps.instructor || 'TBD';
              const childName = event.extendedProps.childName || 'Child';

              return {
                html: `
                   <div class="p-1">
                     <div class="font-semibold text-xs mb-0.5 text-purple-700">${event.title}</div>
                     <div class="text-xs opacity-75 mb-0.5 text-purple-700">${arg.timeText}</div>
                     <div class="text-xs opacity-60 text-purple-600">${childName} • ${location} • ${instructor}</div>
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