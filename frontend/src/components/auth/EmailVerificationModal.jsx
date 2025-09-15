import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, AlertCircle, RefreshCw, X } from 'lucide-react';
import { showSuccessToast, showErrorToast, showLoadingToast, dismissToast } from '../../utils/toast.js';
import { authService } from '../../services/index.js';

const EmailVerificationModal = ({ user, onVerified, onCancel, onResend }) => {
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState('pending'); // pending, verified, error

  useEffect(() => {
    // Start cooldown timer for resend button
    const timer = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;

    setResendLoading(true);
    const loadingToast = showLoadingToast('Resending verification email...');

    try {
      await authService.resendVerificationEmail(user.id);
      dismissToast(loadingToast);
      showSuccessToast('Verification email sent! Please check your inbox.');
      
      // Set cooldown for 60 seconds
      setResendCooldown(60);
      
      if (onResend) {
        onResend();
      }
    } catch (error) {
      console.error('Error resending verification email:', error);
      dismissToast(loadingToast);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to resend verification email';
      showErrorToast(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setLoading(true);
    const loadingToast = showLoadingToast('Checking verification status...');

    try {
      // Check if user's email is verified by making a request to get user info
      const response = await authService.getCurrentUserFromAPI();
      const userData = response.data;
      
      if (userData.emailVerified) {
        dismissToast(loadingToast);
        showSuccessToast('Email verified successfully!');
        setVerificationStatus('verified');
        
        // Call onVerified with the updated user data
        if (onVerified) {
          onVerified(userData);
        }
      } else {
        dismissToast(loadingToast);
        showErrorToast('Email not yet verified. Please check your email and click the verification link.');
        setVerificationStatus('pending');
      }
    } catch (error) {
      console.error('Error checking verification:', error);
      dismissToast(loadingToast);
      
      if (error.response?.status === 403 && error.response?.data?.message?.includes('Email verification required')) {
        showErrorToast('Email verification is still required. Please check your email and click the verification link.');
      } else {
        showErrorToast('Failed to check verification status');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{margin: '0px'}}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mr-4">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Verify Your Email</h2>
                <p className="text-sm text-gray-600">Complete your registration</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800 mb-2">
                    Check Your Email
                  </h3>
                  <p className="text-sm text-blue-700 mb-3">
                    We've sent a verification link to <strong>{user?.email}</strong>. 
                    Please check your inbox and click the link to verify your email address.
                  </p>
                  <div className="text-xs text-blue-600">
                    <p>• Check your spam/junk folder if you don't see the email</p>
                    <p>• The verification link expires in 24 hours</p>
                    <p>• You can resend the email if needed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">              
              <button
                onClick={handleResendEmail}
                disabled={resendLoading || resendCooldown > 0}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {resendLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Sending...
                  </>
                ) : resendCooldown > 0 ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resend in {formatTime(resendCooldown)}
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </button>
            </div>

            {/* Help Text */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                After clicking the verification link in your email, click "I've Verified My Email" above.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationModal;
