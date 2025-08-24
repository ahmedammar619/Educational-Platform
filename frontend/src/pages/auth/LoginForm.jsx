import { useState, useCallback } from 'react';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import { authService } from '../../services';
import PhoneInput from '../../components/ui/PhoneInput';

const LoginForm = ({ onLogin, onRegister }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'parent', // Only parents can register
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Real authentication function using authService
  const authenticateUser = async (email, password) => {
    try {
      console.log('authenticateUser called with:', { email, password }); // Debug log
      console.log('Calling authService.login...'); // Debug log
      const result = await authService.login({ email, password });
      console.log('authService.login result:', result); // Debug log
      return result;
    } catch (error) {
      console.error('Authentication error in authenticateUser:', error); // Debug log
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted!', { isLogin, formData }); // Debug log
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        // Login flow
        console.log('Login attempt with:', formData.email);
        console.log('Calling authenticateUser...'); // Debug log
        const authResult = await authenticateUser(formData.email, formData.password);
        console.log('authenticateUser result:', authResult); // Debug log

        if (authResult && authResult.user) {
          console.log('Authentication successful:', authResult);
          console.log('Calling onLogin...'); // Debug log
          onLogin(authResult.user, authResult.token);
          return;
        } else {
          console.log('Authentication failed - no user in result'); // Debug log
          setError('Authentication failed. Please check your credentials.');
        }
      } else {
        // Registration flow
        console.log('Registration attempt for:', formData.email);
        const registrationData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: 'parent', // Always set to parent (lowercase to match backend)
          phone: formData.phone
        };

        const result = await authService.register(registrationData);
        console.log('Registration successful:', result);
        
        // Show success message for registration
        setSuccess('Account created successfully! Please sign in with your new credentials.');
        
        // Clear form data for login
        setFormData({
          firstName: '',
          lastName: '',
          email: formData.email, // Keep email for convenience
          password: '',
          role: 'parent',
          phone: ''
        });
        
        // Switch to login mode
        setIsLogin(true);
        setLoading(false);
        return;
      }

      // If we reach here, something went wrong but no exception was thrown
      console.log('Reached end of handleSubmit without success'); // Debug log
      setError('Operation failed. Please try again.');
    } catch (error) {
      console.error('Operation error:', error);
      
      // Extract error message from different possible error formats
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.error) {
        errorMessage = error.error;
      }
      
      setError(errorMessage);
      
      // Don't redirect or change state - stay on the login page
      // The error will be displayed above the form
    } finally {
      setLoading(false);
    }
  };

  // Memoize the phone onChange function to prevent infinite re-renders
  const handlePhoneChange = useCallback((value) => {
    setFormData(prev => ({ ...prev, phone: value }));
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4 h-full">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-6 sm:p-8 relative">
        {/* Close button */}
        <button
          onClick={onRegister}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
          title="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-xl sm:text-2xl font-bold">ب</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">براعم النور</h1>
          <p className="text-xs sm:text-sm text-gray-600 mb-2">Baraem Al-Noor</p>
          <p className="text-sm sm:text-base text-gray-600">
            {isLogin ? 'Sign in to your account' : 'Create parent account'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm relative">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="inline-flex text-red-400 hover:text-red-600 focus:outline-none focus:text-red-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L10 8.586 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm relative">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  type="button"
                  onClick={() => setSuccess('')}
                  className="inline-flex text-green-400 hover:text-green-600 focus:outline-none focus:text-green-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L10 8.586 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 sm:py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="First name"
                    required={!isLogin}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Last name"
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
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Phone Number *
               </label>
               <PhoneInput
                 value={formData.phone}
                 onChange={handlePhoneChange}
                 placeholder="Enter your phone number"
                 required={true}
               />
             </div>
           )}
          
          {!isLogin && (
            <>
              <div className="mb-4 p-3 bg-yellow-50 rounded-md">
                <p className="text-sm text-yellow-800 font-medium">Parent Registration Only:</p>
                <div className="text-xs text-yellow-700 mt-1">
                  <div>• Only parents can register through this form</div>
                  <div>• Students, teachers, and admins: Contact your administrator</div>
                </div>
              </div>



              <div className="hidden">
                <input
                  type="hidden"
                  name="role"
                  value="parent"
                />
              </div>

            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2.5 sm:py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-medium"
          >
            {loading 
              ? (isLogin ? 'Signing in...' : 'Creating account...') 
              : (isLogin ? 'Sign In' : 'Create Parent Account')
            }
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccess('');
              setFormData({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                role: 'parent',
                phone: ''
              });
            }}
            className="text-green-600 hover:text-green-800 text-sm"
          >
            {isLogin
              ? "Don't have an account? Sign up as parent"
              : "Already have an account? Sign in"
            }
          </button>
        </div>

        {isLogin && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800 font-medium">Authentication Policy:</p>
            <div className="text-xs text-blue-700 mt-2 space-y-1">
              <div>• Use your real credentials to login</div>
              <div>• Only parents can create accounts through registration</div>
              <div>• Students, teachers, and admins are created by administrators</div>
              <div>• All data is securely stored and managed</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginForm;