import { useState, useEffect } from 'react';
import { Calendar, Users, BookOpen, Clock, TrendingUp, FileText, MessageSquare } from 'lucide-react';
import { mockClasses, mockUsers } from '../../data/mockData';

const TeacherDashboard = ({ user }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Use mock data instead of API call
      if (user && user.id) {
        // Find teacher in mock data
        const teacher = mockUsers.teachers.find(t => t.id === user.id);
        if (!teacher) {
          setDashboardData({
            courses: [],
            upcomingSessions: [],
            pendingGrading: [],
            studentActivity: []
          });
          setLoading(false);
          return;
        }

        // Get classes taught by this teacher
        const courses = mockClasses.filter(c => c.teacherId === user.id);
        
        // Generate upcoming sessions from teacher's classes
        const upcomingSessions = generateUpcomingSessions(courses);
        
        const data = {
          courses,
          upcomingSessions,
          pendingGrading: [], // Mock empty for now
          studentActivity: [] // Mock empty for now
        };
        
        setDashboardData(data);
      } else {
        setDashboardData({
          courses: [],
          upcomingSessions: [],
          pendingGrading: [],
          studentActivity: []
        });
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate upcoming sessions from teacher's classes
  const generateUpcomingSessions = (courses) => {
    const sessions = [];
    const today = new Date();
    
    courses.forEach(cls => {
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
            sessions.push({
              id: `session-${cls.id}-${scheduleItem.day}`,
              title: cls.name,
              course_title: cls.name,
              scheduled_start: nextDate.toISOString(),
              zoom_meeting_id: `ZOOM-${cls.id}-${Date.now()}`,
              zoom_join_url: `https://zoom.us/j/${Math.floor(Math.random() * 1000000)}`,
              location: `Room ${getRoomForClass(cls.id)}`,
              day: scheduleItem.day,
              time: `${scheduleItem.startTime}-${scheduleItem.endTime}`
            });
          }
        });
      }
    });
    
    // Sort by date and return
    return sessions.sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start));
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { courses = [], upcomingSessions = [], pendingGrading = [], studentActivity = [] } = dashboardData || {};

  return (
    <div className="space-y-6">
      {/* User Info Card */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {user?.firstName?.charAt(0) || user?.name?.charAt(0) || 'T'}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user?.name || 'Teacher'
                }
              </h1>
              <p className="text-blue-100">Teacher • Education Professional</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium text-gray-900">{user?.email || 'teacher@example.com'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium text-gray-900">{user?.phone || '+1 (555) 123-4567'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Specialization</p>
              <p className="font-medium text-gray-900">{user?.specialization || 'Islamic Studies'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Join Date</p>
              <p className="font-medium text-gray-900">{user?.joinDate || 'Jan 2024'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">My Courses</p>
              <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.reduce((total, course) => total + (course.students?.length || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Upcoming Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{upcomingSessions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Grading</p>
              <p className="text-2xl font-bold text-gray-900">{pendingGrading.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Courses */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">My Courses</h2>
          </div>
          <div className="p-6">
            {courses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No courses assigned yet</p>
            ) : (
              <div className="space-y-4">
                {courses.map((course) => (
                  <div key={course.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{course.name}</h3>
                      <span className="text-sm text-gray-500">Course</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{course.description}</p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">
                          👥 {course.students?.length || 0} students
                        </span>
                        <span className="text-sm text-gray-500">
                          📊 85% avg progress
                        </span>
                      </div>
                      <button className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                        Manage
                      </button>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Schedule: {course.schedule && Array.isArray(course.schedule) 
                        ? course.schedule.map(item => `${item.day} ${item.startTime}-${item.endTime}`).join(', ')
                        : 'Schedule TBD'
                      }
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
                      <Calendar className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{session.course_title}</p>
                    <p className="text-sm text-gray-500 mb-2">
                      {session.day} • {session.time}
                    </p>
                    <p className="text-sm text-gray-500 mb-2">
                      {new Date(session.scheduled_start).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Meeting ID: {session.zoom_meeting_id || 'Not set'}
                      </span>
                      <div className="space-x-2">
                        {session.zoom_join_url && (
                          <a 
                            href={session.zoom_join_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                          >
                            Start Session
                          </a>
                        )}
                        <button className="text-sm bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700">
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pending Grading & Student Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Grading */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Pending Grading</h2>
          </div>
          <div className="p-6">
            {pendingGrading.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No submissions to grade</p>
            ) : (
              <div className="space-y-4">
                {pendingGrading.map((submission) => (
                  <div key={submission.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{submission.assignment_title}</h3>
                      <span className="text-sm text-gray-500">
                        {submission.max_points} pts
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Student: {submission.student_name}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      Course: {submission.course_title}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Submitted: {new Date(submission.submitted_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </span>
                      <button className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
                        Grade Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Student Activity */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recent Student Activity</h2>
          </div>
          <div className="p-6">
            {studentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {studentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {activity.student_name.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.student_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {activity.course_title} - {activity.progress_percentage}% complete
                      </p>
                      <p className="text-xs text-gray-500">
                        Last active: {new Date(activity.last_activity).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50">
              <BookOpen className="h-8 w-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium">Create Course</span>
            </button>
            <button className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50">
              <Calendar className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-sm font-medium">Schedule Session</span>
            </button>
            <button className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50">
              <FileText className="h-8 w-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium">Create Assignment</span>
            </button>
            <button className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50">
              <MessageSquare className="h-8 w-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium">Message Students</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;