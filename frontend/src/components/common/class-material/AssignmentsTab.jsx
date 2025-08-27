import { useState } from 'react';
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

const AssignmentsTab = ({ currentUser, theme }) => {
  // Mock data for assignments
  const [assignments, setAssignments] = useState([
    {
      id: 1,
      title: 'Math Homework - Chapter 5',
      description: 'Complete exercises 1-20 from Chapter 5. Show all your work and submit as PDF.',
      dueDate: '2024-01-15',
      dueTime: '23:59',
      maxPoints: 100,
      createdBy: {
        name: 'Dr. Smith',
        avatar: 'DS',
        avatarColor: 'bg-blue-500'
      },
      createdAt: '2024-01-10',
      submissions: [
        {
          id: 1,
          studentId: 'student1',
          studentName: 'John Doe',
          fileName: 'math_homework_john.pdf',
          submittedAt: '2024-01-14T15:30:00',
          grade: 85,
          feedback: 'Good work! Minor calculation errors in problems 8 and 12.',
          status: 'graded'
        },
        {
          id: 2,
          studentId: 'student2',
          studentName: 'Jane Smith',
          fileName: 'math_homework_jane.pdf',
          submittedAt: '2024-01-14T18:45:00',
          grade: null,
          feedback: null,
          status: 'submitted'
        }
      ]
    },
    {
      id: 2,
      title: 'Science Project - Lab Report',
      description: 'Write a comprehensive lab report on the photosynthesis experiment. Include data analysis and conclusions.',
      dueDate: '2024-01-20',
      dueTime: '17:00',
      maxPoints: 150,
      createdBy: {
        name: 'Prof. Johnson',
        avatar: 'PJ',
        avatarColor: 'bg-green-500'
      },
      createdAt: '2024-01-12',
      submissions: []
    }
  ]);

  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [showSubmitAssignment, setShowSubmitAssignment] = useState(false);
  const [showGradeAssignment, setShowGradeAssignment] = useState(false);
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
    return submission.status;
  };

  const getSubmissionGrade = (assignment, studentId) => {
    const submission = assignment.submissions.find(sub => sub.studentId === studentId);
    return submission ? submission.grade : null;
  };

  // Event handlers
  const handleCreateAssignment = () => {
    if (assignmentTitle.trim() && assignmentDescription.trim() && assignmentDueDate && assignmentDueTime) {
      const newAssignment = {
        id: Date.now(),
        title: assignmentTitle,
        description: assignmentDescription,
        dueDate: assignmentDueDate,
        dueTime: assignmentDueTime,
        maxPoints: parseInt(assignmentMaxPoints),
        createdBy: {
          name: currentUser?.name || 'Teacher',
          avatar: currentUser?.name?.charAt(0)?.toUpperCase() || 'T',
          avatarColor: 'bg-blue-500'
        },
        createdAt: new Date().toISOString().split('T')[0],
        submissions: []
      };

      setAssignments([newAssignment, ...assignments]);

      // Reset form
      setAssignmentTitle('');
      setAssignmentDescription('');
      setAssignmentDueDate('');
      setAssignmentDueTime('');
      setAssignmentMaxPoints(100);
      setShowCreateAssignment(false);
    }
  };

  const handleSubmitAssignment = () => {
    if (uploadedFile && selectedAssignment) {
      const newSubmission = {
        id: Date.now(),
        studentId: currentUser?.id || 'current_student',
        studentName: currentUser?.name || 'Current Student',
        fileName: uploadedFile.name,
        submittedAt: new Date().toISOString(),
        grade: null,
        feedback: null,
        status: 'submitted'
      };

      setAssignments(assignments.map(assignment =>
        assignment.id === selectedAssignment.id
          ? { ...assignment, submissions: [...assignment.submissions, newSubmission] }
          : assignment
      ));

      setUploadedFile(null);
      setSelectedAssignment(null);
      setShowSubmitAssignment(false);
    }
  };

  const handleGradeAssignment = () => {
    if (grade && selectedSubmission) {
      setAssignments(assignments.map(assignment =>
        assignment.id === selectedAssignment.id
          ? {
            ...assignment,
            submissions: assignment.submissions.map(submission =>
              submission.id === selectedSubmission.id
                ? {
                  ...submission,
                  grade: parseInt(grade),
                  feedback: feedback.trim() || null,
                  status: 'graded'
                }
                : submission
            )
          }
          : assignment
      ));

      setGrade('');
      setFeedback('');
      setSelectedSubmission(null);
      setSelectedAssignment(null);
      setShowGradeAssignment(false);
    }
  };

  const handleDownloadSubmission = (submission) => {
    // Create a mock download (in real app, this would be actual file data)
    const blob = new Blob(['Mock PDF content for ' + submission.fileName], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = submission.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDeleteAssignment = (assignmentId) => {
    if (window.confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      setAssignments(assignments.filter(a => a.id !== assignmentId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Assignment Button */}
      {canCreateAssignment() && (
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Assignments</h2>
          <button
            onClick={() => setShowCreateAssignment(true)}
            className={`px-4 py-2 bg-${theme.primary}-600 text-white rounded-lg hover:bg-${theme.primaryHover} transition-colors flex items-center gap-2`}
          >
            <Plus className="h-5 w-5" />
            Create Assignment
          </button>
        </div>
      )}

      {/* Assignments List */}
      {assignments.length === 0 ? (
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
              className={`px-4 py-2 bg-${theme.primary}-600 text-white rounded-lg hover:bg-${theme.primaryHover} transition-colors flex items-center gap-2 mx-auto`}
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
                    <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
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
                      {assignment.maxPoints} points
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {assignment.submissions.length} submission{assignment.submissions.length !== 1 ? 's' : ''}
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
                        className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View submissions"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete assignment"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}

                  {canSubmitAssignment() && (
                    <button
                      onClick={() => {
                        setSelectedAssignment(assignment);
                        setShowSubmitAssignment(true);
                      }}
                      disabled={isOverdue(assignment.dueDate, assignment.dueTime)}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors flex items-center gap-1 ${isOverdue(assignment.dueDate, assignment.dueTime)
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : `bg-${theme.primary}-100 text-${theme.primary}-700 hover:bg-${theme.primary}-200`
                        }`}
                    >
                      <Upload className="h-4 w-4" />
                      {getSubmissionStatus(assignment, currentUser?.id || 'current_student') === 'not_submitted' ? 'Submit' : 'Resubmit'}
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
                              <span className="text-sm">Graded: {submissionGrade}/{assignment.maxPoints}</span>
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
                    className="w-full bg-gray-50 text-gray-900 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Time</label>
                  <input
                    type="time"
                    value={assignmentDueTime}
                    onChange={(e) => setAssignmentDueTime(e.target.value)}
                    className="w-full bg-gray-50 text-gray-900 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
                  />
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
                className={`flex-1 px-4 py-2 bg-${theme.primary}-600 text-white rounded-lg hover:bg-${theme.primaryHover} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              >
                Create Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Assignment Modal */}
      {showSubmitAssignment && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-2xl shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Submit Assignment</h3>
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
              <h4 className="font-medium text-gray-900 mb-2">{selectedAssignment.title}</h4>
              <p className="text-gray-600 text-sm mb-4">{selectedAssignment.description}</p>
              <div className="text-sm text-gray-500">
                Due: {formatDate(selectedAssignment.dueDate)} at {selectedAssignment.dueTime}
              </div>
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
                className={`flex-1 px-4 py-2 bg-${theme.primary}-600 text-white rounded-lg hover:bg-${theme.primaryHover} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              >
                Submit Assignment
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
              <h3 className="text-xl font-semibold text-gray-900">Grade Assignment: {selectedAssignment.title}</h3>
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
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {submission.status === 'graded' && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                            {submission.grade}/{selectedAssignment.maxPoints}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Grade (out of {selectedAssignment.maxPoints})</label>
                    <input
                      type="number"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      min="0"
                      max={selectedAssignment.maxPoints}
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
                    disabled={!grade || grade < 0 || grade > selectedAssignment.maxPoints}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
  );
};

export default AssignmentsTab;
