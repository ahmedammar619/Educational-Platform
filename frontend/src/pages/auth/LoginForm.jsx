import React, { useState, useCallback } from 'react';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import { showSuccessToast, showErrorToast, showWarningToast, showLoadingToast, dismissToast } from '../../utils/toast.js';
import { authService } from '../../services';
import PhoneInput from '../../components/ui/PhoneInput';
import ProfileCompletionModal from '../../pages/auth/ProfileCompletionModal';
import EmailVerificationModal from '../../components/auth/EmailVerificationModal';

const LoginForm = React.memo(({ onLogin, onRegister }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'parent', // Default to parent
    phone: '',
    birthDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [emailVerificationUser, setEmailVerificationUser] = useState(null);

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

    // Prevent double-clicking
    if (loading) {
      console.warn('🚫 Form submission already in progress, ignoring duplicate click');
      showWarningToast('Please wait', 'Form submission is already in progress.');
      return;
    }

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

            // Check if user needs email verification FIRST (only for teachers and parents, NOT admins)
            if ((authResult.user.role === 'teacher' || authResult.user.role === 'parent') && !authResult.user.emailVerified) {
              console.log('Teacher/Parent requires email verification');
              dismissToast(loadingToast);
              setEmailVerificationUser(authResult.user);
              setShowEmailVerification(true);
              setLoading(false);
              return;
            }

            // Check if user needs to complete their profile
            // For parents only: check if they have incomplete profile data
            // Teachers should only complete profile after email verification, not during login
            // Admins should not be required to complete profile during login
            const needsProfileCompletion = authResult.user.role === 'parent' && 
              (!authResult.user.firstName || 
               !authResult.user.lastName || 
               authResult.user.firstName.startsWith('New ') || 
               authResult.user.lastName === 'User' ||
               !authResult.user.phone);
            
            if (needsProfileCompletion) {
              console.log('Parent requires profile completion - incomplete profile data');
              dismissToast(loadingToast);
              setPendingUser(authResult.user);
              setShowProfileCompletion(true);
              return;
            }

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
          role: formData.role, // Use selected role (parent only)
          phone: formData.phone, // Phone required for both teachers and students
        };

        const result = await authService.register(registrationData);
        console.log('Registration successful:', result);

        // Dismiss loading toast
        dismissToast(loadingToast);

        // Check if email verification is required
        if (result.emailVerificationRequired) {
          console.log('Email verification required for new user');
          setEmailVerificationUser(result.user);
          setShowEmailVerification(true);
          setLoading(false);
          return;
        }

        showSuccessToast(`Account for ${formData.firstName} ${formData.lastName} created successfully! Please sign in.`);

        // Show success message for registration
        setSuccess('Account created successfully! Please sign in with your new credentials.');

        // Clear form data for login
        setFormData({
          firstName: '',
          lastName: '',
          email: formData.email, // Keep email for convenience
          password: '',
          role: 'parent', // Reset to default
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

  const handleProfileCompletion = (updatedUser) => {
    // Profile completed successfully, ProfileCompletionModal handles navigation
    console.log('Profile completion successful:', updatedUser);
    setShowProfileCompletion(false);
    setPendingUser(null);
    // ProfileCompletionModal will navigate to login page automatically
  };

  const handleProfileCompletionCancel = async () => {
    // User cancelled profile completion, clear everything
    console.log('Profile completion cancelled');
    setShowProfileCompletion(false);
    setPendingUser(null);
    await authService.logout(); // Clear the temporary login
    showErrorToast('Profile completion is required to access the platform.');
    // Force reload to ensure clean state
    window.location.href = '/auth';
  };

  const handleEmailVerificationComplete = (verifiedUser) => {
    console.log('Email verification completed:', verifiedUser);
    setShowEmailVerification(false);
    setEmailVerificationUser(null);
    
    // Only show ProfileCompletionModal for teachers after email verification
    if (verifiedUser.role === 'teacher') {
      console.log('Teacher email verified, proceeding to profile completion');
      setPendingUser(verifiedUser);
      setShowProfileCompletion(true);
    } else {
      // For parents and other roles, proceed directly to login
      console.log('Non-teacher email verified, proceeding to login');
      
      // Get the token from localStorage (it should be there from the initial login)
      const token = localStorage.getItem('token');
      if (token) {
        showSuccessToast('Email verified successfully! Welcome to the platform.');
        onLogin(verifiedUser, token);
      } else {
        showSuccessToast('Email verified successfully! You can now sign in.');
        
        // Clear form data for login
        setFormData({
          firstName: '',
          lastName: '',
          email: verifiedUser.email, // Keep email for convenience
          password: '',
          role: 'parent',
          phone: '',
          birthDate: ''
        });

        // Switch to login mode
        setIsLogin(true);
      }
    }
  };

  const handleEmailVerificationCancel = () => {
    console.log('Email verification cancelled');
    setShowEmailVerification(false);
    setEmailVerificationUser(null);
    showErrorToast('Email verification is required to complete your registration.');
  };

  const handleEmailVerificationResend = () => {
    console.log('Email verification resent');
    // The EmailVerificationModal handles the resend logic
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
              : 'Join our educational platform as a parent'
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
              {/* Phone Number Field for Parents */}
              {formData.role === 'parent' && (
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

              {/* Role Selection - Parent Only */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Account Type *
                </label>
                <div className="space-y-3">
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
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2.5 sm:py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-medium flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </>
            ) : (
              isLogin ? 'Sign In' : 'Create Parent Account'
            )}
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
                phone: '',
                birthDate: ''
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
              <div>• Parents can create accounts through registration</div>
              <div>• Teachers: Contact your administrator or use the teacher portal</div>
              <div>• All data is securely stored and managed</div>
            </div>
          </div>
        )}

        {/* Profile Completion Modal */}
        {showProfileCompletion && pendingUser && (
          <ProfileCompletionModal
            user={pendingUser}
            onComplete={handleProfileCompletion}
            onCancel={handleProfileCompletionCancel}
          />
        )}

        {/* Email Verification Modal */}
        {showEmailVerification && emailVerificationUser && (
          <EmailVerificationModal
            user={emailVerificationUser}
            onVerified={handleEmailVerificationComplete}
            onCancel={handleEmailVerificationCancel}
            onResend={handleEmailVerificationResend}
          />
        )}
      </div>
    </div>
  );
});

export default LoginForm;