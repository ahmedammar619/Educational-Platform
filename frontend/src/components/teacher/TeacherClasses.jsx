import { useState, useEffect } from 'react';
import { Users, Clock, Calendar, BookOpen, Plus, Edit, Eye, MessageSquare, User, DollarSign } from 'lucide-react';
import { mockClasses, mockUsers, getClassesByTeacher } from '../../data/mockData';

const TeacherClasses = ({ user }) => {
  const [classes, setClasses] = useState([]);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedClassForModal, setSelectedClassForModal] = useState(null);

  useEffect(() => {
    loadClasses();
  }, [user]);

  const loadClasses = () => {
    if (user) {
      const teacherClasses = getClassesByTeacher(user.id);
      setClasses(teacherClasses);
    }
  };

  const getStudentDetails = (studentIds) => {
    return studentIds.map(id =>
      mockUsers.students.find(student => student.id === id)
    ).filter(Boolean);
  };



  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl text-start font-bold text-gray-900">My Classes</h1>
          <p className="text-gray-600">Manage your classes and track student progress</p>
        </div>
      </div>

      {/* Classes List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">All Classes</h2>
        </div>
        <div className="p-6">
          {classes.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No classes assigned yet</p>
              <p className="text-sm text-gray-500">Create your first class to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {classes.map((classItem) => (
                <div
                  key={classItem.id}
                  className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all w-full p-4 flex flex-col gap-4"
                >
                  {/* Top Row - Name, Teacher, Actions */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">{classItem.name}</h3>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setSelectedClassForModal(classItem);
                          setShowStudentModal(true);
                        }}
                        className="text-green-600 hover:text-green-800"
                        title="View Students"
                      >
                        <Users className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Bottom Row - Students, Date, Class Material */}
                  <div className="flex justify-between items-center w-full">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                        <Users className="h-4 w-4 text-gray-400" /> Students
                      </p>
                      <p className="font-medium text-gray-900">{classItem.students?.length || 0}</p>
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-400" /> Date & Time
                      </p>
                      <p className="font-medium text-gray-900">{classItem.schedule}</p>
                    </div>

                    <div className="text-center">
                      <button
                        onClick={() => {
                          // Handle class material click
                          console.log('Class material clicked for:', classItem.name);
                        }}
                        className="px-3 py-2 border-2 border-blue-600 text-blue-600 font-semibold text-xs rounded-lg hover:bg-green-600 hover:text-white transition-all duration-200 uppercase"
                      >
                        Class Material
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Student Modal */}
      {showStudentModal && selectedClassForModal && (
        <StudentModal
          classData={selectedClassForModal}
          students={getStudentDetails(selectedClassForModal.students)}
          onClose={() => {
            setShowStudentModal(false);
            setSelectedClassForModal(null);
          }}
        />
      )}
    </div>
  );
};

// Student Modal Component
const StudentModal = ({ classData, students, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style={{ margin: 0 }}>
      <div className="relative top-20 mx-auto p-5 border w-1/2 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Students in {classData.name}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            {students.map((student) => (
              <div key={student.id} className="border rounded-lg p-4 flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {student.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{student.name}</h4>
                    <p className="text-sm text-gray-500">{student.email}</p>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherClasses;