import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import {
  Home,
  Users,
  Calendar,
  MessageSquare,
  CreditCard,
  BookOpen,
  BarChart3,
  Shield,
  User,
  Bell,
  LogOut,
  Settings,
  Menu,
  X,
  Newspaper,
  Megaphone
} from 'lucide-react';
import baraemLogo from '../../assets/baraem.svg';
import UserProfilePopup from '../ui/UserProfilePopup';
// import NotificationDropdown from '../notifications/NotificationDropdown';
// import { useNotifications } from '../../contexts/NotificationContext';

// Role-based navigation configurations
const getNavigationConfig = (role) => {
  const baseConfig = {
    admin: [
      { id: 'announcements', name: 'Announcements', icon: Megaphone, path: '/admin/announcements' },
      { id: 'users', name: 'User Management', icon: Users, path: '/admin/users' },
      { id: 'classes', name: 'Class Management', icon: BookOpen, path: '/admin/classes' },
      { id: 'payments', name: 'Payments', icon: CreditCard, path: '/admin/payments' },
      { id: 'form', name: 'Form', icon: Newspaper, path: '/admin/form' },
    ],
    teacher: [
      { id: 'announcements', name: 'Announcements', icon: Megaphone, path: '/teacher/announcements' },
      { id: 'classes', name: 'Classes', icon: BookOpen, path: '/teacher/classes' },
      { id: 'schedule', name: 'Schedule', icon: Calendar, path: '/teacher/schedule' },
    ],
    parent: [
      { id: 'announcements', name: 'Announcements', icon: Megaphone, path: '/parent/announcements' },
      { id: 'children', name: 'Children', icon: Users, path: '/parent/children' },
      { id: 'schedule', name: 'Schedule', icon: Calendar, path: '/parent/schedule' },
      { id: 'payments', name: 'Payments', icon: CreditCard, path: '/parent/payments' },
    ],
    student: [
      { id: 'announcements', name: 'Announcements', icon: Megaphone, path: '/student/announcements' },
      { id: 'classes', name: 'Classes', icon: BookOpen, path: '/student/classes' },
      { id: 'schedule', name: 'Schedule', icon: Calendar, path: '/student/schedule' },
    ],
  };

  return baseConfig[role] || baseConfig.student;
};

// Role-based stats configurations
/*const getStatsConfig = (role) => {
  const baseConfig = {
    admin: {
      title: 'System Stats',
      stats: [
        { label: 'Total Users', value: '156' },
        { label: 'Active Classes', value: '24' },
        { label: "Today's Sessions", value: '18' },
        { label: 'System Status', value: 'Online', color: 'text-green-600' },
      ],
    },
    teacher: {
      title: 'Teaching Stats',
      stats: [
        { label: 'Active Classes', value: '5' },
        { label: 'Total Students', value: '32' },
        { label: "This Week Sessions", value: '12' },
        { label: 'Avg. Attendance', value: '89%', color: 'text-green-600' },
      ],
    },
    parent: {
      title: 'Family Stats',
      stats: [
        { label: 'Children', value: '2' },
        { label: 'Active Courses', value: '6' },
        { label: "This Week Sessions", value: '8' },
        { label: 'Avg. Attendance', value: '94%', color: 'text-green-600' },
      ],
    },
    student: {
      title: 'Student Stats',
      stats: [
        { label: 'Enrolled Classes', value: '4' },
        { label: "This Week Sessions", value: '6' },
        { label: 'Attendance Rate', value: '92%', color: 'text-green-600' },
        { label: 'Average Grade', value: 'A-', color: 'text-blue-600' },
      ],
    },
  };

  return baseConfig[role] || baseConfig.student;
};
*/

// Role-based color schemes
const getRoleColors = (role) => {
  const colorSchemes = {
    admin: {
      avatar: 'bg-green-600',
      active: 'bg-green-100 text-green-700 border-green-200',
      hover: 'hover:text-green-600',
    },
    teacher: {
      avatar: 'bg-blue-600',
      active: 'bg-blue-100 text-blue-700 border-blue-200',
      hover: 'hover:text-green-600',
    },
    parent: {
      avatar: 'bg-purple-600',
      active: 'bg-purple-100 text-purple-700 border-purple-200',
      hover: 'hover:text-green-600',
    },
    student: {
      avatar: 'bg-red-600',
      active: 'bg-red-100 text-red-700 border-red-200',
      hover: 'hover:text-green-600',
    },
  };

  return colorSchemes[role] || colorSchemes.student;
};

