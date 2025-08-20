import { useState } from 'react';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import { mockUsers } from '../../data/mockData';

const LoginForm = ({ onLogin, onRegister }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mock authentication function
  const mockAuthenticate = (email, password) => {
    console.log('Mock authentication attempt:', { email, password });
    
    // Check if it's a demo account
    if (password === 'password123') {
      console.log('Password matches demo password, searching for user...');
      
      // Find user in mock data
      let user = null;
      
      // Check teachers
      user = mockUsers.teachers.find(t => t.email === email);
      if (user) {
        console.log('Found teacher user:', user);
        return { user, token: 'mock-token-teacher' };
      }
      
      // Check students
      user = mockUsers.students.find(s => s.email === email);
      if (user) {
        console.log('Found student user:', user);
        return { user, token: 'mock-token-student' };
      }
      
      // Check parents
      user = mockUsers.parents.find(p => p.email === email);
      if (user) {
        console.log('Found parent user:', user);
        return { user, token: 'mock-token-parent' };
      }
      
      // Check admins
      user = mockUsers.admins.find(a => a.email === email);
      if (user) {
        console.log('Found admin user:', user);
        return { user, token: 'mock-token-admin' };
      }
      
      console.log('No user found with email:', email);
    } else {
      console.log('Password does not match demo password');
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Login attempt with:', formData.email);
      
      // Use mock authentication only
      const mockAuth = mockAuthenticate(formData.email, formData.password);
      
      if (mockAuth) {
        console.log('Mock authentication successful:', mockAuth);
        // Mock authentication successful
        localStorage.setItem('token', mockAuth.token);
        onLogin(mockAuth.user, mockAuth.token);
        return;
      }

      // Mock authentication failed
      setError('Invalid email or password. Please use the demo accounts.');
    } catch (error) {
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-6 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-xl sm:text-2xl font-bold">ب</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">براعم النور</h1>
          <p className="text-xs sm:text-sm text-gray-600 mb-2">Baraem Al-Noor</p>
          <p className="text-sm sm:text-base text-gray-600">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 sm:py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Enter your full name"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 sm:py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-10 py-2 sm:py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="parent">Parent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Enter your phone number"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2.5 sm:py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-medium"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setFormData({
                name: '',
                email: '',
                password: '',
                role: 'student',
                phone: ''
              });
            }}
            className="text-green-600 hover:text-green-800 text-sm"
          >
            {isLogin 
              ? "Don't have an account? Sign up" 
              : "Already have an account? Sign in"
            }
          </button>
        </div>

        {isLogin && (
          <div className="mt-4 p-3 bg-green-50 rounded-md">
            <p className="text-sm text-green-800 font-medium">Demo Accounts:</p>
            <div className="text-xs text-green-700 mt-2 space-y-1">
              <div>Admin: admin@education.com</div>
              <div>Teacher: jane.teacher@education.com</div>
              <div>Student: john.student@education.com</div>
              <div>Parent: mary.parent@education.com</div>
              <div className="mt-1 font-medium">Password: password123</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginForm;