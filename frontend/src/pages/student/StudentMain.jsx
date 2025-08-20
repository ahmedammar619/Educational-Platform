import { useState } from 'react';
import { Home, BookOpen, Calendar, User, Bell, LogOut } from 'lucide-react';
import StudentDashboard from './StudentDashboard';
import StudentClasses from './StudentClasses';
import StudentSchedule from './StudentSchedule';

const StudentMain = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: Home, component: StudentDashboard },
    { id: 'classes', name: 'My Classes', icon: BookOpen, component: StudentClasses },
    { id: 'calendar', name: 'Calendar', icon: Calendar, component: StudentSchedule },
  ];

  const ActiveComponent = navigation.find(nav => nav.id === activeTab)?.component || StudentDashboard;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-bold">ب</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">براعم النور</h1>
                  <p className="text-xs text-gray-600">Baraem Al-Noor</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-red-600">
                <Bell className="h-5 w-5" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user?.name || 'Student'
                      }
                    </p>
                    <p className="text-xs text-gray-500">Student</p>
                  </div>
                </div>
                
                <button
                  onClick={onLogout}
                  className="p-2 text-gray-400 hover:text-red-600"
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
                          ? 'bg-red-100 text-red-700 border border-red-200'
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
              <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Enrolled Classes</span>
                  <span className="font-medium text-gray-900">2</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium text-gray-900">85%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Attendance</span>
                  <span className="font-medium text-green-600">94%</span>
                </div>
              </div>
            </div>

            {/* Upcoming Classes */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Upcoming Classes</h3>
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="font-medium text-gray-900">Quran Memorization</p>
                  <p className="text-xs text-blue-600">Today at 4:00 PM</p>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">Arabic Language</p>
                  <p className="text-xs text-green-600">Tomorrow at 5:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <ActiveComponent user={user} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentMain;