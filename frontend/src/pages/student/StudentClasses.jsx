import { useState, useEffect } from 'react';
import { BookOpen, Clock, User, MapPin, Calendar, CheckCircle, Users, Search, Filter } from 'lucide-react';
import { mockClasses, mockUsers } from '../../data/mockData';

const StudentClasses = ({ user }) => {
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const loadStudentClasses = () => {
    setLoading(true);
    
    // For demo purposes, let's show classes that have students enrolled
    // In a real app, this would filter by the actual student ID
    const studentId = user?.id || 201; // Default to Ahmad Al-Noor for demo
    
    // Get classes where this student is enrolled
    const studentClasses = mockClasses.filter(cls => 
      cls.students && cls.students.includes(studentId)
    );
    
    // If no classes found for this student, show some sample classes for demo
    if (studentClasses.length === 0) {
      // Show classes that have students (for demo purposes)
      const demoClasses = mockClasses.filter(cls => cls.students && cls.students.length > 0);
      setEnrolledClasses(demoClasses);
    } else {
      setEnrolledClasses(studentClasses);
    }
    
    setLoading(false);
  };

  const filterClasses = () => {
    let filtered = [...enrolledClasses];

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(classItem =>
        classItem.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        classItem.teacher.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Apply teacher filter
    if (filters.teacher) {
      filtered = filtered.filter(classItem =>
        classItem.teacher.toLowerCase().includes(filters.teacher.toLowerCase())
      );
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
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Classes</h1>
          <p className="text-sm sm:text-base text-gray-600">View your enrolled classes and progress</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search classes..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            />
          </div>

          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={filters.teacher}
            onChange={(e) => setFilters({ ...filters, teacher: e.target.value, page: 1 })}
          >
            <option value="">All Teachers</option>
            {mockUsers.teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.name}>
                {teacher.name}
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
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Enrolled</h3>
          <p className="text-gray-600">You haven't enrolled in any classes yet.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 sm:space-y-4">
            {filteredClasses.map((classItem) => (
              <div
                key={classItem.id}
                className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all w-full p-3 sm:p-4 flex flex-col gap-3 sm:gap-4"
              >
                {/* Top Row - Name, Teacher */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">{classItem.name}</h3>
                    </div>
                    <span className="hidden sm:inline text-sm text-gray-500">|</span>
                    <p className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1">
                      <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                      {classItem.teacher}
                    </p>
                  </div>
                </div>

                {/* Bottom Row - Students, Date, Class Material */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center w-full gap-3 sm:gap-0">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" /> Students
                    </p>
                    <p className="font-medium text-gray-900 text-sm sm:text-base">{classItem.students?.length || 0}</p>
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" /> Date & Time
                    </p>
                    <p className="font-medium text-gray-900 text-xs sm:text-sm">{classItem.schedule}</p>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={() => {
                        // Handle class material click
                        console.log('Class material clicked for:', classItem.name);
                      }}
                      className="w-full sm:w-auto px-3 py-2 border-2 border-red-600 text-red-600 font-semibold text-xs rounded-lg hover:bg-red-600 hover:text-white transition-all duration-200 uppercase"
                    >
                      Class Material
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="bg-white px-3 sm:px-4 py-3 flex items-center justify-between border-t border-gray-200 mt-6 rounded-b-lg">
              {/* Mobile */}
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                  disabled={filters.page === 1}
                  className="px-3 sm:px-4 py-2 border-2 border-green-600 text-green-600 text-xs sm:text-sm rounded-md bg-white hover:bg-green-50 disabled:opacity-50 transition-all duration-200"
                >
                  Previous
                </button>
                <button
                  onClick={() => setFilters({ ...filters, page: Math.min(pagination?.pages || 1, filters.page + 1) })}
                  disabled={filters.page === (pagination?.pages || 1)}
                  className="px-3 sm:px-4 py-2 border-2 border-green-600 text-green-600 text-xs sm:text-sm rounded-md bg-white hover:bg-green-50 disabled:opacity-50 transition-all duration-200"
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
    </div>
  );
};

export default StudentClasses;