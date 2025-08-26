import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import { Home, BookOpen, Calendar, FileText, Users, MessageSquare, User, Bell, LogOut } from 'lucide-react';
import MaterialPages from '../../components/common/class-material/MaterialPages';
import StudentDashboard from './StudentDashboard';
import StudentClasses from './StudentClasses';
import StudentSchedule from './StudentSchedule';

const StudentMain = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the current tab from the URL path
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.includes('/classes')) return 'classes';
    if (path.includes('/schedule')) return 'schedule';
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
      navigate('/student');
    } else {
      navigate(`/student/${tabId}`);
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
    { id: 'dashboard', name: 'Dashboard', icon: Home, component: StudentDashboard },
    { id: 'classes', name: 'Classes', icon: BookOpen, component: StudentClasses },
    { id: 'schedule', name: 'Schedule', icon: Calendar, component: StudentSchedule },
  ];

  const renderMainContent = () => {
    if (showMaterials && selectedClass) {
      return (
        <div className="space-y-4 h-full">
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
        <Route path="/" element={<StudentDashboard user={user} />} />
        <Route path="/classes" element={<StudentClasses user={user} onOpenMaterials={handleOpenMaterials} />} />
        <Route path="/schedule" element={<StudentSchedule user={user} />} />
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
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-blue-600 rounded-lg flex items-center justify-center">
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
              <h3 className="text-sm font-medium text-gray-900 mb-3">Student Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Enrolled Classes</span>
                  <span className="font-medium text-gray-900">4</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">This Week Sessions</span>
                  <span className="font-medium text-gray-900">6</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Attendance Rate</span>
                  <span className="font-medium text-green-600">92%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Average Grade</span>
                  <span className="font-medium text-blue-600">A-</span>
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

export default StudentMain;