import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Calendar, DollarSign, BookOpen, Search, Filter, User, X, ChevronDown, ChevronRight } from 'lucide-react';
import { mockUsers } from '../../data/mockData';

// Mock data for the new structure
const mockClasses = [
  {
    id: '1',
    name: 'Islamic Studies Program 2024',
    startDate: '2024-03-01',
    endDate: '2024-06-30',
    price: 450.00,
    numberOfStudents: 12,
    courses: [
      {
        id: 'c1',
        name: 'Islamic Studies - Level 1',
        teacherName: 'Ahmed Al-Rashid',
        sessionTime: [
          { day: 'Monday', startTime: '09:00', endTime: '10:30' },
          { day: 'Wednesday', startTime: '09:00', endTime: '10:30' }
        ]
      },
      {
        id: 'c2',
        name: 'Arabic Language - Beginner',
        teacherName: 'Yusuf Al-Khalil',
        sessionTime: [
          { day: 'Tuesday', startTime: '14:00', endTime: '15:30' },
          { day: 'Thursday', startTime: '14:00', endTime: '15:30' }
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'Advanced Islamic Education',
    startDate: '2024-04-01',
    endDate: '2024-08-31',
    price: 600.00,
    numberOfStudents: 8,
    courses: [
      {
        id: 'c3',
        name: 'Quran Recitation - Tajweed',
        teacherName: 'Ahmed Al-Rashid',
        sessionTime: [
          { day: 'Sunday', startTime: '10:00', endTime: '11:30' },
          { day: 'Thursday', startTime: '10:00', endTime: '11:30' }
        ]
      },
      {
        id: 'c4',
        name: 'Islamic History & Culture',
        teacherName: 'Yusuf Al-Khalil',
        sessionTime: [
          { day: 'Saturday', startTime: '15:00', endTime: '16:30' }
        ]
      }
    ]
  }
];

const ClassManagement = ({ user, onOpenMaterials }) => {
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
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    loadMockClasses();
  }, []);

  useEffect(() => {
    filterClasses();
  }, [filters, classes]);

  const loadMockClasses = () => {
    setLoading(true);
    setClasses(mockClasses || []);
    setLoading(false);
  };

  const filterClasses = () => {
    let filtered = [...classes];

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(classItem => {
        return classItem.name.toLowerCase().includes(filters.search.toLowerCase());
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

  const handleCreateClass = (classData) => {
    const newClass = {
      id: Date.now().toString(),
      name: classData.name,
      startDate: classData.startDate,
      endDate: classData.endDate,
      price: classData.price,
      numberOfStudents: 0,
      status: 'active',
      courses: []
    };

    setClasses(prev => [...prev, newClass]);
    setShowCreateClassModal(false);
    alert('Class created successfully!');
  };

  const handleCreateCourse = (courseData) => {
    if (!selectedClass) return;

    const newCourse = {
      id: Date.now().toString(),
      name: courseData.name,
      startDate: selectedClass.startDate,
      endDate: selectedClass.endDate,
      teacherName: courseData.teacherName,
      courseMaterial: courseData.courseMaterial,
      sessionTime: courseData.sessions
    };

    setClasses(prev => prev.map(classItem => {
      if (classItem.id === selectedClass.id) {
        return {
          ...classItem,
          courses: [...classItem.courses, newCourse]
        };
      }
      return classItem;
    }));

    setShowCreateCourseModal(false);
    setSelectedClass(null);
    alert('Course created successfully!');
  };

  const handleUpdateClass = (classId, classData) => {
    setClasses(prev => prev.map(classItem => {
      if (classItem.id === classId) {
        return {
          ...classItem,
          name: classData.name,
          startDate: classData.startDate,
          endDate: classData.endDate,
          price: classData.price
        };
      }
      return classItem;
    }));
    setShowEditClassModal(false);
    setSelectedClass(null);
    alert('Class updated successfully!');
  };

  const handleUpdateCourse = (classId, courseId, courseData) => {
    setClasses(prev => prev.map(classItem => {
      if (classItem.id === classId) {
        return {
          ...classItem,
          courses: classItem.courses.map(course => {
            if (course.id === courseId) {
              return {
                ...course,
                name: courseData.name,
                teacherName: courseData.teacherName,
                courseMaterial: courseData.courseMaterial,
                sessionTime: courseData.sessions
              };
            }
            return course;
          })
        };
      }
      return classItem;
    }));
    setShowEditCourseModal(false);
    setSelectedClass(null);
    setSelectedCourse(null);
    alert('Course updated successfully!');
  };

  const handleDeleteClass = (classId) => {
    if (!confirm('Are you sure you want to delete this class? This will also delete all courses within it.')) return;

    setClasses(prev => prev.filter(classItem => classItem.id !== classId));
    alert('Class deleted successfully!');
  };

  const handleDeleteCourse = (classId, courseId) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    setClasses(prev => prev.map(classItem => {
      if (classItem.id === classId) {
        return {
          ...classItem,
          courses: classItem.courses.filter(course => course.id !== courseId)
        };
      }
      return classItem;
    }));
    alert('Course deleted successfully!');
  };

  const handleEnrollStudents = (classId, studentIds) => {
    setClasses(prev => prev.map(classItem => {
      if (classItem.id === classId) {
        return {
          ...classItem,
          numberOfStudents: studentIds.length
        };
      }
      return classItem;
    }));
    setShowEnrollModal(false);
    setSelectedClass(null);
    alert('Students enrolled successfully!');
  };

  return (
    <div className="space-y-4 sm:space-y-6 h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Management</h1>
          <p className="text-gray-600">Manage classes and their courses</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateClassModal(true)}
            className="flex items-center justify-center space-x-2 border-2 border-green-600 text-green-600 px-4 py-2 rounded-lg hover:bg-green-600 hover:text-white transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>Add Class</span>
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

                    {/* Class Actions */}
                    <div className="flex items-center gap-2">
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
                        className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete Class"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Class Info */}
                  <div className="mt-4 grid grid-cols-4 gap-4">
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
                        <DollarSign className="h-3 w-3 text-gray-400" /> Price
                      </p>
                      <p className="font-medium text-gray-900 text-sm">{classItem.price}</p>
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
                      <h4 className="text-lg font-semibold text-gray-800">Courses ({classItem.courses.length})</h4>
                    </div>

                    {classItem.courses.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No courses added yet. Click the + button to add a course.</p>
                    ) : (
                      <div className="space-y-3">
                        {classItem.courses.map((course) => (
                          <div key={course.id} className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <h5 className="font-semibold text-gray-900">{course.name}</h5>
                                <span className="text-gray-400">|</span>
                                <div className="flex items-center gap-1">
                                  <User className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm text-gray-600">{course.teacherName}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedClass(classItem);
                                    setSelectedCourse(course);
                                    setShowEditCourseModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                                  title="Edit Course"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCourse(classItem.id, course.id)}
                                  className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                                  title="Delete Course"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
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
        />
      )}

      {/* Create Course Modal */}
      {showCreateCourseModal && selectedClass && (
        <CourseModal
          title="Add New Course"
          onClose={() => {
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
          onClose={() => {
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
    </div>
  );
};

// Class Modal Component
const ClassModal = ({ title, classData, onClose, onSubmit }) => {
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
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                required
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
                className="px-4 py-2 border-2 border-green-600 text-green-600 rounded-md hover:bg-green-500 hover:text-white transition-all duration-200 text-sm"
              >
                {classData ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Course Modal Component (using the old class design)
const CourseModal = ({ title, courseData, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: courseData?.name || '',
    teacherName: courseData?.teacherName || '',
    courseMaterial: courseData?.courseMaterial || '',
    sessions: courseData?.sessionTime || []
  });

  useEffect(() => {
    setFormData({
      name: courseData?.name || '',
      teacherName: courseData?.teacherName || '',
      courseMaterial: courseData?.courseMaterial || '',
      sessions: courseData?.sessionTime || []
    });
  }, [courseData]);

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
      alert('End time must be after start time');
      return;
    }

    const sessionExists = formData.sessions.some(session =>
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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.sessions.length === 0) {
      alert('Please add at least one session');
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 sm:top-10 mx-auto p-4 sm:p-5 border w-11/12 sm:w-96 shadow-lg rounded-md bg-white">
        <div className="mt-1">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">{title}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Course Name</label>
              <input
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Teacher Name</label>
              <input
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={formData.teacherName}
                onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Course Material</label>
              <textarea
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows="3"
                value={formData.courseMaterial}
                onChange={(e) => setFormData({ ...formData, courseMaterial: e.target.value })}
              />
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
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 transition-colors"
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
                  className="w-full p-2 sm:p-3 border-2 border-dashed border-green-300 rounded-md text-green-600 hover:border-green-400 hover:text-green-700 transition-colors text-sm"
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
                className="px-3 sm:px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 sm:px-4 py-2 border-2 border-green-600 text-green-600 rounded-md hover:bg-green-500 hover:text-white transition-all duration-200 text-sm"
              >
                {courseData ? 'Update' : 'Create'}
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

  // Get available students
  const availableStudents = mockUsers.filter(user => user.role === 'student');

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
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="ml-3 flex items-center">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
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