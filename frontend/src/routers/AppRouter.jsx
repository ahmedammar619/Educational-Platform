import React, { useMemo, useCallback, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { authService } from '../services';
import MainLayout from '../components/Layout/MainLayout';
import MaterialPages from '../components/common/class-material/MaterialPages';

// Lazy load individual page components
const UserManagement = lazy(() => import('../pages/admin/UserManagement'));
const ClassManagement = lazy(() => import('../pages/admin/ClassManagement'));
const AdminPayments = lazy(() => import('../pages/admin/AdminPayments'));
const AdminForm = lazy(() => import('../pages/admin/AdminForm'));

const StudentClasses = lazy(() => import('../pages/student/StudentClasses'));
const StudentSchedule = lazy(() => import('../pages/student/StudentSchedule'));

const ChildrenManagement = lazy(() => import('../pages/parent/ChildrenManagement'));
const ParentSchedule = lazy(() => import('../pages/parent/ParentSchedule'));
const ParentPayments = lazy(() => import('../pages/parent/ParentPayments'));

const TeacherClasses = lazy(() => import('../pages/teacher/TeacherClasses'));
const TeacherSchedule = lazy(() => import('../pages/teacher/TeacherSchedule'));

const AnnouncementsPage = lazy(() => import('../pages/announcements/AnnouncementsPage'));

const HomePage = lazy(() => import('../pages/home/HomePage'));

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);



const AppRouter = React.memo(({ user, onLogin, onLogout }) => {
  const navigate = useNavigate();
  
  // State for material page navigation
  const [materialPageData, setMaterialPageData] = useState(null);
  const [showMaterialPage, setShowMaterialPage] = useState(false);

  // Function to handle opening material pages
  const handleOpenMaterials = useCallback((courseData) => {
    console.log('Opening materials for course:', courseData);
    setMaterialPageData(courseData);
    setShowMaterialPage(true);
    
    // Navigate to materials route based on user role
    if (user?.role) {
      const basePath = user.role === 'admin' ? '/admin' : '/student';
      navigate(`${basePath}/materials`);
    }
  }, [navigate, user?.role]);

  // Function to handle closing material pages
  const handleCloseMaterials = useCallback(() => {
    setShowMaterialPage(false);
    setMaterialPageData(null);
    
    // Navigate back to classes
    if (user?.role) {
      const basePath = user.role === 'admin' ? '/admin' : '/student';
      navigate(`${basePath}/classes`);
    }
  }, [navigate, user?.role]);

  // Show HomePage if user is not logged in
  if (!user) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <HomePage onLoginClick={onLogin} />
      </Suspense>
    );
  }

  // Determine the correct route based on user role - memoized to prevent re-renders
  const roleRoute = useMemo(() => {
    switch (user.role) {
      case 'admin': return '/admin';
      case 'student': return '/student';
      case 'parent': return '/parent';
      case 'teacher': return '/teacher';
      default: return '/';
    }
  }, [user.role]);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Root path - redirect authenticated users to their role path */}
        <Route 
          path="/" 
          element={
            <Navigate to={roleRoute} replace />
          } 
        />
        
        {/* Admin routes */}
        <Route 
          path="/admin/*" 
          element={
            user.role === 'admin' ? (
              <MainLayout user={user} onLogout={onLogout} routes={[
                { path: "/", element: <Navigate to="/admin/announcements" replace /> },
                { path: "/users", element: <UserManagement user={user} /> },
                { path: "/classes", element: <ClassManagement user={user} onOpenMaterials={handleOpenMaterials} /> },
                { path: "/payments", element: <AdminPayments user={user} /> },
                { path: "/form", element: <AdminForm user={user} /> },
                { path: "/announcements", element: <AnnouncementsPage currentUser={user} theme={{ primary: 'green', primaryLight: 'green-50' }} /> },
                { path: "/materials", element: showMaterialPage && materialPageData ? (
                  <MaterialPages 
                    courseData={materialPageData} 
                    onBack={handleCloseMaterials} 
                    currentUser={user} 
                  />
                ) : <Navigate to="/admin/classes" replace /> },
              ]} />
            ) : (
              <Navigate to={roleRoute} replace />
            )
          } 
        />
        
        {/* Student routes */}
        <Route 
          path="/student/*" 
          element={
            user.role === 'student' ? (
              <MainLayout user={user} onLogout={onLogout} routes={[
                { path: "/", element: <Navigate to="/student/announcements" replace /> },
                { path: "/classes", element: <StudentClasses user={user} onOpenMaterials={handleOpenMaterials} /> },
                { path: "/schedule", element: <StudentSchedule user={user} /> },
                { path: "/announcements", element: <AnnouncementsPage currentUser={user} theme={{ primary: 'red', primaryLight: 'red-50' }} /> },
                { path: "/materials", element: showMaterialPage && materialPageData ? (
                  <MaterialPages 
                    courseData={materialPageData} 
                    onBack={handleCloseMaterials} 
                    currentUser={user} 
                  />
                ) : <Navigate to="/student/classes" replace /> },
              ]} />
            ) : (
              <Navigate to={roleRoute} replace />
            )
          } 
        />
        
        {/* Parent routes */}
        <Route 
          path="/parent/*" 
          element={
            user.role === 'parent' ? (
              <MainLayout user={user} onLogout={onLogout} routes={[
                { path: "/", element: <Navigate to="/parent/announcements" replace /> },
                { path: "/children", element: <ChildrenManagement user={user} /> },
                { path: "/schedule", element: <ParentSchedule user={user} /> },
                { path: "/payments", element: <ParentPayments user={user} /> },
                { path: "/announcements", element: <AnnouncementsPage currentUser={user} theme={{ primary: 'purple', primaryLight: 'purple-50' }} /> },
              ]} />
            ) : (
              <Navigate to={roleRoute} replace />
            )
          } 
        />
        
        {/* Teacher routes */}
        <Route 
          path="/teacher/*" 
          element={
            user.role === 'teacher' ? (
              <MainLayout user={user} onLogout={onLogout} routes={[
                { path: "/", element: <Navigate to="/teacher/announcements" replace /> },
                { path: "/classes", element: <TeacherClasses user={user} /> },
                { path: "/schedule", element: <TeacherSchedule user={user} /> },
                { path: "/announcements", element: <AnnouncementsPage currentUser={user} theme={{ primary: 'blue', primaryLight: 'blue-50' }} /> },
              ]} />
            ) : (
              <Navigate to={roleRoute} replace />
            )
          } 
        />
        
        {/* Default redirect for authenticated users */}
        <Route 
          path="*" 
          element={
            <Navigate to={roleRoute} replace />
          } 
        />
      </Routes>
    </Suspense>
  );
});

const UnauthorizedPage = () => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">🚫</div>
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
    <p className="text-gray-600">You don't have permission to access this page.</p>
  </div>
);

const ComingSoonPage = ({ title }) => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">🚧</div>
    <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
    <p className="text-gray-600">This feature is coming soon!</p>
    <p className="text-sm text-gray-500 mt-2">We're working hard to bring you this functionality.</p>
  </div>
);

export default AppRouter;