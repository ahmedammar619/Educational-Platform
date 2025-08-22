import { useState, useEffect } from 'react';
import { Users, X, Clock, Edit } from 'lucide-react';

const AttendanceTab = ({ currentUser, theme }) => {
  // Course schedule - this would come from the classData in a real app
  // For Islamic History: Monday 9-11, Wednesday 2-4, Friday 10-12
  const [courseSchedule, setCourseSchedule] = useState(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // Get the last 3 sessions based on current date
    // For Islamic History: Monday 9-11, Wednesday 2-4, Friday 10-12
    const getLastThreeSessions = () => {
      const sessions = [];
      let currentDate = new Date(today);

      // Go back in time to find the last 3 sessions
      for (let i = 0; i < 30; i++) { // Look back up to 30 days
        currentDate.setDate(currentDate.getDate() - 1);
        const dayOfWeek = currentDate.getDay();
        const dateString = currentDate.toISOString().split('T')[0];

        if (dayOfWeek === 1) { // Monday
          sessions.push({
            day: 'Monday',
            time: '09:00-11:00',
            date: dateString
          });
        } else if (dayOfWeek === 3) { // Wednesday
          sessions.push({
            day: 'Wednesday',
            time: '14:00-16:00',
            date: dateString
          });
        } else if (dayOfWeek === 5) { // Friday
          sessions.push({
            day: 'Friday',
            time: '10:00-12:00',
            date: dateString
          });
        }

        if (sessions.length >= 3) break;
      }

      // Return the last 3 sessions in chronological order (oldest first)
      return sessions.reverse().slice(-3);
    };

    return getLastThreeSessions();
  });

  // Attendance state - only for scheduled class days
  const [attendanceData, setAttendanceData] = useState([
    {
      id: 1,
      date: '2024-01-15',
      day: 'Monday',
      time: '09:00-11:00',
      students: [
        { id: 1, name: 'John Doe', status: 'present', time: '09:00' },
        { id: 2, name: 'Jane Smith', status: 'absent', time: null },
        { id: 3, name: 'Mike Johnson', status: 'late', time: '09:15' },
        { id: 4, name: 'Sarah Wilson', status: 'present', time: '08:55' }
      ]
    },
    {
      id: 2,
      date: '2024-01-17',
      day: 'Wednesday',
      time: '14:00-16:00',
      students: [
        { id: 1, name: 'John Doe', status: 'present', time: '14:02' },
        { id: 2, name: 'Jane Smith', status: 'present', time: '13:58' },
        { id: 3, name: 'Mike Johnson', status: 'present', time: '14:00' },
        { id: 4, name: 'Sarah Wilson', status: 'absent', time: null }
      ]
    }
  ]);

  // Get next scheduled class date
  const getNextScheduledClass = () => {
    // Since we're showing the last 3 sessions, the most recent one should be the default
    // Return the last (most recent) session date
    return courseSchedule.length > 0 ? courseSchedule[courseSchedule.length - 1].date : new Date().toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getNextScheduledClass());
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);

  // Function to update course schedule (call this when new sessions occur)
  const updateCourseSchedule = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    const getLastThreeSessions = () => {
      const sessions = [];
      let currentDate = new Date(today);

      // Go back in time to find the last 3 sessions
      for (let i = 0; i < 30; i++) { // Look back up to 30 days
        currentDate.setDate(currentDate.getDate() - 1);
        const dayOfWeek = currentDate.getDay();
        const dateString = currentDate.toISOString().split('T')[0];

        if (dayOfWeek === 1) { // Monday
          sessions.push({
            day: 'Monday',
            time: '09:00-11:00',
            date: dateString
          });
        } else if (dayOfWeek === 3) { // Wednesday
          sessions.push({
            day: 'Wednesday',
            time: '14:00-16:00',
            date: dateString
          });
        } else if (dayOfWeek === 5) { // Friday
          sessions.push({
            day: 'Friday',
            time: '10:00-12:00',
            date: dateString
          });
        }

        if (sessions.length >= 3) break;
      }

      // Return the last 3 sessions in chronological order (oldest first)
      return sessions.reverse().slice(-3);
    };

    const newSchedule = getLastThreeSessions();
    setCourseSchedule(newSchedule);

    // Update selected date to the most recent session
    if (newSchedule.length > 0) {
      setSelectedDate(newSchedule[newSchedule.length - 1].date);
    }
  };

  // Update course schedule when component mounts
  useEffect(() => {
    updateCourseSchedule();
  }, []);

  return (
    <div className="space-y-6">
      {/* Course Schedule */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-lg font-medium text-gray-900">Course Schedule</h4>
          <p className="text-xs text-gray-500">Last 3 sessions • Click to select</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {courseSchedule.map((schedule) => {
            const hasAttendance = attendanceData.some(record => record.date === schedule.date);
            return (
              <div
                key={schedule.date}
                className={`text-start p-2 rounded-xl border-2 transition-all duration-200 cursor-pointer relative shadow-sm hover:shadow-md ${selectedDate === schedule.date
                  ? `border-${theme.primary}-500 bg-${theme.primaryLight} shadow-lg`
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                onClick={() => setSelectedDate(schedule.date)}
              >
                {/* Day Badge */}
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-3 ${selectedDate === schedule.date
                  ? `bg-${theme.primary}-100 text-${theme.primary}-700`
                  : 'bg-gray-100 text-gray-600'
                  }`}>
                  {schedule.day}
                </div>

                {/* Time Display */}
                <div className="mb-4">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {schedule.time}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(schedule.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>

                {/* Take/Update Attendance Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDate(schedule.date);
                    setShowAttendanceModal(true);
                    if (hasAttendance) {
                      // If attendance exists, set it for editing
                      const existingRecord = attendanceData.find(record => record.date === schedule.date);
                      setEditingAttendance(existingRecord);
                    } else {
                      // If no attendance exists, clear editing state
                      setEditingAttendance(null);
                    }
                  }}
                  className={`absolute top-2 right-4 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md ${hasAttendance
                    ? 'bg-green-500 text-white hover:bg-green-600 hover:scale-105'
                    : 'bg-blue-500 text-white hover:bg-blue-600 hover:scale-105'
                    }`}
                >
                  {hasAttendance ? 'Update' : 'Take'} Attendance
                </button>

                {/* Status Indicator */}
                {hasAttendance && (
                  <div className="absolute top-4 right-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">4</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Present This Day</p>
              <p className="text-2xl font-bold text-green-600">
                {(() => {
                  const selectedRecord = attendanceData.find(record => record.date === selectedDate);
                  return selectedRecord ? selectedRecord.students.filter(s => s.status === 'present').length : 0;
                })()}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Absent This Day</p>
              <p className="text-2xl font-bold text-red-600">
                {(() => {
                  const selectedRecord = attendanceData.find(record => record.date === selectedDate);
                  return selectedRecord ? selectedRecord.students.filter(s => s.status === 'absent').length : 0;
                })()}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <X className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Late This Day</p>
              <p className="text-2xl font-bold text-orange-600">
                {(() => {
                  const selectedRecord = attendanceData.find(record => record.date === selectedDate);
                  return selectedRecord ? selectedRecord.students.filter(s => s.status === 'late').length : 0;
                })()}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Records */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900">Attendance Records for Scheduled Classes</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-center text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-center text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day & Time</th>
                <th className="px-6 py-3 text-center text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
                <th className="px-6 py-3 text-center text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Absent</th>
                <th className="px-6 py-3 text-center text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Late</th>
                <th className="px-6 py-3 text-center text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceData.map((record) => {
                const presentCount = record.students.filter(s => s.status === 'present').length;
                const absentCount = record.students.filter(s => s.status === 'absent').length;
                const lateCount = record.students.filter(s => s.status === 'late').length;

                return (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {record.day} - {record.time}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {lateCount}
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
                {editingAttendance ? `Edit Attendance - ${editingAttendance.day} ${editingAttendance.time}` : `Take Attendance - ${courseSchedule.find(s => s.date === selectedDate)?.day} ${courseSchedule.find(s => s.date === selectedDate)?.time}`}
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

            {/* Date Display */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Class Date & Time</label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">
                {courseSchedule.find(s => s.date === selectedDate)?.day} - {courseSchedule.find(s => s.date === selectedDate)?.time} ({new Date(selectedDate).toLocaleDateString()})
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Only scheduled class days are available for attendance
              </p>
            </div>

            {/* Students List */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Student Attendance</h4>
              <div className="space-y-3">
                {(editingAttendance ? editingAttendance.students : attendanceData[0]?.students || []).map((student) => (
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
                          if (editingAttendance) {
                            setEditingAttendance({
                              ...editingAttendance,
                              students: editingAttendance.students.map(s =>
                                s.id === student.id ? { ...s, status: newStatus } : s
                              )
                            });
                          } else {
                            // Update the first attendance record for new attendance
                            setAttendanceData(prev => prev.map((record, index) =>
                              index === 0 ? {
                                ...record,
                                students: record.students.map(s =>
                                  s.id === student.id ? { ...s, status: newStatus } : s
                                )
                              } : record
                            ));
                          }
                        }}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
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
                onClick={() => {
                  if (editingAttendance) {
                    // Update existing attendance record
                    setAttendanceData(prev => prev.map(record =>
                      record.id === editingAttendance.id ? editingAttendance : record
                    ));
                  } else {
                    // Create new attendance record
                    const selectedSchedule = courseSchedule.find(s => s.date === selectedDate);
                    const newRecord = {
                      id: Date.now(),
                      date: selectedDate,
                      day: selectedSchedule?.day || 'Unknown',
                      time: selectedSchedule?.time || 'Unknown',
                      students: attendanceData[0]?.students || []
                    };
                    setAttendanceData([newRecord, ...attendanceData]);
                  }
                  setShowAttendanceModal(false);
                  setEditingAttendance(null);
                }}
                className={`px-6 py-2 bg-${theme.primary}-600 text-white rounded-lg hover:bg-${theme.primary}-700 transition-colors`}
              >
                {editingAttendance ? 'Update' : 'Save'} Attendance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTab;
