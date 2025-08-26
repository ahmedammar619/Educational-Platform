import { useState, useEffect } from 'react';
import { Users, BookOpen, GraduationCap, UserCheck, TrendingUp, DollarSign, AlertCircle, UserPlus } from 'lucide-react';
import { adminService, dashboardService } from '../../services';
import { getMockData } from '../../data/mockData';

const AdminDashboard = ({ user }) => {
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
      
      // Fetch admin dashboard data from backend
      const [adminStats, dashboardStats] = await Promise.all([
        adminService.getDashboardStats(),
        dashboardService.getAdminDashboard()
      ]);
      
      // Combine backend data with mock data for components without backend
      const combinedData = {
        ...dashboardStats,
        ...adminStats,
        // Use mock data for components without backend endpoints
        monthlyGrowth: getMockData('adminDashboard').monthlyGrowth,
        revenue: getMockData('adminDashboard').revenue,
        classDistribution: getMockData('adminDashboard').classDistribution,
        recentActivity: getMockData('adminDashboard').recentActivity
      };
      
      setDashboardData(combinedData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data. Using mock data instead.');
      // Fallback to mock data if backend fails
      setDashboardData(getMockData('adminDashboard'));
    } finally {
      setLoading(false);
    }
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
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Use fallback values if backend data is missing
  const data = dashboardData || getMockData('adminDashboard');

  return (
    <div className="space-y-6 h-full">
      {/* Admin Info Card */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="bg-gradient-to-r from-green-700 to-green-600 p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {user?.firstName?.charAt(0) || user?.name?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.name || 'Admin'
                }
              </h1>
              <p className="text-green-100">Administrator • Platform Management</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium text-gray-900">{user?.email || 'admin@example.com'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Admin ID</p>
              <p className="font-medium text-gray-900">{user?.id || 'ADM001'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Role</p>
              <p className="font-medium text-gray-900">{user?.role || 'Administrator'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Join Date</p>
              <p className="font-medium text-gray-900">
                {user?.createdAt 
                  ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalUsers || 0}</p>
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
              <p className="text-2xl font-bold text-gray-900">{data.totalClasses || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Growth</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.monthlyGrowth && data.monthlyGrowth.users 
                  ? Math.round(((data.monthlyGrowth.users[data.monthlyGrowth.users.length - 1] - data.monthlyGrowth.users[0]) / data.monthlyGrowth.users[0]) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                USD {data.revenue && data.revenue.total ? data.revenue.total.toLocaleString() : '0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Growth Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
          <div className="space-y-3">
            {data.monthlyGrowth && data.monthlyGrowth.users && data.monthlyGrowth.users.map((users, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Month {index + 1}</span>
                <div className="flex items-center">
                  <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(users / Math.max(...data.monthlyGrowth.users)) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{users}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Class Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Distribution</h3>
          <div className="space-y-3">
            {data.classDistribution && Array.isArray(data.classDistribution) && data.classDistribution.map((classData, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: index === 0 ? '#10B981' : index === 1 ? '#3B82F6' : '#8B5CF6' }}
                  ></div>
                  <span className="text-sm text-gray-600 truncate max-w-32">{classData.level}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{classData.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h3>
        <div className="space-y-3">
          {data.revenue && data.revenue.monthly && Array.isArray(data.revenue.monthly) && data.revenue.monthly.map((revenue, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Month {index + 1}</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">USD {revenue.toLocaleString()}</span>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${(revenue / Math.max(...data.revenue.monthly)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {data.recentActivity && Array.isArray(data.recentActivity) && data.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-full">
                  {activity.icon === 'UserPlus' && <UserPlus className="h-4 w-4 text-green-600" />}
                  {activity.icon === 'BookOpen' && <BookOpen className="h-4 w-4 text-blue-600" />}
                  {activity.icon === 'GraduationCap' && <GraduationCap className="h-4 w-4 text-purple-600" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                  <p className="text-sm text-gray-500">{activity.user} • {new Date(activity.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 