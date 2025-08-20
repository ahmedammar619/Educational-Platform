import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, BookOpen, TrendingUp, AlertCircle } from 'lucide-react';
import { mockUsers, mockClasses } from '../../data/mockData';

const ParentDashboard = ({ user }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Use mock dashboard data
      if (user && user.role === 'parent') {
        const parent = mockUsers.parents.find(p => p.id === user.id);
        if (parent) {
          const children = parent.children.map(childId => {
            const child = mockUsers.students.find(s => s.id === childId);
            const childClasses = mockClasses.filter(cls => cls.students.includes(childId));

            return {
              child: child,
              classes: childClasses,
              totalClasses: childClasses.length,
              totalSessions: childClasses.reduce((total, cls) => total + cls.numberOfSessions, 0)
            };
          });

          const totalChildren = children.length;
          const totalClasses = children.reduce((total, child) => total + child.totalClasses, 0);
          const totalSessions = children.reduce((total, child) => total + child.totalSessions, 0);

          // Calculate total cost
          const totalCost = children.reduce((total, child) => {
            return total + child.classes.reduce((classTotal, cls) => classTotal + cls.price, 0);
          }, 0);

          // Get upcoming classes for this week
          const today = new Date();
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)

          const upcomingClasses = [];
          children.forEach(({ child, classes }) => {
            classes.forEach(cls => {
              cls.schedule.forEach(session => {
                const dayNumber = getDayNumber(session.day);
                const classDate = new Date(weekStart);
                classDate.setDate(weekStart.getDate() + dayNumber);

                if (classDate >= today) {
                  upcomingClasses.push({
                    id: `${cls.id}-${session.day}-${child.id}`,
                    title: cls.name,
                    childName: child.fullName,
                    teacherName: getTeacherName(cls.teacherId),
                    day: session.day,
                    startTime: session.startTime,
                    endTime: session.endTime,
                    date: classDate
                  });
                }
              });
            });
          });

          // Sort upcoming classes by date and time
          upcomingClasses.sort((a, b) => {
            if (a.date.getTime() !== b.date.getTime()) {
              return a.date.getTime() - b.date.getTime();
            }
            return a.startTime.localeCompare(b.startTime);
          });

          setDashboardData({
            totalChildren,
            totalClasses,
            totalSessions,
            totalCost,
            children,
            upcomingClasses: upcomingClasses.slice(0, 5) // Show only next 5 classes
          });
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTeacherName = (teacherId) => {
    const teacher = mockUsers.teachers.find(t => t.id === teacherId);
    return teacher ? teacher.fullName : 'Unknown Teacher';
  };

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
      {/* Parent Info Card */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
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
              <p className="font-medium text-gray-900">{dashboardData?.totalChildren || 0}</p>
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
              <p className="text-2xl font-bold text-gray-900">{dashboardData.totalChildren}</p>
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
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Weekly Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.totalSessions}</p>
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
              <p className="text-2xl font-bold text-gray-900">SAR {dashboardData.totalCost.toLocaleString()}</p>
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
              {dashboardData.children.map(({ child, classes, totalClasses, totalSessions }) => (
                <div key={child.id} className="border rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {child.firstName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{child.fullName}</h4>
                      <p className="text-sm text-gray-600">{child.email}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{totalClasses} classes</div>
                      <div className="text-xs text-gray-500">{totalSessions} sessions/week</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {classes.slice(0, 3).map((cls) => (
                      <div key={cls.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{cls.name}</span>
                        <span className="text-gray-900 font-medium">SAR {cls.price}</span>
                      </div>
                    ))}
                    {classes.length > 3 && (
                      <div className="text-xs text-gray-500 text-center pt-2">
                        +{classes.length - 3} more classes
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Classes */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Classes This Week</h3>
          </div>
          <div className="p-6">
            {dashboardData.upcomingClasses.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No upcoming classes this week</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData.upcomingClasses.map((cls) => (
                  <div key={cls.id} className="border rounded-lg p-3 bg-blue-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{cls.title}</h4>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {cls.day}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>{cls.childName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>{cls.teacherName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>{convert24To12Hour(cls.startTime)} - {convert24To12Hour(cls.endTime)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <Calendar className="h-8 w-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium">View Schedule</span>
            </button>
            <button className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <Users className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-sm font-medium">Contact Teachers</span>
            </button>
            <button className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <BookOpen className="h-8 w-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium">View Progress</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;