import { useState, useEffect } from 'react';
import { Users, Plus, ArrowLeft } from 'lucide-react';
import ChildAccountCreation from './ChildAccountCreation';
import parentsService from '../../services/parentsService';

const ChildrenManagement = ({ user }) => {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddChildForm, setShowAddChildForm] = useState(false);
  const [error, setError] = useState(null);
  const [forceRender, setForceRender] = useState(0); // Force re-render mechanism

  useEffect(() => {
    fetchChildren();
  }, []);



  // Debug useEffect to monitor showAddChildForm changes
  useEffect(() => {
    console.log('showAddChildForm changed to:', showAddChildForm);
  }, [showAddChildForm]);

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

  // Debug: Log current state
  console.log('Current render state:', {
    children: children.length,
    showAddChildForm,
    selectedChild: !!selectedChild,
    forceRender
  });

  // Show Add Child Form as a separate page - CHECK THIS FIRST
  console.log('Checking showAddChildForm condition:', showAddChildForm);
  if (showAddChildForm) {
    console.log('Rendering child account creation form');
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

            {/* Contact Information */}
            <div className="bg-gray-50 rounded-lg md:rounded-xl p-4 md:p-6">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Contact Information</h3>
              <div className="flex items-center">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3 md:mr-4 flex-shrink-0">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 text-sm md:text-base break-all">{selectedChild.email}</div>
                  <div className="text-xs md:text-sm text-gray-500">Email address</div>
                </div>
              </div>
            </div>

            {/* Parent Information */}
            {selectedChild.parentId && (
              <div className="mt-4 md:mt-6 bg-blue-50 rounded-lg md:rounded-xl p-4 md:p-6">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Parent Information</h3>
                <div className="flex items-center">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 md:mr-4 flex-shrink-0">
                    <svg className="w-4 h-4 md:w-5 md:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 text-sm md:text-base">{user.firstName} {user.lastName}</div>
                    <div className="text-xs md:text-sm text-gray-500">Parent/Guardian</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChildrenManagement;