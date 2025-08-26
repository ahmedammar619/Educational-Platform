import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, BookOpen, CheckCircle, TrendingUp, AlertCircle } from 'lucide-react';
import { dashboardService } from '../../services';
import { getMockData } from '../../data/mockData';

const StudentDashboard = ({ user }) => {
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

      // Fetch student dashboard data from backend
      const response = await dashboardService.getStudentDashboard(user.id);

      // Combine backend data with mock data for components without backend
      const combinedData = {
        ...response,
        // Use mock data for components without backend endpoints
        upcomingSessions: getMockData('studentDashboard').upcomingSessions,
        recentAssignments: getMockData('studentDashboard').recentAssignments,
        progress: getMockData('studentDashboard').progress
      };

      setDashboardData(combinedData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data. Using mock data instead.');
      // Fallback to mock data if backend fails
      setDashboardData(getMockData('studentDashboard'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Use fallback values if backend data is missing
  const data = dashboardData || getMockData('studentDashboard');

  // Calculate age from birthdate if available
  const calculateAge = (birthdate) => {
    if (!birthdate) return 'N/A';
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Format join date from createdAt
  const formatJoinDate = (createdAt) => {
    if (!createdAt) return 'Jan 2024';
    return new Date(createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-600';
    if (percentage >= 60) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">

        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-red-700 to-red-600 p-6">
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
                <p className="font-medium text-gray-900">
                  {data.profile?.age || (data.profile?.birthdate ? calculateAge(data.profile.birthdate) : 'N/A')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Join Date</p>
                <p className="font-medium text-gray-900">
                  {data.profile?.createdAt ? formatJoinDate(data.profile.createdAt) : 'Jan 2024'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{data.enrolledCourses?.length || 0}</div>
            <div className="text-sm text-gray-600">Enrolled Classes</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-2xl font-bold text-green-600">{data.progress?.overall || 0}%</div>
            <div className="text-sm text-gray-600">Overall Progress</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">{data.upcomingSessions?.length || 0}</div>
            <div className="text-sm text-gray-600">Upcoming Sessions</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-2xl font-bold text-orange-600">{data.recentAssignments?.length || 0}</div>
            <div className="text-sm text-gray-600">Recent Assignments</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Enrolled Classes */}
          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">My Classes</h2>
                <Link
                  to="/student/classes"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View All →
                </Link>
              </div>

              {!data.enrolledCourses || data.enrolledCourses.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">📚</div>
                  <p className="text-gray-500 mb-4">No classes enrolled yet</p>
                  <Link
                    to="/student/classes"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    Browse Classes
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.enrolledCourses.slice(0, 3).map((cls) => (
                    <div key={cls.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{cls.name}</h3>
                        <span className="text-sm text-gray-500">{cls.teacher?.name || 'Unknown Teacher'}</span>
                      </div>

                      {data.progress?.courses && data.progress.courses.find(c => c.name === cls.name) && (
                        <div className="mb-2">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Progress</span>
                            <span className={getProgressColor(data.progress.courses.find(c => c.name === cls.name).progress)}>
                              {data.progress.courses.find(c => c.name === cls.name).progress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getProgressBarColor(data.progress.courses.find(c => c.name === cls.name).progress)}`}
                              style={{ width: `${data.progress.courses.find(c => c.name === cls.name).progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Next: {cls.schedule?.[0]?.day || 'TBD'}</span>
                        <Link
                          to={`/student/classes/${cls.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Sessions */}
          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Upcoming Sessions</h2>
                <Link
                  to="/student/schedule"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View Schedule →
                </Link>
              </div>

              {!data.upcomingSessions || data.upcomingSessions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">📅</div>
                  <p className="text-gray-500">No upcoming sessions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.upcomingSessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">📚</span>
                      </div>

                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{session.courseName}</h4>
                        <p className="text-sm text-gray-600">
                          {session.date} at {session.startTime}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {session.teacher}
                        </div>
                        <div className="text-xs text-gray-500">
                          {session.startTime} - {session.endTime}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        {data.recentActivities && data.recentActivities.length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activities</h2>

              <div className="space-y-3">
                {data.recentActivities.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-sm">✓</span>
                    </div>

                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">{activity.timestamp}</p>
                    </div>

                    {activity.type && (
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {activity.type}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;