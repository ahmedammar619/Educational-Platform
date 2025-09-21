import { useState, useEffect } from 'react';
import { BookOpen, Clock, User, MapPin, Calendar, CheckCircle, Users, Search, Filter, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import studentsService from '../../services/studentsService';
import { showErrorToast, showSuccessToast } from '../../utils/toast.js';



const StudentClasses = ({ user, onOpenMaterials }) => {
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedClasses, setExpandedClasses] = useState(new Set());
  const [googleFormUrl, setGoogleFormUrl] = useState(null);
  const [formStatus, setFormStatus] = useState({ formCompleted: false, completionDate: null });
  const [filters, setFilters] = useState({
    search: '',
    teacher: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    loadStudentClasses();
    loadGoogleFormUrl();
    loadFormStatus();
  }, [user]);

  useEffect(() => {
    filterClasses();
  }, [filters, enrolledClasses]);

  const loadStudentClasses = async () => {
    setLoading(true);
    try {
      if (!user?.id) {
        console.error('No user ID available');
        setEnrolledClasses([]);
        return;
      }

      const response = await studentsService.getStudentClasses(user.id);
      console.log('Student classes response:', response);
      
      // The API returns an array of classes
      setEnrolledClasses(response || []);
    } catch (error) {
      console.error('Error loading student classes:', error);
      setEnrolledClasses([]);
      
      // Extract the actual error message from backend
      let errorMessage = 'Failed to load classes. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.message) {
        errorMessage = error.response.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showErrorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadGoogleFormUrl = async () => {
    try {
      const response = await studentsService.getGoogleFormUrl();
      setGoogleFormUrl(response.googleFormUrl);
    } catch (error) {
      console.error('Error loading Google form URL:', error);
      // Don't show error toast for this as it's not critical
    }
  };

  const loadFormStatus = async () => {
    try {
      const response = await studentsService.getFormStatus();
      setFormStatus(response);
    } catch (error) {
      console.error('Error loading form status:', error);
      // Don't show error toast for this as it's not critical
    }
  };

  const handleFormCompletion = async () => {
    try {
      await studentsService.markFormCompleted();
      setFormStatus({ formCompleted: true, completionDate: new Date() });
      showSuccessToast('Form completion recorded! Admin will review your submission.');
    } catch (error) {
      console.error('Error marking form as completed:', error);
      showErrorToast('Failed to record form completion. Please try again.');
    }
  };

  const filterClasses = () => {
    let filtered = [...enrolledClasses];

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(classItem => {
        return classItem.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          classItem.courses.some(course => 
            course.name.toLowerCase().includes(filters.search.toLowerCase()) ||
            course.teacherName.toLowerCase().includes(filters.search.toLowerCase())
          );
      });
    }

    // Apply teacher filter
    if (filters.teacher) {
      filtered = filtered.filter(classItem => {
        return classItem.courses.some(course => 
          course.teacherName.toLowerCase().includes(filters.teacher.toLowerCase())
        );
      });
    }

    // Calculate pagination
    const total = filtered.length;
    const pages = Math.ceil(total / filters.limit);
    const startIndex = (filters.page - 1) * filters.limit;
    const endIndex = startIndex + parseInt(filters.limit);

    setFilteredClasses(filtered.slice(startIndex, endIndex));
    setPagination({
      page: filters.page,
      limit: filters.limit,
      total,
      pages
    });
  };

  const toggleClassExpansion = (classId) => {
    const newExpanded = new Set(expandedClasses);
    if (newExpanded.has(classId)) {
      newExpanded.delete(classId);
    } else {
      newExpanded.add(classId);
    }
    setExpandedClasses(newExpanded);
  };

  const getSubjectColor = (subject) => {
    const subjectLower = subject.toLowerCase();
    if (subjectLower.includes('quran')) return 'bg-green-100 text-green-800';
    if (subjectLower.includes('arabic')) return 'bg-blue-100 text-blue-800';
    if (subjectLower.includes('islamic')) return 'bg-purple-100 text-purple-800';
    if (subjectLower.includes('tajweed')) return 'bg-yellow-100 text-yellow-800';
    if (subjectLower.includes('hadith')) return 'bg-pink-100 text-pink-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 sm:p-6">
          <div className="text-center py-8">
            <BookOpen className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm sm:text-base text-gray-600">Loading classes...</p>
            <p className="text-xs sm:text-sm text-gray-500">Please wait while we fetch your data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Classes</h1>
          <p className="text-sm sm:text-base text-gray-600">View and manage your enrolled classes</p>
        </div>
      </div>

      {/* Classes Cards */}
      {enrolledClasses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 sm:p-6">
            <div className="text-center py-8">
              <BookOpen className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm sm:text-base text-gray-600 mb-2">No classes enrolled yet</p>
              
              {!formStatus.formCompleted ? (
                <>
                  <p className="text-xs sm:text-sm text-gray-500 mb-6">
                    You haven't been assigned to any classes yet. Please complete the registration form to get enrolled.
                  </p>
                  {googleFormUrl && (
                    <div className="space-y-4">
                      {/* HUGE WARNING */}
                      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-red-800">⚠️ IMPORTANT WARNING ⚠️</h3>
                            <p className="text-sm font-semibold text-red-700">You can only open this form ONCE!</p>
                          </div>
                        </div>
                        <div className="bg-red-100 border border-red-300 rounded-md p-3">
                          <p className="text-sm text-red-800 font-medium mb-2">🚨 CRITICAL NOTICE:</p>
                          <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                            <li><strong>This form can only be opened ONE TIME</strong></li>
                            <li>Once you click the button below, you CANNOT open it again</li>
                            <li>Make sure you have all your information ready before clicking</li>
                            <li>Complete the entire form in one session</li>
                            <li>After submission, you must return here to mark it as completed</li>
                          </ul>
                        </div>
                      </div>
                      
                      <a
                        href={googleFormUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleFormCompletion}
                        className="inline-flex items-center gap-2 px-8 py-4 text-white bg-red-600 border-2 border-red-600 rounded-lg hover:bg-red-700 hover:border-red-700 transition-colors duration-200 font-bold text-lg shadow-lg"
                      >
                        <ExternalLink className="h-5 w-5" />
                        🚨 OPEN REGISTRATION FORM (ONE TIME ONLY) 🚨
                      </a>
                      
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                        <p className="text-sm text-yellow-800 font-medium">
                          📝 <strong>Instructions:</strong> Click the red button above to open the form, complete it fully, then return to this page. The button will disappear after you click it.
                        </p>
                      </div>
                    </div>
                  )}
                  {!googleFormUrl && (
                    <p className="text-xs text-gray-400">Please contact admin for registration</p>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="text-sm font-medium text-green-600">Registration Form Completed</p>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-4">
                    Thank you for completing the registration form! Admin will review your submission and assign you to appropriate classes.
                  </p>
                  {formStatus.completionDate && (
                    <p className="text-xs text-gray-400">
                      Completed on: {new Date(formStatus.completionDate).toLocaleDateString()}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 sm:p-6">
              <div className="space-y-4">
                {filteredClasses.map((classItem) => (
                  <div key={classItem.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all">
                    {/* Class Header */}
                    <div className="p-3 md:p-4 lg:p-6 border-b border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleClassExpansion(classItem.id)}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            {expandedClasses.has(classItem.id) ? (
                              <ChevronDown className="h-5 w-5" />
                            ) : (
                              <ChevronRight className="h-5 w-5" />
                            )}
                          </button>
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-blue-600" />
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{classItem.name}</h3>
                          </div>
                        </div>
                      </div>

                      {/* Class Info */}
                      <div className="mt-4 grid grid-cols-3 gap-4">
                        <div className="text-center bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 flex items-center justify-center gap-1 mb-1">
                            <Calendar className="h-3 w-3 text-gray-400" /> Start Date
                          </p>
                          <p className="font-medium text-gray-900 text-sm">{classItem.startDate}</p>
                        </div>
                        <div className="text-center bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 flex items-center justify-center gap-1 mb-1">
                            <Calendar className="h-3 w-3 text-gray-400" /> End Date
                          </p>
                          <p className="font-medium text-gray-900 text-sm">{classItem.endDate}</p>
                        </div>
                        <div className="text-center bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 flex items-center justify-center gap-1 mb-1">
                            <Users className="h-3 w-3 text-gray-400" /> Students
                          </p>
                          <p className="font-medium text-gray-900 text-sm">{classItem.numberOfStudents}</p>
                        </div>
                      </div>
                    </div>

                    {/* Courses Section */}
                    {expandedClasses.has(classItem.id) && (
                      <div className="p-4 sm:p-6 bg-gray-50">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-base md:text-lg font-semibold text-gray-800">My Courses ({classItem.courses.length})</h4>
                        </div>

                        {classItem.courses.length === 0 ? (
                          <p className="text-gray-500 text-center py-4 text-sm md:text-base">No courses available in this class.</p>
                        ) : (
                          <div className="space-y-4">
                            {classItem.courses.map((course) => (
                              <div key={course.id} className="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
                                <div className="mb-3 md:mb-4">
                                  <div className="flex items-center gap-2">
                                    <h5 className="text-sm md:text-base font-semibold text-gray-900 leading-tight text-start">{course.name}</h5>
                                    <span className="text-gray-400">|</span>
                                    <div className="flex items-center gap-1">
                                      <User className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
                                      <span className="text-xs md:text-sm text-gray-600">{course.teacherName}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Course Content */}
                                <div className="space-y-4">
                                  {/* Sessions */}
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Calendar className="h-4 w-4 text-gray-500" />
                                      <p className="text-sm font-medium text-gray-700">Schedule</p>
                                    </div>
                                    <div className="space-y-1">
                                      {course.sessionTime && course.sessionTime.length > 0 ? (
                                        course.sessionTime.map((session, index) => (
                                          <div key={index} className="flex items-center justify-between bg-white rounded-md px-3 py-2 border border-gray-200">
                                            <span className="text-sm font-medium text-gray-900">{session.day}</span>
                                            <span className="text-sm text-gray-600">{session.startTime} - {session.endTime}</span>
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-sm text-gray-500 italic">No sessions scheduled</p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Course Material Button */}
                                  <div className="flex justify-center sm:justify-end">
                                    <button
                                      onClick={() => onOpenMaterials && onOpenMaterials(course)}
                                      className="w-full md:w-auto px-4 py-2 border-2 border-red-600 text-red-600 font-semibold text-xs md:text-sm rounded-lg hover:bg-red-600 hover:text-white transition-all duration-200 uppercase tracking-wide"
                                    >
                                      Course Material
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="bg-white px-3 sm:px-4 py-3 flex items-center justify-between border-t border-gray-200 mt-6 rounded-b-lg overflow-x-auto hide-scrollbar" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
              {/* Mobile */}
              <div className="flex items-center justify-between w-full sm:hidden">
                <button
                  onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                  disabled={filters.page === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {filters.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setFilters({ ...filters, page: Math.min(pagination.pages, filters.page + 1) })}
                  disabled={filters.page === pagination.pages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>

              {/* Desktop */}
              <div className="hidden sm:flex items-center space-x-2 overflow-x-auto hide-scrollbar" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                <button
                  onClick={() => setFilters({ ...filters, page: 1 })}
                  disabled={filters.page === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  First
                </button>
                <button
                  onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                  disabled={filters.page === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(pagination.pages - 4, filters.page - 2)) + i;
                    if (pageNum > pagination.pages) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setFilters({ ...filters, page: pageNum })}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${pageNum === filters.page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setFilters({ ...filters, page: Math.min(pagination.pages, filters.page + 1) })}
                  disabled={filters.page === pagination.pages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
                <button
                  onClick={() => setFilters({ ...filters, page: pagination.pages })}
                  disabled={filters.page === pagination.pages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:cursor-not-allowed"
                >
                  Last
                </button>
              </div>

              <div className="text-sm text-gray-700">
                Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, pagination.total)} of {pagination.total} results
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentClasses;