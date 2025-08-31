import { useState, useEffect } from 'react';
import {
  Plus,
  Upload,
  Download,
  Edit,
  Trash2,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Star,
  Eye,
  User
} from 'lucide-react';
import { materialsService } from '../../../services';
import { showErrorToast, showSuccessToast } from '../../../utils/errorHandler';

const AssignmentsTab = ({ currentUser, theme, courseId }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [showSubmitAssignment, setShowSubmitAssignment] = useState(false);
  const [showGradeAssignment, setShowGradeAssignment] = useState(false);
  const [showEditAssignment, setShowEditAssignment] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  // Form states for creating assignment
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDescription, setAssignmentDescription] = useState('');
  const [assignmentDueDate, setAssignmentDueDate] = useState('');
  const [assignmentDueTime, setAssignmentDueTime] = useState('');
  const [assignmentMaxPoints, setAssignmentMaxPoints] = useState(100);

  // Form states for grading
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');

  // Load assignments when component mounts or courseId changes
  useEffect(() => {
    if (courseId) {
      loadAssignments();
    }
  }, [courseId]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const assignmentsData = await materialsService.getCourseAssignments(courseId);
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
    } catch (error) {
      console.error('Error loading assignments:', error);
      showErrorToast(error, 'Failed to load assignments. Please try again.');
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  // Role-based access control
  const canCreateAssignment = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'teacher';
  };

  const canSubmitAssignment = () => {
    return currentUser?.role === 'student';
  };

  const canGradeAssignment = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'teacher';
  };

  // Helper functions
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateTimeString) => {
    return new Date(dateTimeString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (dueDate, dueTime) => {
    const now = new Date();
    const due = new Date(`${dueDate}T${dueTime}`);
    return now > due;
  };

  const getSubmissionStatus = (assignment, studentId) => {
    const submission = assignment.submissions.find(sub => sub.studentId === studentId);
    if (!submission) return 'not_submitted';
    
    // Determine status based on whether the submission has been graded
    if (submission.grade !== null && submission.grade !== undefined) {
      return 'graded';
    } else {
      return 'submitted';
    }
  };

  const getSubmissionGrade = (assignment, studentId) => {
    const submission = assignment.submissions.find(sub => sub.studentId === studentId);
    return submission ? submission.grade : null;
  };

  // Event handlers
  const handleCreateAssignment = async () => {
    if (assignmentTitle.trim() && assignmentDescription.trim() && assignmentDueDate && assignmentDueTime && courseId) {
      try {
        const assignmentData = {
          title: assignmentTitle.trim(),
          description: assignmentDescription.trim(),
          dueDate: assignmentDueDate,
          dueTime: assignmentDueTime,
          maxPoints: parseInt(assignmentMaxPoints)
        };

        await materialsService.createAssignment(courseId, assignmentData);
        
        // Reload assignments to get the updated list
        await loadAssignments();

        // Reset form
        setAssignmentTitle('');
        setAssignmentDescription('');
        setAssignmentDueDate('');
        setAssignmentDueTime('');
        setAssignmentMaxPoints(100);
        setShowCreateAssignment(false);
        showSuccessToast('Assignment created successfully!');
      } catch (error) {
        console.error('Error creating assignment:', error);
        showErrorToast(error, 'Failed to create assignment. Please try again.');
      }
    }
  };

  const handleEditAssignment = async () => {
    if (assignmentTitle.trim() && assignmentDescription.trim() && assignmentDueDate && assignmentDueTime && selectedAssignment) {
      try {
        const assignmentData = {
          title: assignmentTitle.trim(),
          description: assignmentDescription.trim(),
          dueDate: assignmentDueDate,
          dueTime: assignmentDueTime,
          maxPoints: parseInt(assignmentMaxPoints)
        };

        await materialsService.updateAssignment(selectedAssignment.id, assignmentData);
        
        // Reload assignments to get the updated list
        await loadAssignments();

        // Reset form
        setAssignmentTitle('');
        setAssignmentDescription('');
        setAssignmentDueDate('');
        setAssignmentDueTime('');
        setAssignmentMaxPoints(100);
        setSelectedAssignment(null);
        setShowEditAssignment(false);
        showSuccessToast('Assignment updated successfully!');
      } catch (error) {
        console.error('Error updating assignment:', error);
        showErrorToast(error, 'Failed to update assignment. Please try again.');
      }
    }
  };

  const handleSubmitAssignment = async () => {
    if (uploadedFile && selectedAssignment) {
      try {
        const isEditing = getSubmissionStatus(selectedAssignment, currentUser?.id || 'current_student') !== 'not_submitted';
        
        await materialsService.submitAssignment(selectedAssignment.id, uploadedFile);
        
        // Reload assignments to get the updated list
        await loadAssignments();

        setUploadedFile(null);
        setSelectedAssignment(null);
        setShowSubmitAssignment(false);
        showSuccessToast(isEditing ? 'Assignment updated successfully!' : 'Assignment submitted successfully!');
      } catch (error) {
        console.error('Error submitting assignment:', error);
        showErrorToast(error, 'Failed to submit assignment. Please try again.');
      }
    }
  };

  const handleGradeAssignment = async () => {
    if (grade && selectedSubmission) {
      try {
        const gradeData = {
          grade: parseInt(grade),
          feedback: feedback.trim() || null
        };

        await materialsService.gradeAssignment(selectedSubmission.id, gradeData);
        
        // Reload assignments to get the updated list
        await loadAssignments();

        setGrade('');
        setFeedback('');
        setSelectedSubmission(null);
        setSelectedAssignment(null);
        setShowGradeAssignment(false);
        showSuccessToast('Grade saved successfully!');
      } catch (error) {
        console.error('Error grading assignment:', error);
        showErrorToast(error, 'Failed to save grade. Please try again.');
      }
    }
  };

  // Helper function to clean filename by removing timestamp and random number
  const getCleanFileName = (fileName) => {
    if (!fileName) return 'submission.pdf';
    
    // Extract file extension
    const ext = fileName.substring(fileName.lastIndexOf('.'));
    
    // Remove the timestamp and random number pattern (name-12345678901-123456789.ext)
    const baseName = fileName.substring(0, fileName.lastIndexOf('-'));
    if (baseName.includes('-')) {
      return baseName.substring(0, baseName.lastIndexOf('-')) + ext;
    }
    
    // Fallback if pattern doesn't match
    return fileName;
  };

  const handleDownloadSubmission = async (submission) => {
    try {
      const blob = await materialsService.downloadSubmission(submission.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Use cleaned filename for download
      const cleanFileName = getCleanFileName(submission.fileName);
      link.download = cleanFileName;
      
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      showSuccessToast('File downloaded successfully!');
    } catch (error) {
      console.error('Error downloading submission:', error);
      showErrorToast(error, 'Failed to download submission');
    }
  };

  return (
    <div className="h-[450px] flex flex-col">
      {/* Fixed height container with scroll */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2">
      {/* Header with Create Assignment Button */}
      {canCreateAssignment() && (
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Assignments</h2>
                      <button
              onClick={() => setShowCreateAssignment(true)}
              className={`px-4 py-2 border-2 border-${theme.primary}-600 text-${theme.primary}-600 rounded-lg hover:bg-${theme.primaryLight} transition-colors flex items-center gap-2`}
            >
              <Plus className="h-5 w-5" />
              Create Assignment
            </button>
        </div>
      )}

      {/* Assignments List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="mb-6">
            <div className="relative w-32 h-32 mx-auto">
              {currentUser?.role === 'admin' && (
                <>
                  <div className="absolute top-0 left-0 w-16 h-16 bg-green-500 rounded-full opacity-80 animate-pulse"></div>
                  <div className="absolute top-4 right-0 w-16 h-16 bg-green-400 rounded-full opacity-80 animate-pulse"></div>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-green-300 rounded-full opacity-80 animate-pulse"></div>
                </>
              )}
              {currentUser?.role === 'teacher' && (
                <>
                  <div className="absolute top-0 left-0 w-16 h-16 bg-blue-500 rounded-full opacity-80 animate-pulse"></div>
                  <div className="absolute top-4 right-0 w-16 h-16 bg-blue-400 rounded-full opacity-80 animate-pulse"></div>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-blue-300 rounded-full opacity-80 animate-pulse"></div>
                </>
              )}
              {currentUser?.role === 'student' && (
                <>
                  <div className="absolute top-0 left-0 w-16 h-16 bg-red-500 rounded-full opacity-80 animate-pulse"></div>
                  <div className="absolute top-4 right-0 w-16 h-16 bg-red-400 rounded-full opacity-80 animate-pulse"></div>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-red-300 rounded-full opacity-80 animate-pulse"></div>
                </>
              )}
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Loading assignments...</h3>
          <p className="text-gray-600">Please wait while we fetch the assignments.</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
          <p className="text-gray-500 mb-4">
            {canCreateAssignment()
              ? 'Create your first assignment to get started.'
              : 'No assignments have been posted yet.'}
          </p>
          {canCreateAssignment() && (
                          <button
                onClick={() => setShowCreateAssignment(true)}
                className={`px-4 py-2 border-2 border-${theme.primary}-600 text-${theme.primary}-600 rounded-lg hover:bg-${theme.primaryLight} transition-colors flex items-center gap-2 mx-auto`}
              >
                <Plus className="h-5 w-5" />
                Create Assignment
              </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-sm transition-shadow">
              {/* Assignment Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{assignment.name}</h3>
                    {isOverdue(assignment.dueDate, assignment.dueTime) && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Overdue
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-3">{assignment.description}</p>

                  {/* Assignment Details */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Due: {formatDate(assignment.dueDate)} at {assignment.dueTime}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      {assignment.marks} points
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {assignment.submissions?.length || 0} submission{(assignment.submissions?.length || 0) !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {/* Assignment Actions */}
                <div className="flex gap-2 ml-4">
                  {canCreateAssignment() && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setShowGradeAssignment(true);
                        }}
                        className="p-2 text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="View submissions"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setAssignmentTitle(assignment.name || '');
                          setAssignmentDescription(assignment.description || '');
                          setAssignmentDueDate(assignment.dueDate || '');
                          setAssignmentDueTime(assignment.dueTime || '');
                          setAssignmentMaxPoints(assignment.marks || 100);
                          setShowEditAssignment(true);
                        }}
                        className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit assignment"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </>
                  )}

                  {canSubmitAssignment() && (
                    <button
                      onClick={() => {
                        setSelectedAssignment(assignment);
                        // Pre-populate form if already submitted
                        const existingSubmission = assignment.submissions?.find(sub => sub.studentId === currentUser?.id);
                        if (existingSubmission) {
                          setUploadedFile(null); // Reset file input, user needs to select file again
                        }
                        setShowSubmitAssignment(true);
                      }}
                      disabled={isOverdue(assignment.dueDate, assignment.dueTime)}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors flex items-center gap-1 ${isOverdue(assignment.dueDate, assignment.dueTime)
                          ? 'border border-gray-300 bg-gray-50 text-gray-400 cursor-not-allowed'
                          : `border border-${theme.primary}-600 text-${theme.primary}-600 hover:bg-${theme.primaryLight}`
                        }`}
                    >
                      <Upload className="h-4 w-4" />
                      {getSubmissionStatus(assignment, currentUser?.id || 'current_student') === 'not_submitted' ? 'Submit' : 'Edit Submission'}
                    </button>
                  )}
                </div>
              </div>

              {/* Student View - Submission Status */}
              {canSubmitAssignment() && (
                <div className="border-t border-gray-100 pt-4">
                  {(() => {
                    const status = getSubmissionStatus(assignment, currentUser?.id || 'current_student');
                    const submissionGrade = getSubmissionGrade(assignment, currentUser?.id || 'current_student');

                    switch (status) {
                      case 'not_submitted':
                        return (
                          <div className="flex items-center gap-2 text-orange-600">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">Not submitted</span>
                          </div>
                        );
                      case 'submitted':
                        return (
                          <div className="flex items-center gap-2 text-blue-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Submitted - Awaiting grade</span>
                          </div>
                        );
                      case 'graded':
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm">Graded: {submissionGrade}/{assignment.marks}</span>
                            </div>
                            {assignment.submissions.find(sub => sub.studentId === currentUser?.id)?.feedback && (
                              <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                <strong>Feedback:</strong> {assignment.submissions.find(sub => sub.studentId === currentUser?.id)?.feedback}
                              </div>
                            )}
                          </div>
                        );
                      default:
                        return null;
                    }
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Assignment Modal */}
      {showCreateAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ margin: '0px' }}>
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Create New Assignment</h3>
              <button
                onClick={() => setShowCreateAssignment(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Title</label>
                <input
                  type="text"
                  value={assignmentTitle}
                  onChange={(e) => setAssignmentTitle(e.target.value)}
                  placeholder="Enter assignment title..."
                  className="w-full bg-gray-50 text-gray-900 placeholder-gray-500 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={assignmentDescription}
                  onChange={(e) => setAssignmentDescription(e.target.value)}
                  placeholder="Enter assignment description and instructions..."
                  className="w-full bg-gray-50 text-gray-900 placeholder-gray-500 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
                  rows="4"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={assignmentDueDate}
                    onChange={(e) => setAssignmentDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-gray-50 text-gray-900 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Time</label>
                  <select
                    value={assignmentDueTime}
                    onChange={(e) => setAssignmentDueTime(e.target.value)}
                    className="w-full bg-gray-50 text-gray-900 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
                  >
                    <option value="">Select time</option>
                    {Array.from({ length: 24 }).map((_, hour) => (
                      [0, 15, 30, 45].map((minute) => {
                        const formattedHour = hour.toString().padStart(2, '0');
                        const formattedMinute = minute.toString().padStart(2, '0');
                        const timeValue = `${formattedHour}:${formattedMinute}`;
                        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                        const amPm = hour < 12 ? 'AM' : 'PM';
                        const displayTime = `${displayHour}:${formattedMinute} ${amPm}`;
                        
                        return (
                          <option key={timeValue} value={timeValue}>
                            {displayTime}
                          </option>
                        );
                      })
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Points</label>
                <input
                  type="number"
                  value={assignmentMaxPoints}
                  onChange={(e) => setAssignmentMaxPoints(e.target.value)}
                  min="1"
                  className="w-full bg-gray-50 text-gray-900 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateAssignment(false)}
                className="flex-1 px-4 py-2 border-2 border-gray-400 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAssignment}
                disabled={!assignmentTitle.trim() || !assignmentDescription.trim() || !assignmentDueDate || !assignmentDueTime}
                className={`flex-1 px-4 py-2 border-2 border-${theme.primary}-600 text-${theme.primary}-600 rounded-lg hover:bg-${theme.primaryLight} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              >
                Create Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {showEditAssignment && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ margin: '0px' }}>
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Edit Assignment</h3>
              <button
                onClick={() => {
                  setShowEditAssignment(false);
                  setSelectedAssignment(null);
                  setAssignmentTitle('');
                  setAssignmentDescription('');
                  setAssignmentDueDate('');
                  setAssignmentDueTime('');
                  setAssignmentMaxPoints(100);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Title</label>
                <input
                  type="text"
                  value={assignmentTitle}
                  onChange={(e) => setAssignmentTitle(e.target.value)}
                  placeholder="Enter assignment title..."
                  className="w-full bg-gray-50 text-gray-900 placeholder-gray-500 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={assignmentDescription}
                  onChange={(e) => setAssignmentDescription(e.target.value)}
                  placeholder="Enter assignment description and instructions..."
                  className="w-full bg-gray-50 text-gray-900 placeholder-gray-500 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
                  rows="4"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                                      <input
                    type="date"
                    value={assignmentDueDate}
                    onChange={(e) => setAssignmentDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-gray-50 text-gray-900 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Time</label>
                  <select
                    value={assignmentDueTime}
                    onChange={(e) => setAssignmentDueTime(e.target.value)}
                    className="w-full bg-gray-50 text-gray-900 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
                  >
                    <option value="">Select time</option>
                    {Array.from({ length: 24 }).map((_, hour) => (
                      [0, 15, 30, 45].map((minute) => {
                        const formattedHour = hour.toString().padStart(2, '0');
                        const formattedMinute = minute.toString().padStart(2, '0');
                        const timeValue = `${formattedHour}:${formattedMinute}`;
                        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                        const amPm = hour < 12 ? 'AM' : 'PM';
                        const displayTime = `${displayHour}:${formattedMinute} ${amPm}`;
                        
                        return (
                          <option key={timeValue} value={timeValue}>
                            {displayTime}
                          </option>
                        );
                      })
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Points</label>
                <input
                  type="number"
                  value={assignmentMaxPoints}
                  onChange={(e) => setAssignmentMaxPoints(e.target.value)}
                  min="1"
                  className="w-full bg-gray-50 text-gray-900 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditAssignment(false);
                  setSelectedAssignment(null);
                  setAssignmentTitle('');
                  setAssignmentDescription('');
                  setAssignmentDueDate('');
                  setAssignmentDueTime('');
                  setAssignmentMaxPoints(100);
                }}
                className="flex-1 px-4 py-2 border-2 border-gray-400 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditAssignment}
                disabled={!assignmentTitle.trim() || !assignmentDescription.trim() || !assignmentDueDate || !assignmentDueTime}
                className={`flex-1 px-4 py-2 border-2 border-${theme.primary}-600 text-${theme.primary}-600 rounded-lg hover:bg-${theme.primaryLight} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              >
                Update Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Assignment Modal */}
      {showSubmitAssignment && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ margin: '0px' }}>
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-2xl shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {getSubmissionStatus(selectedAssignment, currentUser?.id || 'current_student') === 'not_submitted' 
                  ? 'Submit Assignment' 
                  : 'Edit Submission'}
              </h3>
              <button
                onClick={() => {
                  setShowSubmitAssignment(false);
                  setSelectedAssignment(null);
                  setUploadedFile(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">{selectedAssignment.name}</h4>
              <p className="text-gray-600 text-sm mb-4">{selectedAssignment.description}</p>
              <div className="text-sm text-gray-500 mb-3">
                Due: {formatDate(selectedAssignment.dueDate)} at {selectedAssignment.dueTime}
              </div>
              
              {/* Show current submission info if editing */}
              {getSubmissionStatus(selectedAssignment, currentUser?.id || 'current_student') !== 'not_submitted' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-blue-700 mb-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Current Submission</span>
                  </div>
                  {(() => {
                    const submission = selectedAssignment.submissions?.find(sub => sub.studentId === currentUser?.id);
                    return submission ? (
                      <div className="text-sm text-blue-600">
                        <div>Submitted: {formatDateTime(submission.submittedAt)}</div>
                        {submission.fileName && <div>File: {getCleanFileName(submission.fileName)}</div>}
                        <div className="mt-1 text-xs text-blue-500">
                          Upload a new file to replace your current submission
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload PDF File</label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setUploadedFile(e.target.files[0])}
                className="w-full bg-gray-50 text-gray-900 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
              />
              {uploadedFile && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium">{uploadedFile.name}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSubmitAssignment(false);
                  setSelectedAssignment(null);
                  setUploadedFile(null);
                }}
                className="flex-1 px-4 py-2 border-2 border-gray-400 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAssignment}
                disabled={!uploadedFile}
                className={`flex-1 px-4 py-2 border-2 border-${theme.primary}-600 text-${theme.primary}-600 rounded-lg hover:bg-${theme.primaryLight} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              >
                {getSubmissionStatus(selectedAssignment, currentUser?.id || 'current_student') === 'not_submitted' 
                  ? 'Submit Assignment' 
                  : 'Update Submission'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grade Assignment Modal */}
      {showGradeAssignment && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ margin: '0px' }}>
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-4xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Grade Assignment: {selectedAssignment.name}</h3>
              <button
                onClick={() => {
                  setShowGradeAssignment(false);
                  setSelectedAssignment(null);
                  setSelectedSubmission(null);
                  setGrade('');
                  setFeedback('');
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Submissions List */}
            <div className="space-y-4 mb-6">
              {selectedAssignment.submissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No submissions yet
                </div>
              ) : (
                selectedAssignment.submissions.map((submission) => (
                  <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                                              <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {submission.studentName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{submission.studentName}</h4>
                            <p className="text-sm text-gray-500">
                              Submitted: {formatDateTime(submission.submittedAt)}
                            </p>
                            {submission.fileName && (
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {getCleanFileName(submission.fileName)}
                              </p>
                            )}
                          </div>
                        </div>
                      <div className="flex items-center gap-2">
                        {submission.status === 'graded' && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                            {submission.grade}/{selectedAssignment.marks}
                          </span>
                        )}
                        <button
                          onClick={() => handleDownloadSubmission(submission)}
                          className="p-2 text-green-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Download submission"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setGrade(submission.grade || '');
                            setFeedback(submission.feedback || '');
                          }}
                          className={`p-2 rounded-lg transition-colors ${submission.status === 'graded'
                              ? 'text-blue-500 hover:text-blue-600 hover:bg-blue-50'
                              : 'text-orange-500 hover:text-orange-600 hover:bg-orange-50'
                            }`}
                          title={submission.status === 'graded' ? 'Edit grade' : 'Grade submission'}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {submission.feedback && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        <strong>Feedback:</strong> {submission.feedback}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Grading Form */}
            {selectedSubmission && (
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-medium text-gray-900 mb-4">
                  Grade: {selectedSubmission.studentName}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Grade (out of {selectedAssignment.marks})</label>
                    <input
                      type="number"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      min="0"
                      max={selectedAssignment.marks}
                      className="w-full bg-gray-50 text-gray-900 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Feedback (optional)</label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide feedback for the student..."
                    className="w-full bg-gray-50 text-gray-900 placeholder-gray-500 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
                    rows="3"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedSubmission(null);
                      setGrade('');
                      setFeedback('');
                    }}
                    className="px-4 py-2 border-2 border-gray-400 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGradeAssignment}
                    disabled={!grade || grade < 0 || grade > selectedAssignment.marks}
                    className="px-4 py-2 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Save Grade
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AssignmentsTab;
