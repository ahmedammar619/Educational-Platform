import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import { Home, Users, BookOpen, Shield, Bell, LogOut, User, FileText, ArrowLeft } from 'lucide-react';
import ComponentLoader from '../../components/ComponentLoader';
import AdminDashboard from './AdminDashboard';
import UserManagement from './UserManagement';
import ClassManagement from './ClassManagement';
import MaterialPages from '../../components/common/class-material/MaterialPages';
import baraemLogo from '../../assets/baraem.png';

const AdminMain = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the current tab from the URL path
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.includes('/users')) return 'users';
    if (path.includes('/classes')) return 'classes';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getCurrentTab());
  const [showMaterials, setShowMaterials] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

  // Update active tab when URL changes
  useEffect(() => {
    setActiveTab(getCurrentTab());
  }, [location.pathname]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Navigate to the appropriate route
    if (tabId === 'dashboard') {
      navigate('/admin');
    } else {
      navigate(`/admin/${tabId}`);
    }
  };

  const handleOpenMaterials = (classData) => {
    setSelectedClass(classData);
    setShowMaterials(true);
  };

  const handleBackFromMaterials = () => {
    setShowMaterials(false);
    setSelectedClass(null);
  };

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: Home, component: AdminDashboard },
    { id: 'users', name: 'User Management', icon: Users, component: UserManagement },
    { id: 'classes', name: 'Class Management', icon: BookOpen, component: ClassManagement },
  ];

  const renderMainContent = () => {
    if (showMaterials && selectedClass) {
      return (
        <div className="space-y-4">
          <MaterialPages
            classData={selectedClass}
            onBack={handleBackFromMaterials}
            currentUser={user}
          />
        </div>
      );
    }

    return (
      <Routes>
        <Route path="/" element={<AdminDashboard user={user} />} />
        <Route path="/users" element={<UserManagement user={user} />} />
        <Route path="/classes" element={<ClassManagement user={user} onOpenMaterials={handleOpenMaterials} />} />
      </Routes>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 h-full">
      {/* Top Navigation - Fixed */}
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden">
                  <img src={baraemLogo} alt="Baraem Al-Nour Logo" className="w-full h-full object-cover" />
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

      <div className="pt-16 pr-8 pl-2">
        <div className="flex flex-col lg:flex-row gap-8 pt-6">
          {/* Sidebar Navigation - Fixed */}
          <div className="lg:w-64 flex-shrink-0 lg:fixed lg:top-16 lg:left-4 lg:h-screen lg:overflow-y-auto lg:z-40">
            <div className="bg-white rounded-lg shadow-sm border p-4 mt-6">
              <nav className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
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

            {/* Quick Stats */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">System Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Users</span>
                  <span className="font-medium text-gray-900">156</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Active Classes</span>
                  <span className="font-medium text-gray-900">24</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Today's Sessions</span>
                  <span className="font-medium text-gray-900">18</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">System Status</span>
                  <span className="font-medium text-green-600">Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - With left margin for fixed sidebar and gap */}
          <div className="flex-1 min-w-0 lg:ml-72">
            {renderMainContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMain;