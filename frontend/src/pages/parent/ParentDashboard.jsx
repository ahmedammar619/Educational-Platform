import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, BookOpen, TrendingUp, AlertCircle } from 'lucide-react';
import { dashboardService } from '../../services';
import { getMockData } from '../../data/mockData';

const ParentDashboard = ({ user }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch parent dashboard data from backend
      const response = await dashboardService.getParentDashboard(user.id);
      
      // Combine backend data with mock data for components without backend
      const combinedData = {
        ...response,
        // Use mock data for components without backend endpoints
        upcomingSessions: getMockData('parentDashboard').upcomingSessions,
        recentGrades: getMockData('parentDashboard').recentGrades
      };
      
      setDashboardData(combinedData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data. Using mock data instead.');
      // Fallback to mock data if backend fails
      setDashboardData(getMockData('parentDashboard'));
    } finally {
      setLoading(false);
    }
  };

  const convert24To12Hour = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
  const data = dashboardData || getMockData('parentDashboard');

  // Calculate totals from children data
  const totalChildren = data.children?.length || 0;
  const totalClasses = data.children ? data.children.reduce((total, child) => total + (child.enrolledClasses?.length || 0), 0) : 0;
  const totalSessions = data.upcomingSessions?.length || 0;
  const totalCost = totalClasses * 150; // Mock cost per class

  return (
    <div className="space-y-6 h-full">
      {/* Parent Info Card */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="bg-gradient-to-r from-purple-700 to-purple-600 p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {user?.firstName?.charAt(0) || user?.name?.charAt(0) || 'P'}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.name || 'Parent'
                }
              </h1>
              <p className="text-purple-100">Parent • Family Management</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium text-gray-900">{user?.email || 'parent@example.com'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Parent ID</p>
              <p className="font-medium text-gray-900">{user?.id || 'PAR001'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Children</p>
              <p className="font-medium text-gray-900">{totalChildren}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Join Date</p>
              <p className="font-medium text-gray-900">{user?.joinDate || 'Jan 2024'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Children</p>
              <p className="text-2xl font-bold text-gray-900">{totalChildren}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Classes</p>
              <p className="text-2xl font-bold text-gray-900">{totalClasses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Weekly Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Investment</p>
              <p className="text-2xl font-bold text-gray-900">SAR {totalCost.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Children Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Children Summary */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Children Overview</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {data.children && data.children.length > 0 ? (
                data.children.map((child) => {
                  const childClasses = child.enrolledClasses || [];
                  const totalChildClasses = childClasses.length;
                  const totalChildSessions = totalChildClasses * 2; // Mock: 2 sessions per class per week
                  
                  return (
                    <div key={child.id} className="border rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {child.firstName?.charAt(0) || child.name?.charAt(0) || 'C'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {child.firstName && child.lastName 
                              ? `${child.firstName} ${child.lastName}` 
                              : child.name || 'Child'
                            }
                          </h4>
                          <p className="text-sm text-gray-600">{child.email}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{totalChildClasses} classes</div>
                          <div className="text-xs text-gray-500">{totalChildSessions} sessions/week</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {childClasses.slice(0, 3).map((cls) => (
                          <div key={cls.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{cls.name || 'Course'}</span>
                            <span className="text-gray-900 font-medium">SAR 150</span>
                          </div>
                        ))}
                        {childClasses.length > 3 && (
                          <div className="text-xs text-gray-500 text-center pt-2">
                            +{childClasses.length - 3} more classes
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">No children added yet</p>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Add Child
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Classes */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Classes This Week</h3>
          </div>
          <div className="p-6">
            {data.upcomingSessions && data.upcomingSessions.length > 0 ? (
              <div className="space-y-4">
                {data.upcomingSessions.slice(0, 5).map((session) => (
                  <div key={session.id} className="border rounded-lg p-3 bg-blue-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{session.courseName}</h4>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {new Date(session.date).toLocaleDateString('en-US', { weekday: 'long' })}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>Student</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>Teacher</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>{convert24To12Hour(session.startTime)} - {convert24To12Hour(session.endTime)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No upcoming classes this week</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;