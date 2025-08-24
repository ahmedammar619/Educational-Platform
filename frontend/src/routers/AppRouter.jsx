import { Routes, Route, Navigate } from 'react-router-dom';
import { StudentMain } from '../pages/student';
import { AdminMain } from '../pages/admin';
import { ParentMain } from '../pages/parent';
import TeacherMain from '../pages/teacher/TeacherMain';
import HomePage from '../pages/home/HomePage';
import { authService } from '../services';

const AppRouter = ({ user, onLogin, onLogout }) => {
  // Show HomePage if user is not logged in
  if (!user) {
    return <HomePage onLoginClick={onLogin} />;
  }

  // Protected Route component
  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!user) {
      return <Navigate to="/" replace />;
    }
    
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
    
    return children;
  };

  return (
    <Routes>
      {/* Root path - redirect authenticated users to their dashboard */}
      <Route 
        path="/" 
        element={
          <Navigate 
            to={`/${user.role === 'admin' ? 'admin' : user.role === 'student' ? 'student' : user.role === 'parent' ? 'parent' : 'teacher'}/dashboard`} 
            replace 
          />
        } 
      />
      
      {/* Admin routes */}
      <Route 
        path="/admin/*" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminMain user={user} onLogout={onLogout} />
          </ProtectedRoute>
        } 
      />
      
      {/* Student routes */}
      <Route 
        path="/student/*" 
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentMain user={user} onLogout={onLogout} />
          </ProtectedRoute>
        } 
      />
      
      {/* Parent routes */}
      <Route 
        path="/parent/*" 
        element={
          <ProtectedRoute allowedRoles={['parent']}>
            <ParentMain user={user} onLogout={onLogout} />
          </ProtectedRoute>
        } 
      />
      
      {/* Teacher routes */}
      <Route 
        path="/teacher/*" 
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherMain user={user} onLogout={onLogout} />
          </ProtectedRoute>
        } 
      />
      
      {/* Default redirect for authenticated users */}
      <Route 
        path="*" 
        element={
          <Navigate 
            to={`/${user.role === 'admin' ? 'admin' : user.role === 'student' ? 'student' : user.role === 'parent' ? 'parent' : 'teacher'}/dashboard`} 
            replace 
          />
        } 
      />
    </Routes>
  );
};

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