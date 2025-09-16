import React, { useState, useEffect } from 'react';
import { Newspaper, Save, ExternalLink, AlertCircle, CheckCircle, Users, Calendar, Mail, Phone, X, RefreshCw, Clock } from 'lucide-react';
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler';
import { API_CONFIG } from '../../config/api';
import studentsService from '../../services/studentsService';

const AdminForm = ({ user }) => {
  const [googleFormUrl, setGoogleFormUrl] = useState('');
  const [originalUrl, setOriginalUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formCompletions, setFormCompletions] = useState([]);
  const [loadingCompletions, setLoadingCompletions] = useState(false);
  const [resetting, setResetting] = useState(null);

  useEffect(() => {
    loadFormSettings();
    loadFormCompletions();
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
        const url = data.googleFormUrl || '';
        setGoogleFormUrl(url);
        setOriginalUrl(url);
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
        setOriginalUrl(googleFormUrl); // Update original URL after successful save
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

  const loadFormCompletions = async () => {
    setLoadingCompletions(true);
    try {
      const response = await studentsService.getFormCompletions();
      setFormCompletions(response || []);
    } catch (error) {
      console.error('Error loading form completions:', error);
      showErrorToast('Failed to load form completions');
    } finally {
      setLoadingCompletions(false);
    }
  };

  const handleResetFormCompletion = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to reset the form completion for ${studentName}? This will allow them to access the form again.`)) {
      return;
    }

    setResetting(studentId);
    try {
      const response = await studentsService.resetFormCompletion(studentId);
      showSuccessToast(`Form completion reset for ${response.studentName}. They can now access the form again.`);
      loadFormCompletions(); // Reload the list
    } catch (error) {
      console.error('Error resetting form completion:', error);
      showErrorToast('Failed to reset form completion');
    } finally {
      setResetting(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      {/* Google Form URL Configuration */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Newspaper className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Student Registration Form</h2>
          </div>
          
          <div className="space-y-4">
            <div>
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
                <button
                  onClick={saveGoogleFormUrl}
                  disabled={saving || !googleFormUrl.trim() || googleFormUrl === originalUrl}
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
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Completions */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Form Completions</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                {formCompletions.length} completion{formCompletions.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {loadingCompletions ? (
            <div className="text-center py-8">
              <Users className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm sm:text-base text-gray-600">Loading form completions...</p>
            </div>
          ) : formCompletions.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm sm:text-base text-gray-600 mb-2">No form completions yet</p>
              <p className="text-xs sm:text-sm text-gray-500">
                Students who complete the registration form will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {formCompletions.map((completion) => (
                <div key={completion.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Student Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <h4 className="text-lg font-semibold text-gray-900">
                            {completion.firstName} {completion.lastName}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1">
                          {completion.hasClasses ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              <CheckCircle className="h-3 w-3" />
                              Enrolled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                              <Clock className="h-3 w-3" />
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{completion.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">
                            Completed: {formatDate(completion.formCompletionDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">
                            Joined: {formatDate(completion.createdAt)}
                          </span>
                        </div>
                        {completion.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">{completion.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResetFormCompletion(completion.id, `${completion.firstName} ${completion.lastName}`)}
                        disabled={resetting === completion.id}
                        className="flex items-center gap-2 px-3 py-2 text-red-600 border-2 border-red-300 rounded-lg hover:border-red-400 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 bg-transparent font-medium text-sm"
                        title="Reset form completion (allows student to access form again)"
                      >
                        {resetting === completion.id ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Resetting...
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4" />
                            Reset
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminForm;
