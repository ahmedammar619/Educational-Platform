import React, { useMemo, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { authService } from '../services';
import MainLayout from '../components/Layout/MainLayout';

// Lazy load individual page components
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const UserManagement = lazy(() => import('../pages/admin/UserManagement'));
const ClassManagement = lazy(() => import('../pages/admin/ClassManagement'));
const AdminPayments = lazy(() => import('../pages/admin/AdminPayments'));

const StudentDashboard = lazy(() => import('../pages/student/StudentDashboard'));
const StudentClasses = lazy(() => import('../pages/student/StudentClasses'));
const StudentSchedule = lazy(() => import('../pages/student/StudentSchedule'));

const ParentDashboard = lazy(() => import('../pages/parent/ParentDashboard'));
const ChildrenManagement = lazy(() => import('../pages/parent/ChildrenManagement'));
const ParentSchedule = lazy(() => import('../pages/parent/ParentSchedule'));
const ParentCommunication = lazy(() => import('../pages/parent/ParentCommunication'));
const ParentPayments = lazy(() => import('../pages/parent/ParentPayments'));

const TeacherDashboard = lazy(() => import('../pages/teacher/TeacherDashboard'));
const TeacherClasses = lazy(() => import('../pages/teacher/TeacherClasses'));
const TeacherSchedule = lazy(() => import('../pages/teacher/TeacherSchedule'));

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
                { path: "/", element: <AdminDashboard user={user} /> },
                { path: "/users", element: <UserManagement user={user} /> },
                { path: "/classes", element: <ClassManagement user={user} /> },
                { path: "/payments", element: <AdminPayments user={user} /> },
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
                { path: "/", element: <StudentDashboard user={user} /> },
                { path: "/classes", element: <StudentClasses user={user} /> },
                { path: "/schedule", element: <StudentSchedule user={user} /> },
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
                { path: "/", element: <ParentDashboard user={user} /> },
                { path: "/children", element: <ChildrenManagement user={user} /> },
                { path: "/schedule", element: <ParentSchedule user={user} /> },
                { path: "/communication", element: <ParentCommunication user={user} /> },
                { path: "/payments", element: <ParentPayments user={user} /> },
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
                { path: "/", element: <TeacherDashboard user={user} /> },
                { path: "/classes", element: <TeacherClasses user={user} /> },
                { path: "/schedule", element: <TeacherSchedule user={user} /> },
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
