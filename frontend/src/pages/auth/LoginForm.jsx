import React, { useState, useCallback } from 'react';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import { showSuccessToast, showErrorToast, showLoadingToast, dismissToast } from '../../utils/toast.jsx';
import { authService } from '../../services';
import PhoneInput from '../../components/ui/PhoneInput';

const LoginForm = React.memo(({ onLogin, onRegister }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'student', // Default to student, can be changed to parent
    phone: '',
    birthDate: ''
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
        const loadingToast = showLoadingToast('Signing in...');
        
        console.log('Login attempt with:', formData.email);
        console.log('Calling authenticateUser...'); // Debug log
        
        try {
          const authResult = await authenticateUser(formData.email, formData.password);
          console.log('authenticateUser result:', authResult); // Debug log

          if (authResult && authResult.user) {
            console.log('Authentication successful:', authResult);
            console.log('Calling onLogin...'); // Debug log
            
            // Dismiss loading toast and show success toast
            dismissToast(loadingToast);
            showSuccessToast(`Welcome back, ${authResult.user.firstName || authResult.user.name || 'User'}!`);
            
            onLogin(authResult.user, authResult.token);
            return;
          } else {
            console.log('Authentication failed - no user in result'); // Debug log
            
            // Dismiss loading toast and show error toast
            dismissToast(loadingToast);
            showErrorToast('Authentication failed. Please check your credentials.');
            setError('Authentication failed. Please check your credentials.');
          }
        } catch (authError) {
          console.error('Authentication error:', authError);
          console.error('AuthError type:', typeof authError);
          console.error('AuthError response:', authError.response);
          console.error('AuthError message:', authError.message);
          
          // Dismiss loading toast
          dismissToast(loadingToast);
          
          // Extract error message from authentication error
          let errorMessage = 'Invalid credentials. Please check your email and password.';
          
          if (authError.response?.data?.message) {
            errorMessage = authError.response.data.message;
          } else if (authError.message) {
            errorMessage = authError.message;
          } else if (typeof authError === 'string') {
            errorMessage = authError;
          }
          
          console.log('Setting error message:', errorMessage);
          showErrorToast(errorMessage);
          setError(errorMessage);
          setLoading(false);
          
          console.log('LoginForm: Authentication failed, staying on login page');
          return; // Exit early to prevent further processing
        }
      } else {
        // Registration flow
        const loadingToast = showLoadingToast('Creating account...');
        
        console.log('Registration attempt for:', formData.email);
        const registrationData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: formData.role, // Use selected role (teacher or student)
          phone: formData.phone, // Phone required for both teachers and students
          ...(formData.role === 'student' && { birthDate: formData.birthDate })
        };

        const result = await authService.register(registrationData);
        console.log('Registration successful:', result);
        
        // Dismiss loading toast and show success toast
        dismissToast(loadingToast);
        showSuccessToast(`Account for ${formData.firstName} ${formData.lastName} created successfully! Please sign in.`);
        
        // Show success message for registration
        setSuccess('Account created successfully! Please sign in with your new credentials.');
        
        // Clear form data for login
        setFormData({
          firstName: '',
          lastName: '',
          email: formData.email, // Keep email for convenience
          password: '',
          role: 'student', // Reset to default
          phone: '',
          birthDate: ''
        });
        
        // Switch to login mode
        setIsLogin(true);
        setLoading(false);
        return;
      }

      // If we reach here, something went wrong but no exception was thrown
      console.log('Reached end of handleSubmit without success'); // Debug log
      showErrorToast('Operation failed. Please try again.');
      setError('Operation failed. Please try again.');
    } catch (error) {
      console.error('Operation error:', error);
      
      // Extract error message from different possible error formats
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      showErrorToast(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handlePhoneChange = (value) => {
    setFormData(prev => ({
      ...prev,
      phone: value
    }));
  };

  const handleRoleChange = (role) => {
    setFormData(prev => ({
      ...prev,
      role: role
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </h2>
                     <p className="mt-2 text-center text-sm text-gray-600">
             {isLogin 
               ? 'Welcome back! Please sign in to continue.'
               : 'Join our educational platform as a student or parent'
             }
           </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
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
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>{success}</p>
                </div>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
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
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 pr-10 py-2 sm:py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
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
              {/* Phone Number Field for Students and Parents */}
              {(formData.role === 'student' || formData.role === 'parent') && (
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

                             {/* Role Selection Radio Buttons */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-3">
                   Account Type *
                 </label>
                 <div className="space-y-3">
                   <label className="flex items-center">
                     <input
                       type="radio"
                       name="role"
                       value="student"
                       checked={formData.role === 'student'}
                       onChange={() => handleRoleChange('student')}
                       className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                     />
                     <span className="ml-3 text-sm text-gray-700">
                       <span className="font-medium">Student</span>
                       <span className="text-gray-500 ml-1">- Enroll in courses and learn</span>
                     </span>
                   </label>
                   
                   <label className="flex items-center">
                     <input
                       type="radio"
                       name="role"
                       value="parent"
                       checked={formData.role === 'parent'}
                       onChange={() => handleRoleChange('parent')}
                       className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                     />
                     <span className="ml-3 text-sm text-gray-700">
                       <span className="font-medium">Parent</span>
                       <span className="text-gray-500 ml-1">- Manage your children's education</span>
                     </span>
                   </label>
                 </div>
               </div>

              {/* Birth Date Field for Students */}
              {formData.role === 'student' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Birth Date *
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                    required={formData.role === 'student'}
                  />
                </div>
              )}

                             <div className="mb-4 p-3 bg-blue-50 rounded-md">
                 <p className="text-sm text-blue-800 font-medium">Registration Information:</p>
                 <div className="text-xs text-blue-700 mt-1">
                   <div>• Students and parents can register through this form</div>
                   <div>• Teachers: Contact your administrator or use the teacher portal</div>
                   <div>• Phone number required for all public registrations</div>
                   <div>• Students created by parents don't require phone numbers</div>
                 </div>
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
               : (isLogin ? 'Sign In' : `Create ${formData.role === 'parent' ? 'Parent' : 'Student'} Account`)
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
                 role: 'student',
                 phone: '',
                 birthDate: ''
               });
             }}
            className="text-green-600 hover:text-green-800 text-sm"
          >
                         {isLogin
               ? "Don't have an account? Sign up as student or parent"
               : "Already have an account? Sign in"
             }
          </button>
        </div>

        {isLogin && (
                     <div className="mt-4 p-3 bg-blue-50 rounded-md">
             <p className="text-sm text-blue-800 font-medium">Authentication Policy:</p>
             <div className="text-xs text-blue-700 mt-2 space-y-1">
               <div>• Use your real credentials to login</div>
               <div>• Students and parents can create accounts through registration</div>
               <div>• Teachers: Contact your administrator or use the teacher portal</div>
               <div>• All data is securely stored and managed</div>
             </div>
           </div>
        )}
      </div>
    </div>
  );
});

export default LoginForm;