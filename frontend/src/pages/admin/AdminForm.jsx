import React, { useState, useEffect } from 'react';
import { Newspaper, Save, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler';
import { API_CONFIG } from '../../config/api';

const AdminForm = ({ user }) => {
  const [googleFormUrl, setGoogleFormUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFormSettings();
  }, []);

  const loadFormSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/config/google-form-url`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setGoogleFormUrl(data.googleFormUrl || '');
      } else {
        console.error('Failed to load form settings:', response.status, response.statusText);
        showErrorToast('Failed to load form settings');
      }
    } catch (error) {
      console.error('Error loading form settings:', error);
      showErrorToast('Failed to load form settings');
    } finally {
      setLoading(false);
    }
  };

  const saveGoogleFormUrl = async () => {
    if (!googleFormUrl.trim()) {
      showErrorToast('Please enter a valid Google Form URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(googleFormUrl);
    } catch {
      showErrorToast('Please enter a valid URL');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/config/google-form-url`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: googleFormUrl }),
      });

      if (response.ok) {
        showSuccessToast('Registration form URL updated successfully');
      } else {
        const errorData = await response.json();
        showErrorToast(errorData.message || 'Failed to update registration form URL');
      }
    } catch (error) {
      console.error('Error saving form settings:', error);
      showErrorToast('Failed to save form settings');
    } finally {
      setSaving(false);
    }
  };

  const testGoogleFormUrl = () => {
    if (googleFormUrl) {
      window.open(googleFormUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 sm:p-6">
          <div className="text-center py-8">
            <Newspaper className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm sm:text-base text-gray-600">Loading form settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Registration Form</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage student registration form configuration</p>
        </div>
      </div>

      {/* Google Form URL Configuration */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Newspaper className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Student Registration Form</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Form URL
              </label>
              <p className="text-xs text-gray-500 mb-3">
                This URL will be shown to students who haven't been assigned to any classes yet. 
                They can use this form to complete their registration.
              </p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={googleFormUrl}
                  onChange={(e) => setGoogleFormUrl(e.target.value)}
                  placeholder="https://docs.google.com/forms/d/..."
                  className="flex-1 px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                {googleFormUrl && (
                  <button
                    onClick={testGoogleFormUrl}
                    className="px-3 py-2 text-green-600 border-2 border-green-300 rounded-md hover:border-green-400 hover:bg-green-50 transition-colors duration-200 flex items-center gap-1 text-sm bg-transparent"
                    title="Test the form URL"
                  >
                    <ExternalLink className="h-4 w-4 text-green-600" />
                    Test
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">How it works:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Students who are not enrolled in any class will see a button to complete this form</li>
                  <li>After admin reviews the form submissions, they can manually enroll students in classes</li>
                  <li>Once enrolled, students will no longer see the form button</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={saveGoogleFormUrl}
                disabled={saving || !googleFormUrl.trim()}
                className="flex items-center gap-2 px-4 py-2 text-green-600 border-2 border-green-300 rounded-lg hover:border-green-400 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 bg-transparent font-medium"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Form 
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Current Status */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Current Status</h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Registration Form URL:</span>
              <span className={`text-sm font-medium ${googleFormUrl ? 'text-green-600' : 'text-gray-400'}`}>
                {googleFormUrl ? 'Configured' : 'Not configured'}
              </span>
            </div>
            {googleFormUrl && (
              <div className="text-xs text-gray-500 break-all">
                {googleFormUrl}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminForm;
