import { useState, useEffect } from 'react';
import { BookOpen, Clock, User, MapPin, Calendar, CheckCircle, Users, Search, Filter, ChevronDown, ChevronRight } from 'lucide-react';
import studentsService from '../../services/studentsService';
import { showErrorToast } from '../../utils/errorHandler';



const StudentClasses = ({ user, onOpenMaterials }) => {
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedClasses, setExpandedClasses] = useState(new Set());
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
      showErrorToast('Failed to load classes. Please try again.');
      setEnrolledClasses([]);
    } finally {
      setLoading(false);
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

      {/* Filters */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search classes..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={filters.search}
              onChange={(e) => {
                console.log('Search input changed:', e.target.value);
                setFilters({ ...filters, search: e.target.value, page: 1 });
              }}
              style={{ colorScheme: 'light' }}
              onFocus={(e) => e.target.placeholder = 'Search classes...'}
              onBlur={(e) => e.target.placeholder = 'Search classes...'}
            />
          </div>

          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={filters.teacher}
            onChange={(e) => setFilters({ ...filters, teacher: e.target.value, page: 1 })}
          >
            <option value="">All Teachers</option>
            {Array.from(new Set(enrolledClasses.flatMap(cls => cls.courses?.map(course => course.teacherName) || []))).map((teacherName) => (
              <option key={teacherName} value={teacherName}>
                {teacherName}
              </option>
            ))}
          </select>

          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={filters.limit}
            onChange={(e) => setFilters({ ...filters, limit: e.target.value, page: 1 })}
          >
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
      </div>

      {/* Classes Cards */}
      {enrolledClasses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 sm:p-6">
            <div className="text-center py-8">
              <BookOpen className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm sm:text-base text-gray-600">No classes enrolled yet</p>
              <p className="text-xs sm:text-sm text-gray-500">Contact admin to get enrolled in classes</p>
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
                    <div className="p-4 sm:p-6 border-b border-gray-100">
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
                        <div className="text-center">
                          <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-400" /> Start Date
                          </p>
                          <p className="font-medium text-gray-900 text-sm">{classItem.startDate}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-400" /> End Date
                          </p>
                          <p className="font-medium text-gray-900 text-sm">{classItem.endDate}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
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
                          <h4 className="text-lg font-semibold text-gray-800">My Courses ({classItem.courses.length})</h4>
                        </div>

                        {classItem.courses.length === 0 ? (
                          <p className="text-gray-500 text-center py-4">No courses available in this class.</p>
                        ) : (
                          <div className="space-y-3">
                            {classItem.courses.map((course) => (
                              <div key={course.id} className="bg-white rounded-lg border border-gray-200 p-4">
                                <div className="mb-3">
                                  <div className="flex items-center gap-2">
                                    <h5 className="text-start font-semibold text-gray-900">{course.name}</h5>
                                    <span className="text-gray-400">|</span>
                                    <div className="flex items-center gap-1">
                                      <User className="h-4 w-4 text-gray-500" />
                                      <span className="text-sm text-gray-600">{course.teacherName}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row gap-4 text-sm items-center">
                                  <div className="flex-1">
                                    <p className="text-gray-500">Sessions</p>
                                    <p className="font-medium text-gray-900">
                                      {course.sessionTime.map(session =>
                                        `${session.day} ${session.startTime}-${session.endTime}`
                                      ).join(', ')}
                                    </p>
                                  </div>
                                  <div className="flex-shrink-0">
                                    <button
                                      onClick={() => onOpenMaterials && onOpenMaterials(course)}
                                      className="px-3 py-2 border-2 border-green-600 text-green-600 font-semibold text-xs rounded-lg hover:bg-green-600 hover:text-white transition-all duration-200 uppercase"
                                    >
                                      Class Material
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
            <div className="bg-white px-3 sm:px-4 py-3 flex items-center justify-between border-t border-gray-200 mt-6 rounded-b-lg">
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
              <div className="hidden sm:flex items-center space-x-2">
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