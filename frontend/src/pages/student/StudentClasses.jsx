import React, { useState, useEffect } from 'react';
import { studentsService, coursesService, usersService } from '../../services';

const StudentClasses = () => {
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all required data in parallel
      const [enrolledResponse, availableResponse, teachersResponse] = await Promise.all([
        studentsService.getStudentClasses(),
        coursesService.getAllCourses(),
        usersService.getUsersByRole('teacher')
      ]);
      
      setEnrolledClasses(enrolledResponse.classes || []);
      setAvailableClasses(availableResponse.courses || []);
      setTeachers(teachersResponse.users || []);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load class data');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (classId) => {
    try {
      await studentsService.enrollInClass(classId);
      
      // Refresh the data
      await fetchData();
      
      alert('Successfully enrolled in class!');
      setShowEnrollModal(false);
      setSelectedClass(null);
      
    } catch (err) {
      console.error('Error enrolling in class:', err);
      alert('Failed to enroll in class: ' + err.message);
    }
  };

  const handleUnenroll = async (classId) => {
    if (window.confirm('Are you sure you want to unenroll from this class?')) {
      try {
        await studentsService.unenrollFromClass(classId);
        
        // Refresh the data
        await fetchData();
        
        alert('Successfully unenrolled from class!');
        
      } catch (err) {
        console.error('Error unenrolling from class:', err);
        alert('Failed to unenroll from class: ' + err.message);
      }
    }
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Teacher TBD';
  };

  const getScheduleDisplay = (schedule) => {
    if (!schedule || schedule.length === 0) return 'Schedule TBD';
    
    return schedule.map(session => 
      `${session.day} ${session.startTime}-${session.endTime}`
    ).join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading classes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchData} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Classes</h1>
          <p className="text-gray-600">Manage your enrolled classes and discover new ones</p>
        </div>

        {/* Enrolled Classes */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Enrolled Classes</h2>
            <button
              onClick={() => setShowEnrollModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Enroll in New Class
            </button>
          </div>

          {enrolledClasses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <div className="text-gray-400 text-6xl mb-4">📚</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Enrolled</h3>
              <p className="text-gray-500 mb-4">
                You haven't enrolled in any classes yet. Browse available classes to get started!
              </p>
              <button
                onClick={() => setShowEnrollModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Classes
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledClasses.map((cls) => (
                <div key={cls.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{cls.name}</h3>
                    <button
                      onClick={() => handleUnenroll(cls.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Unenroll
                    </button>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{cls.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Teacher:</span>
                      <span className="text-gray-900">{getTeacherName(cls.teacherId)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Schedule:</span>
                      <span className="text-gray-900">{getScheduleDisplay(cls.schedule)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Price:</span>
                      <span className="text-gray-900">SAR {cls.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        Enrolled
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Classes */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Available Classes</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableClasses
              .filter(cls => !enrolledClasses.some(enrolled => enrolled.id === cls.id))
              .map((cls) => (
                <div key={cls.id} className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{cls.name}</h3>
                  
                  <p className="text-gray-600 mb-4">{cls.description}</p>
                  
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Teacher:</span>
                      <span className="text-gray-900">{getTeacherName(cls.teacherId)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Schedule:</span>
                      <span className="text-gray-900">{getScheduleDisplay(cls.schedule)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Price:</span>
                      <span className="text-gray-900">SAR {cls.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Students:</span>
                      <span className="text-gray-900">{cls.students?.length || 0}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setSelectedClass(cls);
                      setShowEnrollModal(true);
                    }}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                  >
                    Enroll Now
                  </button>
                </div>
              ))}
          </div>
          
          {availableClasses.filter(cls => !enrolledClasses.some(enrolled => enrolled.id === cls.id)).length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <div className="text-gray-400 text-6xl mb-4">🎉</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">All Classes Enrolled!</h3>
              <p className="text-gray-500">
                You're enrolled in all available classes. Check back later for new offerings!
              </p>
            </div>
          )}
        </div>

        {/* Enroll Modal */}
        {showEnrollModal && selectedClass && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Enrollment</h3>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to enroll in <strong>{selectedClass.name}</strong>?
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Teacher:</span>
                      <span className="text-gray-900">{getTeacherName(selectedClass.teacherId)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Schedule:</span>
                      <span className="text-gray-900">{getScheduleDisplay(selectedClass.schedule)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Price:</span>
                      <span className="text-gray-900">SAR {selectedClass.price}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEnrollModal(false);
                    setSelectedClass(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleEnroll(selectedClass.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Confirm Enrollment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentClasses;