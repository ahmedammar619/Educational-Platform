import { useState, useEffect } from 'react';
import { Users, Calendar, BookOpen, MessageSquare, User, X, ChevronDown, ChevronRight } from 'lucide-react';
import { teachersService, coursesService, usersService } from '../../services';
import { showErrorToast } from '../../utils/errorHandler';
import MaterialPages from '../../components/common/class-material/MaterialPages';
import { AlertDialog } from '../../components/ui';
import useAlert from '../../hooks/useAlert';



const TeacherClasses = ({ user }) => {
  const { alertState, showAlert, hideAlert } = useAlert();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showMaterialPages, setShowMaterialPages] = useState(false);
  const [selectedClassForModal, setSelectedClassForModal] = useState(null);
  const [selectedClassForMaterial, setSelectedClassForMaterial] = useState(null);
  const [expandedClasses, setExpandedClasses] = useState(new Set());

  useEffect(() => {
    if (user && user.role === 'teacher') {
      loadClasses();
    }
  }, [user]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      console.log('Loading classes for teacher:', user);

      // Fetch teacher's classes from backend
      const response = await teachersService.getTeacherClasses();
      console.log('Raw response from backend:', response);
      
      // Handle different response formats - convert object to array if needed
      let classesArray = [];
      if (Array.isArray(response)) {
        classesArray = response;
      } else if (response && typeof response === 'object') {
        // Check if response has a 'classes' property (new format)
        if (response.classes && Array.isArray(response.classes)) {
          classesArray = response.classes;
        } else {
          // Convert object with numeric keys to array (old format)
          classesArray = Object.values(response).filter(item => 
            item && typeof item === 'object' && item.id && !item._rateLimitInfo
          );
        }
      }
      
      console.log('Parsed classes array:', classesArray);
      
      // Process classes - courses are already included from backend
      const processedClasses = classesArray.map(classItem => {
        console.log('Processing class:', classItem);
        
        // Courses are already provided by the backend, just ensure they're properly formatted
        const courses = (classItem.courses || []).map(course => {
          console.log('Processing course:', course);
          return {
            ...course,
            // Sessions are already stored in the course
            sessionTime: course.sessions || course.sessionTime || [],
            // Use teacherName from backend response
            teacherName: course.teacherName || 'Unknown Teacher'
          };
        });
        
        // Calculate student count from students array if available
        const studentsCount = classItem.students && Array.isArray(classItem.students) 
          ? classItem.students.length 
          : (classItem.studentCount || classItem.numberOfStudents || 0);
          
        console.log(`Class ${classItem.name} student count:`, {
          fromStudentsArray: classItem.students?.length,
          fromStudentCount: classItem.studentCount,
          fromNumberOfStudents: classItem.numberOfStudents,
          final: studentsCount
        });
        
        return {
          ...classItem,
          courses: courses,
          numberOfStudents: studentsCount
        };
      });
      
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

  const getStudentDetails = async (classId) => {
    try {
      const studentsData = await teachersService.getClassStudents(classId);
      return studentsData || [];
    } catch (error) {
      console.error('Error fetching students for class:', classId, error);
      return [];
    }
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
    if (!user || !classItem.courses) return [];

    // Filter courses to only show those taught by the current teacher
    return classItem.courses.filter(course => 
      course.teacherId === user.id
    );
  };

  const handleWhatsAppClick = (phone, contactName) => {
    // Remove any non-digit characters except + for international format
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}`;
    window.open(whatsappUrl, '_blank');
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
              {loading ? (
                <div className="text-center py-8">
                  <BookOpen className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm sm:text-base text-gray-600">Loading classes...</p>
                  <p className="text-xs sm:text-sm text-gray-500">Please wait while we fetch your data</p>
                </div>
              ) : classes.length === 0 ? (
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
                      <div className="p-3 md:p-4 lg:p-6 border-b border-gray-100">
                        <div className="flex items-center justify-between">
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
                            <p className="font-medium text-gray-900 text-sm">
                              {classItem.numberOfStudents} 
                              {/* Debug info */}
                              {console.log('Rendering student count:', {
                                id: classItem.id,
                                name: classItem.name,
                                numberOfStudents: classItem.numberOfStudents,
                                studentsArray: classItem.students,
                                studentsLength: classItem.students?.length
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Courses Section */}
                      {expandedClasses.has(classItem.id) && (
                        <div className="p-4 sm:p-6 bg-gray-50">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-base md:text-lg font-semibold text-gray-800">My Courses ({getTeacherCourses(classItem).length})</h4>
                          </div>

                          {getTeacherCourses(classItem).length === 0 ? (
                            <p className="text-gray-500 text-center py-4 text-sm md:text-base">No courses assigned to you in this class.</p>
                          ) : (
                            <div className="space-y-4">
                              {getTeacherCourses(classItem).map((course) => (
                                <div key={course.id} className="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
                                  <div className="mb-3 md:mb-4">
                                    <div className="flex items-center gap-2">
                                      <h5 className="text-sm md:text-base font-semibold text-gray-900 leading-tight text-start">{course.name}</h5>
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
                                        onClick={() => {
                                          console.log('🔍 Teacher clicking course material button for course:', course);
                                          console.log('🔍 Course data structure:', {
                                            id: course.id,
                                            name: course.name,
                                            courseId: course.courseId,
                                            classId: course.classId,
                                            teacherId: course.teacherId
                                          });
                                          setSelectedClassForMaterial(course);
                                          setShowMaterialPages(true);
                                        }}
                                        className="w-full md:w-auto px-4 py-2 border-2 border-blue-600 text-blue-600 font-semibold text-xs md:text-sm rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-200 uppercase tracking-wide"
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
          courseData={selectedClassForMaterial}
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
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  const handleWhatsAppClick = (phone, contactName) => {
    // Remove any non-digit characters except + for international format
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}`;
    window.open(whatsappUrl, '_blank');
  };

  useEffect(() => {
    loadStudents();
  }, [classData]);

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      const studentsData = await teachersService.getClassStudents(classData.id);
      
      console.log('Raw students data:', studentsData);
      
      // The service already handles extracting students array from backend response
      let studentsArray = [];
      if (Array.isArray(studentsData)) {
        studentsArray = studentsData;
      } else if (studentsData && typeof studentsData === 'object') {
        // If it's still an object, try to extract students property or convert to array
        if (studentsData.students && Array.isArray(studentsData.students)) {
          studentsArray = studentsData.students;
        } else {
          studentsArray = Object.values(studentsData).filter(item => 
            item && typeof item === 'object' && item.id && !item._rateLimitInfo
          );
        }
      }
      
      console.log('Processed students array:', studentsArray);
      setStudents(studentsArray);
    } catch (error) {
      console.error('Error loading students:', error);
      setStudents([]);
      showErrorToast(error, 'Failed to load students. Please try again.');
    } finally {
      setLoadingStudents(false);
    }
  };

  const getParentDetails = async (parentId) => {
    try {
      console.log('Fetching parent details for ID:', parentId);
      
      // In the backend, parentId refers to a User entity with role=Parent
      // So we need to fetch the user directly
      const response = await usersService.getUserById(parentId);
      
      console.log('Parent data received:', response);
      
      // Handle different response structures
      let parentData = response;
      
      // Check if the response has a nested user object (common backend pattern)
      if (response && response.user) {
        parentData = response.user;
        console.log('Extracted parent data from nested user object:', parentData);
      }
      
      if (!parentData) {
        console.warn('No parent data found for ID:', parentId);
        return {
          id: parentId,
          firstName: 'Unknown',
          lastName: 'Parent',
          fullName: 'Unknown Parent',
          email: 'unknown@example.com'
        };
      }
      
      // Make sure we have a consistent structure with firstName and lastName
      return {
        id: parentData.id || parentId,
        firstName: parentData.firstName || (parentData.name ? parentData.name.split(' ')[0] : 'Unknown'),
        lastName: parentData.lastName || (parentData.name ? parentData.name.split(' ')[1] || '' : 'Parent'),
        fullName: parentData.fullName || parentData.name || `${parentData.firstName || 'Unknown'} ${parentData.lastName || 'Parent'}`,
        email: parentData.email || 'unknown@example.com',
        phone: parentData.phone || parentData.phoneNumber || null
      };
    } catch (error) {
      console.error('Error fetching parent details:', error);
      return {
        id: parentId,
        firstName: 'Unknown',
        lastName: 'Parent',
        fullName: 'Unknown Parent',
        email: 'unknown@example.com',
        phone: null
      };
    }
  };

  const groupStudentsByParent = async (students) => {
    console.log('Grouping students by parent:', students);
    const grouped = {};
    const individualStudents = [];

    for (const student of students) {
      // Check if student has a valid parentId
      if (student.parentId && student.parentId !== 'null' && student.parentId !== 'undefined') {
        // Student has a parent - group under parent
        const parentId = student.parentId;
        console.log('Processing student with parent:', getStudentDisplayName(student), 'Parent ID:', parentId);
        
        if (!grouped[parentId]) {
          console.log('Fetching parent details for new group:', parentId);
          
          // Check if student already has parent information attached
          let parentDetails;
          if (student.parent && (student.parent.firstName || student.parent.lastName)) {
            console.log('Using attached parent information:', student.parent);
            parentDetails = {
              id: student.parent.id || parentId,
              firstName: student.parent.firstName || 'Unknown',
              lastName: student.parent.lastName || 'Parent',
              fullName: `${student.parent.firstName || 'Unknown'} ${student.parent.lastName || 'Parent'}`,
              email: student.parent.email || 'unknown@example.com',
              phone: student.parent.phone || student.parent.phoneNumber || null
            };
          } else {
            // Fetch parent details from API
            parentDetails = await getParentDetails(parentId);
          }
          
          grouped[parentId] = {
            parent: parentDetails,
            students: []
          };
        }
        grouped[parentId].students.push(student);
      } else {
        // Student has no parent - add to individual students
        console.log('Processing individual student:', getStudentDisplayName(student));
        individualStudents.push(student);
      }
    }

    console.log('Grouped students by parent:', grouped);
    console.log('Individual students:', individualStudents);

    // Convert to array and sort by parent name, then add individual students at the end
    const parentGroups = Object.values(grouped).sort((a, b) => {
      const aName = `${a.parent?.firstName || ''} ${a.parent?.lastName || ''}`.trim();
      const bName = `${b.parent?.firstName || ''} ${b.parent?.lastName || ''}`.trim();
      return aName.localeCompare(bName);
    });

    // Add individual students as separate entries
    const result = [...parentGroups];
    individualStudents.forEach(student => {
      result.push({
        parent: null, // No parent
        students: [student],
        isIndividual: true
      });
    });

    console.log('Final grouped result:', result);
    return result;
  };

  const [groupedStudents, setGroupedStudents] = useState([]);
  const [loadingGroupedStudents, setLoadingGroupedStudents] = useState(true);

  useEffect(() => {
    if (students.length > 0) {
      loadGroupedStudents();
    }
  }, [students]);

  const loadGroupedStudents = async () => {
    try {
      setLoadingGroupedStudents(true);
      const grouped = await groupStudentsByParent(students);
      setGroupedStudents(grouped);
    } catch (error) {
      console.error('Error grouping students:', error);
      setGroupedStudents([]);
    } finally {
      setLoadingGroupedStudents(false);
    }
  };

  
  // Helper function to get student display name from various data structures
  const getStudentDisplayName = (student) => {
    // If we have firstName and lastName directly on the student object
    if (student.firstName && student.lastName) {
      return `${student.firstName} ${student.lastName}`;
    }
    
    // If we have a user object with firstName and lastName
    if (student.user && student.user.firstName && student.user.lastName) {
      return `${student.user.firstName} ${student.user.lastName}`;
    }
    
    // If we have a name property
    if (student.name) {
      return student.name;
    }
    
    // If we have only firstName but no lastName
    if (student.firstName) {
      return student.firstName;
    }
    
    // If we have only user.firstName but no user.lastName
    if (student.user && student.user.firstName) {
      return student.user.firstName;
    }
    
    // Fallback
    return 'Unknown Student';
  };

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
            {loadingStudents || loadingGroupedStudents ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-600">Loading students...</p>
              </div>
            ) : groupedStudents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-600">No students enrolled in this class</p>
              </div>
            ) : (
              groupedStudents.map((group, groupIndex) => (
              <div key={group.isIndividual ? `individual-${group.students[0].id}` : group.parent.id} className="border rounded-lg overflow-hidden">
                {/* Parent Header - only show for groups with parents */}
                {!group.isIndividual && (
                  <div className="bg-blue-50 px-3 py-3 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <div className="text-start min-w-0">
                          <h4 className="font-semibold text-blue-900 text-sm sm:text-base">
                            {group.parent.firstName} {group.parent.lastName}
                          </h4>
                          <p className="text-xs sm:text-sm text-blue-700">{group.parent.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {group.students.length > 1 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {group.students.length} Student{group.students.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        <button 
                          onClick={() => {
                            const phoneNumber = group.parent.phone || group.parent.phoneNumber;
                            if (phoneNumber) {
                              handleWhatsAppClick(phoneNumber, `${group.parent.firstName} ${group.parent.lastName}`);
                            } else {
                              // Fallback to email if no phone number
                              const emailUrl = `mailto:${group.parent.email}`;
                              window.open(emailUrl, '_blank');
                            }
                          }}
                          className="text-green-600 hover:text-green-900 text-xs sm:text-sm font-medium px-3 py-2 rounded-lg hover:bg-green-50 transition-colors"
                        >
                          <MessageSquare className="h-4 w-4 inline mr-1" />
                          Contact Parent
                        </button>
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
                              {student.firstName ? student.firstName.charAt(0) : (student.user?.firstName?.charAt(0) || student.name?.charAt(0) || 'S')}
                            </span>
                          </div>
                          {!group.isIndividual && group.students.length > 1 && studentIndex === 0 && (
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-3 bg-blue-300 rounded-full"></div>
                          )}
                        </div>
                        <div className="text-start min-w-0 flex-1">
                          <h5 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                            {getStudentDisplayName(student)}
                          </h5>
                          <p className="text-xs sm:text-sm text-gray-500">{student.email || student.user?.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">

                        {/* Show contact button for individual students */}
                        {group.isIndividual && (
                          <button 
                            onClick={() => {
                              // For individual students, try to get phone number from various sources
                              const student = group.students[0];
                              
                              // Check multiple sources for phone number
                              const phoneNumber = student.phone || 
                                                  student.phoneNumber || 
                                                  student.user?.phone || 
                                                  student.user?.phoneNumber ||
                                                  student.parent?.phone || 
                                                  student.parent?.phoneNumber;
                              
                              if (phoneNumber) {
                                handleWhatsAppClick(phoneNumber, getStudentDisplayName(student));
                              } else {
                                // If no phone number found, show alert
                                showAlert({
                                  title: 'No Phone Number',
                                  message: 'No phone number available for this student. Please contact them via email.',
                                  type: 'warning'
                                });
                              }
                            }}
                            className="text-green-600 hover:text-green-900 text-xs sm:text-sm font-medium px-3 py-2 rounded-lg hover:bg-green-50 transition-colors"
                          >
                            <MessageSquare className="h-4 w-4 inline mr-1" />
                            Contact Student
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      </div>

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

export default TeacherClasses;