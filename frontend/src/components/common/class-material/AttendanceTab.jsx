import { useState, useEffect } from 'react';
import { Users, X, Clock, Edit, Video } from 'lucide-react';
import { materialsService } from '../../../services';
import zoomService from '../../../services/zoomService';
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

  // Auto-refresh attendance data more frequently to catch real-time updates
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (courseId) {
  //       console.log('🔄 Auto-refreshing attendance data...');
  //       loadAttendanceData();
  //     }
  //   }, 15000); // Refresh every 15 seconds (more frequent for real-time updates)

  //   return () => clearInterval(interval);
  // }, [courseId]);

  // Listen for attendance updates from other components (like ZoomTab)
  useEffect(() => {
    const handleAttendanceUpdate = (event) => {
      const { courseId: eventCourseId, meetingId, studentId, action } = event.detail;
      
      // Only refresh if the update is for the current course
      if (eventCourseId === courseId) {
        console.log('📢 Received attendance update event:', { courseId, meetingId, studentId, action });
        console.log('🔄 Refreshing attendance data immediately...');
        
        // Refresh attendance data immediately
        setTimeout(() => {
          loadAttendanceData();
        }, 1000); // Small delay to ensure backend has processed the update
      }
    };

    // Add event listener
    window.addEventListener('attendanceUpdated', handleAttendanceUpdate);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener('attendanceUpdated', handleAttendanceUpdate);
    };
  }, [courseId]);

  // Get students from the class that contains this course
  const getCourseStudents = async () => {
    try {
      // Get course details to find which class it belongs to
      const courseDetails = await materialsService.getCourseDetails(courseId);
      if (!courseDetails || !courseDetails.classId) {
        console.warn('Course has no associated class');
        return [];
      }
      
      console.log('📚 Course details:', courseDetails);
      console.log('🏫 Class ID:', courseDetails.classId);
      
      // Get students from that class
      const classStudents = await materialsService.getClassStudents(courseDetails.classId);
      console.log('👥 Class students:', classStudents);
      
      return classStudents || [];
    } catch (error) {
      console.error('Error getting course students:', error);
      return [];
    }
  };

  // Save attendance record
  const saveAttendanceRecord = async (attendanceData) => {
    try {
      await materialsService.markAttendance(courseId, attendanceData);
    } catch (error) {
      console.error('Error saving attendance record:', error);
    }
  };

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      
      // Get Zoom meetings for this course
      const meetings = await zoomService.getMeetings({ courseId });
      
      // Get students from the class that contains this course
      const courseStudents = await getCourseStudents();
      
      // Get attendance records for this course
      const attendanceRecords = await materialsService.getCourseAttendance(courseId);
      console.log('📊 Retrieved attendance records:', attendanceRecords);
      console.log('📊 Attendance records count:', attendanceRecords.length);
      
      // Log each record in detail
      attendanceRecords.forEach((record, index) => {
        console.log(`📋 Record ${index + 1}:`, {
          meetingId: record.meetingId,
          date: record.date,
          day: record.day,
          time: record.time,
          studentsCount: record.students?.length || 0,
          students: record.students?.map(s => ({ id: s.id, name: s.name, status: s.status })) || []
        });
      });
      
      // Combine Zoom meetings with their attendance records
      const meetingAttendanceData = meetings.map(meeting => {
        // Find attendance record for this meeting
        const attendanceRecord = attendanceRecords.find(record => 
          record.meetingId === meeting.id
        );
        
        console.log('🔍 Meeting:', meeting.title, 'ID:', meeting.id);
        console.log('📊 Existing attendance record:', attendanceRecord);
        console.log('👥 Course students count:', courseStudents.length);
        
        // Debug: Check if we found the attendance record
        if (attendanceRecord) {
          console.log('✅ Found attendance record for meeting:', meeting.title);
          console.log('📋 Record details:', {
            meetingId: attendanceRecord.meetingId,
            studentsCount: attendanceRecord.students?.length || 0,
            students: attendanceRecord.students?.map(s => `${s.name}: ${s.status}`) || []
          });
        } else {
          console.log('❌ No attendance record found for meeting:', meeting.title, 'ID:', meeting.id);
          console.log('🔍 Available records:', attendanceRecords.map(r => ({ 
            meetingId: r.meetingId, 
            title: r.meetingName || 'Unknown' 
          })));
        }
        
        // If no attendance record exists, create one with all students marked as absent
        let attendanceData = attendanceRecord;
        if (!attendanceData && courseStudents.length > 0) {
          console.log('📝 Creating attendance record for meeting:', meeting.title);
          console.log('👥 Course students to mark absent:', courseStudents);
          
          attendanceData = {
            meetingId: meeting.id,
            students: courseStudents.map(student => {
              // Handle different student data formats
              const studentName = student.user ? 
                `${student.user.firstName} ${student.user.lastName}` :
                `${student.firstName} ${student.lastName}`;
              
              const studentId = student.user ? student.user.id : student.id;
              
              console.log('👤 Creating attendance for student:', {
                studentId: studentId,
                studentName: studentName,
                studentEntityId: student.id,
                userEntityId: student.user?.id,
                studentData: student
              });
              
              return {
                id: studentId,
                name: studentName,
                status: 'absent' // Initially mark all students as absent
              };
            }),
            date: meeting.date,
            time: meeting.time,
            day: new Date(meeting.date).toLocaleDateString('en-US', { weekday: 'long' })
          };
          
          console.log('📋 Attendance data to save:', attendanceData);
          
          // Save the initial attendance record
          saveAttendanceRecord(attendanceData);
        } else if (attendanceData && (!attendanceData.students || attendanceData.students.length === 0) && courseStudents.length > 0) {
          // Attendance record exists but has no students - populate with course students
          // but mark them as absent initially (preserving any saved data)
          console.log('⚠️ Attendance record exists but has no students - populating with course students');
          console.log('📊 Attendance record:', attendanceData);
          console.log('👥 Course students available:', courseStudents.length);
          
          // Create students array with all course students marked as absent
          // This ensures students appear in the UI
          attendanceData.students = courseStudents.map(student => {
            const studentName = student.user ? 
              `${student.user.firstName} ${student.user.lastName}` :
              `${student.firstName} ${student.lastName}`;
            
            const studentId = student.user ? student.user.id : student.id;
            
            return {
              id: studentId,
              name: studentName,
              status: 'absent' // Default to absent - will be updated by backend data
            };
          });
          
          console.log('📋 Populated students for display:', attendanceData.students);
        } else if (attendanceData && attendanceData.students && attendanceData.students.length > 0) {
          console.log('✅ Attendance record already exists for meeting:', meeting.title);
          console.log('📋 Existing attendance data:', attendanceData);
          
          // Check if all course students are present in the attendance record
          const existingStudentIds = attendanceData.students.map(s => s.id);
          const missingStudents = courseStudents.filter(student => {
            const studentId = student.user ? student.user.id : student.id;
            return !existingStudentIds.includes(studentId);
          });
          
          if (missingStudents.length > 0) {
            console.log('👥 Adding missing students to attendance record:', missingStudents.length);
            
            // Add missing students to the attendance record
            const missingStudentsData = missingStudents.map(student => {
              const studentName = student.user ? 
                `${student.user.firstName} ${student.user.lastName}` :
                `${student.firstName} ${student.lastName}`;
              
              const studentId = student.user ? student.user.id : student.id;
              
              return {
                id: studentId,
                name: studentName,
                status: 'absent' // Default to absent for new students
              };
            });
            
            attendanceData.students = [...attendanceData.students, ...missingStudentsData];
            console.log('📋 Updated attendance data with missing students:', attendanceData.students);
          }
        }
        
        return {
          id: meeting.id,
          meetingName: meeting.title,
          date: meeting.date,
          time: meeting.time,
          period: meeting.period,
          day: meeting.date ? new Date(meeting.date).toLocaleDateString('en-US', { weekday: 'long' }) : 'Unknown',
          status: meeting.status,
          students: attendanceData ? attendanceData.students : [],
          meetingId: meeting.id,
          createdBy: meeting.createdBy
        };
      });
      
      // Sort by date (most recent first)
      const sortedData = meetingAttendanceData.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      
      setAttendanceData(sortedData);

      // Set the most recent record as selected by default
      if (sortedData.length > 0) {
        setSelectedRecord(sortedData[0]);
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
    <div className="h-[700px] lg:h-[450px] flex flex-col">

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
                      <th className="px-6 py-3 text-center text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                      <th className="px-6 py-3 text-center text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zoom Meeting</th>
                      <th className="px-6 py-3 text-center text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-center text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
                      <th className="px-6 py-3 text-center text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Absent</th>
                      <th className="px-6 py-3 text-center text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendanceData.map((record) => {
                      const presentCount = record.students ? record.students.filter(s => s.status === 'present').length : 0;
                      const absentCount = record.students ? record.students.filter(s => s.status === 'absent').length : 0;

                      // Get meeting status
                      const getMeetingStatus = (meeting) => {
                        if (!meeting.date || !meeting.time || !meeting.period) return 'scheduled';
                        if (meeting.status === 'ended') return 'ended';
                        if (meeting.status === 'cancelled') return 'cancelled';
                        
                        const now = new Date();
                        const [hours, minutes] = meeting.time.split(':').map(Number);
                        let hour24 = hours;
                        
                        if (meeting.period === 'PM' && hours !== 12) {
                          hour24 = hours + 12;
                        } else if (meeting.period === 'AM' && hours === 12) {
                          hour24 = 0;
                        }
                        
                        const meetingDateTime = new Date(meeting.date);
                        meetingDateTime.setHours(hour24, minutes, 0, 0);
                        
                        if (now < meetingDateTime) return 'upcoming';
                        if (now >= meetingDateTime) return 'live';
                        return 'ended';
                      };

                      const meetingStatus = getMeetingStatus(record);
                      const statusColors = {
                        upcoming: 'bg-blue-100 text-blue-800',
                        live: 'bg-green-100 text-green-800',
                        ended: 'bg-gray-100 text-gray-800',
                        scheduled: 'bg-yellow-100 text-yellow-800',
                        cancelled: 'bg-red-100 text-red-800'
                      };

                      return (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex items-center justify-center gap-2">
                              <div>
                                <div>{record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}</div>
                                {record.time && record.period && (
                                  <div className="text-xs text-gray-500">{record.time} {record.period}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div className="font-medium">{record.meetingName || 'N/A'}</div>
                            {record.createdBy && (
                              <div className="text-xs text-gray-500">
                                by {record.createdBy.firstName} {record.createdBy.lastName}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[meetingStatus]}`}>
                              {meetingStatus === 'upcoming' ? 'Upcoming' : 
                               meetingStatus === 'live' ? 'Live Now' : 
                               meetingStatus === 'ended' ? 'Ended' : 
                               meetingStatus === 'cancelled' ? 'Cancelled' : 'Scheduled'}
                            </span>
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
                              title="Edit Attendance"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Zoom Meeting Information</label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">
                      <div className="flex items-center gap-2 mb-1">
                        <Video className="w-4 h-4 text-blue-600" />
                        <div className="font-semibold">{editingAttendance?.meetingName || 'Zoom Meeting'}</div>
                      </div>
                      <div className="text-gray-600">
                        {editingAttendance?.date && new Date(editingAttendance.date).toLocaleDateString()} 
                        {editingAttendance?.time && editingAttendance?.period && ` at ${editingAttendance.time} ${editingAttendance.period}`}
                      </div>
                      {editingAttendance?.createdBy && (
                        <div className="text-xs text-gray-500 mt-1">
                          Created by: {editingAttendance.createdBy.firstName} {editingAttendance.createdBy.lastName}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Students are automatically marked as present when they join the Zoom meeting
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
                          // Keep the date in the same format as it was received (YYYY-MM-DD)
                          const formattedDate = dateValue || new Date().toISOString().split('T')[0];
                          
                          const attendanceDataToSave = {
                            date: formattedDate,
                            day: editingAttendance.day || 'Unknown',
                            time: editingAttendance.time || 'Unknown',
                            meetingId: editingAttendance.meetingId,
                            students: students
                          };

                          console.log('📤 Sending attendance data:', attendanceDataToSave);
                          console.log('📊 Data types:', {
                            date: typeof attendanceDataToSave.date,
                            day: typeof attendanceDataToSave.day,
                            time: typeof attendanceDataToSave.time,
                            students: typeof attendanceDataToSave.students,
                            studentsIsArray: Array.isArray(attendanceDataToSave.students)
                          });
                          console.log('📋 Raw values:', {
                            date: attendanceDataToSave.date,
                            day: attendanceDataToSave.day,
                            time: attendanceDataToSave.time,
                            meetingId: attendanceDataToSave.meetingId,
                            students: attendanceDataToSave.students,
                            studentsLength: attendanceDataToSave.students?.length
                          });
                          console.log('👥 Student details:', attendanceDataToSave.students?.map(s => ({
                            id: s.id,
                            name: s.name,
                            status: s.status
                          })));
                          
                          // Validate data before sending
                          if (!attendanceDataToSave.date || !attendanceDataToSave.day || !attendanceDataToSave.time || !Array.isArray(attendanceDataToSave.students)) {
                            console.error('Invalid data format:', attendanceDataToSave);
                            showErrorToast('Invalid attendance data format. Please try again.');
                            return;
                          }
                          
                          console.log('💾 Saving attendance data...');
                          const saveResult = await materialsService.markAttendance(courseId, attendanceDataToSave);
                          console.log('✅ Save result:', saveResult);

                          // Wait a moment for the backend to process the data
                          console.log('⏳ Waiting for backend to process...');
                          await new Promise(resolve => setTimeout(resolve, 1000));

                          // Reload attendance data to get the updated list
                          console.log('🔄 Reloading attendance data...');
                          await loadAttendanceData();
                          console.log('✅ Attendance data reloaded');

                          setShowAttendanceModal(false);
                          setEditingAttendance(null);
                          showSuccessToast('Attendance updated successfully!');
                        } catch (error) {
                          console.error('❌ Error updating attendance:', error);
                          console.error('❌ Error details:', {
                            message: error.message,
                            response: error.response?.data,
                            status: error.response?.status,
                            statusText: error.response?.statusText
                          });
                          
                          let errorMessage = 'Failed to update attendance. Please try again.';
                          if (error.response?.data?.message) {
                            errorMessage = error.response.data.message;
                          } else if (error.message) {
                            errorMessage = error.message;
                          }
                          
                          showErrorToast(errorMessage);
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
