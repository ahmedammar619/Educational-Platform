import { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import PostsTab from './PostsTab';
import FilesTab from './FilesTab';
import AttendanceTab from './AttendanceTab';
import ZoomTab from './ZoomTab';
import AssignmentsTab from './AssignmentsTab';
import { materialsService } from '../../../services';

const MaterialPages = ({ courseData, onBack, currentUser }) => {
  // Get theme colors based on user role
  const getThemeColors = () => {
    switch (currentUser?.role) {
      case 'student':
        return {
          primary: 'red',
          primaryLight: 'red-50',
          primaryDark: 'red-700',
          primaryHover: 'red-600',
          primaryBorder: 'red-200',
          primaryBg: 'red-100',
          primaryText: 'red-800'
        };
      case 'admin':
        return {
          primary: 'green',
          primaryLight: 'green-50',
          primaryDark: 'green-700',
          primaryHover: 'green-600',
          primaryBorder: 'green-200',
          primaryBg: 'green-100',
          primaryText: 'green-800'
        };
      case 'teacher':
        return {
          primary: 'blue',
          primaryLight: 'blue-50',
          primaryDark: 'blue-700',
          primaryHover: 'blue-600',
          primaryBorder: 'blue-200',
          primaryBg: 'blue-100',
          primaryText: 'blue-800'
        };
      default:
        return {
          primary: 'blue',
          primaryLight: 'blue-50',
          primaryDark: 'blue-700',
          primaryHover: 'blue-600',
          primaryBorder: 'blue-200',
          primaryBg: 'blue-100',
          primaryText: 'blue-800'
        };
    }
  };

  const theme = getThemeColors();

  // Role-based access control functions
  const canViewAttendance = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'teacher';
  };

  const canViewPosts = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'teacher' || currentUser?.role === 'student';
  };

  const canViewFiles = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'teacher' || currentUser?.role === 'student';
  };

  const canViewZoom = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'teacher' || currentUser?.role === 'student';
  };

  const canViewAssignments = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'teacher' || currentUser?.role === 'student';
  };

  // Set default tab based on user permissions
  const getDefaultTab = () => {
    if (canViewPosts()) return 'posts';
    if (canViewFiles()) return 'files';
    if (canViewAssignments()) return 'assignments';
    if (canViewAttendance()) return 'attendance';
    if (canViewZoom()) return 'zoom';
    return 'posts'; // fallback
  };

  const [activeTab, setActiveTab] = useState(getDefaultTab());
  const tabsContainerRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Update active tab when user role changes
  useEffect(() => {
    const newDefaultTab = getDefaultTab();
    if (activeTab !== newDefaultTab && !canViewTab(activeTab)) {
      setActiveTab(newDefaultTab);
    }
  }, [currentUser?.role]);

  // Handle horizontal scroll for tabs
  const handleTabScroll = (e) => {
    setScrollPosition(e.target.scrollLeft);
  };

  // Get available tabs based on permissions
  const getAvailableTabs = () => {
    const tabs = [];
    if (canViewPosts()) tabs.push({ id: 'posts', label: 'Posts' });
    if (canViewFiles()) tabs.push({ id: 'files', label: 'Files' });
    if (canViewAssignments()) tabs.push({ id: 'assignments', label: 'Assignments' });
    if (canViewAttendance()) tabs.push({ id: 'attendance', label: 'Attendance' });
    if (canViewZoom()) tabs.push({ id: 'zoom', label: 'Zoom' });
    return tabs;
  };

  const availableTabs = getAvailableTabs();

  // Helper function to check if user can view a specific tab
  const canViewTab = (tabName) => {
    switch (tabName) {
      case 'posts': return canViewPosts();
      case 'files': return canViewFiles();
      case 'assignments': return canViewAssignments();
      case 'attendance': return canViewAttendance();
      case 'zoom': return canViewZoom();
      default: return false;
    }
  };

  return (
    <div className="h-screen flex flex-col space-y-4 sm:space-y-6 overflow-hidden" style={{ height: 'calc(100vh - 100px)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 p-3 sm:p-4 bg-white border-b border-gray-200 flex-shrink-0">
        <button
          onClick={onBack}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">{courseData?.name}</h1>
        </div>
      </div>

      {/* Tabs Carousel */}
      <div className="bg-white rounded-lg shadow-sm border flex-shrink-0" style={{ marginTop: '10px' }}>
        <div 
          ref={tabsContainerRef}
          className="flex border-b border-gray-200 overflow-x-auto hide-scrollbar"
          onScroll={handleTabScroll}
          style={{ 
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === tab.id
                ? `text-${theme.primary}-600 border-b-2 border-${theme.primary}-600 bg-${theme.primaryLight}`
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-2 sm:p-4 flex-1 overflow-y-auto">
          {activeTab === 'posts' && (
            <PostsTab currentUser={currentUser} theme={theme} courseId={courseData?.id} />
          )}
          {activeTab === 'files' && (
            <FilesTab currentUser={currentUser} theme={theme} courseId={courseData?.id} />
          )}
          {activeTab === 'assignments' && (
            <AssignmentsTab currentUser={currentUser} theme={theme} courseId={courseData?.id} />
          )}
          {activeTab === 'attendance' && (
            <AttendanceTab currentUser={currentUser} theme={theme} courseId={courseData?.id} />
          )}
          {activeTab === 'zoom' && (
            <ZoomTab currentUser={currentUser} theme={theme} courseId={courseData?.id} />
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialPages;
