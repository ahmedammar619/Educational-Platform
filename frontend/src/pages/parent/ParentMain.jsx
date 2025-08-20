import { useState, useEffect } from 'react';
import { Home, Users, Calendar, MessageSquare, User, Bell, LogOut } from 'lucide-react';
import ParentDashboard from './ParentDashboard';
import ChildrenManagement from './ChildrenManagement';
import ParentSchedule from './ParentSchedule';
import ParentCommunication from './ParentCommunication';

const ParentMain = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Debug effect to monitor user object
  useEffect(() => {
    console.log('ParentMain - User object received:', user);
    console.log('ParentMain - User type:', typeof user);
    console.log('ParentMain - User keys:', user ? Object.keys(user) : 'No user');
    if (user) {
      console.log('ParentMain - User firstName:', user.firstName);
      console.log('ParentMain - User lastName:', user.lastName);
      console.log('ParentMain - User name:', user.name);
      console.log('ParentMain - User email:', user.email);
      console.log('ParentMain - User role:', user.role);
    }
  }, [user]);

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: Home, component: ParentDashboard },
    { id: 'children', name: 'Children', icon: Users, component: ChildrenManagement },
    { id: 'schedule', name: 'Schedule', icon: Calendar, component: ParentSchedule },
    { id: 'communication', name: 'Communication', icon: MessageSquare, component: ParentCommunication },
  ];

  const ActiveComponent = navigation.find(nav => nav.id === activeTab)?.component || ParentDashboard;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-bold">ب</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">براعم النور</h1>
                  <p className="text-xs text-gray-600">Baraem Al-Nour</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-green-600">
                <Bell className="h-5 w-5" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-900">
                      {(() => {
                        // Check if user exists and has valid name data
                        if (!user) {
                          return 'Parent';
                        }
                        
                        // Try firstName + lastName first
                        if (user.firstName && user.lastName && 
                            user.firstName.trim() && user.lastName.trim()) {
                          return `${user.firstName.trim()} ${user.lastName.trim()}`;
                        }
                        
                        // Fallback to firstName only
                        if (user.firstName && user.firstName.trim()) {
                          return user.firstName.trim();
                        }
                        
                        // Fallback to lastName only
                        if (user.lastName && user.lastName.trim()) {
                          return user.lastName.trim();
                        }
                        
                        // Fallback to name field (for backward compatibility)
                        if (user.name && user.name.trim()) {
                          return user.name.trim();
                        }
                        
                        // Check if user might be stored as string in localStorage
                        if (typeof user === 'string') {
                          try {
                            const parsedUser = JSON.parse(user);
                            if (parsedUser.firstName && parsedUser.lastName) {
                              return `${parsedUser.firstName} ${parsedUser.lastName}`;
                            }
                            if (parsedUser.name) {
                              return parsedUser.name;
                            }
                          } catch (e) {
                            // If it's not JSON, treat as name
                            return user;
                          }
                        }
                        
                        // Final fallback
                        return 'Parent';
                      })()}
                    </p>
                    <p className="text-xs text-gray-500">Parent</p>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="p-2 text-gray-400 hover:text-green-600"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <nav className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === item.id
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Family Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Children</span>
                  <span className="font-medium text-gray-900">2</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Active Courses</span>
                  <span className="font-medium text-gray-900">6</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">This Week Sessions</span>
                  <span className="font-medium text-gray-900">8</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Avg. Attendance</span>
                  <span className="font-medium text-green-600">94%</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-md">
                  View Progress Reports
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-md">
                  Message Teachers
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-md">
                  Schedule Meeting
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-md">
                  Payment History
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <ActiveComponent user={user} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentMain;