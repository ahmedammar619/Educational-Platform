import React, { useState, useEffect } from 'react';
import { teachersService, usersService, coursesService } from '../../services';

const TeacherStudents = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClass, setSelectedClass] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all required data in parallel
      const [studentsResponse, classesResponse] = await Promise.all([
        teachersService.getTeacherStudents(),
        teachersService.getTeacherClasses()
      ]);
      
      setStudents(studentsResponse.students || []);
      setClasses(classesResponse.classes || []);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const getStudentClasses = (studentId) => {
    return classes.filter(cls => 
      cls.students && cls.students.includes(studentId)
    );
  };

  const getAttendanceRate = (studentId) => {
    // TODO: Implement proper attendance calculation from backend
    // This should fetch actual attendance data from the backend
    // For now, returning a placeholder value
    return 0; // Will be replaced with real data when backend is implemented
  };

  const getAttendanceColor = (rate) => {
    if (rate >= 90) return 'bg-green-500';
    if (rate >= 80) return 'bg-yellow-500';
    if (rate >= 70) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = selectedClass === 'all' || 
                        getStudentClasses(student.id).some(cls => cls.id === selectedClass);
    
    return matchesSearch && matchesClass;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchData} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Students</h1>
          <p className="text-gray-600">View and manage your enrolled students across all classes</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Students</label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Classes</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Students List */}
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
            <p className="text-gray-500">
              {searchTerm || selectedClass !== 'all' 
                ? 'Try adjusting your search criteria or filters.'
                : 'You don\'t have any students enrolled yet.'
              }
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Students ({filteredStudents.length})
              </h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              {filteredStudents.map((student) => {
                const studentClasses = getStudentClasses(student.id);
                
                return (
                  <div key={student.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-lg font-medium text-blue-600">
                            {student.firstName?.charAt(0) || student.email?.charAt(0) || 'S'}
                          </span>
                        </div>
                        
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {student.firstName && student.lastName 
                              ? `${student.firstName} ${student.lastName}`
                              : student.email
                            }
                          </h4>
                          <p className="text-sm text-gray-600">{student.email}</p>
                          <p className="text-xs text-gray-500">
                            Enrolled in {studentClasses.length} class{studentClasses.length !== 1 ? 'es' : ''}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm text-gray-500">Attendance:</span>
                          <div className="flex items-center space-x-1">
                            <div className={`w-3 h-3 rounded-full ${getAttendanceColor(getAttendanceRate(student.id))}`}></div>
                            <span className="text-sm font-medium text-gray-900">
                              {getAttendanceRate(student.id)}%
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => window.location.href = `/teacher/students/${student.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                    
                    {/* Student's Classes */}
                    {studentClasses.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Enrolled Classes:</h5>
                        <div className="flex flex-wrap gap-2">
                          {studentClasses.map(cls => (
                            <span
                              key={cls.id}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {cls.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {students.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-2xl font-bold text-blue-600">{students.length}</div>
              <div className="text-sm text-gray-600">Total Students</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-2xl font-bold text-green-600">{classes.length}</div>
              <div className="text-sm text-gray-600">Active Classes</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(students.reduce((acc, student) => acc + getAttendanceRate(student.id), 0) / students.length)}%
              </div>
              <div className="text-sm text-gray-600">Average Attendance</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherStudents;
