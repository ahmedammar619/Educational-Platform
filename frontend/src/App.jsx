import React, { useState, useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { LoginForm } from './pages/auth';
import { AppRouter } from './routers';
import { authService } from './services';
import './App.css';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
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
  }, []);

  const validateToken = async (savedToken) => {
    try {
      // Check if user is authenticated using authService
      if (authService.isAuthenticated()) {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          return;
        }
      }
      
      // Invalid or expired token, clear everything
      authService.logout();
    } catch (error) {
      console.error('Token validation failed:', error);
      authService.logout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData, userToken) => {
    console.log('App: handleLogin called with:', { userData, userToken }); // Debug log
    console.log('App: userData type:', typeof userData); // Debug log
    console.log('App: userData keys:', userData ? Object.keys(userData) : 'No userData'); // Debug log
    
    // Ensure userData is valid
    if (!userData || !userData.id) {
      console.error('App: Invalid userData received:', userData);
      return;
    }
    
    setUser(userData);
    setShowLogin(false);
    
    console.log('App: User state set to:', userData); // Debug log
    console.log('App: Login modal closed, showLogin set to false'); // Debug log
    console.log('App: Login successful, user set and modal closed'); // Debug log
  };

  const handleLoginClick = () => {
    // Always show login modal when clicked, regardless of current auth state
    setShowLogin(true);
  };

  const handleLogout = () => {
    // Clear user state first
    setUser(null);
    // Then logout from authService
    authService.logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <HelmetProvider>
      <ErrorBoundary>
        <div className="App">
          {showLogin ? (
            <LoginForm onLogin={handleLogin} onRegister={() => setShowLogin(false)} />
          ) : (
            <AppRouter 
              user={user} 
              onLogin={handleLoginClick}
              onLogout={handleLogout}
            />
          )}
        </div>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
