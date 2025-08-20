import { useState, useEffect } from 'react';
import { Users, Clock, Calendar, BookOpen, Plus, Edit, Eye, MessageSquare, User, DollarSign, X } from 'lucide-react';
import { mockClasses, mockUsers } from '../../data/mockData';

const TeacherClasses = ({ user }) => {
  const [classes, setClasses] = useState([]);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedClassForModal, setSelectedClassForModal] = useState(null);

  useEffect(() => {
    loadClasses();
  }, [user]);

  const loadClasses = () => {
    if (user && user.id) {
      console.log('TeacherClasses - User object:', user);
      console.log('TeacherClasses - User ID:', user.id);
      // Get classes taught by this teacher
      const teacherClasses = mockClasses.filter(c => c.teacherId === user.id);
      console.log('TeacherClasses - Found classes:', teacherClasses);
      setClasses(teacherClasses);
    } else {
      console.log('TeacherClasses - No user object');
    }
  };

  const getStudentDetails = (studentIds) => {
    return studentIds.map(id =>
      mockUsers.students.find(student => student.id === id)
    ).filter(Boolean);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Classes</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your classes and track student progress</p>
        </div>
      </div>

      {/* Classes List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 sm:p-6 border-b">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">All Classes</h2>
        </div>
        <div className="p-4 sm:p-6">
          {classes.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm sm:text-base text-gray-600">No classes assigned yet</p>
              <p className="text-xs sm:text-sm text-gray-500">Create your first class to get started</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {classes.map((classItem) => (
                <div
                  key={classItem.id}
                  className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all w-full p-3 sm:p-4 flex flex-col gap-3 sm:gap-4"
                >
                  {/* Top Row - Name, Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">{classItem.name}</h3>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setSelectedClassForModal(classItem);
                          setShowStudentModal(true);
                        }}
                        className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-colors"
                        title="View Students"
                      >
                        <Users className="h-4 w-4" />
                      </button>
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
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" /> Schedule
                      </p>
                      <p className="font-medium text-gray-900 text-sm sm:text-base">
                        {classItem.schedule && Array.isArray(classItem.schedule)
                          ? classItem.schedule.map(item => `${item.day} ${item.startTime}-${item.endTime}`).join(', ')
                          : 'Schedule TBD'
                        }
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" /> Duration
                      </p>
                      <p className="font-medium text-gray-900 text-sm sm:text-base">{classItem.sessionDuration || 120} min</p>
                    </div>

                    <div className="text-center">
                      <button
                        onClick={() => {
                          console.log('Class material clicked for:', classItem.name);
                        }}
                        className="w-full sm:w-auto px-3 py-2 border-2 border-blue-600 text-blue-600 font-semibold text-xs rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-200 uppercase"
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
      </div>

      {/* Student Modal */}
      {showStudentModal && selectedClassForModal && (
        <StudentModal
          classData={selectedClassForModal}
          onClose={() => {
            setShowStudentModal(false);
            setSelectedClassForModal(null);
          }}
        />
      )}
    </div>
  );
};

// Student Modal Component
const StudentModal = ({ classData, onClose }) => {
  const students = classData.students || [];

  const getParentDetails = (parentId) => {
    return mockUsers.parents.find(parent => parent.id === parentId) || {
      id: parentId,
      firstName: 'Unknown',
      lastName: 'Parent',
      fullName: 'Unknown Parent',
      email: 'unknown@example.com'
    };
  };

  const groupStudentsByParent = (students) => {
    const grouped = {};

    students.forEach(studentId => {
      const student = mockUsers.students.find(s => s.id === studentId);
      if (student && student.parentId) {
        const parentId = student.parentId;
        if (!grouped[parentId]) {
          grouped[parentId] = {
            parent: getParentDetails(parentId),
            students: []
          };
        }
        grouped[parentId].students.push(student);
      }
    });

    // Convert to array and sort by parent name
    return Object.values(grouped).sort((a, b) =>
      `${a.parent.firstName} ${a.parent.lastName}`.localeCompare(`${b.parent.firstName} ${b.parent.lastName}`)
    );
  };

  const getAttendanceRate = (studentId) => {
    // Mock attendance data - in real app this would come from database
    const attendanceRates = {
      201: 95, // Ahmad Al-Noor
      202: 88, // Fatima Al-Zahra
      203: 92, // Yusuf Al-Salam
      204: 78, // Maryam Al-Siddiq
      205: 85, // Omar Al-Khattab
      206: 90, // John Student
    };

    return attendanceRates[studentId] || Math.floor(Math.random() * 30) + 70;
  };

  const getAttendanceColor = (rate) => {
    if (rate >= 90) return 'bg-green-500';
    if (rate >= 80) return 'bg-yellow-500';
    if (rate >= 70) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const groupedStudents = groupStudentsByParent(students);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style={{ margin: 0 }}>
      <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-11/12 sm:w-3/4 md:w-1/2 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900">
                Students in {classData.name}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {groupedStudents.map((group, groupIndex) => (
              <div key={group.parent.id} className="border rounded-lg overflow-hidden">
                {/* Parent Header */}
                <div className="bg-blue-50 px-3 py-3 border-b">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="text-start min-w-0 flex-1">
                      <h4 className="font-semibold text-blue-900 text-sm sm:text-base">
                        {group.parent.firstName} {group.parent.lastName}
                      </h4>
                      <p className="text-xs sm:text-sm text-blue-700">{group.parent.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="text-green-600 hover:text-green-900 text-xs sm:text-sm font-medium px-3 py-2 rounded-lg hover:bg-green-50 transition-colors">
                        <MessageSquare className="h-4 w-4 inline mr-1" />
                        Contact
                      </button>
                      {group.students.length > 1 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {group.students.length} Student{group.students.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Students List */}
                <div className="divide-y">
                  {group.students.map((student, studentIndex) => (
                    <div key={student.id} className="px-3 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-medium text-sm sm:text-base">
                              {student.firstName ? student.firstName.charAt(0) : student.fullName.charAt(0)}
                            </span>
                          </div>
                          {group.students.length > 1 && studentIndex === 0 && (
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-3 bg-blue-300 rounded-full"></div>
                          )}
                        </div>
                        <div className="text-start min-w-0 flex-1">
                          <h5 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                            {student.firstName && student.lastName
                              ? `${student.firstName} ${student.lastName}`
                              : student.fullName
                            }
                          </h5>
                          <p className="text-xs sm:text-sm text-gray-500">{student.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Attendance</p>
                          <div className="flex items-center gap-1">
                            <div className={`w-3 h-3 rounded-full ${getAttendanceColor(getAttendanceRate(student.id))}`}></div>
                            <span className="text-xs font-medium text-gray-900">
                              {getAttendanceRate(student.id)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherClasses;