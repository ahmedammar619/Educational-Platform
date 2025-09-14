import React from 'react';
import { showSuccessToast, showErrorToast, showWarningToast, showInfoToast, showLoadingToast, dismissAllToasts } from '../utils/toast.jsx';

const ToastDemo = () => {
  const handleSimpleSuccess = () => {
    showSuccessToast('Success!', '', { showLeftBar: false, showDescription: false });
  };

  const handleSimpleSuccessWithBar = () => {
    showSuccessToast('Success!', '', { showLeftBar: true, showDescription: false });
  };

  const handleDetailedSuccess = () => {
    showSuccessToast('Success!', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', { showLeftBar: false, showDescription: true });
  };

  const handleDetailedSuccessWithBar = () => {
    showSuccessToast('Success!', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', { showLeftBar: true, showDescription: true });
  };

  const handleSimpleError = () => {
    showErrorToast('Error!', '', { showLeftBar: false, showDescription: false });
  };

  const handleSimpleErrorWithBar = () => {
    showErrorToast('Error!', '', { showLeftBar: true, showDescription: false });
  };

  const handleDetailedError = () => {
    showErrorToast('Error!', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', { showLeftBar: false, showDescription: true });
  };

  const handleDetailedErrorWithBar = () => {
    showErrorToast('Error!', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', { showLeftBar: true, showDescription: true });
  };

  const handleSimpleWarning = () => {
    showWarningToast('Warning!', '', { showLeftBar: false, showDescription: false });
  };

  const handleSimpleWarningWithBar = () => {
    showWarningToast('Warning!', '', { showLeftBar: true, showDescription: false });
  };

  const handleDetailedWarning = () => {
    showWarningToast('Warning!', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', { showLeftBar: false, showDescription: true });
  };

  const handleDetailedWarningWithBar = () => {
    showWarningToast('Warning!', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', { showLeftBar: true, showDescription: true });
  };

  const handleSimpleInfo = () => {
    showInfoToast('Info!', '', { showLeftBar: false, showDescription: false });
  };

  const handleSimpleInfoWithBar = () => {
    showInfoToast('Info!', '', { showLeftBar: true, showDescription: false });
  };

  const handleDetailedInfo = () => {
    showInfoToast('Info!', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', { showLeftBar: false, showDescription: true });
  };

  const handleDetailedInfoWithBar = () => {
    showInfoToast('Info!', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', { showLeftBar: true, showDescription: true });
  };

  const handleLoading = () => {
    const loadingToast = showLoadingToast('Loading...', 'Please wait while we process your request.');
    setTimeout(() => {
      dismissAllToasts();
      showSuccessToast('Loading Complete!', 'Your request has been processed successfully.');
    }, 3000);
  };

  const handleClearAll = () => {
    dismissAllToasts();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Toast Notification Demo</h1>
          <p className="text-gray-600">Click the buttons below to see different toast notification variants</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Success Toasts */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-green-700 mb-4">Success Toasts</h3>
            <div className="space-y-3">
              <button
                onClick={handleSimpleSuccess}
                className="w-full bg-green-100 text-green-800 px-4 py-2 rounded hover:bg-green-200 transition-colors"
              >
                Simple
              </button>
              <button
                onClick={handleSimpleSuccessWithBar}
                className="w-full bg-green-100 text-green-800 px-4 py-2 rounded hover:bg-green-200 transition-colors"
              >
                Simple + Bar
              </button>
              <button
                onClick={handleDetailedSuccess}
                className="w-full bg-green-100 text-green-800 px-4 py-2 rounded hover:bg-green-200 transition-colors"
              >
                Detailed
              </button>
              <button
                onClick={handleDetailedSuccessWithBar}
                className="w-full bg-green-100 text-green-800 px-4 py-2 rounded hover:bg-green-200 transition-colors"
              >
                Detailed + Bar
              </button>
            </div>
          </div>

          {/* Error Toasts */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-red-700 mb-4">Error Toasts</h3>
            <div className="space-y-3">
              <button
                onClick={handleSimpleError}
                className="w-full bg-red-100 text-red-800 px-4 py-2 rounded hover:bg-red-200 transition-colors"
              >
                Simple
              </button>
              <button
                onClick={handleSimpleErrorWithBar}
                className="w-full bg-red-100 text-red-800 px-4 py-2 rounded hover:bg-red-200 transition-colors"
              >
                Simple + Bar
              </button>
              <button
                onClick={handleDetailedError}
                className="w-full bg-red-100 text-red-800 px-4 py-2 rounded hover:bg-red-200 transition-colors"
              >
                Detailed
              </button>
              <button
                onClick={handleDetailedErrorWithBar}
                className="w-full bg-red-100 text-red-800 px-4 py-2 rounded hover:bg-red-200 transition-colors"
              >
                Detailed + Bar
              </button>
            </div>
          </div>

          {/* Warning Toasts */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-orange-700 mb-4">Warning Toasts</h3>
            <div className="space-y-3">
              <button
                onClick={handleSimpleWarning}
                className="w-full bg-orange-100 text-orange-800 px-4 py-2 rounded hover:bg-orange-200 transition-colors"
              >
                Simple
              </button>
              <button
                onClick={handleSimpleWarningWithBar}
                className="w-full bg-orange-100 text-orange-800 px-4 py-2 rounded hover:bg-orange-200 transition-colors"
              >
                Simple + Bar
              </button>
              <button
                onClick={handleDetailedWarning}
                className="w-full bg-orange-100 text-orange-800 px-4 py-2 rounded hover:bg-orange-200 transition-colors"
              >
                Detailed
              </button>
              <button
                onClick={handleDetailedWarningWithBar}
                className="w-full bg-orange-100 text-orange-800 px-4 py-2 rounded hover:bg-orange-200 transition-colors"
              >
                Detailed + Bar
              </button>
            </div>
          </div>

          {/* Info Toasts */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Info Toasts</h3>
            <div className="space-y-3">
              <button
                onClick={handleSimpleInfo}
                className="w-full bg-gray-100 text-gray-800 px-4 py-2 rounded hover:bg-gray-200 transition-colors"
              >
                Simple
              </button>
              <button
                onClick={handleSimpleInfoWithBar}
                className="w-full bg-gray-100 text-gray-800 px-4 py-2 rounded hover:bg-gray-200 transition-colors"
              >
                Simple + Bar
              </button>
              <button
                onClick={handleDetailedInfo}
                className="w-full bg-gray-100 text-gray-800 px-4 py-2 rounded hover:bg-gray-200 transition-colors"
              >
                Detailed
              </button>
              <button
                onClick={handleDetailedInfoWithBar}
                className="w-full bg-gray-100 text-gray-800 px-4 py-2 rounded hover:bg-gray-200 transition-colors"
              >
                Detailed + Bar
              </button>
            </div>
          </div>
        </div>

        {/* Special Actions */}
        <div className="mt-8 text-center">
          <div className="bg-white rounded-lg shadow-md p-6 inline-block">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Special Actions</h3>
            <div className="space-x-4">
              <button
                onClick={handleLoading}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Show Loading Toast
              </button>
              <button
                onClick={handleClearAll}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                Clear All Toasts
              </button>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Usage Instructions</h3>
          <div className="text-blue-800 space-y-2">
            <p>• <strong>Simple:</strong> Shows only the title with no description or left bar</p>
            <p>• <strong>Simple + Bar:</strong> Shows title with a colored left border</p>
            <p>• <strong>Detailed:</strong> Shows title and description text</p>
            <p>• <strong>Detailed + Bar:</strong> Shows title, description, and colored left border</p>
            <p>• <strong>X Button:</strong> All toasts can be dismissed by clicking the X button</p>
            <p>• <strong>Auto-dismiss:</strong> Toasts automatically disappear after 4-5 seconds (except loading toasts)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToastDemo;
