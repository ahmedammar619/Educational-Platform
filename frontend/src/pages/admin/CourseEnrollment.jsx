import React, { useState, useEffect, useRef } from 'react';
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
  Calendar,
  ChevronDown,
  X,
  BookOpen,
  CreditCard,
  Mail,
  User,
  CheckCheck
} from 'lucide-react';
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler';
import { API_CONFIG } from '../../config/api';

const CourseEnrollment = ({ user }) => {
  const [activeTab, setActiveTab] = useState('pending'); // pending, enrolled, summary
  const [allSubscriptions, setAllSubscriptions] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [courses, setCourses] = useState([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState(''); // recurring, one_time, all

  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState(null);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [selectedCourses, setSelectedCourses] = useState({});
  const [changingCourse, setChangingCourse] = useState(null);

  const dropdownRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
        setCourseSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadAllSubscriptions(),
        loadEnrolledStudents(),
        loadFinancialSummary(),
        loadCourses(),
        loadSubscriptionPlans()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      showErrorToast('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadAllSubscriptions = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/course-enrollment/pending`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAllSubscriptions(data.pendingEnrollments || []);
      }
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    }
  };

  const loadEnrolledStudents = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/course-enrollment/enrolled`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEnrolledStudents(data.enrolledStudents || []);
      }
    } catch (error) {
      console.error('Error loading enrolled students:', error);
    }
  };

  const loadFinancialSummary = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/course-enrollment/summary`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFinancialSummary(data);
      }
    } catch (error) {
      console.error('Error loading financial summary:', error);
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
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/subscription-plans/admin/plans`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Loaded subscription plans:', data);
        setSubscriptionPlans(data || []);
      } else {
        console.error('Failed to load subscription plans:', response.status);
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
        await loadAllSubscriptions();
        setSelectedCourses(prev => {
          const updated = { ...prev };
          delete updated[subscriptionId];
          return updated;
        });
        setOpenDropdown(null);
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

  const handleChangeCourse = async (subscriptionId, newCourseId) => {
    if (!newCourseId) {
      showErrorToast('Please select a course');
      return;
    }

    setChangingCourse(subscriptionId);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/course-enrollment/change-course`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId, courseId: newCourseId }),
      });

      if (response.ok) {
        const data = await response.json();
        showSuccessToast(`Course changed successfully from ${data.subscription.oldCourse} to ${data.subscription.newCourse}`);
        await loadEnrolledStudents();
        setSelectedCourses(prev => {
          const updated = { ...prev };
          delete updated[subscriptionId];
          return updated;
        });
        setOpenDropdown(null);
      } else {
        const error = await response.json();
        showErrorToast(error.message || 'Failed to change course');
      }
    } catch (error) {
      console.error('Error changing course:', error);
      showErrorToast('Failed to change course');
    } finally {
      setChangingCourse(null);
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  // Filter subscriptions
  const filteredSubscriptions = allSubscriptions.filter(sub => {
    const matchesSearch =
      sub.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.parentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.planName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPlan = !selectedPlanFilter || sub.planId === selectedPlanFilter;

    const matchesType = !selectedTypeFilter ||
      (selectedTypeFilter === 'recurring' && sub.planType === 'recurring') ||
      (selectedTypeFilter === 'one_time' && sub.planType === 'one_time');

    return matchesSearch && matchesPlan && matchesType;
  });

  // Filter enrolled students
  const filteredEnrolledStudents = enrolledStudents.filter(student => {
    const matchesSearch =
      student.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.parentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.planName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.courseName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPlan = !selectedPlanFilter || student.planId === selectedPlanFilter;

    const matchesType = !selectedTypeFilter ||
      (selectedTypeFilter === 'recurring' && student.planType === 'recurring') ||
      (selectedTypeFilter === 'one_time' && student.planType === 'one_time');

    return matchesSearch && matchesPlan && matchesType;
  });

  // Filter courses for dropdown
  const getFilteredCourses = () => {
    if (!courseSearchQuery) return courses;
    return courses.filter(course =>
      course.name.toLowerCase().includes(courseSearchQuery.toLowerCase())
    );
  };

  const handleCourseSelect = (subscriptionId, courseId) => {
    setSelectedCourses(prev => ({
      ...prev,
      [subscriptionId]: courseId
    }));
    setCourseSearchQuery('');
  };

  const getSelectedCourseName = (subscriptionId) => {
    const courseId = selectedCourses[subscriptionId];
    if (!courseId) return '';
    const course = courses.find(c => c.id === courseId);
    return course ? course.name : '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
                  <UserPlus className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Course Enrollment Management
                </h1>
              </div>
              <p className="text-gray-600 ml-16">
                Enroll students into courses based on their subscription purchases
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Pending</p>
                <p className="text-2xl font-bold text-purple-600">{filteredSubscriptions.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden">
          <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
            <nav className="flex px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('pending')}
                className={`relative py-5 px-6 font-semibold text-sm transition-all ${
                  activeTab === 'pending'
                    ? 'text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>Pending Enrollments</span>
                  {filteredSubscriptions.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                      {filteredSubscriptions.length}
                    </span>
                  )}
                </div>
                {activeTab === 'pending' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-t-full"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('enrolled')}
                className={`relative py-5 px-6 font-semibold text-sm transition-all ${
                  activeTab === 'enrolled'
                    ? 'text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Enrolled Students</span>
                </div>
                {activeTab === 'enrolled' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-t-full"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                className={`relative py-5 px-6 font-semibold text-sm transition-all ${
                  activeTab === 'summary'
                    ? 'text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Financial Summary</span>
                </div>
                {activeTab === 'summary' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-t-full"></div>
                )}
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Filters - Only show on pending and enrolled tabs */}
            {(activeTab === 'pending' || activeTab === 'enrolled') && (
              <div className="mb-6 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <Filter className="h-4 w-4" />
                  Filters
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Search */}
                  <div className="md:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by student, parent, or plan name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Plan Filter */}
                  <div>
                    <select
                      value={selectedPlanFilter}
                      onChange={(e) => setSelectedPlanFilter(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none bg-white"
                    >
                      <option value="">All Plans</option>
                      {subscriptionPlans.map(plan => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Type Filter */}
                  <div>
                    <select
                      value={selectedTypeFilter}
                      onChange={(e) => setSelectedTypeFilter(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none bg-white"
                    >
                      <option value="">All Types</option>
                      <option value="recurring">Recurring Only</option>
                      <option value="one_time">One-time Only</option>
                    </select>
                  </div>
                </div>

                {/* Active filters display */}
                {(searchQuery || selectedPlanFilter || selectedTypeFilter) && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500">Active filters:</span>
                    {searchQuery && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        Search: {searchQuery}
                        <button onClick={() => setSearchQuery('')} className="hover:bg-purple-200 rounded-full p-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {selectedPlanFilter && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        Plan: {subscriptionPlans.find(p => p.id === selectedPlanFilter)?.name}
                        <button onClick={() => setSelectedPlanFilter('')} className="hover:bg-blue-200 rounded-full p-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {selectedTypeFilter && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        Type: {selectedTypeFilter === 'recurring' ? 'Recurring' : 'One-time'}
                        <button onClick={() => setSelectedTypeFilter('')} className="hover:bg-green-200 rounded-full p-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedPlanFilter('');
                        setSelectedTypeFilter('');
                      }}
                      className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            )}

            {loading ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
                  <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-600 font-medium">Loading enrollment data...</p>
              </div>
            ) : (
              <>
                {/* Pending Enrollments Tab */}
                {activeTab === 'pending' && (
                  <div className="space-y-4">
                    {filteredSubscriptions.length === 0 ? (
                      <div className="text-center py-20 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl border-2 border-dashed border-green-300">
                        <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                        <p className="text-gray-700 font-semibold text-lg mb-2">
                          {searchQuery || selectedPlanFilter || selectedTypeFilter
                            ? 'No subscriptions match your filters'
                            : 'All students are enrolled!'
                          }
                        </p>
                        <p className="text-sm text-gray-500">
                          {searchQuery || selectedPlanFilter || selectedTypeFilter
                            ? 'Try adjusting your filters to see more results'
                            : 'Every paid student has been enrolled in a course'
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {filteredSubscriptions.map((subscription) => (
                          <div
                            key={subscription.subscriptionId}
                            className="group bg-white border-2 border-gray-200 hover:border-purple-300 rounded-xl p-6 transition-all hover:shadow-lg"
                          >
                            <div className="flex items-start justify-between gap-6">
                              {/* Student Info */}
                              <div className="flex-1 space-y-4">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-3 mb-2">
                                      <div className="p-2 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg">
                                        <User className="h-5 w-5 text-purple-600" />
                                      </div>
                                      <div>
                                        <h3 className="text-xl font-bold text-gray-900">
                                          {subscription.studentName}
                                        </h3>
                                        <p className="text-sm text-gray-500">Student</p>
                                      </div>
                                    </div>
                                  </div>
                                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
                                    <Clock className="h-3 w-3" />
                                    Pending Enrollment
                                  </span>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                                      <Mail className="h-3 w-3" />
                                      Parent
                                    </div>
                                    <p className="font-semibold text-gray-900 text-sm">
                                      {subscription.parentName}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                                      <CreditCard className="h-3 w-3" />
                                      Subscription Plan
                                    </div>
                                    <p className="font-semibold text-gray-900 text-sm">
                                      {subscription.planName}
                                    </p>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      subscription.planType === 'recurring'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-green-100 text-green-700'
                                    }`}>
                                      {subscription.planType === 'recurring' ? 'Recurring' : 'One-time'}
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                                      <DollarSign className="h-3 w-3" />
                                      Amount Paid
                                    </div>
                                    <p className="font-bold text-green-600 text-sm">
                                      {formatCurrency(subscription.amount)}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                                      <Calendar className="h-3 w-3" />
                                      Payment Date
                                    </div>
                                    <p className="font-semibold text-gray-900 text-sm">
                                      {formatDate(subscription.paidAt)}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Enrollment Action */}
                              <div className="flex flex-col gap-3 min-w-[280px]">
                                {/* Course Dropdown */}
                                <div className="relative" ref={openDropdown === subscription.subscriptionId ? dropdownRef : null}>
                                  <label className="block text-xs font-medium text-gray-700 mb-2">
                                    Select Course to Enroll
                                  </label>
                                  <button
                                    onClick={() => {
                                      setOpenDropdown(openDropdown === subscription.subscriptionId ? null : subscription.subscriptionId);
                                      setCourseSearchQuery('');
                                    }}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-gray-300 hover:border-purple-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                  >
                                    <span className={`flex items-center gap-2 ${!selectedCourses[subscription.subscriptionId] ? 'text-gray-500' : 'text-gray-900 font-medium'}`}>
                                      <BookOpen className="h-4 w-4" />
                                      {getSelectedCourseName(subscription.subscriptionId) || 'Choose a course...'}
                                    </span>
                                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${openDropdown === subscription.subscriptionId ? 'rotate-180' : ''}`} />
                                  </button>

                                  {/* Dropdown Menu */}
                                  {openDropdown === subscription.subscriptionId && (
                                    <div className="absolute z-50 mt-2 w-full bg-white border-2 border-purple-200 rounded-xl shadow-2xl overflow-hidden">
                                      {/* Search within dropdown */}
                                      <div className="p-3 border-b border-gray-200 bg-gray-50">
                                        <div className="relative">
                                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                          <input
                                            type="text"
                                            placeholder="Search courses..."
                                            value={courseSearchQuery}
                                            onChange={(e) => setCourseSearchQuery(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            autoFocus
                                          />
                                        </div>
                                      </div>
                                      <div className="max-h-64 overflow-y-auto">
                                        {getFilteredCourses().length === 0 ? (
                                          <div className="p-4 text-center text-sm text-gray-500">
                                            No courses found
                                          </div>
                                        ) : (
                                          getFilteredCourses().map((course) => (
                                            <button
                                              key={course.id}
                                              onClick={() => {
                                                handleCourseSelect(subscription.subscriptionId, course.id);
                                                setOpenDropdown(null);
                                              }}
                                              className={`w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors flex items-center justify-between group ${
                                                selectedCourses[subscription.subscriptionId] === course.id ? 'bg-purple-100' : ''
                                              }`}
                                            >
                                              <span className="font-medium text-gray-900 text-sm">{course.name}</span>
                                              {selectedCourses[subscription.subscriptionId] === course.id && (
                                                <CheckCheck className="h-4 w-4 text-purple-600" />
                                              )}
                                            </button>
                                          ))
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Enroll Button */}
                                <button
                                  onClick={() => handleEnrollStudent(subscription.subscriptionId, selectedCourses[subscription.subscriptionId])}
                                  disabled={enrolling || !selectedCourses[subscription.subscriptionId]}
                                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all"
                                >
                                  {enrolling ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                      Enrolling...
                                    </>
                                  ) : (
                                    <>
                                      <UserPlus className="h-4 w-4" />
                                      Enroll Student
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
                )}

                {/* Enrolled Students Tab */}
                {activeTab === 'enrolled' && (
                  <div className="space-y-4">
                    {filteredEnrolledStudents.length === 0 ? (
                      <div className="text-center py-20 bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border-2 border-dashed border-purple-300">
                        <CheckCircle className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                        <p className="text-gray-700 font-semibold text-lg mb-2">
                          No enrolled students yet
                        </p>
                        <p className="text-sm text-gray-500">
                          Students will appear here once you enroll them in courses
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {filteredEnrolledStudents.map((student) => (
                          <div
                            key={student.subscriptionId}
                            className="bg-white border-2 border-green-200 rounded-xl p-6 hover:shadow-lg transition-all"
                          >
                            <div className="flex items-start justify-between gap-6">
                              {/* Student Info */}
                              <div className="flex-1 space-y-4">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-3 mb-2">
                                      <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg">
                                        <User className="h-5 w-5 text-green-600" />
                                      </div>
                                      <div>
                                        <h3 className="text-xl font-bold text-gray-900">
                                          {student.studentName}
                                        </h3>
                                        <p className="text-sm text-gray-500">Student</p>
                                      </div>
                                    </div>
                                  </div>
                                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                                    <CheckCircle className="h-3 w-3" />
                                    Enrolled
                                  </span>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                                      <Mail className="h-3 w-3" />
                                      Parent
                                    </div>
                                    <p className="font-semibold text-gray-900 text-sm">
                                      {student.parentName}
                                    </p>
                                    <p className="text-xs text-gray-500">{student.parentEmail}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                                      <BookOpen className="h-3 w-3" />
                                      Enrolled Course
                                    </div>
                                    <p className="font-semibold text-gray-900 text-sm">
                                      {student.courseName}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                                      <CreditCard className="h-3 w-3" />
                                      Subscription Plan
                                    </div>
                                    <p className="font-semibold text-gray-900 text-sm">
                                      {student.planName}
                                    </p>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      student.planType === 'recurring'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-green-100 text-green-700'
                                    }`}>
                                      {student.planType === 'recurring' ? 'Recurring' : 'One-time'}
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                                      <Calendar className="h-3 w-3" />
                                      Enrolled Date
                                    </div>
                                    <p className="font-semibold text-gray-900 text-sm">
                                      {formatDate(student.enrolledAt)}
                                    </p>
                                  </div>
                                </div>

                                {/* Payment Status */}
                                <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Payment Status:</span>
                                    {student.isPaid ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                                        <CheckCircle className="h-3 w-3" />
                                        Fully Paid
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
                                        <Clock className="h-3 w-3" />
                                        Pending Payment
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Amount:</span>
                                    <span className="font-bold text-green-600 text-sm">
                                      {formatCurrency(student.amount)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Status:</span>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                      student.status === 'active' ? 'bg-green-100 text-green-800' :
                                      student.status === 'canceled' ? 'bg-gray-100 text-gray-800' :
                                      'bg-blue-100 text-blue-800'
                                    }`}>
                                      {student.status}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Change Course Section */}
                              <div className="flex flex-col gap-3 min-w-[280px]">
                                <div className="relative" ref={openDropdown === `enrolled-${student.subscriptionId}` ? dropdownRef : null}>
                                  <label className="block text-xs font-medium text-gray-700 mb-2">
                                    Change Course
                                  </label>
                                  <button
                                    onClick={() => {
                                      setOpenDropdown(openDropdown === `enrolled-${student.subscriptionId}` ? null : `enrolled-${student.subscriptionId}`);
                                      setCourseSearchQuery('');
                                    }}
                                    disabled={changingCourse === student.subscriptionId}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-gray-300 hover:border-blue-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                                  >
                                    <span className={`flex items-center gap-2 ${!selectedCourses[student.subscriptionId] ? 'text-gray-500' : 'text-gray-900 font-medium'}`}>
                                      <BookOpen className="h-4 w-4" />
                                      {getSelectedCourseName(student.subscriptionId) || 'Select new course...'}
                                    </span>
                                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${openDropdown === `enrolled-${student.subscriptionId}` ? 'rotate-180' : ''}`} />
                                  </button>

                                  {/* Dropdown Menu */}
                                  {openDropdown === `enrolled-${student.subscriptionId}` && (
                                    <div className="absolute z-50 mt-2 w-full bg-white border-2 border-blue-200 rounded-xl shadow-2xl overflow-hidden">
                                      <div className="p-3 border-b border-gray-200 bg-gray-50">
                                        <div className="relative">
                                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                          <input
                                            type="text"
                                            placeholder="Search courses..."
                                            value={courseSearchQuery}
                                            onChange={(e) => setCourseSearchQuery(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            autoFocus
                                          />
                                        </div>
                                      </div>
                                      <div className="max-h-64 overflow-y-auto">
                                        {getFilteredCourses().length === 0 ? (
                                          <div className="p-4 text-center text-sm text-gray-500">
                                            No courses found
                                          </div>
                                        ) : (
                                          getFilteredCourses()
                                            .filter(course => course.id !== student.courseId) // Don't show current course
                                            .map((course) => (
                                            <button
                                              key={course.id}
                                              onClick={() => {
                                                handleCourseSelect(student.subscriptionId, course.id);
                                                setOpenDropdown(null);
                                              }}
                                              className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center justify-between group ${
                                                selectedCourses[student.subscriptionId] === course.id ? 'bg-blue-100' : ''
                                              }`}
                                            >
                                              <span className="font-medium text-gray-900 text-sm">{course.name}</span>
                                              {selectedCourses[student.subscriptionId] === course.id && (
                                                <CheckCheck className="h-4 w-4 text-blue-600" />
                                              )}
                                            </button>
                                          ))
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Change Course Button */}
                                <button
                                  onClick={() => handleChangeCourse(student.subscriptionId, selectedCourses[student.subscriptionId])}
                                  disabled={changingCourse === student.subscriptionId || !selectedCourses[student.subscriptionId]}
                                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all"
                                >
                                  {changingCourse === student.subscriptionId ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                      Changing...
                                    </>
                                  ) : (
                                    <>
                                      <BookOpen className="h-4 w-4" />
                                      Change Course
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
                )}

                {/* Financial Summary Tab */}
                {activeTab === 'summary' && financialSummary && (
                  <div className="space-y-6">
                    {/* Overall Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <DollarSign className="h-6 w-6" />
                          </div>
                          <span className="text-lg font-medium opacity-90">Total Revenue</span>
                        </div>
                        <p className="text-4xl font-bold mb-1">
                          {formatCurrency(financialSummary.totalRevenue)}
                        </p>
                        <p className="text-sm opacity-75">From all enrolled students</p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Users className="h-6 w-6" />
                          </div>
                          <span className="text-lg font-medium opacity-90">Total Students</span>
                        </div>
                        <p className="text-4xl font-bold mb-1">{financialSummary.totalStudents}</p>
                        <p className="text-sm opacity-75">Across all subscription plans</p>
                      </div>
                    </div>

                    {/* Per-Plan Summary */}
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                        Revenue Breakdown by Plan
                      </h3>
                      {financialSummary.summary && financialSummary.summary.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                          {financialSummary.summary.map((plan) => (
                            <div key={plan.planId} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-purple-300 transition-all">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-bold text-gray-900">{plan.planName}</h4>
                                <span className="text-2xl font-bold text-green-600">
                                  {formatCurrency(plan.totalRevenue)}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div className="bg-blue-50 rounded-lg p-3">
                                  <p className="text-xs text-blue-600 font-medium mb-1">Total Students</p>
                                  <p className="text-2xl font-bold text-blue-900">{plan.totalStudents}</p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-3">
                                  <p className="text-xs text-green-600 font-medium mb-1">Enrolled</p>
                                  <p className="text-2xl font-bold text-green-900">{plan.enrolledStudents}</p>
                                </div>
                                <div className="bg-yellow-50 rounded-lg p-3">
                                  <p className="text-xs text-yellow-600 font-medium mb-1">Pending</p>
                                  <p className="text-2xl font-bold text-yellow-900">{plan.pendingEnrollments}</p>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-3">
                                  <p className="text-xs text-purple-600 font-medium mb-1">Fully Paid</p>
                                  <p className="text-2xl font-bold text-purple-900">{plan.fullyPaidStudents}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <p className="text-xs text-gray-600 font-medium mb-1">Avg/Student</p>
                                  <p className="text-2xl font-bold text-gray-900">
                                    {formatCurrency(plan.totalRevenue / plan.totalStudents)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                          <p className="text-gray-500">No financial data available</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseEnrollment;
