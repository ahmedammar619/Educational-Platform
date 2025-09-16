import React, { useState, useEffect, useCallback } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { Routes, Route, useLocation } from 'react-router-dom';
import { LoginForm } from './pages/auth';
import EmailVerificationPage from './pages/auth/EmailVerificationPage';
import { AppRouter } from './routers';
import { authService } from './services';
import { NotificationProvider } from './contexts/NotificationContext';
import ToastContainer from './components/ui/ToastContainer';
import { showInfoToast } from './utils/toast.js';
import './App.css';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Only catch actual errors, not navigation/state changes
    if (error.name === 'ChunkLoadError' || error.message?.includes('Loading chunk')) {
      // Don't catch chunk loading errors during navigation
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">We're sorry, but something unexpected happened.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [preventAutoLogin, setPreventAutoLogin] = useState(false);
  const location = useLocation();

  const validateToken = React.useCallback(async () => {
    try {
      // Don't auto-login if we're preventing it (e.g., after manual logout)
      if (preventAutoLogin) {
        console.log('Auto-login prevented, skipping token validation');
        setLoading(false);
        return;
      }

      // Check if user is authenticated using authService
      if (authService.isAuthenticated()) {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          return;
        }
      }
      
      // Invalid or expired token, clear everything
      await authService.logout();
    } catch (error) {
      console.error('Token validation failed:', error);
      await authService.logout();
    } finally {
      setLoading(false);
    }
  }, [preventAutoLogin]);

  useEffect(() => {
    // Check if user is already authenticated on app start
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          await validateToken();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [validateToken]);

  const handleLogin = React.useCallback((userData, userToken) => {
    console.log('App: handleLogin called with:', { userData, userToken }); // Debug log
    console.log('App: userData type:', typeof userData); // Debug log
    console.log('App: userData keys:', userData ? Object.keys(userData) : 'No userData'); // Debug log
    
    // Ensure userData is valid and has required properties
    if (!userData || !userData.id || !userData.email || !userData.role) {
      console.error('App: Invalid userData received - missing required fields:', userData);
      console.error('App: userData.id:', userData?.id);
      console.error('App: userData.email:', userData?.email);
      console.error('App: userData.role:', userData?.role);
      return;
    }
    
    // Additional validation - ensure userData is a proper object
    if (typeof userData !== 'object' || Array.isArray(userData)) {
      console.error('App: Invalid userData type - expected object, got:', typeof userData);
      return;
    }
    
    console.log('App: Valid userData received, proceeding with login');
    setUser(userData);
    setShowLogin(false);
    setPreventAutoLogin(false); // Reset the flag on successful login
    
    console.log('App: User state set to:', userData); // Debug log
    console.log('App: Login modal closed, showLogin set to false'); // Debug log
    console.log('App: Login successful, user set and modal closed'); // Debug log
  }, []);

  const handleLoginClick = React.useCallback(() => {
    // Always show login modal when clicked, regardless of current auth state
    setShowLogin(true);
  }, []);

  const handleLogout = React.useCallback(async () => {
    // Set logging out state to prevent error boundary issues
    setIsLoggingOut(true);
    
    // Prevent auto-login after logout
    setPreventAutoLogin(true);
    
    // Show logout confirmation
    showInfoToast('Signing out...', 'You have been successfully logged out.');
    
    // Clear user state and logout from authService
    await authService.logout();
    setUser(null);
    
    // Use setTimeout to ensure state updates are processed before navigation
    setTimeout(() => {
      window.location.href = '/';
    }, 50);
  }, []);

  if (loading || isLoggingOut) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{isLoggingOut ? 'Signing out...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <HelmetProvider>
      <ErrorBoundary>
        <NotificationProvider user={user}>
          <div className="App">
            <Routes>
              {/* Email verification route - always accessible */}
              <Route path="/verify-email" element={<EmailVerificationPage />} />
              
              {/* All other routes */}
              <Route path="*" element={
                showLogin ? (
                  <LoginForm 
                    onLogin={handleLogin} 
                    onRegister={() => setShowLogin(false)}
                    onProfileCompletion={() => {
                      console.log('Profile completion callback triggered - clearing user state and showing login');
                      
                      // CRITICAL: Immediately clear user state to prevent any navigation attempts
                      // This must happen synchronously to prevent AppRouter from seeing the user
                      setUser(null);
                      setShowLogin(true);
                      setPreventAutoLogin(true);
                      
                      // Force clear any remaining authentication state
                      try {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        console.log('✅ Cleared all auth data from localStorage after profile completion');
                      } catch (error) {
                        console.error('❌ Error clearing localStorage:', error);
                      }
                      
                      console.log('Profile completion: User state cleared, login form should be visible');
                    }}
                    onLogout={handleLogout}
                  />
                ) : (
                  <AppRouter 
                    user={user} 
                    onLogin={handleLoginClick}
                    onLogout={handleLogout}
                  />
                )
              } />
            </Routes>
            <ToastContainer position="top-right" />
          </div>
        </NotificationProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
