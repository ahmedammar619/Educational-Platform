import { useState, useEffect } from 'react';
import { MessageCircle, Send, Users, Mail, Phone, Search, Plus, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { mockUsers, mockClasses } from '../../data/mockData';

const ParentCommunication = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    teacher_id: '',
    child_id: ''
  });
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    fetchMessages();
    fetchTeachers();
    fetchChildren();
  }, [filters]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      // Generate messages based on parent's children and their teachers
      if (user && user.role === 'parent') {
        const parent = mockUsers.parents.find(p => p.id === user.id);
        if (parent && parent.children) {
          const generatedMessages = [];

          parent.children.forEach(childId => {
            const child = mockUsers.students.find(s => s.id === childId);
            if (child) {
              // Get classes for this child
              const childClasses = mockClasses.filter(cls => cls.students.includes(child.id));

              childClasses.forEach(cls => {
                const teacher = mockUsers.teachers.find(t => t.id === cls.teacherId);
                if (teacher) {
                  generatedMessages.push({
                    id: `msg-${cls.id}-${teacher.id}`,
                    from: `${teacher.firstName} ${teacher.lastName}`,
                    fromId: teacher.id,
                    fromRole: 'teacher',
                    to: `${parent.firstName} ${parent.lastName}`,
                    toId: parent.id,
                    toRole: 'parent',
                    subject: `${child.firstName || child.name}'s Progress in ${cls.name}`,
                    message: `Assalamu Alaikum. ${child.firstName || child.name} is making good progress in ${cls.name}. Please encourage regular practice at home.`,
                    timestamp: new Date().toISOString(),
                    read: Math.random() > 0.5,
                    replied: Math.random() > 0.7
                  });
                }
              });
            }
          });

          setMessages(generatedMessages);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      // Get teachers from mock data
      setTeachers(mockUsers.teachers);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchChildren = async () => {
    try {
      if (user && user.role === 'parent') {
        const parent = mockUsers.parents.find(p => p.id === user.id);
        if (parent) {
          const childrenData = parent.children.map(childId => {
            const child = mockUsers.students.find(s => s.id === childId);
            return child;
          }).filter(Boolean);
          setChildren(childrenData);
        }
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const filteredMessages = messages.filter(message => {
    if (filters.teacher_id && message.fromId !== parseInt(filters.teacher_id)) return false;
    if (filters.child_id) {
      const child = children.find(c => c.id === parseInt(filters.child_id));
      if (!child) return false;
      // Check if the message is related to this child's classes
      const childClasses = mockClasses.filter(cls => cls.students.includes(child.id));
      const messageTeacherId = message.fromId;
      const isRelated = childClasses.some(cls => cls.teacherId === messageTeacherId);
      if (!isRelated) return false;
    }
    return true;
  });

  const getTeacherName = (teacherId) => {
    const teacher = mockUsers.teachers.find(t => t.id === teacherId);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Unknown Teacher';
  };

  const getChildName = (childId) => {
    const child = mockUsers.students.find(s => s.id === childId);
    return child ? (child.firstName && child.lastName ? `${child.firstName} ${child.lastName}` : child.name) : 'Unknown Child';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Communication Center</h1>
          <p className="text-sm sm:text-base text-gray-600">Stay connected with teachers and monitor your children's progress</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          <select
            value={filters.teacher_id}
            onChange={(e) => handleFilterChange('teacher_id', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Teachers</option>
            {teachers.map(teacher => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.firstName && teacher.lastName ? `${teacher.firstName} ${teacher.lastName}` : teacher.name}
              </option>
            ))}
          </select>

          <select
            value={filters.child_id}
            onChange={(e) => handleFilterChange('child_id', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Children</option>
            {children.map(child => (
              <option key={child.id} value={child.id}>
                {child.firstName && child.lastName ? `${child.firstName} ${child.lastName}` : child.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            <button
              onClick={() => setShowComposeModal(true)}
              className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Compose</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages found</h3>
              <p className="text-gray-500">Try adjusting your filters or compose a new message.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${message.read ? 'bg-gray-50 border-gray-200' : 'bg-purple-50 border-purple-200'
                    }`}
                  onClick={() => setSelectedMessage(message)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {message.subject}
                        </h4>
                        {!message.read && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        From: <span className="font-medium">{getTeacherName(message.fromId)}</span>
                      </p>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {message.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {format(new Date(message.timestamp), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {message.replied && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Replied
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Teacher Directory */}
      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Teacher Directory</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teachers.map((teacher) => (
              <div key={teacher.id} className="border rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-medium">
                      {teacher.firstName ? teacher.firstName.charAt(0) : teacher.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {teacher.firstName && teacher.lastName ? `${teacher.firstName} ${teacher.lastName}` : teacher.name}
                    </h4>
                    <p className="text-sm text-gray-600">{teacher.specialization || 'Teacher'}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>{teacher.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>{teacher.phone}</span>
                  </div>
                </div>
                <button className="mt-3 w-full bg-purple-600 text-white px-3 py-2 rounded-md text-sm hover:bg-purple-700 transition-colors">
                  Send Message
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentCommunication;