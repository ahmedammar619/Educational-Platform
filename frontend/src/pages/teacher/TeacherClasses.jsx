import { useState, useEffect } from 'react';
import { Users, Clock, Calendar, BookOpen, Plus, Edit, Eye, MessageSquare, User, DollarSign, X, ChevronDown, ChevronRight } from 'lucide-react';
import { mockCourses, mockUsers } from '../../data/mockData';
import MaterialPages from '../../components/common/class-material/MaterialPages';

// Mock data for the new class structure (matching ClassManagement.jsx)
const mockClasses = [
  {
    id: '1',
    name: 'Islamic Studies Program 2024',
    startDate: '2024-03-01',
    endDate: '2024-06-30',
    price: 450.00,
    numberOfStudents: 12,
    status: 'active',
    courses: [
      {
        id: 'c1',
        name: 'Islamic Studies - Level 1',
        startDate: '2024-03-01',
        endDate: '2024-06-30',
        teacherName: 'Current Teacher', // This will match any teacher
        courseMaterial: 'Quran, Hadith, Islamic History',
        sessionTime: [
          { day: 'Monday', startTime: '09:00', endTime: '10:30' },
          { day: 'Wednesday', startTime: '09:00', endTime: '10:30' }
        ]
      },
      {
        id: 'c2',
        name: 'Arabic Language - Beginner',
        startDate: '2024-03-01',
        endDate: '2024-06-30',
        teacherName: 'Current Teacher', // This will match any teacher
        courseMaterial: 'Arabic Alphabet, Vocabulary',
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
    status: 'active',
    courses: [
      {
        id: 'c3',
        name: 'Quran Recitation - Tajweed',
        startDate: '2024-04-01',
        endDate: '2024-08-31',
        teacherName: 'Current Teacher', // This will match any teacher
        courseMaterial: 'Quran Text, Tajweed Rules',
        sessionTime: [
          { day: 'Sunday', startTime: '10:00', endTime: '11:30' },
          { day: 'Thursday', startTime: '10:00', endTime: '11:30' }
        ]
      },
      {
        id: 'c4',
        name: 'Islamic History & Culture',
        startDate: '2024-04-01',
        endDate: '2024-08-31',
        teacherName: 'Current Teacher', // This will match any teacher
        courseMaterial: 'History Books, Cultural Resources',
        sessionTime: [
          { day: 'Saturday', startTime: '15:00', endTime: '16:30' }
        ]
      }
    ]
  }
];

const TeacherClasses = ({ user }) => {
  const [classes, setClasses] = useState([]);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showMaterialPages, setShowMaterialPages] = useState(false);
  const [selectedClassForModal, setSelectedClassForModal] = useState(null);
  const [selectedClassForMaterial, setSelectedClassForMaterial] = useState(null);
  const [expandedClasses, setExpandedClasses] = useState(new Set());

  useEffect(() => {
    loadClasses();
  }, [user]);

  const loadClasses = () => {
    console.log('Loading classes for user:', user); // Debug log

    if (user && user.role === 'teacher') {
      // For demo purposes, show all classes if user is a teacher
      // This ensures teachers can see classes regardless of name matching
      setClasses(mockClasses);
      console.log('Teacher user detected, showing all classes:', mockClasses.length); // Debug log
    } else if (user && user.id) {
      // Get classes where this teacher teaches any course
      // Check multiple possible teacher name formats
      const teacherClasses = mockClasses.filter(classItem =>
        classItem.courses.some(course =>
          course.teacherName === user.name ||
          course.teacherName === 'Current Teacher' ||
          course.teacherName === `${user.firstName} ${user.lastName}` ||
          course.teacherName === user.fullName
        )
      );
      setClasses(teacherClasses);
      console.log('Filtered classes for user:', teacherClasses.length); // Debug log
    } else {
      // Fallback: show all classes if no user is provided
      setClasses(mockClasses);
      console.log('No user provided, showing all classes:', mockClasses.length); // Debug log
    }
  };

  const getStudentDetails = (studentIds) => {
    return studentIds.map(id =>
      mockUsers.find(student => student.id === id && student.role === 'student')
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

  const toggleClassExpansion = (classId) => {
    const newExpanded = new Set(expandedClasses);
    if (newExpanded.has(classId)) {
      newExpanded.delete(classId);
    } else {
      newExpanded.add(classId);
    }
    setExpandedClasses(newExpanded);
  };

  const getTeacherCourses = (classItem) => {
    if (!user) return [];

    // For demo purposes, if user is a teacher, show all courses
    if (user.role === 'teacher') {
      return classItem.courses;
    }

    return classItem.courses.filter(course =>
      course.teacherName === user.name ||
      course.teacherName === 'Current Teacher' ||
      course.teacherName === `${user.firstName} ${user.lastName}` ||
      course.teacherName === user.fullName
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 h-full">
      {!showMaterialPages ? (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Classes</h1>
              <p className="text-sm sm:text-base text-gray-600">Manage your classes and track student progress</p>
            </div>
          </div>

          {/* Classes List */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 sm:p-6">
              {classes.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm sm:text-base text-gray-600">No classes assigned yet</p>
                  <p className="text-xs sm:text-sm text-gray-500">Contact admin to get assigned to classes</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {classes.map((classItem) => (
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
                            <h4 className="text-lg font-semibold text-gray-800">My Courses ({getTeacherCourses(classItem).length})</h4>
                          </div>

                          {getTeacherCourses(classItem).length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No courses assigned to you in this class.</p>
                          ) : (
                            <div className="space-y-3">
                              {getTeacherCourses(classItem).map((course) => (
                                <div key={course.id} className="bg-white rounded-lg border border-gray-200 p-4">
                                  <div className="mb-3">
                                    <h5 className="text-start font-semibold text-gray-900">{course.name}</h5>
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
                                        onClick={() => {
                                          setSelectedClassForMaterial(course);
                                          setShowMaterialPages(true);
                                        }}
                                        className="px-3 py-2 border-2 border-blue-600 text-blue-600 font-semibold text-xs rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-200 uppercase"
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
        </>
      ) : (
        <MaterialPages
          classData={selectedClassForMaterial}
          onBack={() => {
            setShowMaterialPages(false);
            setSelectedClassForMaterial(null);
          }}
          currentUser={user}
        />
      )}
    </div>
  );
};

// Student Modal Component
const StudentModal = ({ classData, onClose }) => {
  // Mock students with parent relationships
  const students = [
    {
      id: '4',
      firstName: 'Aisha',
      lastName: 'Al-Mahmoud',
      email: 'aisha.almahmoud@example.com',
      parentId: '3' // Has parent
    },
    {
      id: '6',
      firstName: 'Hassan',
      lastName: 'Al-Rahman',
      email: 'hassan.alrahman@example.com',
      parentId: '3' // Same parent as Aisha
    },
    {
      id: '8',
      firstName: 'Zainab',
      lastName: 'Al-Fatima',
      email: 'zainab.alfatima@example.com'
      // No parentId - individual student
    }
  ];

  const getParentDetails = (parentId) => {
    return mockUsers.find(parent => parent.id === parentId && parent.role === 'parent') || {
      id: parentId,
      firstName: 'Unknown',
      lastName: 'Parent',
      fullName: 'Unknown Parent',
      email: 'unknown@example.com'
    };
  };

  const groupStudentsByParent = (students) => {
    const grouped = {};
    const individualStudents = [];

    students.forEach(student => {
      if (student.parentId) {
        // Student has a parent - group under parent
        const parentId = student.parentId;
        if (!grouped[parentId]) {
          grouped[parentId] = {
            parent: getParentDetails(parentId),
            students: []
          };
        }
        grouped[parentId].students.push(student);
      } else {
        // Student has no parent - add to individual students
        individualStudents.push(student);
      }
    });

    // Convert to array and sort by parent name, then add individual students at the end
    const parentGroups = Object.values(grouped).sort((a, b) =>
      `${a.parent.firstName} ${a.parent.lastName}`.localeCompare(`${b.parent.firstName} ${b.parent.lastName}`)
    );

    // Add individual students as separate entries
    const result = [...parentGroups];
    individualStudents.forEach(student => {
      result.push({
        parent: null, // No parent
        students: [student],
        isIndividual: true
      });
    });

    return result;
  };

  const getAttendanceRate = (studentId) => {
    // Mock attendance data - in real app this would come from database
    const attendanceRates = {
      '4': 95, // Aisha Al-Mahmoud
      '6': 88, // Hassan Al-Rahman
      '8': 92, // Zainab Al-Fatima
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
              <div key={group.isIndividual ? `individual-${group.students[0].id}` : group.parent.id} className="border rounded-lg overflow-hidden">
                {/* Parent Header - only show for groups with parents */}
                {!group.isIndividual && (
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
                          Contact Parent
                        </button>
                        {group.students.length > 1 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {group.students.length} Student{group.students.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Students List */}
                <div className={group.isIndividual ? "" : "divide-y"}>
                  {group.students.map((student, studentIndex) => (
                    <div key={student.id} className="px-3 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-medium text-sm sm:text-base">
                              {student.firstName ? student.firstName.charAt(0) : student.name?.charAt(0) || 'S'}
                            </span>
                          </div>
                          {!group.isIndividual && group.students.length > 1 && studentIndex === 0 && (
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-3 bg-blue-300 rounded-full"></div>
                          )}
                        </div>
                        <div className="text-start min-w-0 flex-1">
                          <h5 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                            {student.firstName && student.lastName
                              ? `${student.firstName} ${student.lastName}`
                              : student.name || `${student.firstName} ${student.lastName}`
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

                        {/* Show contact button for individual students */}
                        {group.isIndividual && (
                          <button className="text-green-600 hover:text-green-900 text-xs sm:text-sm font-medium px-3 py-2 rounded-lg hover:bg-green-50 transition-colors">
                            <MessageSquare className="h-4 w-4 inline mr-1" />
                            Contact
                          </button>
                        )}
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