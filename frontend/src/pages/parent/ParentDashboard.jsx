import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, BookOpen, TrendingUp, AlertCircle } from 'lucide-react';
import { dashboardService } from '../../services';

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
      
      // Fetch children's enrolled classes and sessions
      if (response.children && response.children.length > 0) {
        const childrenWithClasses = await Promise.all(
          response.children.map(async (child) => {
            try {
              // Fetch student's enrolled classes and courses
              const studentResponse = await dashboardService.getStudentDashboard(child.id);
              return {
                ...child,
                enrolledClasses: studentResponse.enrolledCourses || [],
                totalSessions: studentResponse.stats?.totalSessions || 0
              };
            } catch (error) {
              console.error(`Failed to fetch data for child ${child.id}:`, error);
              return {
                ...child,
                enrolledClasses: [],
                totalSessions: 0
              };
            }
          })
        );
        
        response.children = childrenWithClasses;
      }
      
      setDashboardData(response);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data. Please try again later.');
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
  const data = dashboardData || {
    parent: {
      id: user?.id,
      firstName: user?.firstName,
      lastName: user?.lastName,
      email: user?.email,
      createdAt: null
    },
    children: [],
    stats: {
      totalChildren: 0,
      totalClasses: 0,
      totalSessions: 0
    }
  };

  // Calculate totals from children data
  const totalChildren = data.children?.length || 0;
  const totalClasses = data.children ? data.children.reduce((total, child) => total + (child.enrolledClasses?.length || 0), 0) : 0;
  const totalSessions = data.children ? data.children.reduce((total, child) => total + (child.totalSessions || 0), 0) : 0;
  const totalCost = totalClasses * 100; // $100 per class based on backend data

  return (
    <div className="space-y-6 h-full">
      {/* Parent Info Card */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="bg-gradient-to-r from-purple-700 to-purple-600 p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {data.parent?.firstName?.charAt(0) || user?.firstName?.charAt(0) || 'P'}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">
                {data.parent?.firstName && data.parent?.lastName
                  ? `${data.parent.firstName} ${data.parent.lastName}`
                  : user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : 'Parent'
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
              <p className="font-medium text-gray-900">{data.parent?.email || user?.email || 'parent@example.com'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Parent ID</p>
              <p className="font-medium text-gray-900">{data.parent?.id || user?.id || 'PAR001'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Children</p>
              <p className="font-medium text-gray-900">{totalChildren}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Join Date</p>
              <p className="font-medium text-gray-900">
                {data.parent?.createdAt 
                  ? new Date(data.parent.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short' 
                    })
                  : 'Jan 2024'
                }
              </p>
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
              <p className="text-2xl font-bold text-gray-900">USD {totalCost.toLocaleString()}</p>
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
                            {child.firstName?.charAt(0) || 'C'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {child.firstName && child.lastName 
                              ? `${child.firstName} ${child.lastName}` 
                              : 'Child'
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
                            <span className="text-gray-900 font-medium">USD 100</span>
                          </div>
                        ))}
                        {childClasses.length > 3 && (
                          <div className="text-xs text-gray-500 text-center pt-2">
                            +{childClasses.length - 3} more classes
                          </div>
                        )}
                        {childClasses.length === 0 && (
                          <div className="text-xs text-gray-500 text-center pt-2">
                            No classes enrolled yet
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
            {data.children && data.children.length > 0 ? (
              <div className="space-y-4">
                {data.children.slice(0, 3).map((child) => (
                  <div key={child.id} className="border rounded-lg p-3 bg-blue-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">
                        {child.firstName} {child.lastName}
                      </h4>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Student
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-4 w-4" />
                        <span>{child.enrolledClasses?.length || 0} classes enrolled</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>Check schedule for details</span>
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