const MainLayout = ({ user, onLogout, children, routes }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // const [showNotifications, setShowNotifications] = useState(false);
  // const { unreadCount, isConnected } = useNotifications();

  const userRole = user?.role || 'student';
  const navigation = getNavigationConfig(userRole);
  const colors = getRoleColors(userRole);

  // Get the current tab from the URL path
  const getCurrentTab = () => {
    const path = location.pathname;

    // Check for exact matches first
    for (const item of navigation) {
      if (path === item.path) {
        return item.id;
      }
    }

    // Check for sub-routes (e.g., /admin/materials should keep "classes" active)
    for (const item of navigation) {
      if (path.startsWith(item.path + '/') || path === item.path) {
        return item.id;
      }
    }

    // Special case: materials routes should keep classes active
    if (path.includes('/materials')) {
      return 'classes';
    }

    return navigation[0]?.id || 'announcements';
  };

  const [activeTab, setActiveTab] = useState(getCurrentTab());

  // Update active tab when URL changes
  useEffect(() => {
    setActiveTab(getCurrentTab());
  }, [location.pathname]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const navItem = navigation.find(item => item.id === tabId);
    if (navItem) {
      navigate(navItem.path);
    }
    // Close sidebar on mobile after navigation
    setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleProfileClick = () => {
    console.log('Profile clicked!'); // Debug log
    setShowProfilePopup(true);
  };

  const handleNotificationClick = () => {
    // setShowNotifications(!showNotifications);
    setShowProfilePopup(false); // Close profile popup if open
  };

  const handleEditProfile = () => {
    setShowProfilePopup(false);
    // TODO: Implement profile edit functionality
    alert('Profile edit functionality will be implemented soon!');
  };

  // Get user display name with fallback logic
  const getUserDisplayName = () => {
    if (!user) {
      return userRole.charAt(0).toUpperCase() + userRole.slice(1);
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
    return userRole.charAt(0).toUpperCase() + userRole.slice(1);
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
                  <p className="text-xs text-gray-600z">Baraem Al-Nour</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              {/* <div className="relative">
                <button 
                  onClick={handleNotificationClick}
                  className={`relative p-2 text-gray-400 ${colors.hover} transition-colors`}
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                  {!isConnected && (
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full" title="Disconnected" />
                  )}
                </button>
                
                <NotificationDropdown
                  isOpen={showNotifications}
                  onClose={() => setShowNotifications(false)}
                />
              </div> */}

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleProfileClick}
                  className="flex items-center space-x-2 hover:bg-gray-50 p-2 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  type="button"
                >
                  <div className={`w-8 h-8 ${colors.avatar} rounded-full flex items-center justify-center`}>
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Dropdown Navigation - Mobile */}
      <div className="lg:hidden">
        {/* Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ease-in-out"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Dropdown Menu */}
        <div className={`
          fixed top-16 left-0 right-0 z-50 bg-white shadow-lg border-b 
          transform transition-all duration-300 ease-in-out
          ${sidebarOpen 
            ? 'translate-y-0 opacity-100' 
            : '-translate-y-full opacity-0 pointer-events-none'
          }
        `}>
          <div className="px-4 py-4">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-md text-sm font-medium transition-colors ${activeTab === item.id
                      ? `${colors.active} border`
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
        </div>
      </div>

      <div className="pt-16">
        <div className="flex">
          {/* Desktop Sidebar - Fixed */}
          <div className="hidden lg:block lg:w-64 flex-shrink-0 lg:fixed lg:top-16 lg:left-4 lg:h-screen lg:overflow-y-auto lg:z-40">
            <div className="bg-white rounded-lg shadow-sm border p-4 mt-6">
              <nav className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === item.id
                        ? `${colors.active} border`
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
          </div>

          {/* Main Content - Responsive */}
          <div className="flex-1 min-w-0 lg:ml-72 px-4 lg:px-8 pt-6">
            {routes ? (
              <Routes>
                {routes.map((route) => (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={route.element}
                  />
                ))}
              </Routes>
            ) : (
              children
            )}
          </div>
        </div>
      </div>

      {/* User Profile Popup */}
      <UserProfilePopup
        user={user}
        isOpen={showProfilePopup}
        onClose={() => setShowProfilePopup(false)}
        onEdit={handleEditProfile}
        onLogout={onLogout}
      />
    </div>
  );
};

export default MainLayout;
