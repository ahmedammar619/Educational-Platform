import { useState } from 'react';
import { Home, Users, BookOpen, Shield, Bell, LogOut, User } from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import UserManagement from './UserManagement';
import ClassManagement from './ClassManagement';

const AdminMain = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: Home, component: AdminDashboard },
    { id: 'users', name: 'User Management', icon: Users, component: UserManagement },
    { id: 'classes', name: 'Class Management', icon: BookOpen, component: ClassManagement },
  ];

  const ActiveComponent = navigation.find(nav => nav.id === activeTab)?.component || AdminDashboard;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-bold">ب</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">براعم النور</h1>
                  <p className="text-xs text-gray-600">Baraem Al-Noor</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-green-600">
                <Bell className="h-5 w-5" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user?.name || 'Admin'
                      }
                    </p>
                    <p className="text-xs text-gray-500">Administrator</p>
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
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === item.id
                          ? 'bg-green-100 text-green-700 border border-green-200'
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

            {/* System Stats */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">System Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Users</span>
                  <span className="font-medium text-gray-900">15</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Active Classes</span>
                  <span className="font-medium text-gray-900">5</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">System Health</span>
                  <span className="font-medium text-green-600">Excellent</span>
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



export default AdminMain;