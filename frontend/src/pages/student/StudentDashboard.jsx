import { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { mockAnalytics, mockClasses, mockUsers } from '../../data/mockData';

const StudentDashboard = ({ user }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Simulate API call with mock data
      setTimeout(() => {
        if (!user || !user.id) {
          setDashboardData({
            courses: [],
            upcomingSessions: [],
            analytics: mockAnalytics.student,
            announcements: []
          });
          setLoading(false);
          return;
        }

        // Find student in mock data
        const student = mockUsers.students.find(s => s.id === user.id);
        if (!student) {
          setDashboardData({
            courses: [],
            upcomingSessions: [],
            analytics: mockAnalytics.student,
            announcements: []
          });
          setLoading(false);
          return;
        }

        // Get enrolled classes
        const enrolledClasses = mockClasses.filter(c => 
          c.students.includes(user.id)
        );

        const classesWithDetails = enrolledClasses.map(cls => {
          const teacher = mockUsers.teachers.find(t => t.id === cls.teacherId);
          const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Teacher TBD';
          
          // Generate mock progress
          const progress = Math.floor(Math.random() * 30) + 70;
          
          // Get schedule display
          const scheduleDisplay = cls.schedule && Array.isArray(cls.schedule) 
            ? cls.schedule.map(item => `${item.day} ${item.startTime}-${item.endTime}`).join(', ')
            : 'Schedule TBD';

          return {
            ...cls,
            teacherName,
            progress,
            scheduleDisplay
          };
        });

        // Generate upcoming sessions from enrolled classes
        const upcomingSessions = generateUpcomingSessions(enrolledClasses);

        setDashboardData({
          courses: classesWithDetails,
          upcomingSessions: upcomingSessions.slice(0, 3),
          analytics: mockAnalytics.student,
          announcements: [
            {
              id: 1,
              title: 'Welcome to Baraem Al-Nour!',
              message: 'We are excited to have you join our Islamic learning community.',
              date: '2025-02-15',
              type: 'info'
            },
            {
              id: 2,
              title: 'Class Schedule Update',
              message: 'Please check your calendar for any schedule changes.',
              date: '2025-02-14',
              type: 'warning'
            }
          ]
        });
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  // Generate upcoming sessions from enrolled classes
  const generateUpcomingSessions = (enrolledClasses) => {
    const sessions = [];
    const today = new Date();
    
    enrolledClasses.forEach(cls => {
      if (cls.schedule && Array.isArray(cls.schedule)) {
        cls.schedule.forEach(scheduleItem => {
          // Find next occurrence of this scheduled day
          const dayNumber = getDayNumber(scheduleItem.day);
          let nextDate = new Date(today);
          
          while (nextDate.getDay() !== dayNumber) {
            nextDate.setDate(nextDate.getDate() + 1);
          }
          
          // Only add if it's in the future
          if (nextDate > today) {
            const teacher = mockUsers.teachers.find(t => t.id === cls.teacherId);
            const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Teacher TBD';
            
            sessions.push({
              id: `session-${cls.id}-${scheduleItem.day}`,
              title: cls.name,
              location: `Room ${getRoomForClass(cls.id)}`,
              start: nextDate.toISOString(),
              teacher: teacherName,
              day: scheduleItem.day,
              time: `${scheduleItem.startTime}-${scheduleItem.endTime}`
            });
          }
        });
      }
    });
    
    // Sort by date and return
    return sessions.sort((a, b) => new Date(a.start) - new Date(b.start));
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const { courses = [], upcomingSessions = [], analytics = {}, announcements = [] } = dashboardData || {};

  return (
    <div className="space-y-6">
      {/* User Info Card */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-red-600 p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {user?.firstName?.charAt(0) || user?.name?.charAt(0) || 'S'}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user?.name || 'Student'
                }
              </h1>
              <p className="text-red-100">Student • Islamic Learning Journey</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium text-gray-900">{user?.email || 'student@example.com'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Student ID</p>
              <p className="font-medium text-gray-900">{user?.id || 'STU001'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Age</p>
              <p className="font-medium text-gray-900">{user?.age || 'N/A'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Join Date</p>
              <p className="font-medium text-gray-900">{user?.joinDate || 'Jan 2024'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Enrolled Classes</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.enrolledClasses || courses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Upcoming Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.upcomingSessions || upcomingSessions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overall Progress</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overallProgress}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Attendance</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.attendance}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Classes */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">My Classes</h2>
          </div>
          <div className="p-6">
            {courses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No classes enrolled yet</p>
            ) : (
              <div className="space-y-4">
                {courses.map((course) => (
                  <div key={course.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{course.name}</h3>
                      <span className="text-sm text-gray-500">{course.progress}%</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Teacher: {course.teacherName}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full" 
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>Schedule: {course.scheduleDisplay}</span>
                      <span>Duration: 120 min</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Sessions</h2>
          </div>
          <div className="p-6">
            {upcomingSessions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No upcoming sessions</p>
            ) : (
              <div className="space-y-4">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{session.title}</h3>
                      <Clock className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {session.location && `Location: ${session.location}`}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      Teacher: {session.teacher}
                    </p>
                    <p className="text-sm text-gray-500">
                      {session.day} • {session.time}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(session.start), 'MMM dd, yyyy')}
                    </p>
                    <button className="inline-block mt-2 text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
                      Join Class
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Progress Overview</h2>
        </div>
        <div className="p-6">
          {courses.length > 0 ? (
            <div className="space-y-4">
              {courses.map((classItem) => (
                <div key={classItem.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-900">{classItem.name}</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Progress:</span>
                      <span className="text-sm font-medium text-gray-900">{classItem.progress}%</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Teacher: {classItem.teacherName}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full" 
                      style={{ width: `${classItem.progress}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Schedule: {classItem.scheduleDisplay}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No progress data available</p>
          )}
        </div>
      </div>

      {/* Announcements */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Announcements</h2>
        </div>
        <div className="p-6">
          {announcements.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No announcements</p>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div key={announcement.id} className={`border-l-4 p-4 rounded-r-lg ${
                  announcement.type === 'info' ? 'border-red-400 bg-red-50' :
                  announcement.type === 'warning' ? 'border-yellow-400 bg-yellow-50' :
                  'border-red-400 bg-red-50'
                }`}>
                  <h3 className="font-medium text-gray-900 mb-1">{announcement.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{announcement.message}</p>
                  <p className="text-xs text-gray-500">{format(new Date(announcement.date), 'MMM dd, yyyy')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;