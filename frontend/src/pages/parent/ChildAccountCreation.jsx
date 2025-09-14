import { useState, useEffect } from 'react';
import { User, Mail, Lock, Calendar, Eye, EyeOff } from 'lucide-react';
import { showSuccessToast, showErrorToast, showLoadingToast, dismissToast } from '../../utils/toast.jsx';
import parentsService from '../../services/parentsService';

const ChildAccountCreation = ({ user, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successData, setSuccessData] = useState(null); // New state to hold success data

  // Add CSS to hide browser's default password visibility toggle
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      input[type="password"]::-ms-reveal,
      input[type="password"]::-ms-clear {
        display: none !important;
      }
      input[type="password"]::-webkit-contacts-auto-fill-button,
      input[type="password"]::-webkit-credentials-auto-fill-button {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.birthDate) {
      newErrors.birthDate = 'Date of birth is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent double-clicking
    if (isSubmitting) {
      console.warn('🚫 Form submission already in progress, ignoring duplicate click');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    
    const loadingToast = showLoadingToast('Creating child account...');

    try {
      // Prepare data according to backend CreateChildAccountDto
      const childData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        birthDate: formData.birthDate
      };

      console.log('Submitting child data:', childData);
      const response = await parentsService.createChildAccount(childData, user.id);
      console.log('Child account created successfully:', response);
      
      // Dismiss loading toast and show success toast
      dismissToast(loadingToast);
      showSuccessToast(`Child account for ${formData.firstName} ${formData.lastName} created successfully!`);
      
      setSubmitStatus('success');
              setSuccessData(response); // Store success data
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        birthDate: ''
      });
      
      // Call onSuccess callback after 2 seconds to show success message
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 2000);
      
    } catch (err) {
      console.error('Error creating child account:', err);
      setSubmitStatus('error');
      
      // Dismiss loading toast and show error toast
      dismissToast(loadingToast);
      
      // Handle different types of errors
      let errorMessage = 'Failed to create child account. Please try again.';
      if (err.message) {
        errorMessage = err.message;
      } else if (err.error) {
        errorMessage = err.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      setErrors({ submit: errorMessage });
      showErrorToast(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === 'success') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Account Created Successfully!</h3>
        <p className="text-gray-600 mb-4">
          {successData?.message || 'Your child\'s account has been created and linked to your parent account.'}
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Account Details:</strong><br />
            Student ID: <span className="font-mono">{successData?.student?.id || 'N/A'}</span><br />
            Name: <span className="font-mono">{successData?.student?.firstName} {successData?.student?.lastName}</span><br />
            Email: <span className="font-mono">{successData?.student?.email}</span><br />
            Birth Date: <span className="font-mono">{successData?.student?.birthDate ? new Date(successData.student.birthDate).toLocaleDateString() : 'N/A'}</span><br />
            Parent ID: <span className="font-mono">{successData?.student?.parentId || 'N/A'}</span><br />
            Linked to Parent: <span className="font-mono">{successData?.parent?.name || 'N/A'}</span>
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-800">
            <strong>Login Details:</strong><br />
            Email: <span className="font-mono">{successData?.student?.email || formData.email}</span><br />
            Password: <span className="font-mono">[The password you set]</span>
          </p>
        </div>
        <p className="text-gray-600 mb-6">
          Your child can now log in using their email and password to access their student account.
        </p>
        <div className="flex justify-center space-x-3">
          <button
            onClick={() => setSubmitStatus(null)}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Create Another Account
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ margin:'0px' }}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2 text-purple-600" />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter first name"
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
              )}
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter last name"
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Mail className="h-5 w-5 mr-2 text-purple-600" />
            Account Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter password"
                    style={{ WebkitTextSecurity: showPassword ? 'none' : 'disc' }}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Confirm password"
                    style={{ WebkitTextSecurity: showConfirmPassword ? 'none' : 'disc' }}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-purple-600" />
            Additional Information
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth *
            </label>
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.birthDate ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.birthDate && (
              <p className="text-red-500 text-sm mt-1">{errors.birthDate}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Required for student accounts</p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </>
              ) : (
                'Create Child Account'
              )}
            </button>
          </div>
        </div>

        {submitStatus === 'error' && (
          <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-md">
            <svg className="h-5 w-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-red-700">
              {errors.submit || 'Failed to create account. Please try again.'}
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

export default ChildAccountCreation;