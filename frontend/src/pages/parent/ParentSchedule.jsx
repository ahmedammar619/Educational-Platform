import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, Filter, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, parseISO, addDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { mockUsers, mockClasses } from '../../data/mockData';

const ParentSchedule = ({ user }) => {
  const [schedule, setSchedule] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'day'
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (user) {
      loadParentSchedule();
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
    }
  }, [currentWeek, courses]);

  const loadParentSchedule = () => {
    setLoading(true);
    
    try {
      // Get parent's children enrolled classes from mock data
      if (!user || !user.id || user.role !== 'parent') {
        console.log('No valid parent user, using mock data');
        setSchedule([]);
        setCourses([]);
        return;
      }
      
      // Find parent in mock data
      const parent = mockUsers.parents.find(p => p.id === user.id);
      if (!parent || !parent.children) {
        console.log('Parent or children not found in mock data');
        setSchedule([]);
        setCourses([]);
        return;
      }
      
      // Get all enrolled classes for all children
      const allEnrolledClasses = [];
      parent.children.forEach(childId => {
        const childClasses = mockClasses.filter(c => c.students.includes(childId));
        const child = mockUsers.students.find(s => s.id === childId);
        
        // Add child info to each class for identification
        childClasses.forEach(cls => {
          allEnrolledClasses.push({
            ...cls,
            childId: childId,
            childName: child ? `${child.firstName} ${child.lastName}` : 'Unknown Child'
          });
        });
      });
      
      console.log('Parent ID:', user.id);
      console.log('Children enrolled classes:', allEnrolledClasses);
      
      if (allEnrolledClasses.length === 0) {
        console.log('No enrolled classes found for children');
        setSchedule([]);
        setCourses([]);
        return;
      }
      
      // Convert class schedules to calendar events
      const classEvents = convertClassesToEvents(allEnrolledClasses);
      console.log('Class events:', classEvents);
      
      // Sort events by start time
      const sortedEvents = classEvents.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
      
      setSchedule(sortedEvents);
      setCourses(allEnrolledClasses);
    } catch (error) {
      console.error('Error loading parent schedule:', error);
      setSchedule([]);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const convertClassesToEvents = (enrolledClasses) => {
    const events = [];
    const today = new Date();
    const endDate = addDays(today, 365); // Generate events for next year (52 weeks)
    
    enrolledClasses.forEach((classItem) => {
      const classEvents = generateClassEvents(classItem, today, endDate);
      events.push(...classEvents);
    });
    
    return events;
  };

  const generateClassEvents = (classItem, startDate, endDate) => {
    const events = [];
    
    // Parse schedule using the new data structure
    const scheduleInfo = parseScheduleFromCourse(classItem);
    
    if (!scheduleInfo) return events;
    
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
        
        // Only add events that are in the future
        if (isAfter(eventDate, new Date())) {
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
        }
        
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
            const teacher = mockUsers.teachers.find(t => t.id === course.teacherId);
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

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentWeek, { weekStartsOn: 1 }),
    end: endOfWeek(currentWeek, { weekStartsOn: 1 })
  });

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  const getScheduleForDay = (date) => {
    console.log('Getting schedule for date:', format(date, 'yyyy-MM-dd'));
    
    // First check existing schedule
    const existingEvents = schedule.filter(item => {
      const itemDate = parseISO(item.start_time);
      return isSameDay(itemDate, date);
    });
    
    console.log('Existing events for this date:', existingEvents.length);
    
    // Generate events for the current week if we have courses
    if (courses.length > 0) {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
      console.log('Week range:', format(weekStart, 'yyyy-MM-dd'), 'to', format(weekEnd, 'yyyy-MM-dd'));
      
      const weekEvents = generateEventsForDateRange(weekStart, weekEnd);
      
      // Filter events for the specific date
      const weekEventsForDate = weekEvents.filter(item => {
        const itemDate = parseISO(item.start_time);
        return isSameDay(itemDate, date);
      });
      
      console.log('Generated events for this date:', weekEventsForDate.length);
      
      // Combine and sort all events
      const allEvents = [...existingEvents, ...weekEventsForDate];
      console.log('Total events for this date:', allEvents.length);
      return allEvents.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    }
    
    return existingEvents.sort((a, b) => new Date(a.start_time) - new Date(a.start_time));
  };

  const getScheduleForTimeSlot = (date, timeSlot) => {
    // Ensure we have events for this specific date by calling getScheduleForDay
    const daySchedule = getScheduleForDay(date);
    return daySchedule.filter(item => {
      const itemTime = format(parseISO(item.start_time), 'HH:mm');
      return itemTime === timeSlot;
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

  const getEventColor = (type, isRecurring = false, childId = null) => {
    if (isRecurring) {
      // Different colors for different children to distinguish them
      if (childId) {
        const colors = [
          'bg-blue-100 border-blue-300 text-blue-800',
          'bg-green-100 border-green-300 text-green-800',
          'bg-purple-100 border-purple-300 text-purple-800',
          'bg-orange-100 border-orange-300 text-orange-800',
          'bg-pink-100 border-pink-300 text-pink-800'
        ];
        return colors[childId % colors.length];
      }
      return 'bg-blue-100 border-blue-300 text-blue-800';
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
    
    // Debug: Log the new week to see what's happening
    const newWeek = direction === 'prev' ? subWeeks(currentWeek, 1) : addWeeks(currentWeek, 1);
    console.log('Navigating to week:', format(newWeek, 'yyyy-MM-dd'));
    console.log('Current courses:', courses);
    
    // Force regeneration of events for the new week
    const weekStart = startOfWeek(newWeek, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(newWeek, { weekStartsOn: 1 });
    console.log('New week range:', format(weekStart, 'yyyy-MM-dd'), 'to', format(weekEnd, 'yyyy-MM-dd'));
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
    setSelectedDate(new Date());
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
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                viewMode === 'week' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                viewMode === 'day' 
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
              {viewMode === 'week' 
                ? `Week of ${format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM dd, yyyy')}`
                : format(selectedDate, 'EEEE, MMM dd, yyyy')
              }
            </h2>
            <p className="text-sm text-gray-600">
              {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM dd')} - {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM dd, yyyy')}
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : viewMode === 'week' ? (
        <WeekView 
          weekDays={weekDays}
          timeSlots={timeSlots}
          getScheduleForTimeSlot={getScheduleForTimeSlot}
          getEventColor={getEventColor}
          getEventIcon={getEventIcon}
        />
      ) : (
        <DayView 
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          weekDays={weekDays}
          getScheduleForDay={getScheduleForDay}
          getEventColor={getEventColor}
          getEventIcon={getEventIcon}
        />
      )}

      {/* Legend */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Event Types</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {[
            { type: 'lecture', label: 'Lecture' },
            { type: 'lab', label: 'Lab' },
            { type: 'tutorial', label: 'Tutorial' },
            { type: 'seminar', label: 'Seminar' },
            { type: 'exam', label: 'Exam' },
            { type: 'assignment_due', label: 'Assignment Due' },
            { type: 'office_hours', label: 'Office Hours' },
            { type: 'enrolled', label: 'Enrolled Classes', isRecurring: true }
          ].map(({ type, label, isRecurring }) => (
            <div key={type} className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded border-2 ${getEventColor(type, isRecurring)}`}></div>
              <span className="text-xs text-gray-600">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Week View Component
const WeekView = ({ weekDays, timeSlots, getScheduleForTimeSlot, getEventColor, getEventIcon }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Get current time position for indicator
  const getCurrentTimePosition = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Find the closest time slot
    const timeSlotIndex = timeSlots.findIndex(slot => {
      const [hour] = slot.split(':').map(Number);
      return hour >= currentHour;
    });
    
    if (timeSlotIndex === -1) return null;
    
    // Calculate position within the time slot
    const slotHour = parseInt(timeSlots[timeSlotIndex].split(':')[0]);
    const minutesFromSlot = (currentHour - slotHour) * 60 + currentMinute;
    const slotHeight = 64; // Height of each time slot (h-16 = 64px)
    const position = (timeSlotIndex * slotHeight) + (minutesFromSlot / 60) * slotHeight;
    
    return position;
  };

  const currentTimePosition = getCurrentTimePosition();

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-full relative">
          {/* Header with Days */}
          <div className="grid grid-cols-8 border-b">
            <div className="p-4 bg-gray-50 border-r">
              <span className="text-sm font-medium text-gray-600">Time</span>
              <div className="text-xs text-gray-500 mt-1">GMT+00</div>
            </div>
            {weekDays.map((day) => (
              <div 
                key={day.toISOString()} 
                className="p-4 bg-gray-50 border-r last:border-r-0 text-center"
              >
                <div className="text-sm font-medium text-gray-900">
                  {format(day, 'EEE').toUpperCase()}
                </div>
                <div className="text-lg font-bold text-gray-900 mt-1">
                  {format(day, 'dd')}
                </div>
              </div>
            ))}
          </div>

          {/* Time slots and Events */}
          {timeSlots.map((timeSlot, index) => {
            const isCurrentTimeSlot = (() => {
              const now = new Date();
              const currentHour = now.getHours();
              const currentMinute = now.getMinutes();
              
              // Check if current time is between 8:00 and 20:00
              if (currentHour < 8 || currentHour >= 20) return false;
              
              // Check if this time slot matches current hour
              const [slotHour] = timeSlot.split(':').map(Number);
              return slotHour === currentHour;
            })();

            return (
              <div key={timeSlot} className="grid grid-cols-8 border-b last:border-b-0 relative">
                <div className={`p-3 bg-gray-50 border-r text-center flex items-center justify-center ${
                  isCurrentTimeSlot ? 'border-2 border-blue-500' : ''
                }`}>
                  <span className="text-sm font-medium text-gray-600">
                    {format(parseISO(`2000-01-01T${timeSlot}:00`), 'h a')}
                  </span>
                </div>
                {weekDays.map((day) => {
                  const events = getScheduleForTimeSlot(day, timeSlot);
                  // Remove duplicate events based on unique properties
                  const uniqueEvents = events.filter((event, index, self) => 
                    index === self.findIndex(e => 
                      e.id === event.id || 
                      (e.title === event.title && e.start_time === event.start_time && e.childId === event.childId)
                    )
                  );
                  return (
                    <div 
                      key={`${day.toISOString()}-${timeSlot}`} 
                      className={`p-2 border-r last:border-r-0 h-16 relative ${
                        isCurrentTimeSlot ? 'border-2 border-blue-500' : ''
                      }`}
                    >
                      {uniqueEvents.map((event) => (
                        <ScheduleEvent 
                          key={event.id} 
                          event={event} 
                          getEventColor={(type) => getEventColor(type, event.isRecurring, event.childId)}
                          getEventIcon={getEventIcon}
                          compact={true}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Current Time Indicator */}
          {currentTimePosition && (
            <div 
              className="absolute left-0 right-0 z-10 pointer-events-none"
              style={{ top: `${currentTimePosition}px` }}
            >
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full ml-4"></div>
                <div className="flex-1 h-0.5 bg-red-500"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Day View Component
const DayView = ({ selectedDate, setSelectedDate, weekDays, getScheduleForDay, getEventColor, getEventIcon }) => {
  const daySchedule = getScheduleForDay(selectedDate);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Day selector */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Select Day</h3>
          <div className="space-y-2">
            {weekDays.map((day) => (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`w-full text-left p-3 rounded-md transition-colors ${
                  isSameDay(day, selectedDate)
                    ? 'bg-purple-100 text-purple-900 border border-purple-300'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="font-medium">{format(day, 'EEEE')}</div>
                <div className="text-sm text-gray-600">{format(day, 'MMM dd')}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {getScheduleForDay(day).length} events
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Day schedule */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              {format(selectedDate, 'EEEE, MMMM dd, yyyy')}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {daySchedule.length} events scheduled
            </p>
          </div>
          
          <div className="p-6">
            {daySchedule.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No events scheduled for this day</p>
                <p className="text-sm text-gray-500">Enjoy your free time!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {daySchedule.map((event) => (
                  <ScheduleEvent 
                    key={event.id} 
                    event={event} 
                    getEventColor={(type) => getEventColor(type, event.isRecurring, event.childId)}
                    getEventIcon={getEventIcon}
                    compact={false}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Schedule Event Component
const ScheduleEvent = ({ event, getEventColor, getEventIcon, compact }) => {
  const startTime = format(parseISO(event.start_time), 'HH:mm');
  const endTime = format(parseISO(event.end_time), 'HH:mm');

  if (compact) {
    return (
      <div className={`p-2 rounded border-l-4 text-xs ${getEventColor(event.type)}`}>
        <div className="font-medium truncate">{event.title}</div>
        <div className="text-xs opacity-75">{startTime}-{endTime}</div>
        {event.childName && (
          <div className="text-xs opacity-75 font-medium">{event.childName}</div>
        )}
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border-l-4 ${getEventColor(event.type)}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">{getEventIcon(event.type)}</span>
            <h4 className="font-medium text-gray-900">{event.title}</h4>
          </div>
          
          {event.description && (
            <p className="text-sm text-gray-600 mb-3">{event.description}</p>
          )}
          
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>{startTime} - {endTime}</span>
            </div>
            
            {event.location && (
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
            )}
            
            {event.instructor_name && (
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>{event.instructor_name}</span>
              </div>
            )}
            
            {event.childName && (
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>{event.childName}</span>
              </div>
            )}
            
            {event.course_title && (
              <div className="text-xs text-gray-500 mt-2">
                Course: {event.course_title}
              </div>
            )}
          </div>
        </div>
        
        <div className="text-right">
          {event.isRecurring && (
            <div className="text-xs text-blue-600 font-medium mb-1">
              📚 Enrolled Class
            </div>
          )}
          {event.weekNumber && (
            <div className="text-xs text-blue-500 mb-1">
              Week {event.weekNumber}
            </div>
          )}
          <div className="text-xs text-gray-500 capitalize">
            {event.type.replace('_', ' ')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentSchedule;