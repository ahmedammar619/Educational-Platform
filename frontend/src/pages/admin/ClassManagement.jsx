import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Calendar, DollarSign, BookOpen, Search, Filter, User, X, ChevronDown, ChevronRight, UserMinus, ArrowUp } from 'lucide-react';
import { classesService, usersService, coursesService } from '../../services';
import { showErrorToast, showSuccessToast, getErrorMessage } from '../../utils/errorHandler';
import { showWarningToast } from '../../utils/toast.js';
import { ConfirmationDialog, AlertDialog } from '../../components/ui';
import useConfirmation from '../../hooks/useConfirmation';
import useAlert from '../../hooks/useAlert';

const ClassManagement = ({ user, onOpenMaterials }) => {
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();
  const { alertState, showAlert, hideAlert } = useAlert();
  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedClasses, setExpandedClasses] = useState(new Set());
  const [filters, setFilters] = useState({
    search: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showRemoveStudentModal, setShowRemoveStudentModal] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    filterClasses();
  }, [filters, classes]);

  const loadClasses = async () => {
    try {
    setLoading(true);
      const classesData = await classesService.getAllClasses();
      
      // Handle different response formats - convert object to array if needed
      let classesArray = [];
      if (Array.isArray(classesData)) {
        classesArray = classesData;
      } else if (classesData && typeof classesData === 'object') {
        // Convert object with numeric keys to array
        classesArray = Object.values(classesData).filter(item => 
          item && typeof item === 'object' && item.id && !item._rateLimitInfo
        );
      }
      
      // Process classes and fetch course data for each class
      const processedClasses = await Promise.all(classesArray.map(async (classItem) => {
        console.log('Processing class:', classItem);
        
        // Fetch course data using courseIds
        let courses = [];
        if (classItem.courseIds && classItem.courseIds.length > 0) {
          try {
            const coursesData = await coursesService.getCoursesByClass(classItem.id);
            console.log('Fetched courses for class:', classItem.id, coursesData);
            
            // Handle different response formats for courses
            let coursesArray = [];
            if (Array.isArray(coursesData)) {
              coursesArray = coursesData;
            } else if (coursesData && typeof coursesData === 'object') {
              coursesArray = Object.values(coursesData).filter(item => 
                item && typeof item === 'object' && item.id && !item._rateLimitInfo
              );
            }
            
            courses = coursesArray.map(course => {
              console.log('Processing course:', course);
              console.log('Course sessions:', course.sessions);
              return {
                ...course,
                // Sessions are now stored directly in the course as JSON
                sessionTime: course.sessions || [],
                // Use teacherName from backend response
                teacherName: course.teacherName || 'Unknown Teacher'
              };
            });
          } catch (error) {
            console.error('Error fetching courses for class:', classItem.id, error);
            courses = [];
          }
        }
        
        return {
          ...classItem,
          courses: courses,
          numberOfStudents: classItem.students ? classItem.students.length : (classItem.studentCount || 0)
        };
      }));
      
      console.log('Processed classes with courses:', processedClasses);
      setClasses(processedClasses);
    } catch (error) {
      console.error('Error loading classes:', error);
      setClasses([]);
      showErrorToast(error, 'Failed to load classes. Please try again.');
    } finally {
    setLoading(false);
    }
  };

  const filterClasses = () => {
    // Ensure classes is an array before processing
    if (!Array.isArray(classes)) {
      setFilteredClasses([]);
      return;
    }

    let filtered = [...classes];

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(classItem => {
        return classItem.name && classItem.name.toLowerCase().includes(filters.search.toLowerCase());
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

  const [isCreatingClass, setIsCreatingClass] = useState(false);

  const handleCreateClass = async (classData) => {
    // Prevent double-clicking
    if (isCreatingClass) {
      console.warn('🚫 Class creation already in progress, ignoring duplicate request');
      showWarningToast('Please wait', 'Class creation is already in progress.');
      return;
    }

    setIsCreatingClass(true);
    try {
      // Convert price to number and ensure it's valid
      const processedClassData = {
        ...classData,
        price: parseFloat(classData.price) || 0
      };
      
      const newClass = await classesService.createClass(processedClassData);
      setClasses(prev => [...(Array.isArray(prev) ? prev : []), newClass]);
    setShowCreateClassModal(false);
      showSuccessToast('Class created successfully!');
    } catch (error) {
      console.error('Error creating class:', error);
      showErrorToast(error, 'Failed to create class. Please try again.');
    } finally {
      setIsCreatingClass(false);
    }
  };

    const handleCreateCourse = async (courseData) => {
    if (!selectedClass) return;
    
    // Prevent concurrent course creation
    if (isCreatingCourse) {
      console.warn('🚫 Course creation already in progress, ignoring duplicate request');
      return;
    }

    setIsCreatingCourse(true);

    // Set up timeout to prevent infinite loading (30 seconds)
    const timeoutId = setTimeout(() => {
      console.warn('⏰ Course creation timeout reached, clearing loading state');
      setIsCreatingCourse(false);
      showErrorToast('Course creation timed out. Please try again.');
    }, 30000);

    try {
      console.log('🔄 Creating course:', courseData);
      
      // Create course with classId, teacherId, and sessions
      const coursePayload = {
        name: courseData.name,
        classId: selectedClass.id,
        teacherId: courseData.teacherId,
        sessions: courseData.sessions || []
      };

      const createPromise = coursesService.createCourse(coursePayload);
      
      const newCourse = await Promise.race([
        createPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 25000)
        )
      ]);

      console.log('✅ Course created successfully:', newCourse);

      // Clear timeout since operation completed
      clearTimeout(timeoutId);

      // Reload classes to get updated course data
      await loadClasses();
      
      setShowCreateCourseModal(false);
      setSelectedClass(null);
      showSuccessToast('Course created successfully!');
    } catch (error) {
      // Clear timeout on error
      clearTimeout(timeoutId);
      
      console.error('❌ Error creating course:', error);
      
      if (error.message === 'Request timeout') {
        showErrorToast('Course creation timed out. Please check your connection and try again.');
      } else {
        showErrorToast(error, 'Failed to create course. Please try again.');
      }
    } finally {
      setIsCreatingCourse(false);
    }
  };

  const handleUpdateClass = async (classId, classData) => {
    try {
      // Convert price to number and ensure it's valid
      const processedClassData = {
        ...classData,
        price: parseFloat(classData.price) || 0
      };
      
      const updatedClass = await classesService.updateClass(classId, processedClassData);
      setClasses(prev => (Array.isArray(prev) ? prev : []).map(classItem => 
        classItem.id === classId ? updatedClass : classItem
      ));
    setShowEditClassModal(false);
    setSelectedClass(null);
      showSuccessToast('Class updated successfully!');
    } catch (error) {
      console.error('Error updating class:', error);
      showErrorToast(error, 'Failed to update class. Please try again.');
    }
  };

  const handleUpdateCourse = async (classId, courseId, courseData) => {
    // Prevent double-clicking
    if (updatingCourses.has(courseId)) {
      console.warn('🚫 Course update already in progress, ignoring duplicate request');
      return;
    }

    setUpdatingCourses(prev => new Set(prev).add(courseId));

    // Set up timeout to prevent infinite loading (30 seconds)
    const timeoutId = setTimeout(() => {
      console.warn('⏰ Course update timeout reached, clearing loading state');
      setUpdatingCourses(prev => {
        const newSet = new Set(prev);
        newSet.delete(courseId);
        return newSet;
      });
      showErrorToast('Course update timed out. Please try again.');
    }, 30000);

    try {
      console.log('🔄 Updating course:', { courseId, courseData });

      // Update course basic info with timeout protection
      const updatePromise = coursesService.updateCourse(courseId, {
        name: courseData.name,
        teacherId: courseData.teacherId,
        sessions: courseData.sessions || []
      });

      const updatedCourse = await Promise.race([
        updatePromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 25000)
        )
      ]);

      console.log('✅ Course updated successfully:', updatedCourse);

      // Clear timeout since operation completed
      clearTimeout(timeoutId);

      // Sessions are now handled as part of the course update
      // The sessions data is already included in the courseData.sessions array

      // Reload classes to get updated course data
      await loadClasses();
      
      setShowEditCourseModal(false);
      setSelectedClass(null);
      setSelectedCourse(null);
      showSuccessToast('Course updated successfully!');
    } catch (error) {
      // Clear timeout on error
      clearTimeout(timeoutId);
      
      console.error('❌ Error updating course:', error);
      
      if (error.message === 'Request timeout') {
        showErrorToast('Course update timed out. Please check your connection and try again.');
      } else {
        showErrorToast(error, 'Failed to update course. Please try again.');
      }
    } finally {
      // Always clear the loading state, even if an error occurs
      setUpdatingCourses(prev => {
        const newSet = new Set(prev);
        newSet.delete(courseId);
        return newSet;
      });
    }
  };

  const [deletingClasses, setDeletingClasses] = useState(new Set());

  const handleDeleteClass = async (classId) => {
    // Prevent double-clicking
    if (deletingClasses.has(classId)) {
      console.warn('🚫 Class deletion already in progress, ignoring duplicate request');
      return;
    }

    showConfirmation({
      title: 'Delete Class',
      message: 'Are you sure you want to delete this class? This will also delete all courses within it.',
      type: 'danger',
      confirmText: 'Delete Class',
      confirmButtonVariant: 'danger',
      onConfirm: async () => {
        setDeletingClasses(prev => new Set(prev).add(classId));
        try {
          await classesService.deleteClass(classId);
          setClasses(prev => (Array.isArray(prev) ? prev : []).filter(classItem => classItem.id !== classId));
          showSuccessToast('Class deleted successfully!');
        } catch (error) {
          console.error('Error deleting class:', error);
          showErrorToast(error, 'Failed to delete class. Please try again.');
        } finally {
          setDeletingClasses(prev => {
            const newSet = new Set(prev);
            newSet.delete(classId);
            return newSet;
          });
        }
      }
    });
  };

  const [deletingCourses, setDeletingCourses] = useState(new Set());
  const [updatingCourses, setUpdatingCourses] = useState(new Set());

  const handleDeleteCourse = async (classId, courseId) => {
    // Prevent double-clicking
    if (deletingCourses.has(courseId)) {
      console.warn('🚫 Course deletion already in progress, ignoring duplicate request');
      return;
    }

    // Debug logging
    console.log('Deleting course:', { classId, courseId });

    if (!courseId) {
      showErrorToast('Course ID is missing. Cannot delete course.');
      return;
    }

    showConfirmation({
      title: 'Delete Course',
      message: 'Are you sure you want to delete this course? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete Course',
      confirmButtonVariant: 'danger',
      onConfirm: async () => {
        setDeletingCourses(prev => new Set(prev).add(courseId));
        try {
          await coursesService.deleteCourse(courseId);
          // Reload classes to get updated course data
          await loadClasses();
          showSuccessToast('Course deleted successfully!');
        } catch (error) {
          console.error('Error deleting course:', error);
          showErrorToast(error, 'Failed to delete course. Please try again.');
        } finally {
          setDeletingCourses(prev => {
            const newSet = new Set(prev);
            newSet.delete(courseId);
            return newSet;
          });
        }
      }
    });
  };

  const handleEnrollStudents = async (classId, studentIds) => {
    try {
      await classesService.enrollStudents(classId, studentIds);
      // Reload classes to get updated student count
      await loadClasses();
    setShowEnrollModal(false);
    setSelectedClass(null);
      showSuccessToast('Students enrolled successfully!');
    } catch (error) {
      console.error('Error enrolling students:', error);
      showErrorToast(error, 'Failed to enroll students. Please try again.');
    }
  };

  const handleRemoveStudent = async (classId, studentId) => {
    try {
      await classesService.removeStudentFromClass(classId, studentId);
      // Reload classes to get updated student count
      await loadClasses();
      setShowRemoveStudentModal(false);
      setSelectedClass(null);
      showSuccessToast('Student removed successfully!');
    } catch (error) {
      console.error('Error removing student:', error);
      showErrorToast(error, 'Failed to remove student. Please try again.');
    }
  };

  const handleLevelUpStudents = async (fromClassId, studentIds, toClassId) => {
    try {
      // First, remove students from the current class
      for (const studentId of studentIds) {
        await classesService.removeStudentFromClass(fromClassId, studentId);
      }
      
      // Then, enroll them in the new class
      await classesService.enrollStudents(toClassId, studentIds);
      
      // Reload classes to get updated student counts
      await loadClasses();
      setShowLevelUpModal(false);
      setSelectedClass(null);
      showSuccessToast(`${studentIds.length} student(s) moved to new class successfully!`);
    } catch (error) {
      console.error('Error leveling up students:', error);
      showErrorToast(error, 'Failed to move students. Please try again.');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-8 h-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Class Management</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage classes and their courses</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateClassModal(true)}
            disabled={isCreatingClass}
            className="flex items-center space-x-2 border-2 border-green-600 text-green-600 px-4 py-2 rounded-lg hover:bg-green-600 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingClass ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Add Class</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Classes List */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 sm:p-6">
            <div className="text-center py-8">
              <BookOpen className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm sm:text-base text-gray-600">Loading classes...</p>
              <p className="text-xs sm:text-sm text-gray-500">Please wait while we fetch your data</p>
            </div>
          </div>
        </div>
              ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-4 sm:p-6">
                <div className="space-y-6">
                  {filteredClasses.map((classItem) => (
                    <div key={classItem.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all">
                {/* Class Header */}
                <div className="p-4 sm:p-6 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleClassExpansion(classItem.id)}
                        className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-gray-100"
                      >
                        {expandedClasses.has(classItem.id) ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </button>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{classItem.name || 'Unnamed Class'}</h3>
                      </div>
                    </div>

                    {/* Class Actions */}
                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
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
                          setShowRemoveStudentModal(true);
                        }}
                        className="text-orange-600 hover:text-orange-800 p-2 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remove Students"
                        disabled={!classItem.students || classItem.students.length === 0}
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedClass(classItem);
                          setShowLevelUpModal(true);
                        }}
                        className="text-purple-600 hover:text-purple-800 p-2 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Level Up Students"
                        disabled={!classItem.students || classItem.students.length === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedClass(classItem);
                          setShowCreateCourseModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Add Course"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedClass(classItem);
                          setShowEditClassModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Edit Class"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClass(classItem.id)}
                        disabled={deletingClasses.has(classItem.id)}
                        className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete Class"
                      >
                        {deletingClasses.has(classItem.id) ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Class Info */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="text-center bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 flex items-center justify-center gap-1 mb-1">
                        <Calendar className="h-3 w-3 text-gray-400" /> Start Date
                      </p>
                      <p className="font-medium text-gray-900 text-sm">{classItem.startDate || 'N/A'}</p>
                    </div>
                    <div className="text-center bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 flex items-center justify-center gap-1 mb-1">
                        <Calendar className="h-3 w-3 text-gray-400" /> End Date
                      </p>
                      <p className="font-medium text-gray-900 text-sm">{classItem.endDate || 'N/A'}</p>
                    </div>
                    <div className="text-center bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 flex items-center justify-center gap-1 mb-1">
                        <DollarSign className="h-3 w-3 text-gray-400" /> Price
                      </p>
                      <p className="font-medium text-gray-900 text-sm">${classItem.price || 0}</p>
                    </div>
                    <div className="text-center bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 flex items-center justify-center gap-1 mb-1">
                        <Users className="h-3 w-3 text-gray-400" /> Students
                      </p>
                      <p className="font-medium text-gray-900 text-sm">{classItem.numberOfStudents || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Courses Section */}
                {expandedClasses.has(classItem.id) && (
                  <div className="p-4 sm:p-6 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-800">Courses ({(classItem.courses || []).length})</h4>
                    </div>

                    {(classItem.courses || []).length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No courses added yet. Click the + button to add a course.</p>
                    ) : (
                      <div className="space-y-4">
                        {(classItem.courses || []).map((course) => {
                          console.log('Course object:', course);
                          return (
                          <div key={course.id} className="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
                            <div className="mb-3 md:mb-4">
                              <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                  <h5 className="text-sm md:text-base font-semibold text-gray-900 leading-tight text-start">{course.name}</h5>
                                  <span className="text-gray-400 hidden md:inline">|</span>
                                <div className="flex items-center gap-1">
                                    <User className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
                                    <span className="text-xs md:text-sm text-gray-600">{course.teacherName}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedClass(classItem);
                                    setSelectedCourse(course);
                                    setShowEditCourseModal(true);
                                  }}
                                  disabled={updatingCourses.has(course.id)}
                                  className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400"
                                  title={updatingCourses.has(course.id) ? "Course is being updated..." : "Edit Course"}
                                >
                                  {updatingCourses.has(course.id) ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                  ) : (
                                    <Edit className="h-4 w-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDeleteCourse(classItem.id, course.id)}
                                  disabled={deletingCourses.has(course.id)}
                                  className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Delete Course"
                                >
                                  {deletingCourses.has(course.id) ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </button>
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
                                  className="w-full md:w-auto px-4 py-2 border-2 border-green-600 text-green-600 font-semibold text-xs md:text-sm rounded-lg hover:bg-green-600 hover:text-white transition-all duration-200 uppercase tracking-wide"
                                >
                                  Course Material
                                </button>
                              </div>
                            </div>
                          </div>
                          );
                        })}
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
            <div className="bg-white px-6 py-4 flex items-center justify-between border-t border-gray-200 mt-6 rounded-lg shadow-sm">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                  disabled={filters.page === 1}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Previous
                </button>
                <button
                  onClick={() => setFilters({ ...filters, page: Math.min(pagination?.pages || 1, filters.page + 1) })}
                  disabled={filters.page === (pagination?.pages || 1)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Next
                </button>
              </div>

              <div className="hidden sm:flex sm:items-center sm:justify-between w-full">
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((filters.page - 1) * filters.limit) + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(filters.page * filters.limit, pagination?.total || 0)}</span> of{' '}
                    <span className="font-medium">{pagination?.total || 0}</span> results
                  </p>
                </div>
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                    disabled={filters.page === 1}
                    className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, pagination?.pages || 0) }, (_, i) => {
                      let page;
                      if (pagination?.pages <= 5) {
                        page = i + 1;
                      } else if (filters.page <= 3) {
                        page = i + 1;
                      } else if (filters.page >= pagination?.pages - 2) {
                        page = pagination?.pages - 4 + i;
                      } else {
                        page = filters.page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={page}
                          onClick={() => setFilters({ ...filters, page })}
                          className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                            page === filters.page
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setFilters({ ...filters, page: Math.min(pagination?.pages || 1, filters.page + 1) })}
                    disabled={filters.page === (pagination?.pages || 1)}
                    className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Class Modal */}
      {showCreateClassModal && (
        <ClassModal
          title="Create New Class"
          onClose={() => setShowCreateClassModal(false)}
          onSubmit={handleCreateClass}
          isCreatingClass={isCreatingClass}
        />
      )}

      {/* Edit Class Modal */}
      {showEditClassModal && selectedClass && (
        <ClassModal
          title="Edit Class"
          classData={selectedClass}
          onClose={() => {
            setShowEditClassModal(false);
            setSelectedClass(null);
          }}
          onSubmit={(classData) => handleUpdateClass(selectedClass.id, classData)}
          isCreatingClass={false}
        />
      )}

      {/* Create Course Modal */}
      {showCreateCourseModal && selectedClass && (
        <CourseModal
          title="Add New Course"
          isUpdating={isCreatingCourse}
          onClose={() => {
            // Prevent closing modal while course creation is in progress
            if (isCreatingCourse) {
              console.warn('🚫 Cannot close modal while course creation is in progress');
              return;
            }
            setShowCreateCourseModal(false);
            setSelectedClass(null);
          }}
          onSubmit={handleCreateCourse}
        />
      )}

      {/* Edit Course Modal */}
      {showEditCourseModal && selectedClass && selectedCourse && (
        <CourseModal
          title="Edit Course"
          courseData={selectedCourse}
          isUpdating={updatingCourses.has(selectedCourse.id)}
          onClose={() => {
            // Prevent closing modal while update is in progress
            if (updatingCourses.has(selectedCourse.id)) {
              console.warn('🚫 Cannot close modal while course update is in progress');
              return;
            }
            setShowEditCourseModal(false);
            setSelectedClass(null);
            setSelectedCourse(null);
          }}
          onSubmit={(courseData) => handleUpdateCourse(selectedClass.id, selectedCourse.id, courseData)}
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

      {/* Remove Student Modal */}
      {showRemoveStudentModal && selectedClass && (
        <RemoveStudentModal
          classData={selectedClass}
          onClose={() => {
            setShowRemoveStudentModal(false);
            setSelectedClass(null);
          }}
          onRemove={(studentId) => handleRemoveStudent(selectedClass.id, studentId)}
        />
      )}

      {/* Level Up Students Modal */}
      {showLevelUpModal && selectedClass && (
        <LevelUpModal
          classData={selectedClass}
          onClose={() => {
            setShowLevelUpModal(false);
            setSelectedClass(null);
          }}
          onSubmit={(studentIds, toClassId) => handleLevelUpStudents(selectedClass.id, studentIds, toClassId)}
          showConfirmation={showConfirmation}
          showAlert={showAlert}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationState.isOpen}
        onClose={hideConfirmation}
        onConfirm={handleConfirm}
        title={confirmationState.title}
        message={confirmationState.message}
        type={confirmationState.type}
        confirmText={confirmationState.confirmText}
        cancelText={confirmationState.cancelText}
        confirmButtonVariant={confirmationState.confirmButtonVariant}
        isLoading={confirmationState.isLoading}
      />

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertState.isOpen}
        onClose={hideAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        buttonText={alertState.buttonText}
      />
    </div>
  );
};

// Class Modal Component
const ClassModal = ({ title, classData, onClose, onSubmit, isCreatingClass = false }) => {
  const [formData, setFormData] = useState({
    name: classData?.name || '',
    startDate: classData?.startDate || '',
    endDate: classData?.endDate || '',
    price: classData?.price || ''
  });

  useEffect(() => {
    setFormData({
      name: classData?.name || '',
      startDate: classData?.startDate || '',
      endDate: classData?.endDate || '',
      price: classData?.price || ''
    });
  }, [classData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate dates
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    if (startDate < today) {
      showAlert({
        title: 'Invalid Date',
        message: 'Start date cannot be before today',
        type: 'warning'
      });
      return;
    }
    
    if (endDate < startDate) {
      showAlert({
        title: 'Invalid Date',
        message: 'End date cannot be before start date',
        type: 'warning'
      });
      return;
    }
    
    // Validate price
    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      showAlert({
        title: 'Invalid Price',
        message: 'Please enter a valid price (must be a number greater than or equal to 0)',
        type: 'warning'
      });
      return;
    }
    
    // Ensure price is a number in the form data
    const validatedFormData = {
      ...formData,
      price: price
    };
    
    onSubmit(validatedFormData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style={{margin: '0px'}}>
      <div className="relative top-10 mx-auto p-5 border w-11/12 sm:w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Class Name</label>
              <input
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={formData.startDate}
                onChange={(e) => {
                  const newStartDate = e.target.value;
                  setFormData({ 
                    ...formData, 
                    startDate: newStartDate,
                    // Reset end date if it's before the new start date
                    endDate: formData.endDate && formData.endDate < newStartDate ? '' : formData.endDate
                  });
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                required
                min={formData.startDate || new Date().toISOString().split('T')[0]}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Price (USD)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatingClass}
                className="px-4 py-2 border-2 border-green-600 text-green-600 rounded-md hover:bg-green-500 hover:text-white transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isCreatingClass ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                    {classData ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  classData ? 'Update' : 'Create'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Course Modal Component (using the old class design)
const CourseModal = ({ title, courseData, isUpdating = false, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: courseData?.name || '',
    teacherId: courseData?.teacherId || '',
    teacherName: courseData?.teacherName || '',
    courseMaterial: courseData?.courseMaterial || '',
    sessions: courseData?.sessionTime || []
  });

  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);

  useEffect(() => {
    setFormData({
      name: courseData?.name || '',
      teacherId: courseData?.teacherId || '',
      teacherName: courseData?.teacherName || '',
      courseMaterial: courseData?.courseMaterial || '',
      sessions: courseData?.sessionTime || []
    });
  }, [courseData]);

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const response = await usersService.getUsersByRole('teacher');
      
      // Handle the response format - extract users array and filter for teachers
      let teachersArray = [];
      if (response && response.users && Array.isArray(response.users)) {
        // Filter for teachers from the users array
        teachersArray = response.users.filter(user => user.role === 'teacher');
      } else if (Array.isArray(response)) {
        // If response is directly an array, filter for teachers
        teachersArray = response.filter(user => user.role === 'teacher');
      }
      
      console.log('Teachers data:', teachersArray);
      setAvailableTeachers(teachersArray);
    } catch (error) {
      console.error('Error loading teachers:', error);
      setAvailableTeachers([]);
      showErrorToast(error, 'Failed to load teachers. Please try again.');
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleTeacherChange = (teacherId) => {
    const selectedTeacher = Array.isArray(availableTeachers) ? 
      availableTeachers.find(teacher => teacher.id === teacherId) : null;
    setFormData({
      ...formData,
      teacherId: teacherId,
      teacherName: selectedTeacher ? `${selectedTeacher.firstName || ''} ${selectedTeacher.lastName || ''}`.trim() || selectedTeacher.fullName : ''
    });
  };

  const [showAddSession, setShowAddSession] = useState(false);
  const [newSession, setNewSession] = useState({
    day: 'Sunday',
    startTime: '08:00',
    endTime: '09:00'
  });

  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 8; hour <= 20; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      times.push(timeString);
    }
    return times;
  };

  const addSession = () => {
    if (newSession.startTime >= newSession.endTime) {
      showAlert({
        title: 'Invalid Time',
        message: 'End time must be after start time',
        type: 'warning'
      });
      return;
    }

    const sessionExists = formData.sessions.some(session =>
      session.day === newSession.day &&
      ((newSession.startTime >= session.startTime && newSession.startTime < session.endTime) ||
        (newSession.endTime > session.startTime && newSession.endTime <= session.endTime) ||
        (newSession.startTime <= session.startTime && newSession.endTime >= session.endTime))
    );

    if (sessionExists) {
      showAlert({
        title: 'Time Conflict',
        message: 'Session time conflicts with existing session on the same day',
        type: 'warning'
      });
      return;
    }

    setFormData({
      ...formData,
      sessions: [...formData.sessions, { ...newSession }]
    });

    setNewSession({
      day: 'Sunday',
      startTime: '08:00',
      endTime: '09:00'
    });
    setShowAddSession(false);
  };

  const removeSession = (index) => {
    setFormData({
      ...formData,
      sessions: formData.sessions.filter((_, i) => i !== index)
    });
  };

  // Helper function to parse time string to minutes
  const parseTime = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Helper function to check if two sessions overlap
  const sessionsOverlap = (start1, end1, start2, end2) => {
    return start1 < end2 && start2 < end1;
  };

  // Helper function to validate session conflicts
  const validateSessionConflicts = (sessions) => {
    const validSessions = sessions.filter(session => 
      session && 
      session.day && 
      session.startTime && 
      session.endTime &&
      session.day.trim() !== '' &&
      session.startTime.trim() !== '' &&
      session.endTime.trim() !== ''
    );

    // Check for conflicts within the same sessions array
    for (let i = 0; i < validSessions.length; i++) {
      const session1 = validSessions[i];
      const startTime1 = parseTime(session1.startTime);
      const endTime1 = parseTime(session1.endTime);

      if (startTime1 >= endTime1) {
        return `Session ${i + 1}: End time must be after start time`;
      }

      // Check for conflicts with other sessions in the same array
      for (let j = i + 1; j < validSessions.length; j++) {
        const session2 = validSessions[j];
        
        if (session1.day === session2.day) {
          const startTime2 = parseTime(session2.startTime);
          const endTime2 = parseTime(session2.endTime);

          if (sessionsOverlap(startTime1, endTime1, startTime2, endTime2)) {
            return `Session conflict: ${session1.day} ${session1.startTime}-${session1.endTime} overlaps with ${session2.day} ${session2.startTime}-${session2.endTime}`;
          }
        }
      }
    }

    return null; // No conflicts found
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Prevent form submission if already updating
    if (isUpdating) {
      console.warn('🚫 Form submission prevented - update already in progress');
      return;
    }

    // Filter out empty or invalid sessions
    const validSessions = formData.sessions.filter(session => 
      session && 
      session.day && 
      session.startTime && 
      session.endTime &&
      session.day.trim() !== '' &&
      session.startTime.trim() !== '' &&
      session.endTime.trim() !== ''
    );

    if (validSessions.length === 0) {
      showAlert({
        title: 'Missing Sessions',
        message: 'Please add at least one valid session',
        type: 'warning'
      });
      return;
    }

    // Validate session conflicts
    const conflictError = validateSessionConflicts(validSessions);
    if (conflictError) {
      showAlert({
        title: 'Session Conflict',
        message: conflictError,
        type: 'warning'
      });
      return;
    }

    // Submit with only valid sessions
    onSubmit({
      ...formData,
      sessions: validSessions
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style={{margin: '0px'}}>
      <div className="relative top-4 sm:top-10 mx-auto p-4 sm:p-5 border w-11/12 sm:w-96 shadow-lg rounded-md bg-white">
        <div className="mt-1">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">{title}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Course Name</label>
              <input
                type="text"
                required
                disabled={isUpdating}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Teacher</label>
              {loadingTeachers ? (
                <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-500">
                  Loading teachers...
                </div>
              ) : (
                <select
                required
                disabled={isUpdating}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={formData.teacherId}
                  onChange={(e) => handleTeacherChange(e.target.value)}
                >
                  <option value="">Select a teacher</option>
                  {Array.isArray(availableTeachers) && availableTeachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.firstName && teacher.lastName
                        ? `${teacher.firstName} ${teacher.lastName}`
                        : teacher.fullName
                      } ({teacher.email})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Sessions Management */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Course Sessions</label>

              {/* Existing Sessions */}
              {formData.sessions.length > 0 && (
                <div className="mb-4 space-y-2">
                  {formData.sessions.map((session, index) => (
                    <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <span className="text-xs sm:text-sm font-medium text-blue-900">
                        {session.day}: {session.startTime} - {session.endTime}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSession(index)}
                        disabled={isUpdating}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Session Button */}
              {!showAddSession ? (
                <button
                  type="button"
                  onClick={() => setShowAddSession(true)}
                  disabled={isUpdating}
                  className="w-full p-2 sm:p-3 border-2 border-dashed border-green-300 rounded-md text-green-600 hover:border-green-400 hover:text-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400"
                >
                  + Add Session
                </button>
              ) : (
                /* Add Session Form */
                <div className="p-3 sm:p-4 border border-gray-300 rounded-md bg-gray-50">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Day</label>
                      <select
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                      className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={addSession}
                      className="px-2 sm:px-3 py-1 text-xs sm:text-sm border-2 border-green-600 text-green-600 rounded hover:bg-green-500 hover:text-white transition-all duration-200"
                    >
                      Add Session
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isUpdating}
                className="px-3 sm:px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-3 sm:px-4 py-2 border-2 border-green-600 text-green-600 rounded-md hover:bg-green-500 hover:text-white transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUpdating && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                )}
                {isUpdating ? 'Updating...' : (courseData ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Enroll Students Modal Component
const EnrollModal = ({ classData, onClose, onSubmit }) => {
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      const response = await usersService.getAllStudents();
      
      // Handle different response formats - extract students array
      let studentsArray = [];
      if (response && response.students && Array.isArray(response.students)) {
        // Backend returns { students: Student[] }
        studentsArray = response.students;
      } else if (Array.isArray(response)) {
        // If response is directly an array
        studentsArray = response;
      }
      
      // Map student data to include user properties at the top level
      const mappedStudents = studentsArray.map(student => ({
        id: student.id,
        firstName: student.user?.firstName,
        lastName: student.user?.lastName,
        email: student.user?.email,
        fullName: student.user?.fullName || (student.user?.firstName && student.user?.lastName ? `${student.user.firstName} ${student.user.lastName}` : null),
        birthDate: student.birthDate,
        parentId: student.parentId,
        classId: student.classId,
        role: student.user?.role
      }));
      
      setAvailableStudents(mappedStudents);
    } catch (error) {
      console.error('Error loading students:', error);
      setAvailableStudents([]);
      showErrorToast(error, 'Failed to load students. Please try again.');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleStudentToggle = (studentId) => {
    // Don't allow toggling if student is already enrolled
    const student = availableStudents.find(s => s.id === studentId);
    if (student && student.classId === classData.id) {
      return; // Student is already enrolled, don't allow selection
    }
    
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedStudents.length === 0) {
      showAlert({
        title: 'No Students Selected',
        message: 'Please select at least one student',
        type: 'warning'
      });
      return;
    }
    onSubmit(selectedStudents);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style={{margin: '0px'}}>
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

              {loadingStudents ? (
                <p className="text-gray-500 text-center py-4 text-sm">
                  Loading students...
                </p>
              ) : availableStudents.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-sm">
                  No available students to enroll
                </p>
              ) : (
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                  {availableStudents.map((student) => {
                    const isAlreadyEnrolled = student.classId === classData.id;
                    const isSelected = selectedStudents.includes(student.id);
                    
                    return (
                      <label
                        key={student.id}
                        className={`flex items-center p-2 sm:p-3 border-b border-gray-100 last:border-b-0 ${
                          isAlreadyEnrolled 
                            ? 'bg-gray-50 opacity-60 cursor-not-allowed' 
                            : 'hover:bg-gray-50 cursor-pointer'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleStudentToggle(student.id)}
                          disabled={isAlreadyEnrolled}
                          className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                            isAlreadyEnrolled ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        />
                        <div className="ml-3 flex items-center">
                          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isAlreadyEnrolled ? 'bg-gray-400' : 'bg-red-600'
                          }`}>
                            <span className="text-start text-white text-xs sm:text-sm font-medium">
                              {student.firstName ? student.firstName.charAt(0) : 
                               (student.fullName ? student.fullName.charAt(0) : 
                                (student.email ? student.email.charAt(0).toUpperCase() : 'S'))}
                            </span>
                          </div>
                          <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                            <p className={`text-xs sm:text-sm font-medium truncate ${
                              isAlreadyEnrolled ? 'text-gray-500' : 'text-gray-900'
                            }`}>
                              {student.firstName && student.lastName
                                ? `${student.firstName} ${student.lastName}`
                                : (student.fullName || student.email || 'Unknown Student')
                              }
                              {isAlreadyEnrolled && (
                                <span className="ml-2 text-xs text-green-600 font-normal">
                                  (Already Enrolled)
                                </span>
                              )}
                            </p>
                            <p className={`text-xs truncate ${
                              isAlreadyEnrolled ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {student.email}
                            </p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <p className="text-xs sm:text-sm text-gray-600">
                {selectedStudents.length} student(s) selected
                {availableStudents.filter(s => s.classId === classData.id).length > 0 && (
                  <span className="ml-2 text-green-600">
                    ({availableStudents.filter(s => s.classId === classData.id).length} already enrolled)
                  </span>
                )}
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

// Remove Student Modal Component
const RemoveStudentModal = ({ classData, onClose, onRemove }) => {
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  useEffect(() => {
    loadEnrolledStudents();
  }, []);

  const loadEnrolledStudents = async () => {
    try {
      setLoadingStudents(true);
      const response = await usersService.getAllStudents();
      
      // Handle different response formats - extract students array
      let studentsArray = [];
      if (response && response.students && Array.isArray(response.students)) {
        studentsArray = response.students;
      } else if (Array.isArray(response)) {
        studentsArray = response;
      }
      
      // Filter only students enrolled in this class
      const enrolledInClass = studentsArray.filter(student => 
        student.classId === classData.id
      );
      
      // Map student data to include user properties at the top level
      const mappedStudents = enrolledInClass.map(student => ({
        id: student.id,
        firstName: student.user?.firstName,
        lastName: student.user?.lastName,
        email: student.user?.email,
        fullName: student.user?.fullName || (student.user?.firstName && student.user?.lastName ? `${student.user.firstName} ${student.user.lastName}` : null),
        birthDate: student.birthDate,
        parentId: student.parentId,
        classId: student.classId,
        role: student.user?.role
      }));
      
      setEnrolledStudents(mappedStudents);
    } catch (error) {
      console.error('Error loading enrolled students:', error);
      setEnrolledStudents([]);
      showErrorToast(error, 'Failed to load enrolled students. Please try again.');
    } finally {
      setLoadingStudents(false);
    }
  };

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
      showAlert({
        title: 'No Students Selected',
        message: 'Please select at least one student to remove',
        type: 'warning'
      });
      return;
    }
    
    // Confirm removal
    const confirmMessage = `Are you sure you want to remove ${selectedStudents.length} student(s) from this class?`;
    showConfirmation({
      title: 'Remove Students',
      message: confirmMessage,
      type: 'warning',
      confirmText: 'Remove Students',
      confirmButtonVariant: 'warning',
      onConfirm: () => {
        // Remove each selected student
        selectedStudents.forEach(studentId => {
          onRemove(studentId);
        });
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style={{margin: '0px'}}>
      <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-11/12 sm:w-2/3 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">
              Remove Students from {classData.name}
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
                Select students to remove from this class:
              </p>

              {loadingStudents ? (
                <p className="text-gray-500 text-center py-4 text-sm">
                  Loading enrolled students...
                </p>
              ) : enrolledStudents.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-sm">
                  No students are currently enrolled in this class
                </p>
              ) : (
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                  {enrolledStudents.map((student) => {
                    const isSelected = selectedStudents.includes(student.id);
                    
                    return (
                    <label
                      key={student.id}
                      className="flex items-center p-2 sm:p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                          checked={isSelected}
                        onChange={() => handleStudentToggle(student.id)}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      />
                      <div className="ml-3 flex items-center">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-start text-white text-xs sm:text-sm font-medium">
                            {student.firstName ? student.firstName.charAt(0) : 
                             (student.fullName ? student.fullName.charAt(0) : 
                              (student.email ? student.email.charAt(0).toUpperCase() : 'S'))}
                          </span>
                        </div>
                        <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                            {student.firstName && student.lastName
                              ? `${student.firstName} ${student.lastName}`
                              : (student.fullName || student.email || 'Unknown Student')
                            }
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {student.email}
                          </p>
                        </div>
                      </div>
                    </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <p className="text-xs sm:text-sm text-gray-600">
                {selectedStudents.length} student(s) selected for removal
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
                  className="px-3 sm:px-4 py-2 border-2 border-red-600 text-red-600 rounded-md hover:bg-red-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                >
                  Remove Students
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Level Up Students Modal Component
const LevelUpModal = ({ classData, onClose, onSubmit, showConfirmation, showAlert }) => {
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedTargetClass, setSelectedTargetClass] = useState('');
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(true);

  useEffect(() => {
    loadEnrolledStudents();
    loadAvailableClasses();
  }, []);

  const loadEnrolledStudents = async () => {
    try {
      setLoadingStudents(true);
      const response = await usersService.getAllStudents();
      
      // Handle different response formats - extract students array
      let studentsArray = [];
      if (response && response.students && Array.isArray(response.students)) {
        studentsArray = response.students;
      } else if (Array.isArray(response)) {
        studentsArray = response;
      }
      
      // Filter only students enrolled in this class
      const enrolledInClass = studentsArray.filter(student => 
        student.classId === classData.id
      );
      
      // Map student data to include user properties at the top level
      const mappedStudents = enrolledInClass.map(student => ({
        id: student.id,
        firstName: student.user?.firstName,
        lastName: student.user?.lastName,
        email: student.user?.email,
        fullName: student.user?.fullName || (student.user?.firstName && student.user?.lastName ? `${student.user.firstName} ${student.user.lastName}` : null),
        birthDate: student.birthDate,
        parentId: student.parentId,
        classId: student.classId,
        role: student.user?.role
      }));
      
      setEnrolledStudents(mappedStudents);
    } catch (error) {
      console.error('Error loading enrolled students:', error);
      setEnrolledStudents([]);
      showErrorToast(error, 'Failed to load enrolled students. Please try again.');
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadAvailableClasses = async () => {
    try {
      setLoadingClasses(true);
      const classesData = await classesService.getAllClasses();
      
      // Handle different response formats - convert object to array if needed
      let classesArray = [];
      if (Array.isArray(classesData)) {
        classesArray = classesData;
      } else if (classesData && typeof classesData === 'object') {
        classesArray = Object.values(classesData).filter(item => 
          item && typeof item === 'object' && item.id && !item._rateLimitInfo
        );
      }
      
      // Filter out the current class and sort by name
      const availableClasses = classesArray
        .filter(classItem => classItem.id !== classData.id)
        .sort((a, b) => a.name.localeCompare(b.name));
      
      setAvailableClasses(availableClasses);
    } catch (error) {
      console.error('Error loading classes:', error);
      setAvailableClasses([]);
      showErrorToast(error, 'Failed to load available classes. Please try again.');
    } finally {
      setLoadingClasses(false);
    }
  };

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
      showAlert({
        title: 'No Students Selected',
        message: 'Please select at least one student to level up',
        type: 'warning'
      });
      return;
    }
    if (!selectedTargetClass) {
      showAlert({
        title: 'No Target Class',
        message: 'Please select a target class',
        type: 'warning'
      });
      return;
    }
    
    // Confirm level up
    const confirmMessage = `Are you sure you want to move ${selectedStudents.length} student(s) from "${classData.name}" to the selected class?`;
    showConfirmation({
      title: 'Level Up Students',
      message: confirmMessage,
      type: 'warning',
      confirmText: 'Level Up Students',
      confirmButtonVariant: 'warning',
      onConfirm: () => {
        onSubmit(selectedStudents, selectedTargetClass);
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style={{margin: '0px'}}>
      <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-11/12 sm:w-2/3 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">
              Level Up Students from {classData.name}
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
            {/* Target Class Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Target Class
              </label>
              {loadingClasses ? (
                <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-500">
                  Loading classes...
                </div>
              ) : availableClasses.length === 0 ? (
                <div className="px-3 py-2 border border-gray-300 rounded-md bg-yellow-50 text-sm text-yellow-700">
                  No other classes available for level up
                </div>
              ) : (
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  value={selectedTargetClass}
                  onChange={(e) => setSelectedTargetClass(e.target.value)}
                >
                  <option value="">Choose a class to move students to</option>
                  {availableClasses.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.name} - {classItem.price || 0} USD
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Students Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Students to Level Up
              </label>

              {loadingStudents ? (
                <p className="text-gray-500 text-center py-4 text-sm">
                  Loading enrolled students...
                </p>
              ) : enrolledStudents.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-sm">
                  No students are currently enrolled in this class
                </p>
              ) : (
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                  {enrolledStudents.map((student) => {
                    const isSelected = selectedStudents.includes(student.id);
                    
                    return (
                      <label
                        key={student.id}
                        className="flex items-center p-2 sm:p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleStudentToggle(student.id)}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <div className="ml-3 flex items-center">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-start text-white text-xs sm:text-sm font-medium">
                              {student.firstName ? student.firstName.charAt(0) : 
                               (student.fullName ? student.fullName.charAt(0) : 
                                (student.email ? student.email.charAt(0).toUpperCase() : 'S'))}
                            </span>
                          </div>
                          <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                              {student.firstName && student.lastName
                                ? `${student.firstName} ${student.lastName}`
                                : (student.fullName || student.email || 'Unknown Student')
                              }
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {student.email}
                            </p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <p className="text-xs sm:text-sm text-gray-600">
                {selectedStudents.length} student(s) selected for level up
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
                  disabled={selectedStudents.length === 0 || !selectedTargetClass}
                  className="px-3 sm:px-4 py-2 border-2 border-green-600 text-green-600 rounded-md hover:bg-purple-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                >
                  Level Up Students
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