import { useState, useEffect } from 'react';
import { Users, X, Clock, Edit } from 'lucide-react';
import { materialsService } from '../../../services';
import { showErrorToast, showSuccessToast } from '../../../utils/errorHandler';

const AttendanceTab = ({ currentUser, theme, courseId }) => {
  // Attendance state for actual meetings
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);

  // Load attendance data when component mounts or courseId changes
  useEffect(() => {
    if (courseId) {
      loadAttendanceData();
    }
  }, [courseId]);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      const attendanceRecords = await materialsService.getCourseAttendance(courseId);
      const records = Array.isArray(attendanceRecords) ? attendanceRecords : [];
      setAttendanceData(records);

      // Set the most recent record as selected by default
      if (records.length > 0) {
        setSelectedRecord(records[0]);
      }
    } catch (error) {
      console.error('Error loading attendance:', error);
      showErrorToast(error, 'Failed to load attendance data. Please try again.');
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[450px] flex flex-col">
      {/* Fixed height container with scroll */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2">
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">Loading attendance...</h3>
            <p className="text-gray-600">Please wait while we fetch the attendance data.</p>
          </div>
        ) : (
          <>

            {/* Attendance Records */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h4 className="text-lg font-medium text-gray-900">Individual Meeting Attendance Records</h4>
                <p className="text-sm text-gray-600 mt-1">Each row represents a separate meeting, even if multiple meetings occur on the same day</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-center text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-center text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day & Time</th>
                      <th className="px-6 py-3 text-center text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meeting Name</th>
                      <th className="px-6 py-3 text-center text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
                      <th className="px-6 py-3 text-center text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Absent</th>
                      <th className="px-6 py-3 text-center text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendanceData.map((record) => {
                      const presentCount = record.students ? record.students.filter(s => s.status === 'present').length : 0;
                      const absentCount = record.students ? record.students.filter(s => s.status === 'absent').length : 0;

                      return (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {record.day} - {record.time}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {record.meetingName || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {presentCount}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {absentCount}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                setEditingAttendance(record);
                                setShowAttendanceModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Attendance Modal */}
            {showAttendanceModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ margin: '0px' }}>
                <div className="bg-white rounded-lg p-6 w-11/12 max-w-4xl shadow-xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Edit Attendance - {editingAttendance?.meetingName || 'Meeting'}
                    </h3>
                    <button
                      onClick={() => {
                        setShowAttendanceModal(false);
                        setEditingAttendance(null);
                      }}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Meeting Info Display */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Information</label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">
                      <div className="font-semibold">{editingAttendance?.meetingName || 'Meeting'}</div>
                      <div className="text-gray-600">
                        {editingAttendance?.day} - {editingAttendance?.time} ({new Date(editingAttendance?.date).toLocaleDateString()})
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Attendance is automatically marked when students join Zoom meetings
                    </p>
                  </div>

                  {/* Students List */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Student Attendance</h4>
                    <div className="space-y-3">
                      {editingAttendance?.students?.map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 text-sm font-medium">{student.name.charAt(0)}</span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{student.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <select
                              value={student.status}
                              onChange={(e) => {
                                const newStatus = e.target.value;
                                setEditingAttendance({
                                  ...editingAttendance,
                                  students: editingAttendance.students ? editingAttendance.students.map(s =>
                                    s.id === student.id ? { ...s, status: newStatus } : s
                                  ) : []
                                });
                              }}
                              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="present">Present</option>
                              <option value="absent">Absent</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowAttendanceModal(false);
                        setEditingAttendance(null);
                      }}
                      className="px-4 py-2 border-2 border-gray-400 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          console.log('Editing attendance object:', editingAttendance);
                          console.log('Editing attendance types:', {
                            date: typeof editingAttendance.date,
                            day: typeof editingAttendance.day,
                            time: typeof editingAttendance.time,
                            students: typeof editingAttendance.students,
                            studentsIsArray: Array.isArray(editingAttendance.students)
                          });
                          
                          // Ensure students array is properly formatted
                          const students = (editingAttendance.students || []).map(student => ({
                            id: student.id || '',
                            name: student.name || '',
                            status: student.status || 'absent'
                          }));

                          // Validate and format the data
                          const dateValue = editingAttendance.date;
                          const formattedDate = dateValue ? new Date(dateValue).toISOString() : new Date().toISOString();
                          
                          const attendanceDataToSave = {
                            date: formattedDate,
                            day: editingAttendance.day || 'Unknown',
                            time: editingAttendance.time || 'Unknown',
                            meetingId: editingAttendance.meetingId,
                            students: students
                          };

                          console.log('Sending attendance data:', attendanceDataToSave);
                          console.log('Data types:', {
                            date: typeof attendanceDataToSave.date,
                            day: typeof attendanceDataToSave.day,
                            time: typeof attendanceDataToSave.time,
                            students: typeof attendanceDataToSave.students,
                            studentsIsArray: Array.isArray(attendanceDataToSave.students)
                          });
                          console.log('Raw values:', {
                            date: attendanceDataToSave.date,
                            day: attendanceDataToSave.day,
                            time: attendanceDataToSave.time,
                            students: attendanceDataToSave.students,
                            studentsLength: attendanceDataToSave.students?.length
                          });
                          
                          // Validate data before sending
                          if (!attendanceDataToSave.date || !attendanceDataToSave.day || !attendanceDataToSave.time || !Array.isArray(attendanceDataToSave.students)) {
                            console.error('Invalid data format:', attendanceDataToSave);
                            showErrorToast('Invalid attendance data format. Please try again.');
                            return;
                          }
                          
                          await materialsService.markAttendance(courseId, attendanceDataToSave);

                          // Reload attendance data to get the updated list
                          await loadAttendanceData();

                          setShowAttendanceModal(false);
                          setEditingAttendance(null);
                          showSuccessToast('Attendance updated successfully!');
                        } catch (error) {
                          console.error('Error updating attendance:', error);
                          showErrorToast(error, 'Failed to update attendance. Please try again.');
                        }
                      }}
                      className={`px-6 py-2 border-2 border-${theme.primary}-600 text-${theme.primary}-600 rounded-lg hover:bg-${theme.primaryLight} transition-colors`}
                    >
                      Update Attendance
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AttendanceTab;
