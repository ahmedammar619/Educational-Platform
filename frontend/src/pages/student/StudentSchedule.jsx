import React, { useState, useEffect } from 'react';
import { studentsService, coursesService, usersService } from '../../services';

const StudentSchedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all required data in parallel
      const [scheduleResponse, classesResponse, teachersResponse] = await Promise.all([
        studentsService.getStudentSchedule(),
        coursesService.getAllCourses(),
        usersService.getUsersByRole('teacher')
      ]);
      
      setSchedule(scheduleResponse.schedule || []);
      setClasses(classesResponse.courses || []);
      setTeachers(teachersResponse.users || []);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Teacher TBD';
  };

  const getScheduleDisplay = (schedule) => {
    if (!schedule || schedule.length === 0) return 'Schedule TBD';
    
    return schedule.map(session => 
      `${session.day} ${session.startTime}-${session.endTime}`
    ).join(', ');
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
    return schedule.filter(item => item.day === dayName);
  };

  const getTotalWeeklyHours = () => {
    let totalMinutes = 0;
    schedule.forEach(item => {
      totalMinutes += item.duration || 120;
    });
    return (totalMinutes / 60).toFixed(1);
  };

  const getTotalWeeklyCost = () => {
    let totalCost = 0;
    const uniqueClasses = new Set(schedule.map(item => item.classId));
    
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Schedule</h1>
          <p className="text-gray-600">View your weekly class schedule and upcoming sessions</p>
        </div>

        {/* Schedule Overview */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{classes.length}</div>
              <div className="text-sm text-gray-600">Enrolled Classes</div>
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
                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
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
                            <span className="text-sm font-medium text-blue-600">📚</span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{cls.className}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getTeacherName(cls.teacherId)}
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
              You don't have any classes scheduled yet.
            </p>
            <button
              onClick={() => window.location.href = '/student/classes'}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Classes
            </button>
          </div>
        )}

        {/* Upcoming Sessions */}
        {schedule.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Sessions</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schedule.slice(0, 6).map((session) => (
                <div key={session.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{session.className}</h4>
                    <span className="text-xs text-gray-500">{session.day}</span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {getTimeRangeDisplay(session.startTime, session.endTime)}
                  </p>
                  
                  <p className="text-xs text-gray-500">
                    Teacher: {getTeacherName(session.teacherId)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSchedule;