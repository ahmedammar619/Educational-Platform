import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui';
import { teachersService, dashboardService, coursesService } from '../../services';

const TeacherDashboard = ({ user }) => {
  const [dashboardData, setDashboardData] = useState({
    classes: [],
    students: [],
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
      
      // Fetch teacher dashboard data from backend
      const response = await dashboardService.getTeacherDashboard();
      console.log('Dashboard API response:', response);
      console.log('Response type:', typeof response);
      console.log('Classes type:', typeof response?.classes, 'Is array:', Array.isArray(response?.classes));
      console.log('UpcomingSessions type:', typeof response?.upcomingSessions, 'Is array:', Array.isArray(response?.upcomingSessions));
      setDashboardData(response);
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getTotalStudents = () => {
    if (!dashboardData?.classes || !Array.isArray(dashboardData.classes)) {
      return 0;
    }
    
    const uniqueStudents = new Set();
    dashboardData.classes.forEach(cls => {
      if (cls?.students && Array.isArray(cls.students)) {
        cls.students.forEach(studentId => uniqueStudents.add(studentId));
      }
    });
    return uniqueStudents.size;
  };

  const getTotalWeeklyHours = () => {
    if (!dashboardData?.classes || !Array.isArray(dashboardData.classes)) {
      return 0;
    }
    
    let totalMinutes = 0;
    dashboardData.classes.forEach(cls => {
      if (cls?.schedule && Array.isArray(cls.schedule)) {
        totalMinutes += cls.schedule.length * (cls.sessionDuration || 120);
      }
    });
    return (totalMinutes / 60).toFixed(1);
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Teacher Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's an overview of your teaching activities</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{Array.isArray(dashboardData.classes) ? dashboardData.classes.length : 0}</div>
              <div className="text-sm text-gray-600">Active Classes</div>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{getTotalStudents()}</div>
              <div className="text-sm text-gray-600">Total Students</div>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{getTotalWeeklyHours()}</div>
              <div className="text-sm text-gray-600">Hours per Week</div>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Array.isArray(dashboardData.upcomingSessions) ? dashboardData.upcomingSessions.length : 0}
              </div>
              <div className="text-sm text-gray-600">Upcoming Sessions</div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Classes */}
          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">My Classes</h2>
                <Link
                  to="/teacher/classes"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View All →
                </Link>
              </div>
              
              {(!dashboardData.classes || !Array.isArray(dashboardData.classes) || dashboardData.classes.length === 0) ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">📚</div>
                  <p className="text-gray-500 mb-4">No classes created yet</p>
                  <Link
                    to="/teacher/classes"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    Create Your First Class
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {(Array.isArray(dashboardData.classes) ? dashboardData.classes : []).slice(0, 3).map((cls) => (
                    <div key={cls.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{cls.name}</h3>
                        <span className="text-sm text-gray-500">
                          {cls.students?.length || 0} students
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{cls.description}</p>
                      
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Schedule: {cls.schedule ? cls.schedule.map(s => `${s.day} ${s.startTime}-${s.endTime}`).join(', ') : 'TBD'}</span>
                        <Link
                          to={`/teacher/classes/${cls.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Manage
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
                  to="/teacher/calendar"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View Calendar →
                </Link>
              </div>
              
              {(!dashboardData.upcomingSessions || !Array.isArray(dashboardData.upcomingSessions) || dashboardData.upcomingSessions.length === 0) ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">📅</div>
                  <p className="text-gray-500">No upcoming sessions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(Array.isArray(dashboardData.upcomingSessions) ? dashboardData.upcomingSessions : []).slice(0, 5).map((session) => (
                    <div key={session.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">📚</span>
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{session.className}</h4>
                        <p className="text-sm text-gray-600">
                          {session.day} at {session.time}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {session.studentCount || 0} students
                        </div>
                        <div className="text-xs text-gray-500">
                          {session.duration || 120} min
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
        {dashboardData.recentActivities && Array.isArray(dashboardData.recentActivities) && dashboardData.recentActivities.length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activities</h2>
              
              <div className="space-y-3">
                {(Array.isArray(dashboardData.recentActivities) ? dashboardData.recentActivities : []).slice(0, 5).map((activity, index) => (
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

        {/* Quick Actions */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/teacher/classes"
                className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center"
              >
                <div className="text-blue-600 text-2xl mb-2">📚</div>
                <h3 className="font-medium text-gray-900">Manage Classes</h3>
                <p className="text-sm text-gray-600">Create and manage your classes</p>
              </Link>
              
              <Link
                to="/teacher/students"
                className="p-4 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors text-center"
              >
                <div className="text-green-600 text-2xl mb-2">👥</div>
                <h3 className="font-medium text-gray-900">View Students</h3>
                <p className="text-sm text-gray-600">Check student enrollments</p>
              </Link>
              
              <Link
                to="/teacher/calendar"
                className="p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors text-center"
              >
                <div className="text-blue-600 text-2xl mb-2">📅</div>
                <h3 className="font-medium text-gray-900">View Calendar</h3>
                <p className="text-sm text-gray-600">Check your teaching schedule</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;