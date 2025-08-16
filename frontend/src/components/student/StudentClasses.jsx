import { useState, useEffect } from 'react';
import { BookOpen, Clock, User, MapPin, Calendar, CheckCircle, Users } from 'lucide-react';
import { mockClasses, mockUsers, getClassesByStudent } from '../../data/mockData';

const StudentClasses = ({ user }) => {
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const studentClasses = getClassesByStudent(user?.id || 1);
      const classesWithDetails = studentClasses.map(cls => {
        const teacher = mockUsers.teachers.find(t => t.id === cls.teacherId);
        return {
          ...cls,
          teacherName: teacher?.name || cls.teacher,
          teacherSpecialization: teacher?.specialization || ''
        };
      });
      setEnrolledClasses(classesWithDetails);
      setLoading(false);
    }, 500);
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className='text-start'>
        <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
        <p className="text-gray-600">View your enrolled classes and progress</p>
      </div>

      {/* Classes List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">All Classes</h2>
        </div>
        
        {enrolledClasses.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Enrolled</h3>
            <p className="text-gray-600">You haven't enrolled in any classes yet.</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="space-y-4">
              {enrolledClasses.map((cls) => (
                <ClassCard key={cls.id} classData={cls} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ClassCard = ({ classData }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all w-full p-4 flex flex-col gap-4">
      {/* Top Row - Name, Teacher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">{classData.name}</h3>
          <span className="text-sm text-gray-500">|</span>
          <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <User className="h-4 w-4 text-gray-400" />
            {classData.teacherName}
          </p>
        </div>
      </div>

      {/* Bottom Row - Students, Date, Class Material */}
      <div className="flex justify-between items-center w-full">
        <div className="text-center">
          <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
            <Users className="h-4 w-4 text-gray-400" /> Students
          </p>
          <p className="font-medium text-gray-900">{classData.students?.length || 0}</p>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
            <Calendar className="h-4 w-4 text-gray-400" /> Date & Time
          </p>
          <p className="font-medium text-gray-900">{classData.schedule}</p>
        </div>

        <div className="text-center">
          <button
            onClick={() => {
              // Handle class material click
              console.log('Class material clicked for:', classData.name);
            }}
            className="px-3 py-2 border-2 border-green-600 text-green-600 font-semibold text-xs rounded-lg hover:bg-green-600 hover:text-white transition-all duration-200 uppercase"
          >
            Class Material
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentClasses;