import React, { useState, useEffect } from 'react';
import parentsService from '../../services/parentsService';
import authService from '../../services/authService';

const ParentCommunication = () => {
  const [children, setChildren] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    child_id: '',
    class_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = authService.getCurrentUser();
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      // Fetch real data from backend
      const data = await parentsService.getChildrenTeachers(user.id);
      
      setChildren(data.children || []);
      setTeachers(data.teachers || []);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppClick = (phone, teacherName) => {
    // Remove any non-digit characters except + for international format
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}`;
    window.open(whatsappUrl, '_blank');
  };

  const filteredTeachers = teachers.filter(teacher => {
    if (filters.child_id) {
      return teacher.children.some(child => child.id === filters.child_id);
    }
    if (filters.class_id) {
      return teacher.courses.some(course => course.id === filters.class_id);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading teacher information...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Teacher Communication</h1>
          <p className="text-gray-600">Connect with your children's teachers via WhatsApp</p>
        </div>

        {/* Teacher Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeachers.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">👨‍🏫</div>
              <p className="text-gray-500 text-lg">No teachers found matching your criteria.</p>
            </div>
          ) : (
            filteredTeachers.map((teacher) => (
              <div key={teacher.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                {/* Teacher Header */}
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl font-bold">
                      {teacher.firstName.charAt(0)}{teacher.lastName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">
                        {teacher.firstName} {teacher.lastName}
                      </h3>
                      <p className="text-blue-100">Teacher</p>
                    </div>
                  </div>
                </div>

                {/* Teacher Details */}
                <div className="p-6">
                  {/* Contact Information */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 text-gray-400">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-600">{teacher.email}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 text-gray-400">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-600">{teacher.phone}</span>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Teaching Your Children:</h4>
                    <div className="space-y-1">
                      {teacher.children.map(child => (
                        <div key={child.id} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">
                            {child.firstName} {child.lastName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Courses */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Courses:</h4>
                    <div className="space-y-1">
                      {teacher.courses.map(course => (
                        <div key={course.id} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">{course.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* WhatsApp Button */}
                  <button
                    onClick={() => handleWhatsAppClick(teacher.phone, `${teacher.firstName} ${teacher.lastName}`)}
                    className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                    <span>Chat on WhatsApp</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentCommunication;