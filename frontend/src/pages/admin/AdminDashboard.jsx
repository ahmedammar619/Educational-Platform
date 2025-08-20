import { useState, useEffect } from 'react';
import { Users, TrendingUp, Calendar, Award, MessageCircle, Bell, BookOpen, Clock, UserPlus, BookOpen as BookOpenIcon, DollarSign, Activity, BarChart3, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { mockAnalytics, mockUsers, mockClasses } from '../../data/mockData';
import { format } from 'date-fns';

const AdminDashboard = ({ user }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Use mock dashboard data
      const mockDashboardData = {
        totalUsers: mockAnalytics.admin.totalUsers,
        totalTeachers: mockAnalytics.admin.totalTeachers,
        totalStudents: mockAnalytics.admin.totalStudents,
        totalParents: mockAnalytics.admin.totalParents,
        totalClasses: mockAnalytics.admin.totalClasses,
        activeClasses: mockAnalytics.admin.activeClasses,
        revenue: mockAnalytics.admin.revenue,
        monthlyGrowth: mockAnalytics.admin.monthlyGrowth,
        userGrowthData: mockAnalytics.admin.userGrowthData,
        revenueData: mockAnalytics.admin.revenueData,
        classDistribution: mockAnalytics.admin.classDistribution
      };
      
      setDashboardData(mockDashboardData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-500">Unable to load dashboard data. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
              <p className="font-medium text-gray-900">{user?.joinDate || 'Jan 2024'}</p>
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
                <p className="text-2xl font-bold text-gray-900">{dashboardData.totalUsers}</p>
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
                <p className="text-2xl font-bold text-gray-900">{dashboardData.totalClasses}</p>
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
                <p className="text-2xl font-bold text-gray-900">{dashboardData.monthlyGrowth}%</p>
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
                <p className="text-2xl font-bold text-gray-900">USD {dashboardData.revenue.toLocaleString()}</p>
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
              {dashboardData.userGrowthData.map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{data.month}</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(data.users / Math.max(...dashboardData.userGrowthData.map(d => d.users))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{data.users}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Class Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Distribution</h3>
            <div className="space-y-3">
              {dashboardData.classDistribution.slice(0, 6).map((classData, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-3" 
                      style={{ backgroundColor: classData.color }}
                    ></div>
                    <span className="text-sm text-gray-600 truncate max-w-32">{classData.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{classData.students}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <UserPlus className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">New student registered</p>
                  <p className="text-sm text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">New class created</p>
                  <p className="text-sm text-gray-500">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-full">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Monthly revenue target reached</p>
                  <p className="text-sm text-gray-500">1 day ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default AdminDashboard; 