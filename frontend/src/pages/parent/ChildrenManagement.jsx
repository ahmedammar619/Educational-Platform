import { useState, useEffect } from 'react';
import { Users, Plus, ArrowLeft, MessageCircle, Lock, Eye, EyeOff, Key, Edit, Trash2 } from 'lucide-react';
import ChildAccountCreation from './ChildAccountCreation';
import parentsService from '../../services/parentsService';
import authService from '../../services/authService';
import studentsService from '../../services/studentsService';
import programsService from '../../services/programsService';
import { showSuccessToast, showErrorToast, showWarningToast } from '../../utils/toast.js';

const ChildrenManagement = ({ user }) => {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [showAddChildForm, setShowAddChildForm] = useState(false);
  const [error, setError] = useState(null);
  const [forceRender, setForceRender] = useState(0); // Force re-render mechanism
  
  // Password management state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalChild, setPasswordModalChild] = useState(null);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Edit child modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingChild, setEditingChild] = useState(null);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    birthDate: '',
    programIds: []
  });
  const [availablePrograms, setAvailablePrograms] = useState([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editErrors, setEditErrors] = useState({});

  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingChild, setDeletingChild] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchChildren();
    fetchTeachers();
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const programs = await programsService.getAllPrograms();
      setAvailablePrograms(programs);
    } catch (error) {
      console.error('Error loading programs:', error);
    }
  };

  // Remove this useEffect as fetchTeachers() doesn't depend on selectedChild
  // The filtering happens in getTeachersForSelectedChild() which runs on every render

  const [isAddingChild, setIsAddingChild] = useState(false);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await parentsService.getMyChildrenDetailed(user.id);

      console.log('API Response:', response);

      // Handle case where response might be undefined or null
      if (!response) {
        console.log('No response from API, setting empty children array');
        setChildren([]);
        return;
      }

      // Extract children from response
      const childrenArray = response.children || response.data || [];
      console.log('Children array from API:', childrenArray);

      // Check if we have valid children data
      if (!Array.isArray(childrenArray) || childrenArray.length === 0) {
        console.log('No valid children data, setting empty array');
        setChildren([]);
        return;
      }

      // Transform the data to match the expected format
      const childrenWithDetails = childrenArray.map(child => {
        // Skip children with undefined or null essential data
        if (!child || (!child.firstName && !child.lastName)) {
          console.log('Skipping invalid child data:', child);
          return null;
        }

        return {
          id: child.id,
          name: `${child.firstName || ''} ${child.lastName || ''}`.trim(),
          firstName: child.firstName,
          lastName: child.lastName,
          email: child.email,
          birthDate: child.birthDate,
          parentId: child.parentId,
          age: child.age,
          class: child.className || 'Not specified',
          accountType: child.accountType || 'Student',
          relationship_type: 'child',
          studentData: null,
          programs: child.programs || []
        };
      }).filter(child => child !== null); // Remove null entries

      console.log('Processed children:', childrenWithDetails);
      setChildren(childrenWithDetails);
      
      // Validate and set selected child
      if (childrenWithDetails.length > 0) {
        // Check if current selectedChild is valid
        const isValidSelectedChild = selectedChild && 
          selectedChild.firstName && 
          selectedChild.lastName && 
          childrenWithDetails.some(child => child.id === selectedChild.id);
        
        if (!isValidSelectedChild || !selectedChild) {
          setSelectedChild(childrenWithDetails[0]);
        }
      } else {
        setSelectedChild(null);
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

  // Helper function to get all classes for a specific child
  const getClassesForChild = (childId) => {
    if (!teachers.length) return [];

    const allCourses = [];
    
    // Get all courses for this child from all teachers
    teachers.forEach(teacher => {
      if (teacher.children) {
        const childData = teacher.children.find(child => child.id === childId);
        if (childData && childData.courses) {
          allCourses.push(...childData.courses);
        }
      }
    });

    // Extract unique class names
    const uniqueClasses = [...new Set(allCourses.map(course => course.className).filter(Boolean))];
    return uniqueClasses;
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

  // Password management functions
  const openPasswordModal = (child) => {
    setPasswordModalChild(child);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setPasswordError('');
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordModalChild(null);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setPasswordError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (!passwordModalChild) return;

    if (!passwordData.newPassword) {
      setPasswordError('Please enter a new password');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordLoading(true);
    setPasswordError('');

    try {
      await authService.updateStudentPassword(passwordModalChild.id, passwordData.newPassword);
      closePasswordModal();
      showSuccessToast('Password updated successfully!');
    } catch (error) {
      console.error('Password update error:', error);
      setPasswordError(error.response?.data?.message || 'Failed to update password. Please try again.');
      showErrorToast('Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Edit child functions
  const openEditModal = (child) => {
    console.log('Opening edit modal for child:', child);
    console.log('Child birthDate:', child.birthDate);
    console.log('Child birthDate type:', typeof child.birthDate);
    
    // Format birthDate for input field
    let formattedBirthDate = '';
    if (child.birthDate) {
      try {
        // Handle different date formats
        const date = new Date(child.birthDate);
        if (!isNaN(date.getTime())) {
          formattedBirthDate = date.toISOString().split('T')[0];
        }
      } catch (error) {
        console.error('Error formatting birthDate:', error);
      }
    }
    
    console.log('Formatted birthDate:', formattedBirthDate);
    
    setEditingChild(child);
    setEditFormData({
      firstName: child.firstName || '',
      lastName: child.lastName || '',
      email: child.email || '',
      birthDate: formattedBirthDate,
      programIds: child.programs ? child.programs.map(p => p.id) : []
    });
    setEditErrors({});
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingChild(null);
    setEditFormData({
      firstName: '',
      lastName: '',
      email: '',
      birthDate: '',
      programIds: []
    });
    setEditErrors({});
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (editErrors[name]) {
      setEditErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleEditProgramChange = (programId) => {
    setEditFormData(prev => {
      const currentProgramIds = prev.programIds || [];
      const isSelected = currentProgramIds.includes(programId);
      
      let newProgramIds;
      if (isSelected) {
        newProgramIds = currentProgramIds.filter(id => id !== programId);
      } else {
        newProgramIds = [...currentProgramIds, programId];
      }
      
      return {
        ...prev,
        programIds: newProgramIds
      };
    });
  };

  const validateEditForm = () => {
    const newErrors = {};

    if (!editFormData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!editFormData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!editFormData.email) {
      newErrors.email = 'Email is required';
    }

    if (!editFormData.birthDate) {
      newErrors.birthDate = 'Date of birth is required';
    }

    if (!editFormData.programIds || editFormData.programIds.length === 0) {
      newErrors.programIds = 'Please select at least one program';
    }

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!validateEditForm()) {
      return;
    }

    setEditLoading(true);

    try {
      await studentsService.updateStudent(editingChild.id, editFormData);
      closeEditModal();
      fetchChildren(); // Refresh the children list
      showSuccessToast('Child information updated successfully!');
    } catch (error) {
      console.error('Edit child error:', error);
      setEditErrors({ submit: error.response?.data?.message || 'Failed to update child information. Please try again.' });
      showErrorToast('Failed to update child information');
    } finally {
      setEditLoading(false);
    }
  };

  // Delete child functions
  const openDeleteModal = (child) => {
    setDeletingChild(child);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingChild(null);
  };

  const handleDeleteChild = async () => {
    if (!deletingChild) return;

    setDeleteLoading(true);

    try {
      await parentsService.removeChild(deletingChild.id, user.id);
      closeDeleteModal();
      fetchChildren(); // Refresh the children list
      showSuccessToast('Child account deleted successfully!');
    } catch (error) {
      console.error('Delete child error:', error);
      showErrorToast('Failed to delete child account');
    } finally {
      setDeleteLoading(false);
    }
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
              // Prevent double-clicking
              if (isAddingChild) {
                console.warn('🚫 Add child already in progress, ignoring duplicate click');
                return;
              }
              
              setIsAddingChild(true);
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
              setIsAddingChild(false);
            }}
            disabled={isAddingChild}
            className="flex items-center justify-center space-x-2 border-2 border-purple-600 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-600 hover:text-white transition-all duration-200 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAddingChild ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                <span>Adding...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Add Children</span>
              </>
            )}
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
            // Prevent double-clicking
            if (isAddingChild) {
              console.warn('🚫 Add child already in progress, ignoring duplicate click');
              return;
            }
            
            setIsAddingChild(true);
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
            setIsAddingChild(false);
          }}
          disabled={isAddingChild}
          className="flex items-center justify-center space-x-2 border-2 border-purple-600 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-600 hover:text-white transition-all duration-200 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAddingChild ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
              <span>Adding...</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Add Children</span>
            </>
          )}
        </button>
      </div>

      {/* Children Cards */}
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Your Children</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {children.map((child) => (
            <div
              key={child.id}
              onClick={() => setSelectedChild(child)}
              className={`bg-white rounded-xl border transition-all duration-300 p-4 md:p-6 text-center group cursor-pointer ${
                selectedChild && selectedChild.id === child.id 
                  ? 'border-purple-300 shadow-lg bg-purple-50' 
                  : 'border-gray-100 hover:border-purple-200 hover:shadow-lg'
              }`}
            >
              <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 transition-colors ${
                selectedChild && selectedChild.id === child.id 
                  ? 'bg-purple-600' 
                  : 'bg-purple-500 group-hover:bg-purple-600'
              }`}>
                <span className="text-white text-lg md:text-xl font-bold">
                  {child.firstName ? child.firstName.charAt(0) : 
                   child.name ? child.name.charAt(0) : 'U'}
                </span>
              </div>

              <h3 className="font-semibold text-gray-900 text-sm md:text-lg mb-1">
                {child.firstName && child.lastName
                  ? `${child.firstName} ${child.lastName}`
                  : (child.name || 'Unknown Child')
                }
              </h3>

              <div className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4">
                {(() => {
                  const classes = getClassesForChild(child.id);
                  const classDisplay = classes.length > 0 ? classes.join(', ') : 'Not enrolled';
                  const programs = child.programs || [];
                  const programDisplay = programs.length > 0 ? programs.map(p => p.name).join(', ') : 'No programs';
                  return `${classDisplay} • ${programDisplay} • ${child.age ? `${child.age} years` : 'Age not specified'}`;
                })()}
              </div>

              <div className="space-y-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openPasswordModal(child);
                  }}
                  className="w-full flex items-center justify-center space-x-1 bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors py-2 px-3 rounded-lg text-xs font-medium"
                >
                  <Key className="h-3 w-3" />
                  <span>Change Password</span>
                </button>
                <div className="flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(child);
                    }}
                    className="flex-1 flex items-center justify-center space-x-1 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors py-2 px-2 rounded-lg text-xs font-medium"
                  >
                    <Edit className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModal(child);
                    }}
                    className="flex-1 flex items-center justify-center space-x-1 bg-red-50 text-red-600 hover:bg-red-100 transition-colors py-2 px-2 rounded-lg text-xs font-medium"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Delete</span>
                  </button>
                </div>
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
                  {selectedChild.firstName ? selectedChild.firstName.charAt(0) : 
                   selectedChild.name ? selectedChild.name.charAt(0) : 'U'}
                </span>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                  {selectedChild.firstName && selectedChild.lastName
                    ? `${selectedChild.firstName} ${selectedChild.lastName}`
                    : (selectedChild.name || 'Unknown Child')
                  }
                </h2>
                <p className="text-gray-600 text-sm md:text-lg">
                  {(selectedChild.class || 'Not specified')} • {(() => {
                    const programs = selectedChild.programs || [];
                    const programDisplay = programs.length > 0 ? programs.map(p => p.name).join(', ') : 'No programs';
                    return programDisplay;
                  })()} • {selectedChild.age ? `${selectedChild.age} years old` : 'Age not specified'}
                </p>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-4 md:p-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
              <div className="text-center lg:text-left">
                <div className="text-xs md:text-sm text-gray-500 font-medium">Enrolled Courses</div>
                <div className="text-lg md:text-2xl font-bold text-purple-600 mb-1">
                  {(() => {
                    const allCourses = getTeachersForSelectedChild().flatMap(teacher => 
                      getCoursesForTeacherAndChild(teacher)
                    );
                    return allCourses.length || 0;
                  })()}
                </div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-xs md:text-sm text-gray-500 font-medium">Age</div>
                <div className="text-lg md:text-2xl font-bold text-purple-600 mb-1">
                  {selectedChild.age || 'N/A'}
                </div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-xs md:text-sm text-gray-500 font-medium">Programs</div>
                <div className="text-sm md:text-lg font-semibold text-gray-700 mb-1">
                  {(() => {
                    const programs = selectedChild.programs || [];
                    return programs.length > 0 ? programs.length : 0;
                  })()}
                </div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-xs md:text-sm text-gray-500 font-medium">Student ID</div>
                <div className="text-xs md:text-lg font-semibold text-gray-700 mb-1 truncate">{selectedChild.id || 'No ID'}</div>
              </div>
            </div>

            {/* Teachers Section */}
            <div className="mt-4 md:mt-6">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
                Teachers & Enrolled Courses
              </h3>

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
                                        <span className="font-medium">Enrolled in:</span>{' '}
                                        {courses.map((course, courseIndex) => (
                                          <span key={course.id}>
                                            {course.name}
                                            {course.className && (
                                              <span className="text-gray-400"> ({course.className})</span>
                                            )}
                                            {courseIndex < courses.length - 1 && ', '}
                                          </span>
                                        ))}
                                      </>
                                    ) : (
                                      'No enrolled courses'
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
                        Teachers will appear here once your child is enrolled in specific courses
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Password Management Modal */}
      {showPasswordModal && passwordModalChild && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" style={{ margin: '0px' }}>
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Lock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Manage Password</h3>
                  <p className="text-sm text-gray-600">
                    {passwordModalChild.firstName && passwordModalChild.lastName
                      ? `${passwordModalChild.firstName} ${passwordModalChild.lastName}`
                      : passwordModalChild.name
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={closePasswordModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="newPassword"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter new password"
                    required
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters long</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Confirm new password"
                    required
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {passwordError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{passwordError}</p>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  disabled={passwordLoading}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {passwordLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Child Modal */}
      {showEditModal && editingChild && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" style={{ margin: '0px' }}>
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Edit Child Information</h3>
                <button
                  onClick={closeEditModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={editFormData.firstName}
                      onChange={handleEditInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${editErrors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Enter first name"
                    />
                    {editErrors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{editErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={editFormData.lastName}
                      onChange={handleEditInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${editErrors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Enter last name"
                    />
                    {editErrors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{editErrors.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email or Username *
                  </label>
                  <input
                    type="text"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${editErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter email address or username"
                  />
                  {editErrors.email && (
                    <p className="text-red-500 text-sm mt-1">{editErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    value={editFormData.birthDate}
                    onChange={handleEditInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${editErrors.birthDate ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {editErrors.birthDate && (
                    <p className="text-red-500 text-sm mt-1">{editErrors.birthDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Programs *
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
                    {availablePrograms.map((program) => (
                      <label key={program.id} className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editFormData.programIds?.includes(program.id) || false}
                          onChange={() => handleEditProgramChange(program.id)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">
                              {program.name}
                            </span>
                            <span className="text-sm text-green-600">
                              ${program.price}
                            </span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {editErrors.programIds && (
                    <p className="text-red-500 text-sm mt-1">{editErrors.programIds}</p>
                  )}
                </div>

                {editErrors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600">{editErrors.submit}</p>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={editLoading}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {editLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Update Child</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingChild && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Delete Child Account</h3>
              <button
                onClick={closeDeleteModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete the account for{' '}
                <span className="font-semibold">
                  {deletingChild.firstName && deletingChild.lastName
                    ? `${deletingChild.firstName} ${deletingChild.lastName}`
                    : deletingChild.name
                  }
                </span>?
              </p>
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                <strong>Warning:</strong> This action cannot be undone. All data associated with this child account will be permanently deleted.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChild}
                disabled={deleteLoading}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {deleteLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Account</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChildrenManagement;