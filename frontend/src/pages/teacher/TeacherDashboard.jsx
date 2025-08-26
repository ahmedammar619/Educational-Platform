import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, BookOpen, Clock, TrendingUp, FileText, MessageSquare } from 'lucide-react';
import { dashboardService } from '../../services';
import { getMockData } from '../../data/mockData';

const TeacherDashboard = ({ user }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch teacher dashboard data from backend
      const response = await dashboardService.getTeacherDashboard();
      
      // Combine backend data with mock data for components without backend
      const combinedData = {
        ...response,
        // Use mock data for components without backend endpoints
        upcomingSessions: getMockData('teacherDashboard').upcomingSessions,
        pendingGrading: getMockData('teacherDashboard').pendingGrading || [],
        studentActivity: getMockData('teacherDashboard').studentActivity || []
      };
      
      setDashboardData(combinedData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data. Using mock data instead.');
      // Fallback to mock data if backend fails
      setDashboardData(getMockData('teacherDashboard'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={fetchDashboardData} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Use fallback values if backend data is missing
  const data = dashboardData || getMockData('teacherDashboard');
  const { courses = [], upcomingSessions = [], pendingGrading = [], studentActivity = [] } = data;

  return (
    <div className="space-y-6 h-full">
      {/* User Info Card */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 p-6">
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
                      <Link
                        to={`/teacher/classes/${course.id}`}
                        className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      >
                        Manage
                      </Link>
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
            <Link
              to="/teacher/classes/create"
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50"
            >
              <BookOpen className="h-8 w-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium">Create Course</span>
            </Link>
            <Link
              to="/teacher/calendar"
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50"
            >
              <Calendar className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-sm font-medium">Schedule Session</span>
            </Link>
            <Link
              to="/teacher/assignments"
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50"
            >
              <FileText className="h-8 w-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium">Create Assignment</span>
            </Link>
            <Link
              to="/teacher/messages"
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50"
            >
              <MessageSquare className="h-8 w-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium">Message Students</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;