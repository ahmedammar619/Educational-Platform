import React, { useState, useEffect } from 'react';
import {
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  UserPlus,
  Search,
  Filter,
  Download,
  Calendar
} from 'lucide-react';
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler';
import { API_CONFIG } from '../../config/api';

const CourseEnrollment = ({ user }) => {
  const [activeTab, setActiveTab] = useState('pending'); // pending, missing, summary
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [missingPayments, setMissingPayments] = useState([]);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [courses, setCourses] = useState([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab, selectedPlan]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'pending') {
        await loadPendingEnrollments();
      } else if (activeTab === 'missing') {
        await loadMissingPayments();
      } else if (activeTab === 'summary') {
        await loadFinancialSummary();
      }
      await loadCourses();
      await loadSubscriptionPlans();
    } catch (error) {
      console.error('Error loading data:', error);
      showErrorToast('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingEnrollments = async () => {
    try {
      const url = selectedPlan
        ? `${API_CONFIG.BASE_URL}/api/admin/course-enrollment/pending?planId=${selectedPlan}`
        : `${API_CONFIG.BASE_URL}/api/admin/course-enrollment/pending`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingEnrollments(data.pendingEnrollments || []);
      } else {
        throw new Error('Failed to load pending enrollments');
      }
    } catch (error) {
      console.error('Error loading pending enrollments:', error);
      throw error;
    }
  };

  const loadMissingPayments = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/course-enrollment/missing-payments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMissingPayments(data.missingPayments || []);
      } else {
        throw new Error('Failed to load missing payments');
      }
    } catch (error) {
      console.error('Error loading missing payments:', error);
      throw error;
    }
  };

  const loadFinancialSummary = async () => {
    try {
      const url = selectedPlan
        ? `${API_CONFIG.BASE_URL}/api/admin/course-enrollment/summary?planId=${selectedPlan}`
        : `${API_CONFIG.BASE_URL}/api/admin/course-enrollment/summary`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFinancialSummary(data);
      } else {
        throw new Error('Failed to load financial summary');
      }
    } catch (error) {
      console.error('Error loading financial summary:', error);
      throw error;
    }
  };

  const loadCourses = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/courses`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(data || []);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const loadSubscriptionPlans = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/payments/subscription-plans`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptionPlans(data || []);
      }
    } catch (error) {
      console.error('Error loading subscription plans:', error);
    }
  };

  const handleEnrollStudent = async (subscriptionId, courseId) => {
    if (!courseId) {
      showErrorToast('Please select a course');
      return;
    }

    setEnrolling(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/course-enrollment/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId, courseId }),
      });

      if (response.ok) {
        const data = await response.json();
        showSuccessToast(`${data.subscription.studentName} enrolled successfully`);
        await loadPendingEnrollments();
        setSelectedStudents([]);
      } else {
        const error = await response.json();
        showErrorToast(error.message || 'Failed to enroll student');
      }
    } catch (error) {
      console.error('Error enrolling student:', error);
      showErrorToast('Failed to enroll student');
    } finally {
      setEnrolling(false);
    }
  };

  const handleBulkEnroll = async () => {
    if (selectedStudents.length === 0) {
      showErrorToast('Please select students to enroll');
      return;
    }

    if (!selectedCourse) {
      showErrorToast('Please select a course');
      return;
    }

    setEnrolling(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/course-enrollment/bulk-enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionIds: selectedStudents,
          courseId: selectedCourse,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        showSuccessToast(`${data.successCount} students enrolled successfully`);
        await loadPendingEnrollments();
        setSelectedStudents([]);
        setSelectedCourse('');
      } else {
        const error = await response.json();
        showErrorToast(error.message || 'Failed to enroll students');
      }
    } catch (error) {
      console.error('Error bulk enrolling:', error);
      showErrorToast('Failed to enroll students');
    } finally {
      setEnrolling(false);
    }
  };

  const toggleStudentSelection = (subscriptionId) => {
    setSelectedStudents(prev =>
      prev.includes(subscriptionId)
        ? prev.filter(id => id !== subscriptionId)
        : [...prev, subscriptionId]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Course Enrollment Management</h1>
            <p className="text-gray-600 mt-1">
              Manage student enrollments based on subscription payments
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Enrollments
              </div>
            </button>
            <button
              onClick={() => setActiveTab('missing')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'missing'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Missing Payments
              </div>
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'summary'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Financial Summary
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Filters */}
          <div className="mb-6 flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Subscription Plan
              </label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Plans</option>
                {subscriptionPlans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - {formatCurrency(plan.price)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : (
            <>
              {/* Pending Enrollments Tab */}
              {activeTab === 'pending' && (
                <div className="space-y-4">
                  {selectedStudents.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-green-600" />
                        <span className="text-green-900 font-medium">
                          {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedCourse}
                          onChange={(e) => setSelectedCourse(e.target.value)}
                          className="px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Select Course</option>
                          {courses.map(course => (
                            <option key={course.id} value={course.id}>
                              {course.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleBulkEnroll}
                          disabled={enrolling || !selectedCourse}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {enrolling ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Enrolling...
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4" />
                              Bulk Enroll
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {pendingEnrollments.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">No pending enrollments</p>
                      <p className="text-sm text-gray-500 mt-1">
                        All students who paid have been enrolled
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingEnrollments.map((enrollment) => (
                        <div
                          key={enrollment.subscriptionId}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <input
                                type="checkbox"
                                checked={selectedStudents.includes(enrollment.subscriptionId)}
                                onChange={() => toggleStudentSelection(enrollment.subscriptionId)}
                                className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="text-lg font-semibold text-gray-900">
                                    {enrollment.studentName}
                                  </h4>
                                  <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                    Not Enrolled
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-500">Plan:</span>
                                    <span className="ml-2 font-medium text-gray-900">{enrollment.planName}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Amount:</span>
                                    <span className="ml-2 font-medium text-gray-900">
                                      {formatCurrency(enrollment.amount)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Parent:</span>
                                    <span className="ml-2 font-medium text-gray-900">{enrollment.parentName}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Paid On:</span>
                                    <span className="ml-2 font-medium text-gray-900">
                                      {formatDate(enrollment.paidAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleEnrollStudent(enrollment.subscriptionId, e.target.value);
                                  }
                                }}
                                defaultValue=""
                                disabled={enrolling}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                              >
                                <option value="">Select Course to Enroll</option>
                                {courses.map(course => (
                                  <option key={course.id} value={course.id}>
                                    {course.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Missing Payments Tab */}
              {activeTab === 'missing' && (
                <div className="space-y-3">
                  {missingPayments.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">No missing payments</p>
                      <p className="text-sm text-gray-500 mt-1">All enrolled students have paid</p>
                    </div>
                  ) : (
                    missingPayments.map((payment) => (
                      <div
                        key={payment.subscriptionId}
                        className={`border rounded-lg p-4 ${
                          payment.severity === 'critical'
                            ? 'bg-red-50 border-red-200'
                            : payment.severity === 'warning'
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle
                                className={`h-5 w-5 ${
                                  payment.severity === 'critical'
                                    ? 'text-red-600'
                                    : payment.severity === 'warning'
                                    ? 'text-yellow-600'
                                    : 'text-blue-600'
                                }`}
                              />
                              <h4 className="text-lg font-semibold text-gray-900">
                                {payment.studentName}
                              </h4>
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  payment.severity === 'critical'
                                    ? 'bg-red-100 text-red-800'
                                    : payment.severity === 'warning'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {payment.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Plan:</span>
                                <span className="ml-2 font-medium text-gray-900">{payment.planName}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Amount:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                  {formatCurrency(payment.amount)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Parent:</span>
                                <span className="ml-2 font-medium text-gray-900">{payment.parentName}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Enrolled:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                  {formatDate(payment.enrolledAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Financial Summary Tab */}
              {activeTab === 'summary' && financialSummary && (
                <div className="space-y-6">
                  {/* Overall Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-green-900">Total Revenue</span>
                      </div>
                      <p className="text-2xl font-bold text-green-900">
                        {formatCurrency(financialSummary.totalRevenue)}
                      </p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Total Students</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">{financialSummary.totalStudents}</p>
                    </div>
                  </div>

                  {/* Per-Plan Summary */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">Revenue by Plan</h3>
                    {financialSummary.summary && financialSummary.summary.length > 0 ? (
                      financialSummary.summary.map((plan) => (
                        <div key={plan.planId} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <h4 className="text-lg font-semibold text-gray-900 mb-3">{plan.planName}</h4>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Revenue:</span>
                              <span className="ml-2 font-bold text-gray-900">
                                {formatCurrency(plan.totalRevenue)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Students:</span>
                              <span className="ml-2 font-bold text-gray-900">{plan.totalStudents}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Enrolled:</span>
                              <span className="ml-2 font-bold text-green-900">{plan.enrolledStudents}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Pending:</span>
                              <span className="ml-2 font-bold text-yellow-900">{plan.pendingEnrollments}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Fully Paid:</span>
                              <span className="ml-2 font-bold text-gray-900">{plan.fullyPaidStudents}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Avg/Student:</span>
                              <span className="ml-2 font-bold text-gray-900">
                                {formatCurrency(plan.totalRevenue / plan.totalStudents)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No financial data available</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseEnrollment;
