import { useState, useEffect } from 'react';
import { Users, Plus, ArrowLeft, MessageCircle } from 'lucide-react';
import ChildAccountCreation from './ChildAccountCreation';
import parentsService from '../../services/parentsService';

const ChildrenManagement = ({ user }) => {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [showAddChildForm, setShowAddChildForm] = useState(false);
  const [error, setError] = useState(null);
  const [forceRender, setForceRender] = useState(0); // Force re-render mechanism

  useEffect(() => {
    fetchChildren();
    fetchTeachers();
  }, []);

  // Remove this useEffect as fetchTeachers() doesn't depend on selectedChild
  // The filtering happens in getTeachersForSelectedChild() which runs on every render

  const fetchChildren = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await parentsService.getMyChildrenDetailed(user.id);

      // Handle case where response might be undefined or null
      if (!response) {
        console.log('No response from API, setting empty children array');
        setChildren([]);
        return;
      }

      // Extract children from response
      const childrenArray = response.children || response.data || [];

      // Transform the data to match the expected format
      const childrenWithDetails = childrenArray.map(child => ({
        id: child.id,
        name: `${child.firstName} ${child.lastName}`,
        firstName: child.firstName,
        lastName: child.lastName,
        email: child.email,
        parentId: child.parentId,
        age: child.age,
        class: child.className,
        accountType: child.accountType,
        relationship_type: 'child',
        studentData: null
      }));

      setChildren(childrenWithDetails);
      if (childrenWithDetails.length > 0 && !selectedChild) {
        setSelectedChild(childrenWithDetails[0]);
      }
    } catch (error) {
      console.error('Failed to fetch children:', error);
      // Set empty children array instead of error to show the "no children" state
      setChildren([]);
      setError(null); // Clear any previous errors
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      setTeachersLoading(true);
      const response = await parentsService.getChildrenTeachers(user.id);

      console.log('Debug - Raw API Response:', response);

      if (response && response.teachers) {
        console.log('Debug - Teachers from API:', response.teachers);
        setTeachers(response.teachers);
      } else {
        console.log('Debug - No teachers in response, setting empty array');
        setTeachers([]);
      }
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
      setTeachers([]);
    } finally {
      setTeachersLoading(false);
    }
  };

  // const fetchChildProgress = async (childId) => {
  //   try {
  //     setProgressLoading(true);
  //     setError(null);
  //     const response = await parentsService.getChildProgress(childId, user.id);

  //     // Transform backend data to match frontend expectations
  //     const transformedProgress = {
  //       courses: response.courses || [],
  //       recentGrades: response.recentGrades || [],
  //       attendanceSummary: response.attendanceSummary || []
  //     };

  //     // If no data is available yet, show a message
  //     if (transformedProgress.courses.length === 0 && 
  //         transformedProgress.recentGrades.length === 0 && 
  //         transformedProgress.attendanceSummary.length === 0) {
  //         console.log('No progress data available yet for this child');
  //     }

  //     setChildProgress(transformedProgress);
  //   } catch (error) {
  //       console.error('Failed to fetch child progress:', error);
  //       // Don't set error for progress - just show empty state
  //       setChildProgress({
  //         courses: [],
  //         recentGrades: [],
  //         attendanceSummary: []
  //       });
  //   } finally {
  //       setProgressLoading(false);
  //   }
  // };

  // Helper function for grade colors (used in detailed view)
  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Helper function to get teachers for selected child
  const getTeachersForSelectedChild = () => {
    if (!selectedChild || !teachers.length) return [];

    const filteredTeachers = teachers.filter(teacher => {
      // Check if teacher has children array and if it contains the selected child
      if (!teacher.children || !Array.isArray(teacher.children)) {
        return false;
      }

      return teacher.children.some(child => child.id === selectedChild.id);
    });

    return filteredTeachers;
  };

  // Helper function to get courses for selected child and teacher
  const getCoursesForTeacherAndChild = (teacher) => {
    if (!selectedChild || !teacher.children) return [];

    // Find the selected child in the teacher's children array
    const childData = teacher.children.find(child => child.id === selectedChild.id);

    // Return the courses specific to this child
    return childData ? childData.courses || [] : [];
  };

  // Helper function to generate WhatsApp URL
  const generateWhatsAppUrl = (phoneNumber) => {
    console.log('Original phone number:', phoneNumber);
    // Remove any non-digit characters and ensure it starts with country code
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const whatsappPhone = cleanPhone.startsWith('+') ? cleanPhone.substring(1) : cleanPhone;
    const url = `https://wa.me/${whatsappPhone}`;
    console.log('Generated WhatsApp URL:', url);
    return url;
  };

  // Helper function to get avatar color and initial
  const getAvatarInfo = (name, index) => {
    const colors = [
      { bg: 'bg-green-100', text: 'text-green-600' },
      { bg: 'bg-blue-100', text: 'text-blue-600' },
      { bg: 'bg-purple-100', text: 'text-purple-600' },
      { bg: 'bg-orange-100', text: 'text-orange-600' },
      { bg: 'bg-red-100', text: 'text-red-600' },
      { bg: 'bg-indigo-100', text: 'text-indigo-600' },
      { bg: 'bg-pink-100', text: 'text-pink-600' },
      { bg: 'bg-teal-100', text: 'text-teal-600' }
    ];

    const colorIndex = index % colors.length;
    const initial = name.charAt(0).toUpperCase();

    return {
      ...colors[colorIndex],
      initial
    };
  };

  if (loading) {
    console.log('Rendering loading state');
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    console.log('Rendering error state');
    return (
      <div className="text-center py-8 md:py-12">
        <div className="text-red-600 mb-4">
          <Users className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-2" />
          <p className="text-base md:text-lg font-semibold">{error}</p>
        </div>
        <button
          onClick={fetchChildren}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm md:text-base"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show Add Child Form as a separate page
  if (showAddChildForm) {
    return (
      <div className="space-y-6 h-full">
        {/* Header for Add Child Page */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <button
              onClick={() => setShowAddChildForm(false)}
              className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 font-medium self-start"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm md:text-base">Back to Children</span>
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Create Child Account</h1>
              <p className="text-sm md:text-base text-gray-600">Register your child for Baraem Al-Nour Islamic education programs</p>
            </div>
          </div>
        </div>

        {/* Child Account Creation Form */}
        <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
          <ChildAccountCreation
            user={user}
            onSuccess={() => {
              fetchChildren();
              setShowAddChildForm(false);
            }}
            onCancel={() => setShowAddChildForm(false)}
          />
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    console.log('Rendering no children state, showAddChildForm:', showAddChildForm);
    return (
      <div className="space-y-6 h-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Children's Progress</h1>
            <p className="text-sm md:text-base text-gray-600">Monitor your children's academic performance and attendance</p>
          </div>
          <button
            onClick={() => {
              console.log('Add Children button clicked');
              console.log('Current showAddChildForm state:', showAddChildForm);
              setShowAddChildForm(prevState => {
                console.log('Previous state was:', prevState);
                const newState = true;
                console.log('Setting new state to:', newState);
                return newState;
              });
              // Force a re-render
              setForceRender(prev => prev + 1);
              console.log('State update function called, force render triggered');
            }}
            className="flex items-center justify-center space-x-2 border-2 border-purple-600 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-600 hover:text-white transition-all duration-200 text-sm md:text-base"
          >
            <Plus className="h-4 w-4" />
            <span>Add Children</span>
          </button>
        </div>

        {/* No Children Message */}
        <div className="text-center py-8 md:py-12">
          <Users className="h-10 w-10 md:h-12 md:w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">No Children Linked</h2>
          <p className="text-sm md:text-base text-gray-600 mb-6">You haven't added any children to your account yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full">
      {console.log('Rendering main view, showAddChildForm:', showAddChildForm)}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Children's Progress</h1>
          <p className="text-sm md:text-base text-gray-600">Monitor your children's academic performance and attendance</p>
        </div>
        <button
          onClick={() => {
            console.log('Add Children button clicked (main view)');
            console.log('Current showAddChildForm state:', showAddChildForm);
            setShowAddChildForm(prevState => {
              console.log('Previous state was:', prevState);
              const newState = true;
              console.log('Setting new state to:', newState);
              return newState;
            });
            // Force a re-render
            setForceRender(prev => prev + 1);
            console.log('State update function called, force render triggered');
          }}
          className="flex items-center justify-center space-x-2 border-2 border-purple-600 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-600 hover:text-white transition-all duration-200 text-sm md:text-base"
        >
          <Plus className="h-4 w-4" />
          <span>Add Children</span>
        </button>
      </div>

      {/* Children Cards */}
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Your Children</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {children.map((child) => (
            <div
              key={child.id}
              className="bg-white rounded-xl border border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all duration-300 p-4 md:p-6 text-center group cursor-pointer"
              onClick={() => setSelectedChild(child)}
            >
              <div className="w-12 h-12 md:w-16 md:h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 group-hover:bg-purple-600 transition-colors">
                <span className="text-white text-lg md:text-xl font-bold">
                  {child.firstName ? child.firstName.charAt(0) : child.name.charAt(0)}
                </span>
              </div>

              <h3 className="font-semibold text-gray-900 text-sm md:text-lg mb-1">
                {child.firstName && child.lastName
                  ? `${child.firstName} ${child.lastName}`
                  : child.name
                }
              </h3>

              <div className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4">
                {child.class} • {child.age ? `${child.age} years` : 'Age not specified'}
              </div>

              <div className="text-xs text-purple-600 font-medium group-hover:text-purple-700 transition-colors">
                Click to view details
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Child Details */}
      {selectedChild && (
        <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-4 md:px-8 py-4 md:py-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-purple-500 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 sm:mb-0 sm:mr-6 shadow-lg mx-auto sm:mx-0">
                <span className="text-white text-lg md:text-xl font-bold">
                  {selectedChild.firstName ? selectedChild.firstName.charAt(0) : selectedChild.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                  {selectedChild.firstName && selectedChild.lastName
                    ? `${selectedChild.firstName} ${selectedChild.lastName}`
                    : selectedChild.name
                  }
                </h2>
                <p className="text-gray-600 text-sm md:text-lg">
                  {selectedChild.class} • {selectedChild.age ? `${selectedChild.age} years old` : 'Age not specified'}
                </p>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-4 md:p-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
              <div className="text-center lg:text-left">
                <div className="text-lg md:text-2xl font-bold text-purple-600 mb-1">{selectedChild.class}</div>
                <div className="text-xs md:text-sm text-gray-500 font-medium">Class</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-lg md:text-2xl font-bold text-purple-600 mb-1">
                  {selectedChild.age || 'N/A'}
                </div>
                <div className="text-xs md:text-sm text-gray-500 font-medium">Age</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-sm md:text-lg font-semibold text-gray-700 mb-1">Student</div>
                <div className="text-xs md:text-sm text-gray-500 font-medium">Account Type</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-xs md:text-lg font-semibold text-gray-700 mb-1 truncate">{selectedChild.id}</div>
                <div className="text-xs md:text-sm text-gray-500 font-medium">Student ID</div>
              </div>
            </div>

            {/* Teachers Section */}
            <div className="mt-4 md:mt-6">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Teachers</h3>

              {teachersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Loading teachers...</span>
                </div>
              ) : (
                <>
                  {getTeachersForSelectedChild().length > 0 ? (
                    <div className="space-y-4">
                      {getTeachersForSelectedChild().map((teacher, index) => {
                        console.log('Teacher data:', teacher);
                        const avatarInfo = getAvatarInfo(teacher.firstName || teacher.lastName || 'T', index);
                        const courses = getCoursesForTeacherAndChild(teacher);

                        return (
                          <div key={teacher.id} className="bg-gray-50 rounded-lg md:rounded-xl p-4 md:p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center flex-1">
                                <div className={`w-8 h-8 md:w-10 md:h-10 ${avatarInfo.bg} rounded-lg flex items-center justify-center mr-3 md:mr-4 flex-shrink-0`}>
                                  <span className={`${avatarInfo.text} font-semibold text-sm md:text-base`}>
                                    {avatarInfo.initial}
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-gray-900 text-sm md:text-base">
                                    {teacher.firstName} {teacher.lastName}
                                  </div>
                                  <div className="text-xs md:text-sm text-gray-500">
                                    {courses.length > 0 ? (
                                      <>
                                        <span className="font-medium">Courses:</span>{' '}
                                        {courses.map((course, courseIndex) => (
                                          <span key={course.id}>
                                            {course.name}
                                            {courseIndex < courses.length - 1 && ', '}
                                          </span>
                                        ))}
                                      </>
                                    ) : (
                                      'Teacher'
                                    )}
                                  </div>
                                </div>
                              </div>
                              {teacher.phone ? (
                                <button
                                  onClick={() => window.open(generateWhatsAppUrl(teacher.phone), '_blank')}
                                  className="flex items-center space-x-1 bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors text-xs ml-4 flex-shrink-0"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  <span>WhatsApp</span>
                                </button>
                              ) : (
                                <div className="text-xs text-gray-400 px-3 py-1.5 ml-4 flex-shrink-0">
                                  No Phone
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-2">
                        <Users className="h-8 w-8 mx-auto" />
                      </div>
                      <p className="text-sm text-gray-600">
                        No teachers found for {selectedChild.firstName || selectedChild.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Teachers will appear here once your child is enrolled in courses
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChildrenManagement;