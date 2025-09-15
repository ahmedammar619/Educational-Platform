import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { showSuccessToast, showErrorToast, showLoadingToast, dismissToast } from '../../utils/toast.js';
import { authService } from '../../services/index.js';
import ProfileCompletionModal from './ProfileCompletionModal';

const EmailVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('pending'); // pending, success, error
  const [message, setMessage] = useState('');
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState(null);
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      handleEmailVerification(token);
    }
  }, [token]);

  const handleEmailVerification = async (verificationToken) => {
    setLoading(true);
    const loadingToast = showLoadingToast('Verifying your email...');

    try {
      const result = await authService.verifyEmail(verificationToken);
      dismissToast(loadingToast);
      
      setVerificationStatus('success');
      setMessage(result.message || 'Your email has been verified successfully!');
      showSuccessToast('Email verified successfully!');
      
      // Store the verified user data and token
      const userData = result.user || {};
      const token = result.token;
      
      if (token) {
        // Store the token and user data for profile completion
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('✅ Token stored after email verification:', token.substring(0, 20) + '...');
      }
      
      setVerifiedUser(userData);
      
      // Show ProfileCompletionModal for ALL users after email verification
      setTimeout(() => {
        setShowProfileCompletion(true);
      }, 2000);
    } catch (error) {
      console.error('Email verification error:', error);
      dismissToast(loadingToast);
      
      setVerificationStatus('error');
      const errorMessage = error.response?.data?.message || error.message || 'Email verification failed';
      setMessage(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    const loadingToast = showLoadingToast('Resending verification email...');

    try {
      // Get user from localStorage or redirect to login
      const user = authService.getCurrentUser();
      if (!user) {
        dismissToast(loadingToast);
        showErrorToast('Please login first to resend verification email');
        navigate('/auth');
        return;
      }

      await authService.resendVerificationEmail(user.id);
      dismissToast(loadingToast);
      showSuccessToast('Verification email sent! Please check your inbox.');
    } catch (error) {
      console.error('Resend verification error:', error);
      dismissToast(loadingToast);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to resend verification email';
      showErrorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileCompletion = (updatedUser) => {
    // Profile completed successfully, navigate to login
    console.log('Profile completion successful:', updatedUser);
    setShowProfileCompletion(false);
    setVerifiedUser(null);
    // Navigate to login page
    navigate('/auth');
  };

  const handleProfileCompletionCancel = async () => {
    // User cancelled profile completion, clear everything
    console.log('Profile completion cancelled');
    setShowProfileCompletion(false);
    setVerifiedUser(null);
    await authService.logout(); // Clear the temporary login
    showErrorToast('Profile completion is required to access the platform.');
    // Force reload to ensure clean state
    window.location.href = '/auth';
  };


  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-16 w-16 text-red-500" />;
      default:
        return <Mail className="h-16 w-16 text-blue-500" />;
    }
  };

  const getStatusColor = () => {
    switch (verificationStatus) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const getStatusBgColor = () => {
    switch (verificationStatus) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-white shadow-lg mb-6">
              {getStatusIcon()}
            </div>
            
            <h2 className={`text-3xl font-bold ${getStatusColor()} mb-4`}>
              {verificationStatus === 'success' && 'Email Verified!'}
              {verificationStatus === 'error' && 'Verification Failed'}
              {verificationStatus === 'pending' && 'Verifying Email...'}
            </h2>
            
            <p className="text-gray-600 mb-8">
              {message || 'Please wait while we verify your email address...'}
            </p>
          </div>

          <div className={`rounded-lg border p-6 ${getStatusBgColor()}`}>
            <div className="text-center">
              {verificationStatus === 'success' && (
                <div>
                  <p className="text-green-800 font-medium mb-4">
                    🎉 Congratulations! Your email has been verified successfully.
                  </p>
                  <p className="text-green-700 text-sm mb-4">
                    Your email has been verified successfully! Please complete your profile information to continue.
                  </p>
                </div>
              )}

              {verificationStatus === 'error' && (
                <div>
                  <p className="text-red-800 font-medium mb-4">
                    ❌ Email verification failed
                  </p>
                  <p className="text-red-700 text-sm mb-6">
                    The verification link may be invalid or expired. Please try again.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={handleResendVerification}
                      disabled={loading}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Resending...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Resend Verification Email
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => navigate('/auth')}
                      className="w-full px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors"
                    >
                      Go to Login
                    </button>
                  </div>
                </div>
              )}

              {verificationStatus === 'pending' && (
                <div>
                  <p className="text-blue-800 font-medium mb-4">
                    🔄 Verifying your email address...
                  </p>
                  <p className="text-blue-700 text-sm">
                    Please wait while we process your verification.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Profile Completion Modal - For ALL users after email verification */}
      {showProfileCompletion && verifiedUser && (
        <ProfileCompletionModal
          user={verifiedUser}
          onComplete={handleProfileCompletion}
          onCancel={handleProfileCompletionCancel}
        />
      )}
    </>
  );
};

export default EmailVerificationPage;
