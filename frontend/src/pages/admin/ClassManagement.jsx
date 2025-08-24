import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Users, Clock, DollarSign, Calendar, Search, Filter, User, BookOpen, X } from 'lucide-react';
import { coursesService, usersService } from '../../services';

const ClassManagement = ({ user, onOpenMaterials }) => {
  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    console.log('ClassManagement: useEffect triggered, fetching data...');
    
    // Only fetch data if component is mounted
    if (isMountedRef.current) {
      // Add a small delay to prevent immediate unmounting issues
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          fetchData();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
    
    // Cleanup function to prevent setting state after unmount
    return () => {
      console.log('ClassManagement: Component unmounting, cleaning up...');
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Only call filterClasses if classes is properly loaded and is an array
    if (Array.isArray(classes)) {
      filterClasses();
    }
  }, [filters, classes]);

  const checkBackendHealth = async () => {
    try {
      // Try to connect to the backend - any response means server is running
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // Use the working health endpoint
      const response = await fetch('http://localhost:3000/api/health', {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('Health check response:', response.status, response.statusText);
      
      // If the response is successful (2xx status) or if it's a 401 (which means server is running but endpoint is protected)
      return response.ok || response.status === 401;
    } catch (error) {
      console.log('Backend health check failed:', error);
      return false;
    }
  };

  const fetchData = async () => {
    console.log('ClassManagement: fetchData called, isFetching:', isFetching);
    
    // Prevent multiple simultaneous calls
    if (isFetching) {
      console.log('ClassManagement: Already fetching, skipping...');
      return;
    }
    
    try {
      setIsFetching(true);
      setLoading(true);
      setError(null);
      
      // Check backend health first
      const isBackendHealthy = await checkBackendHealth();
      if (!isBackendHealthy) {
        throw new Error('Backend server is not responding');
      }
      
      // Fetch classes and teachers in parallel with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const [classesResponse, teachersResponse] = await Promise.race([
        Promise.all([
          coursesService.getAllCourses(),
          usersService.getUsersByRole('teacher')
        ]),
        timeoutPromise
      ]);
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        console.log('Classes response:', classesResponse);
        console.log('Teachers response:', teachersResponse);
        
        // Ensure classes is always an array
        let classesArray = [];
        if (Array.isArray(classesResponse)) {
          classesArray = classesResponse;
          console.log('Classes response is already an array, length:', classesArray.length);
        } else if (classesResponse && typeof classesResponse === 'object') {
          // Handle case where response is an object with numeric keys
          console.log('Classes response is an object, keys:', Object.keys(classesResponse));
          classesArray = Object.values(classesResponse).filter(item => 
            item && typeof item === 'object' && !item._rateLimitInfo
          );
          console.log('Extracted classes array, length:', classesArray.length);
        } else {
          console.log('Classes response is unexpected type:', typeof classesResponse, classesResponse);
        }
        
        // Final safety check - ensure we always have an array
        if (!Array.isArray(classesArray)) {
          console.warn('Failed to extract classes array, using empty array as fallback');
          classesArray = [];
        }
        
        // Debug: Check for classes without IDs
        const classesWithoutIds = classesArray.filter(item => !item || !item.id);
        if (classesWithoutIds.length > 0) {
          console.warn('Found classes without IDs:', classesWithoutIds);
        }
        
        console.log('Final classes array:', classesArray);
        setClasses(classesArray);
        setTeachers(teachersResponse.users || []);
      }
      
    } catch (err) {
      console.error('Error fetching data:', err);
      
      // Handle different error types
      if (err.message === 'Backend server is not responding') {
        setError('Backend server is not responding. Please check if the server is running.');
      } else if (err.message === 'Request timeout') {
        setError('Request timed out. The server is taking too long to respond.');
      } else if (err.message === 'Network Error' || err.message?.includes('ERR_CONNECTION_REFUSED')) {
        setError('Cannot connect to the server. Please check if the backend is running.');
      } else if (err.statusCode === 429) {
        setError('Too many requests. Please wait a moment and try again.');
        // Auto-retry after 10 seconds for rate limiting (longer delay)
        setTimeout(() => {
          if (isMountedRef.current && !isFetching) {
            console.log('Auto-retrying after rate limit...');
            fetchData();
          }
        }, 10000);
      } else if (err.statusCode === 401) {
        setError('Authentication required. Please log in again.');
      } else if (err.statusCode === 403) {
        setError('Access denied. You do not have permission to view this data.');
      } else if (err.statusCode >= 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(err.message || 'Failed to load data');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setIsFetching(false);
      }
    }
  };

  const filterClasses = () => {
    // Ensure classes is always an array and filter out invalid items
    const classesArray = Array.isArray(classes) ? classes.filter(item => item && item.id) : [];
    let filtered = [...classesArray];

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(classItem => {
        const teacher = teachers.find(t => t.id === classItem.teacherId);
        const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Teacher TBD';

        return classItem.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          teacherName.toLowerCase().includes(filters.search.toLowerCase());
      });
    }

    // Apply teacher filter
    if (filters.teacher) {
      filtered = filtered.filter(classItem => {
        const teacher = teachers.find(t => t.id === classItem.teacherId);
        const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Teacher TBD';

        return teacherName.toLowerCase().includes(filters.teacher.toLowerCase());
      });
    }

    // Calculate pagination
    const total = filtered.length;
    const pages = Math.ceil(total / filters.limit);
    const startIndex = (filters.page - 1) * filters.limit;
    const endIndex = startIndex + parseInt(filters.limit);

    // Ensure we don't exceed array bounds
    const safeStartIndex = Math.max(0, Math.min(startIndex, total));
    const safeEndIndex = Math.max(safeStartIndex, Math.min(endIndex, total));

    setFilteredClasses(filtered.slice(safeStartIndex, safeEndIndex));
    setPagination({
      page: filters.page,
      limit: filters.limit,
      total,
      pages
    });
  };

  const handleCreateClass = async (classData) => {
    try {
      const courseData = {
        name: classData.name,
        description: classData.description,
        teacherId: classData.teacherId,
        price: parseFloat(classData.price),
        numberOfSessions: classData.numberOfSessions,
        sessionDuration: classData.sessionDuration,
        startDate: new Date().toISOString().split('T')[0], // Default to today
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 30 days from now
        schedule: classData.schedule
      };
      
      await coursesService.createCourse(courseData);
      
      // Refresh the classes list
      await fetchData();
      
      setShowCreateModal(false);
      alert('Class created successfully!');
      
    } catch (err) {
      console.error('Error creating class:', err);
      alert('Failed to create class: ' + err.message);
    }
  };

  const handleUpdateClass = async (classId, classData) => {
    try {
      console.log('Updating class with data:', classData); // Debug log
      
      // Call the backend API to update the course
      const response = await coursesService.updateCourse(classId, classData);
      console.log('Backend update response:', response); // Debug log
      
      // Update the local state after successful backend update
      setClasses(prev => prev.map(classItem => {
        if (classItem.id === classId) {
          return {
            ...classItem,
            name: classData.name,
            description: classData.description,
            teacherId: classData.teacherId,
            price: classData.price,
            schedule: classData.schedule,
            numberOfSessions: classData.numberOfSessions,
            sessionDuration: classData.sessionDuration
          };
        }
        return classItem;
      }));
      
      setShowEditModal(false);
      setSelectedClass(null);
      alert('Class updated successfully!');
    } catch (error) {
      console.error('Error updating class:', error);
      const errorMessage = error.message || error.response?.data?.message || 'Unknown error occurred';
      alert(`Error updating class: ${errorMessage}`);
    }
  };

  const handleDeleteClass = async (classId) => {
    // Safety check for undefined or invalid classId
    if (!classId) {
      console.error('Cannot delete class: classId is undefined or invalid');
      alert('Cannot delete class: Invalid class ID');
      return;
    }

    if (!confirm('Are you sure you want to delete this class?')) return;

    try {
      console.log('Attempting to delete class with ID:', classId);
      console.log('Class details before deletion:', classes.find(c => c.id === classId));
      
      const response = await coursesService.deleteCourse(classId);
      console.log('Delete API response:', response);
      
      setClasses(prev => prev.filter(classItem => classItem.id !== classId));
      alert('Class deleted successfully!');
    } catch (err) {
      console.error('Error deleting class:', err);
      console.error('Full error object:', err);
      console.error('Error response data:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      let errorMessage = 'Unknown error occurred';
      
      // Check for specific backend error messages
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Check for common deletion issues
      if (errorMessage.includes('foreign key') || errorMessage.includes('constraint')) {
        errorMessage = 'Cannot delete class: It has related data (students, sessions, materials, etc.). Please remove all related data first.';
      } else if (errorMessage.includes('not found')) {
        errorMessage = 'Class not found. It may have been deleted by another user.';
      } else if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
        errorMessage = 'You do not have permission to delete this class.';
      }
      
      alert('Failed to delete class: ' + errorMessage);
    }
  };

  const handleEnrollStudents = (classId, studentIds) => {
    setClasses(prev => prev.map(classItem => {
      if (classItem.id === classId) {
        const currentStudents = classItem.students || [];
        const newStudents = [...new Set([...currentStudents, ...studentIds])];
        return { ...classItem, students: newStudents };
      }
      return classItem;
    }));
    setShowEnrollModal(false);
    setSelectedClass(null);
    alert('Students enrolled successfully!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-600 mb-4">{error}</p>
          
          {error.includes('Backend server is not responding') || error.includes('Cannot connect to the server') ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                The backend server is not running or not accessible. Please:
              </p>
              <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
                <li>Check if the backend server is running on port 3000</li>
                <li>Verify the backend URL in your configuration</li>
                <li>Check for any firewall or network issues</li>
              </ul>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Quick Fix:</strong> Open a terminal in the backend folder and run:
                </p>
                <code className="block bg-yellow-100 p-2 rounded mt-2 text-xs font-mono">
                  npm run start:dev
                </code>
              </div>
              <button 
                onClick={fetchData} 
                disabled={isFetching || loading}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isFetching || loading ? 'Retrying...' : 'Retry Connection'}
              </button>
            </div>
          ) : error.includes('Too many requests') ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                The server is receiving too many requests. Please wait a moment.
              </p>
              <button 
                onClick={fetchData} 
                disabled={isFetching || loading}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isFetching || loading ? 'Loading...' : 'Retry Now'}
              </button>
            </div>
          ) : (
            <button 
              onClick={fetchData} 
              disabled={isFetching || loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isFetching || loading ? 'Loading...' : 'Retry'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Class Management</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage classes and schedules</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center space-x-2 border-2 border-green-600 text-green-600 px-3 sm:px-4 py-2 rounded-lg hover:bg-green-600 hover:text-white transition-all duration-200 text-sm sm:text-base"
          >
            <Plus className="h-4 w-4" />
            <span>Add Class</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search classes..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            />
          </div>

          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            value={filters.teacher}
            onChange={(e) => setFilters({ ...filters, teacher: e.target.value, page: 1 })}
          >
            <option value="">All Teachers</option>
            {Array.isArray(teachers) && teachers.filter(teacher => teacher && teacher.id).map((teacher) => (
              <option key={teacher.id} value={`${teacher.firstName} ${teacher.lastName}`}>
                {teacher.firstName} {teacher.lastName}
              </option>
            ))}
          </select>

          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
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
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <>
          <div className="space-y-3 sm:space-y-4">
            {Array.isArray(filteredClasses) && filteredClasses.length > 0 ? (
              filteredClasses
                .filter(classItem => classItem && classItem.id) // Filter out invalid items
                .map((classItem) => {
                  const teacher = teachers.find(t => t.id === classItem.teacherId);
                  const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Teacher TBD';

                  return (
                    <div
                      key={classItem.id}
                      className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all w-full p-3 sm:p-4 flex flex-col gap-3 sm:gap-4"
                    >
                      {/* Top Row - Name, Teacher, Actions */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">{classItem.name}</h3>
                          <span className="text-sm text-gray-500">|</span>
                          <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                            {teacherName}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 sm:gap-3 opacity-80 hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setSelectedClass(classItem);
                              setShowEnrollModal(true);
                            }}
                            className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-colors"
                            title="Enroll Students"
                          >
                            <Users className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedClass(classItem);
                              setShowEditModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Edit Class"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClass(classItem.id)}
                            disabled={!classItem.id} // Disable if no ID
                            className={`${
                              classItem.id 
                                ? 'text-red-600 hover:text-red-800' 
                                : 'text-gray-400 cursor-not-allowed'
                            } p-2 rounded-lg hover:bg-red-50 transition-colors`}
                            title={classItem.id ? "Delete Class" : "Cannot delete - Invalid ID"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Bottom Row - Students, Date, Price, Class Material */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center w-full gap-3 sm:gap-0">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" /> Students
                          </p>
                          <p className="font-medium text-gray-900 text-sm sm:text-base">{classItem.students?.length || 0}</p>
                        </div>

                        <div className="text-center">
                          <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" /> Schedule
                          </p>
                          <p className="font-medium text-gray-900 text-xs sm:text-sm">
                            {classItem.schedule && Array.isArray(classItem.schedule)
                              ? classItem.schedule.map(item => `${item.day} ${item.startTime}-${item.endTime}`).join(', ')
                              : classItem.schedule || 'Schedule TBD'
                            }
                          </p>
                        </div>

                        {classItem.price && (
                          <div className="text-center">
                            <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" /> Price
                            </p>
                            <p className="font-medium text-gray-900 text-sm sm:text-base">${classItem.price}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No classes found</h3>
                <p className="text-gray-500">
                  {Array.isArray(filteredClasses) && filteredClasses.length === 0 
                    ? "No classes match your current filters. Try adjusting your search criteria."
                    : "Loading classes..."
                  }
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="bg-white px-3 sm:px-4 py-3 flex items-center justify-between border-t border-gray-200 mt-6 rounded-b-lg">
              {/* Mobile */}
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                  disabled={filters.page === 1}
                  className="px-3 sm:px-4 py-2 border-2 border-green-600 text-green-600 text-xs sm:text-sm rounded-md bg-white hover:bg-green-200 disabled:opacity-60 transition-all duration-200"
                >
                  Previous
                </button>
                <button
                  onClick={() => setFilters({ ...filters, page: Math.min(pagination?.pages || 1, filters.page + 1) })}
                  disabled={filters.page === (pagination?.pages || 1)}
                  className="px-3 sm:px-4 py-2 border-2 border-green-600 text-green-600 text-xs sm:text-sm rounded-md bg-white hover:bg-green-200 disabled:opacity-60 transition-all duration-200"
                >
                  Next
                </button>
              </div>

              {/* Desktop */}
              <div className="hidden sm:flex sm:items-center sm:justify-between w-full">
                <p className="text-xs sm:text-sm text-gray-700">
                  Showing <span className="font-medium">{((filters.page - 1) * filters.limit) + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(filters.page * filters.limit, pagination?.total || 0)}</span> of{' '}
                  <span className="font-medium">{pagination?.total || 0}</span> results
                </p>
                <nav className="flex space-x-1">
                  {Array.from({ length: pagination?.pages || 0 }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setFilters({ ...filters, page })}
                      className={`px-2 sm:px-3 py-1 border-2 text-xs sm:text-sm rounded-md transition-all duration-200 ${page === filters.page
                        ? 'bg-green-50 border-green-600 text-green-600'
                        : 'bg-white border-green-600 text-green-600 hover:bg-green-50'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Class Modal */}
      {showCreateModal && (
        <ClassModal
          title="Create New Class"
          teachers={teachers}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateClass}
        />
      )}

      {/* Edit Class Modal */}
      {showEditModal && selectedClass && (
        <ClassModal
          title="Edit Class"
          classData={selectedClass}
          teachers={teachers}
          onClose={() => {
            setShowEditModal(false);
            setSelectedClass(null);
          }}
          onSubmit={(classData) => handleUpdateClass(selectedClass.id, classData)}
        />
      )}

      {/* Enroll Students Modal */}
      {showEnrollModal && selectedClass && (
        <EnrollModal
          classData={selectedClass}
          onClose={() => {
            setShowEnrollModal(false);
            setSelectedClass(null);
          }}
          onSubmit={(studentIds) => handleEnrollStudents(selectedClass.id, studentIds)}
        />
      )}
    </div>
  );
};

// Class Modal Component
const ClassModal = ({ title, classData, teachers, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: classData?.name || '',
    description: classData?.description || '',
    teacher: classData?.teacherId || '',
    price: classData?.price || '',
    startDate: classData?.startDate || '',
    endDate: classData?.endDate || '',
    schedule: classData?.schedule || []
  });

  // Reset form when user prop changes
  useEffect(() => {
    setFormData({
      name: classData?.name || '',
      description: classData?.description || '',
      teacher: classData?.teacherId || '',
      price: classData?.price || '',
      startDate: classData?.startDate || '',
      endDate: classData?.endDate || '',
      schedule: classData?.schedule || []
    });
  }, [classData]);

  const [showAddSession, setShowAddSession] = useState(false);
  const [newSession, setNewSession] = useState({
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00'
  });

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 8; hour <= 20; hour++) {
      ['00', '15', '30', '45'].forEach(minute => {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute}`;
        times.push(timeString);
      });
    }
    return times;
  };

  const addSession = () => {
    if (newSession.startTime >= newSession.endTime) {
      alert('End time must be after start time');
      return;
    }

    const sessionExists = formData.schedule.some(session =>
      session.day === newSession.day &&
      ((newSession.startTime >= session.startTime && newSession.startTime < session.endTime) ||
        (newSession.endTime > session.startTime && newSession.endTime <= session.endTime) ||
        (newSession.startTime <= session.startTime && newSession.endTime >= session.endTime))
    );

    if (sessionExists) {
      alert('Session time conflicts with existing session on the same day');
      return;
    }

    setFormData({
      ...formData,
      schedule: [...formData.schedule, { ...newSession }]
    });

    setNewSession({
      day: 'Monday',
      startTime: '09:00',
      endTime: '10:00'
    });
    setShowAddSession(false);
  };

  const removeSession = (index) => {
    setFormData({
      ...formData,
      schedule: formData.schedule.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.schedule.length === 0) {
      alert('Please add at least one session');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      alert('Start date and end date are required');
      return;
    }

    // Validate start date is not before today
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    const startDate = new Date(formData.startDate);
    
    if (startDate < today) {
      alert('Start date cannot be before today');
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      alert('End date must be after start date');
      return;
    }

    // Convert sessions to the new schedule format
    const schedule = formData.schedule.map(session => ({
      day: session.day,
      startTime: session.startTime,
      endTime: session.endTime
    }));

    // Create the class data with the new structure
    const classData = {
      name: formData.name,
      description: formData.description,
      teacherId: formData.teacher, // Keep as string for UUID
      price: parseFloat(formData.price), // Convert to number
      schedule: schedule,
      numberOfSessions: schedule.length,
      sessionDuration: 120, // Default to 120 minutes
      startDate: formData.startDate,
      endDate: formData.endDate
    };

    onSubmit(classData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" style={{ margin: 0 }}>
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teacher *</label>
              <select
                required
                value={formData.teacher}
                onChange={(e) => setFormData({...formData, teacher: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select Teacher</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.firstName} {teacher.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price (USD) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
              <input
                type="date"
                required
                min={formData.startDate || new Date().toISOString().split('T')[0]}
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Schedule Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">Schedule *</label>
            </div>
            
            {formData.schedule.map((slot, index) => {
              const start = new Date(`2000-01-01T${slot.startTime}:00`);
              const end = new Date(`2000-01-01T${slot.endTime}:00`);
              if (end < start) end.setDate(end.getDate() + 1);
              const duration = Math.round((end - start) / (1000 * 60));
              const isValidDuration = duration >= 15 && duration <= 480;
              
              return (
                <div key={index} className="border rounded-lg p-3 mb-3">
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    <select
                      value={slot.day}
                      onChange={(e) => {
                        const newSchedule = [...formData.schedule];
                        newSchedule[index].day = e.target.value;
                        setFormData({...formData, schedule: newSchedule});
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {weekDays.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                    <select
                      value={slot.startTime}
                      onChange={(e) => {
                        const newSchedule = [...formData.schedule];
                        newSchedule[index].startTime = e.target.value;
                        setFormData({...formData, schedule: newSchedule});
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {generateTimeOptions().map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                    <select
                      value={slot.endTime}
                      onChange={(e) => {
                        const newSchedule = [...formData.schedule];
                        newSchedule[index].endTime = e.target.value;
                        setFormData({...formData, schedule: newSchedule});
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {generateTimeOptions().map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                    <div className="flex items-center justify-center">
                      <span className={`text-sm font-medium ${
                        isValidDuration ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {duration} min
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSession(index)}
                      className="text-red-600 hover:text-red-800 px-2 py-2"
                    >
                      Remove
                    </button>
                  </div>
                  {!isValidDuration && (
                    <p className="text-xs text-red-600">
                      Duration must be between 15-480 minutes
                    </p>
                  )}
                </div>
              );
            })}
            

            {/* Add Time Slot Section */}
            {!showAddSession ? (
              <button
                type="button"
                onClick={() => setShowAddSession(true)}
                className="w-full p-3 border-2 border-dashed border-green-300 rounded-lg text-green-600 hover:border-green-400 hover:text-green-700 transition-colors text-sm font-medium"
              >
                + Add Time Slot
              </button>
            ) : (
              <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Time Slot</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Day</label>
                    <select
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                      value={newSession.day}
                      onChange={(e) => setNewSession({ ...newSession, day: e.target.value })}
                    >
                      {weekDays.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
                    <select
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                      value={newSession.startTime}
                      onChange={(e) => setNewSession({ ...newSession, startTime: e.target.value })}
                    >
                      {generateTimeOptions().map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
                    <select
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                      value={newSession.endTime}
                      onChange={(e) => setNewSession({ ...newSession, endTime: e.target.value })}
                    >
                      {generateTimeOptions().map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddSession(false)}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addSession}
                    className="px-3 py-2 text-sm border-2 border-green-600 text-green-600 rounded hover:bg-green-500 hover:text-white transition-all duration-200"
                  >
                    Add Time Slot
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              {classData ? 'Update' : 'Create Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Enroll Students Modal Component
const EnrollModal = ({ classData, onClose, onSubmit }) => {
  const [selectedStudents, setSelectedStudents] = useState([]);

  // For now, we'll use an empty array since we don't have students service integrated
  const availableStudents = [];

  const handleStudentToggle = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedStudents.length === 0) {
      alert('Please select at least one student');
      return;
    }
    onSubmit(selectedStudents);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-11/12 sm:w-2/3 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">
              Enroll Students in {classData.name}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Select students to enroll in this class:
              </p>

              {availableStudents.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-sm">
                  No available students to enroll
                </p>
              ) : (
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                  {availableStudents.map((student) => (
                    <label
                      key={student.id}
                      className="flex items-center p-2 sm:p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleStudentToggle(student.id)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <div className="ml-3 flex items-center">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs sm:text-sm font-medium">
                            {student.firstName ? student.firstName.charAt(0) : student.fullName.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                            {student.firstName && student.lastName
                              ? `${student.firstName} ${student.lastName}`
                              : student.fullName
                            }
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {student.email}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <p className="text-xs sm:text-sm text-gray-600">
                {selectedStudents.length} student(s) selected
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 sm:px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedStudents.length === 0}
                  className="px-3 sm:px-4 py-2 border-2 border-green-600 text-green-600 rounded-md hover:bg-green-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                >
                  Enroll Students
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClassManagement;