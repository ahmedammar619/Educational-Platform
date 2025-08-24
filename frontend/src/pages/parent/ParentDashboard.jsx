import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui';
import { dashboardService, parentsService } from '../../services';

const ParentDashboard = ({ user }) => {
  const [dashboardData, setDashboardData] = useState({
    children: [],
    classes: [],
    upcomingSessions: [],
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch parent dashboard data
      const response = await dashboardService.getParentDashboard();
      setDashboardData(response);
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
            onClick={fetchDashboardData} 
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
        {/* Parent Info Card */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-8">
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
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium text-gray-900">{user?.phone || '+1 (555) 123-4567'}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Children</p>
                <p className="font-medium text-gray-900">{dashboardData.children?.length || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Join Date</p>
                <p className="font-medium text-gray-900">{user?.joinDate || 'Jan 2024'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {dashboardData.children?.length || 0}
            </div>
            <p className="text-gray-600">Children</p>
          </Card>
          
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {dashboardData.classes?.length || 0}
            </div>
            <p className="text-gray-600">Enrolled Classes</p>
          </Card>
          
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {dashboardData.upcomingSessions?.length || 0}
            </div>
            <p className="text-gray-600">Upcoming Sessions</p>
          </Card>
        </div>

        {/* Children Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">My Children</h3>
              <Link 
                to="/parent/children" 
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Manage
              </Link>
            </div>
            
            <div className="space-y-4">
              {dashboardData.children && dashboardData.children.length > 0 ? (
                dashboardData.children.map((child) => (
                  <div key={child.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {child.firstName?.charAt(0)}{child.lastName?.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {child.firstName} {child.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {child.enrolledClasses?.length || 0} classes enrolled
                      </p>
                    </div>
                    <Link 
                      to={`/parent/child/${child.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      View Details
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500 mb-4">No children added yet</p>
                  <Link 
                    to="/parent/children/create"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Add Child
                  </Link>
                </div>
              )}
            </div>
          </Card>

          {/* Upcoming Sessions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Sessions</h3>
            
            <div className="space-y-3">
              {dashboardData.upcomingSessions && dashboardData.upcomingSessions.length > 0 ? (
                dashboardData.upcomingSessions.slice(0, 5).map((session) => (
                  <div key={session.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-green-600">📚</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{session.className}</p>
                      <p className="text-sm text-gray-500">
                        {session.date} at {session.time}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">No upcoming sessions</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Recent Activities */}
        {dashboardData.recentActivities && dashboardData.recentActivities.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
            
            <div className="space-y-3">
              {dashboardData.recentActivities.slice(0, 10).map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {activity.type === 'enrollment' ? '📚' :
                       activity.type === 'attendance' ? '✅' :
                       activity.type === 'grade' ? '📊' : '📝'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;