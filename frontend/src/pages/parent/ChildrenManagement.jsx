import { useState, useEffect } from 'react';
import { Users, Calendar, BookOpen, CheckCircle, Plus, ArrowLeft } from 'lucide-react';
import ChildAccountCreation from './ChildAccountCreation';
import parentsService from '../../services/parentsService';

const ChildrenManagement = ({ user }) => {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childProgress, setChildProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(false);
  const [showAddChildForm, setShowAddChildForm] = useState(false);
  const [error, setError] = useState(null);
  const [forceRender, setForceRender] = useState(0); // Force re-render mechanism

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      // fetchChildProgress(selectedChild.id); // This line is commented out as per the edit hint
    }
  }, [selectedChild]);

  // Debug useEffect to monitor showAddChildForm changes
  useEffect(() => {
    console.log('showAddChildForm changed to:', showAddChildForm);
  }, [showAddChildForm]);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await parentsService.getMyChildren(user.id);
      
      console.log('Backend response:', response);
      console.log('Response type:', typeof response);
      console.log('Is array:', Array.isArray(response));
      
      // Handle case where response might be undefined or null
      if (!response) {
        console.log('No response from API, setting empty children array');
        setChildren([]);
        return;
      }
      
      // Ensure response is an array and handle empty responses
      let childrenArray = [];
      if (Array.isArray(response)) {
        childrenArray = response;
      } else if (response && typeof response === 'object') {
        // If response is an object, try to extract children array
        childrenArray = response.children || response.data || [];
      }
      
      console.log('Processed children array:', childrenArray);
      
      // Fetch detailed data for each child including courses, attendance, and grades
      const childrenWithDetails = await Promise.all(
        childrenArray.map(async (child) => {
          try {
            // Fetch student's detailed dashboard data
            const dashboardService = await import('../../services/dashboardService');
            const studentData = await dashboardService.default.getStudentDashboard(child.id);
            
            return {
              id: child.id,
              name: `${child.firstName} ${child.lastName}`,
              firstName: child.firstName,
              lastName: child.lastName,
              email: child.email,
              parentId: child.parentId, // Include parentId for proper account type detection
              enrolled_courses: studentData.stats?.totalClasses || 0,
              avg_progress: studentData.stats?.averageProgress || 0,
              attended_sessions: 0, // Will be calculated from attendance data
              total_sessions: studentData.stats?.totalSessions || 0,
              avg_grade_percentage: studentData.stats?.averageGrade || 0,
              relationship_type: 'child',
              // Include the full student data for detailed display
              studentData: studentData
            };
          } catch (error) {
            console.error(`Failed to fetch details for child ${child.id}:`, error);
            // Return basic data if detailed fetch fails
            return {
              id: child.id,
              name: `${child.firstName} ${child.lastName}`,
              firstName: child.firstName,
              lastName: child.lastName,
              email: child.email,
              parentId: child.parentId,
              enrolled_courses: 0,
              avg_progress: 0,
              attended_sessions: 0,
              total_sessions: 0,
              avg_grade_percentage: 0,
              relationship_type: 'child',
              studentData: null
            };
          }
        })
      );

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

  // Helper functions to calculate metrics from backend data
  const calculateAverageProgress = (child) => {
    if (!child.enrollments || child.enrollments.length === 0) return 0;
    
    const totalProgress = child.enrollments.reduce((sum, enrollment) => {
      // Calculate progress based on completed sessions vs total sessions
      // This is a simplified calculation - adjust based on your actual data structure
      const progress = enrollment.progress || enrollment.completed_sessions || 0;
      const total = enrollment.total_sessions || enrollment.sessions || 1;
      return sum + (progress / total * 100);
    }, 0);
    
    return Math.round(totalProgress / child.enrollments.length);
  };

  const calculateAttendedSessions = (child) => {
    if (!child.attendances || !Array.isArray(child.attendances)) return 0;
    return child.attendances.filter(attendance => 
      attendance.status === 'present' || attendance.status === 'late'
    ).length;
  };

  const calculateTotalSessions = (child) => {
    if (!child.enrollments || child.enrollments.length === 0) return 0;
    
    // Calculate total sessions from enrollments
    const totalSessions = child.enrollments.reduce((sum, enrollment) => {
      return sum + (enrollment.total_sessions || enrollment.sessions || 0);
    }, 0);
    
    // If no sessions data, return a reasonable default
    return totalSessions > 0 ? totalSessions : 20;
  };

  const calculateAverageGrade = (child) => {
    if (!child.enrollments || child.enrollments.length === 0) return 0;
    
    const grades = child.enrollments
      .map(enrollment => enrollment.grade || enrollment.average_grade)
      .filter(grade => grade !== null && grade !== undefined && !isNaN(grade));
    
    if (grades.length === 0) return 0;
    
    const totalGrade = grades.reduce((sum, grade) => sum + grade, 0);
    return Math.round(totalGrade / grades.length);
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 95) return 'bg-green-100 text-green-800';
    if (percentage >= 85) return 'bg-blue-100 text-blue-800';
    if (percentage >= 75) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
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
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <Users className="h-12 w-12 mx-auto mb-2" />
          <p className="text-lg font-semibold">{error}</p>
        </div>
        <button
          onClick={fetchChildren}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowAddChildForm(false)}
              className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Children</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Child Account</h1>
              <p className="text-gray-600">Register your child for Baraem Al-Nour Islamic education programs</p>
            </div>
          </div>
        </div>

        {/* Child Account Creation Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Children's Progress</h1>
          <p className="text-gray-600">Monitor your children's academic performance and attendance</p>
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
            className="flex items-center space-x-2 border-2 border-purple-600 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-600 hover:text-white transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>Add Children</span>
          </button>
        </div>

        {/* No Children Message */}
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Children Linked</h2>
          <p className="text-gray-600 mb-6">You haven't added any children to your account yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full">
      {console.log('Rendering main view, showAddChildForm:', showAddChildForm)}
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Children's Progress</h1>
          <p className="text-gray-600">Monitor your children's academic performance and attendance</p>
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
          className="flex items-center space-x-2 border-2 border-purple-600 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-600 hover:text-white transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>Add Children</span>
        </button>
      </div>

      {/* Children Selector */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Child</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChild(child)}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${selectedChild?.id === child.id
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
                }`}
            >
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg font-bold">
                    {child.firstName ? child.firstName.charAt(0) : child.name.charAt(0)}
                  </span>
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">
                    {child.firstName && child.lastName
                      ? `${child.firstName} ${child.lastName}`
                      : child.name
                    }
                  </h3>
                  <p className="text-sm text-gray-600">{child.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Courses</p>
                  <p className="font-semibold">{child.enrolled_courses}</p>
                </div>
                <div>
                  <p className="text-gray-600">Avg Progress</p>
                  <p className="font-semibold">{Math.round(child.avg_progress || 0)}%</p>
                </div>
                <div>
                  <p className="text-gray-600">Attendance</p>
                  <p className="font-semibold">
                    {child.total_sessions > 0
                      ? Math.round((child.attended_sessions / child.total_sessions) * 100)
                      : 0}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Avg Grade</p>
                  <p className={`font-semibold ${getGradeColor(child.avg_grade_percentage || 0)}`}>
                    {Math.round(child.avg_grade_percentage || 0)}%
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Child Details */}
      {selectedChild && (
        <div className="space-y-6">
          {/* Child Overview */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-white">
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold">
                  {selectedChild.firstName ? selectedChild.firstName.charAt(0) : selectedChild.name.charAt(0)}
                </span>
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold">
                  {selectedChild.firstName && selectedChild.lastName
                    ? `${selectedChild.firstName} ${selectedChild.lastName}`
                    : selectedChild.name
                  }
                </h2>
                <p className="text-purple-100">{selectedChild.email}</p>
                <p className="text-purple-100 capitalize">
                  {selectedChild.parentId ? 'Linked to Parent Account' : 'Individual Student Account'}
                </p>
                                 {selectedChild.parentId && (
                   <p className="text-purple-100 text-sm">
                     Parent: {user.firstName} {user.lastName}
                   </p>
                 )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold">{selectedChild.enrolled_courses}</p>
                <p className="text-purple-100">Enrolled Courses</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{Math.round(selectedChild.avg_progress || 0)}%</p>
                <p className="text-purple-100">Average Progress</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {selectedChild.studentData?.stats?.attendanceRate || 0}%
                </p>
                <p className="text-purple-100">Attendance Rate</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{Math.round(selectedChild.avg_grade_percentage || 0)}%</p>
                <p className="text-purple-100">Average Grade</p>
              </div>
            </div>
          </div>

          {/* Detailed Progress */}
          {progressLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : childProgress && (
            <div className="space-y-6">
              {/* Show message if no progress data */}
              {childProgress.courses.length === 0 && 
               childProgress.recentGrades.length === 0 && 
               childProgress.attendanceSummary.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                  <BookOpen className="h-12 w-12 text-blue-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">No Progress Data Available</h3>
                  <p className="text-blue-700">
                    Progress data will appear here once your child starts attending classes and completing assignments.
                  </p>
                </div>
              )}

              {/* Course Progress */}
              {childProgress.courses && childProgress.courses.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Course Progress</h3>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                      {childProgress.courses.map((course) => (
                        <div key={course.id || course.title} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">{course.title || course.name || 'Unknown Course'}</h4>
                            <span className="text-sm text-gray-500">{course.progress_percentage || 0}%</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">Instructor: {course.instructor_name || course.instructor || 'Unknown'}</p>

                          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <div
                              className="bg-purple-600 h-2 rounded-full"
                              style={{ width: `${course.progress_percentage || 0}%` }}
                            ></div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Attendance</p>
                              <p className="font-semibold">
                                {course.attended_sessions || 0}/{course.total_sessions || 0}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Assignments</p>
                              <p className="font-semibold">
                                {course.graded_assignments || 0}/{course.total_assignments || 0}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Avg Grade</p>
                              <p className={`font-semibold ${getGradeColor(course.avg_grade_percentage || 0)}`}>
                                {Math.round(course.avg_grade_percentage || 0)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                </div>
              </div>
              )}

              {/* Recent Grades */}
              {childProgress.recentGrades && childProgress.recentGrades.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Grades</h3>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                      {childProgress.recentGrades.slice(0, 10).map((grade, index) => (
                        <div key={grade.id || index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">{grade.assignment_title || grade.title || 'Unknown Assignment'}</h4>
                            <div className="text-right">
                              <span className={`text-lg font-bold ${getGradeColor((grade.grade || 0) / (grade.max_points || 1) * 100)}`}>
                                {grade.grade || 0}/{grade.max_points || 1}
                              </span>
                              <p className="text-xs text-gray-500">
                                {Math.round(((grade.grade || 0) / (grade.max_points || 1)) * 100)}%
                              </p>
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 mb-1">Course: {grade.course_title || grade.course || 'Unknown Course'}</p>
                          <p className="text-sm text-gray-600 mb-2">Type: {grade.assignment_type || grade.type || 'Unknown'}</p>

                          {grade.feedback && (
                            <div className="bg-gray-50 p-3 rounded-md mb-2">
                              <p className="text-sm text-gray-700">{grade.feedback}</p>
                            </div>
                          )}

                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Graded by: {grade.graded_by_name || grade.graded_by || 'Unknown'}</span>
                            <span>Date: {grade.graded_at ? new Date(grade.graded_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            }) : 'Unknown'}</span>
                          </div>
                        </div>
                      ))}
                </div>
              </div>
            </div>
          )}

          {/* Attendance Summary */}
              {childProgress.attendanceSummary && childProgress.attendanceSummary.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Attendance Summary</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {childProgress.attendanceSummary.map((attendance, index) => (
                    <div key={attendance.status || index} className="text-center">
                      <div className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold mb-2 ${getAttendanceColor(attendance.percentage || 0)}`}>
                        {attendance.status ? (attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1)) : 'Unknown'}
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{attendance.count || 0}</p>
                      <p className="text-sm text-gray-600">{attendance.percentage || 0}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
        </div>
      )}
    </div>
  );
};

export default ChildrenManagement;