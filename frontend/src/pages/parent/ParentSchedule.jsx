import React, { useState, useEffect } from 'react';
import { parentsService, coursesService, usersService } from '../../services';

const ParentSchedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [children, setChildren] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChild, setSelectedChild] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all required data in parallel
      const [childrenResponse, classesResponse, teachersResponse] = await Promise.all([
        parentsService.getMyChildren(),
        coursesService.getAllCourses(),
        usersService.getUsersByRole('teacher')
      ]);
      
      setChildren(childrenResponse.children || []);
      setClasses(classesResponse.courses || []);
      setTeachers(teachersResponse.users || []);
      
      // Generate schedule data
      generateScheduleData(childrenResponse.children || [], classesResponse.courses || []);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  };

  const generateScheduleData = (childrenData, classesData) => {
    const scheduleData = [];
    
    childrenData.forEach(child => {
      const childClasses = classesData.filter(cls => 
        cls.students && cls.students.includes(child.id)
      );
      
      childClasses.forEach(cls => {
        if (cls.schedule && Array.isArray(cls.schedule)) {
          cls.schedule.forEach(session => {
            const teacher = teachers.find(t => t.id === cls.teacherId);
            scheduleData.push({
              id: `${cls.id}-${child.id}-${session.day}`,
              childName: `${child.firstName} ${child.lastName}`,
              childId: child.id,
              className: cls.name,
              classId: cls.id,
              teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Teacher TBD',
              day: session.day,
              startTime: session.startTime,
              endTime: session.endTime,
              duration: cls.sessionDuration || 120,
              price: cls.price || 0
            });
          });
        }
      });
    });
    
    setSchedule(scheduleData);
  };

  const getDayNumber = (dayName) => {
    const dayMap = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    return dayMap[dayName] || 0;
  };

  const convert24To12Hour = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  const getTimeRangeDisplay = (startTime, endTime) => {
    if (!startTime || !endTime) return 'Time TBD';
    return `${convert24To12Hour(startTime)} - ${convert24To12Hour(endTime)}`;
  };

  const getWeekDays = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push({
        date: day,
        dayName: day.toLocaleDateString('en-US', { weekday: 'long' }),
        dayNumber: day.getDay()
      });
    }
    return days;
  };

  const getClassesForDay = (dayName) => {
    let filteredSchedule = schedule;
    
    if (selectedChild !== 'all') {
      filteredSchedule = filteredSchedule.filter(item => item.childId === selectedChild);
    }
    
    return filteredSchedule.filter(item => item.day === dayName);
  };

  const getTotalWeeklyHours = () => {
    let totalMinutes = 0;
    let filteredSchedule = schedule;
    
    if (selectedChild !== 'all') {
      filteredSchedule = filteredSchedule.filter(item => item.childId === selectedChild);
    }
    
    filteredSchedule.forEach(item => {
      totalMinutes += item.duration || 120;
    });
    
    return (totalMinutes / 60).toFixed(1);
  };

  const getTotalWeeklyCost = () => {
    let totalCost = 0;
    let filteredSchedule = schedule;
    
    if (selectedChild !== 'all') {
      filteredSchedule = filteredSchedule.filter(item => item.childId === selectedChild);
    }
    
    // Calculate cost based on sessions per week
    const uniqueClasses = new Set(filteredSchedule.map(item => item.classId));
    uniqueClasses.forEach(classId => {
      const classData = classes.find(cls => cls.id === classId);
      if (classData && classData.price) {
        totalCost += classData.price;
      }
    });
    
    return totalCost;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading schedule...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchData} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Weekly Schedule</h1>
          <p className="text-gray-600">View your children's class schedules and activities</p>
        </div>

        {/* Filters and Stats */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Child</label>
              <select
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Children</option>
                {children.map(child => (
                  <option key={child.id} value={child.id}>
                    {child.firstName} {child.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Week Starting</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedChild('all');
                  setSelectedDate(new Date().toISOString().split('T')[0]);
                }}
                className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{children.length}</div>
              <div className="text-sm text-gray-600">Children</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{getTotalWeeklyHours()}</div>
              <div className="text-sm text-gray-600">Hours per Week</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">SAR {getTotalWeeklyCost()}</div>
              <div className="text-sm text-gray-600">Weekly Cost</div>
            </div>
          </div>
        </div>

        {/* Weekly Schedule */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Weekly Schedule</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Day
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Child
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getWeekDays().map(({ dayName, date }) => {
                  const dayClasses = getClassesForDay(dayName);
                  
                  if (dayClasses.length === 0) {
                    return (
                      <tr key={dayName}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">{dayName}</div>
                            <div className="ml-2 text-xs text-gray-500">
                              {date.toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                          No classes scheduled
                        </td>
                      </tr>
                    );
                  }
                  
                  return dayClasses.map((cls, index) => (
                    <tr key={cls.id} className={index === 0 ? '' : 'border-t border-gray-100'}>
                      {index === 0 && (
                        <td className="px-6 py-4 whitespace-nowrap" rowSpan={dayClasses.length}>
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">{dayName}</div>
                            <div className="ml-2 text-xs text-gray-500">
                              {date.toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getTimeRangeDisplay(cls.startTime, cls.endTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {cls.childName.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{cls.childName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cls.className}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cls.teacherName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cls.duration} min
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* No Schedule Message */}
        {schedule.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Schedule Found</h3>
            <p className="text-gray-500 mb-4">
              Your children don't have any classes scheduled yet.
            </p>
            <button
              onClick={() => window.location.href = '/parent/children/create'}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Enroll in Classes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentSchedule;