import { useState, useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { LoginForm } from './pages/auth';
import { AppRouter } from './routers';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    // Always start with home page - no automatic login
    setLoading(false);
  }, []);

  const validateToken = async (savedToken) => {
    try {
      // Mock token validation - check if token exists and is valid
      if (savedToken && savedToken.startsWith('mock-token-')) {
        // Extract user role from token
        const role = savedToken.replace('mock-token-', '');
        
        // Get user from localStorage or mock data
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          if (userData.role === role) {
            setUser(userData);
            return;
          }
        }
      }
      
      // Invalid token, remove it
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Token validation failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData, userToken) => {
    setUser(userData);
    // Save user data to localStorage for persistence
    localStorage.setItem('user', JSON.stringify(userData));
    setShowLogin(false);
  };

  const handleLoginClick = () => {
    // Check if user has a saved token before showing login form
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      validateToken(savedToken);
    } else {
      setShowLogin(true);
    }
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
      <div className="App">
        {showLogin ? (
          <LoginForm onLogin={handleLogin} onClose={() => setShowLogin(false)} />
        ) : (
          <AppRouter 
            user={user} 
            onLogin={handleLoginClick}
          />
        )}
      </div>
    </HelmetProvider>
  );
}

export default App;
