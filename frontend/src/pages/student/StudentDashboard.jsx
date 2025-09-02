import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, BookOpen, CheckCircle, TrendingUp, AlertCircle, Clock, Target, Award, FileText } from 'lucide-react';
import { dashboardService } from '../../services';

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
      setDashboardData(response);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data. Please try again later.');
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
  const data = dashboardData || {
    profile: {
      id: user?.id,
      firstName: user?.firstName,
      lastName: user?.lastName,
      email: user?.email,
      role: 'student',
      birthdate: null,
      age: 'N/A',
      createdAt: null
    },
    stats: {
      totalClasses: 0,
      totalSessions: 0,
      attendanceRate: 0
    },
    enrolledCourses: [],
    upcomingClasses: [],
    recentGrades: []
  };

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
                <p className="text-red-100">
                  Student • {data.profile?.parentId ? 'Linked to Parent Account' : 'Individual Student Account'}
                </p>
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
            <div className="flex items-center justify-center mb-2">
              <BookOpen className="w-6 h-6 text-blue-600 mr-2" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{data.stats?.totalClasses || 0}</div>
            <div className="text-sm text-gray-600">Enrolled Courses</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="w-6 h-6 text-green-600 mr-2" />
            </div>
            <div className="text-2xl font-bold text-green-600">{data.stats?.averageProgress || 0}%</div>
            <div className="text-sm text-gray-600">Average Progress</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-6 h-6 text-purple-600 mr-2" />
            </div>
            <div className="text-2xl font-bold text-purple-600">{data.stats?.attendanceRate || 0}%</div>
            <div className="text-sm text-gray-600">Attendance Rate</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <Award className="w-6 h-6 text-orange-600 mr-2" />
            </div>
            <div className={`text-2xl font-bold ${data.stats?.averageGrade >= 80 ? 'text-green-600' : data.stats?.averageGrade >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
              {data.stats?.averageGrade || 0}%
            </div>
            <div className="text-sm text-gray-600">Average Grade</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     {/* Enrolled Courses */}
           <div>
             <div className="bg-white rounded-lg shadow p-6">
               <div className="flex items-center justify-between mb-4">
                 <h2 className="text-xl font-semibold text-gray-900">My Courses</h2>
                 <Link
                   to="/student/courses"
                   className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                 >
                   View All →
                 </Link>
               </div>

               {!data.enrolledCourses || data.enrolledCourses.length === 0 ? (
                 <div className="text-center py-8">
                   <div className="text-gray-400 text-4xl mb-2">📚</div>
                   <p className="text-gray-500 mb-4">No courses enrolled yet</p>
                   <Link
                     to="/student/courses"
                     className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                   >
                     Browse Courses
                   </Link>
                 </div>
               ) : (
                 <div className="space-y-4">
                   {data.enrolledCourses.slice(0, 3).map((course) => (
                     <div key={course.id} className="border rounded-lg p-4">
                       <div className="flex items-center justify-between mb-2">
                         <h3 className="font-medium text-gray-900">{course.name}</h3>
                         <span className="text-sm text-gray-500">{course.teacher?.name || course.teacher?.firstName + ' ' + course.teacher?.lastName || 'Unknown Teacher'}</span>
                       </div>

                       {data.progress?.courses && data.progress.courses.find(c => c.name === course.name) && (
                         <div className="mb-2">
                           <div className="flex justify-between text-sm text-gray-600 mb-1">
                             <span>Progress</span>
                             <span className={getProgressColor(data.progress.courses.find(c => c.name === course.name).progress)}>
                               {data.progress.courses.find(c => c.name === course.name).progress}%
                             </span>
                           </div>
                           <div className="w-full bg-gray-200 rounded-full h-2">
                             <div
                               className={`h-2 rounded-full ${getProgressBarColor(data.progress.courses.find(c => c.name === course.name).progress)}`}
                               style={{ width: `${data.progress.courses.find(c => c.name === course.name).progress}%` }}
                             ></div>
                           </div>
                         </div>
                       )}

                                               <div className="flex justify-between text-xs text-gray-500">
                          <span>
                            {course.sessions && course.sessions.length > 0 
                              ? `${course.sessions[0].day} ${course.sessions[0].startTime}-${course.sessions[0].endTime}`
                              : 'No sessions scheduled'
                            }
                          </span>
                          <Link
                            to={`/student/courses/${course.id}`}
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

                             {!data.enrolledCourses || data.enrolledCourses.length === 0 ? (
                 <div className="text-center py-8">
                   <div className="text-gray-400 text-4xl mb-2">📅</div>
                   <p className="text-gray-500">No upcoming sessions</p>
                 </div>
               ) : (
                 <div className="space-y-4">
                   {data.enrolledCourses.slice(0, 5).map((course) => 
                     course.sessions?.map((session, sessionIndex) => (
                       <div key={`${course.id}-${sessionIndex}`} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                         <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                           <span className="text-blue-600 font-medium text-sm">📚</span>
                         </div>

                         <div className="flex-1">
                           <h4 className="font-medium text-gray-900">{course.name}</h4>
                           <p className="text-sm text-gray-600">
                             {session.day} at {session.startTime}
                           </p>
                         </div>

                         <div className="text-right">
                           <div className="text-sm font-medium text-gray-900">
                             {course.teacher?.name || 'Unknown Teacher'}
                           </div>
                           <div className="text-xs text-gray-500">
                             {session.startTime} - {session.endTime}
                           </div>
                         </div>
                       </div>
                     ))
                   ).flat().slice(0, 5)}
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