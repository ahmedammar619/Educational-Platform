import React, { useMemo, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { authService } from '../services';

// Lazy load all main page components
const StudentMain = lazy(() => import('../pages/student/StudentMain'));
const AdminMain = lazy(() => import('../pages/admin/AdminMain'));
const ParentMain = lazy(() => import('../pages/parent/ParentMain'));
const TeacherMain = lazy(() => import('../pages/teacher/TeacherMain'));
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
               <AdminMain user={user} onLogout={onLogout} />
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
               <StudentMain user={user} onLogout={onLogout} />
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
               <ParentMain user={user} onLogout={onLogout} />
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
               <TeacherMain user={user} onLogout={onLogout} />
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