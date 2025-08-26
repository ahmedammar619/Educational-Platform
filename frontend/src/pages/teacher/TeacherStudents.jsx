import { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Eye, Edit, Trash2, AlertCircle } from 'lucide-react';
import { getMockData } from '../../data/mockData';

const TeacherStudents = ({ user }) => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      // Use mock data since there's no backend endpoint for teacher students
      const mockStudents = [
        {
          id: '1',
          firstName: 'Aisha',
          lastName: 'Al-Mahmoud',
          email: 'aisha.almahmoud@example.com',
          enrolledClasses: ['Islamic Studies - Level 1', 'Arabic Language - Beginner'],
          attendanceRate: 85,
          progress: 75,
          lastActive: '2024-05-15T10:30:00Z'
        },
        {
          id: '2',
          firstName: 'Hassan',
          lastName: 'Al-Rahman',
          email: 'hassan.alrahman@example.com',
          enrolledClasses: ['Islamic Studies - Level 1'],
          attendanceRate: 92,
          progress: 88,
          lastActive: '2024-05-14T14:15:00Z'
        },
        {
          id: '3',
          firstName: 'Zara',
          lastName: 'Al-Saadi',
          email: 'zara.alsaadi@example.com',
          enrolledClasses: ['Arabic Language - Beginner'],
          attendanceRate: 78,
          progress: 65,
          lastActive: '2024-05-13T09:45:00Z'
        }
      ];
      
      setStudents(mockStudents);
      setFilteredStudents(mockStudents);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      setStudents([]);
      setFilteredStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceRate = (studentId) => {
    // Get attendance rate from mock data
    const student = students.find(s => s.id === studentId);
    return student ? student.attendanceRate : 0;
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    filterStudents(value, selectedFilter);
  };

  const handleFilter = (filter) => {
    setSelectedFilter(filter);
    filterStudents(searchTerm, filter);
  };

  const filterStudents = (search, filter) => {
    let filtered = students;

    // Apply search filter
    if (search) {
      filtered = filtered.filter(student =>
        student.firstName.toLowerCase().includes(search.toLowerCase()) ||
        student.lastName.toLowerCase().includes(search.toLowerCase()) ||
        student.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply category filter
    if (filter !== 'all') {
      filtered = filtered.filter(student => {
        if (filter === 'high-attendance') return student.attendanceRate >= 90;
        if (filter === 'medium-attendance') return student.attendanceRate >= 70 && student.attendanceRate < 90;
        if (filter === 'low-attendance') return student.attendanceRate < 70;
        if (filter === 'high-progress') return student.progress >= 80;
        if (filter === 'medium-progress') return student.progress >= 60 && student.progress < 80;
        if (filter === 'low-progress') return student.progress < 60;
        return true;
      });
    }

    setFilteredStudents(filtered);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
          <p className="text-gray-600">Manage and monitor your students' progress</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={selectedFilter}
          onChange={(e) => handleFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="all">All Students</option>
          <option value="high-attendance">High Attendance (90%+)</option>
          <option value="medium-attendance">Medium Attendance (70-89%)</option>
          <option value="low-attendance">Low Attendance (&lt;70%)</option>
          <option value="high-progress">High Progress (80%+)</option>
          <option value="medium-progress">Medium Progress (60-79%)</option>
          <option value="low-progress">Low Progress (&lt;60%)</option>
        </select>
      </div>

      {/* Students List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enrolled Classes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-semibold">
                          {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {student.enrolledClasses.join(', ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            student.attendanceRate >= 90 ? 'bg-green-600' :
                            student.attendanceRate >= 70 ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${student.attendanceRate}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm font-medium ${
                        student.attendanceRate >= 90 ? 'text-green-600' :
                        student.attendanceRate >= 70 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {student.attendanceRate}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            student.progress >= 80 ? 'bg-green-600' :
                            student.progress >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${student.progress}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm font-medium ${
                        student.progress >= 80 ? 'text-green-600' :
                        student.progress >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {student.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(student.lastActive).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
          <p className="text-gray-500">
            {searchTerm || selectedFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'No students are currently enrolled in your classes.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default TeacherStudents;
