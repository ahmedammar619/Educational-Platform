import React, { useState, useEffect } from 'react';
import { getMockData } from '../../data/mockData';

const ParentCommunication = () => {
  const [messages, setMessages] = useState([]);
  const [children, setChildren] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    teacher_id: '',
    child_id: '',
    class_id: '',
    date_from: '',
    date_to: ''
  });
  const [newMessage, setNewMessage] = useState({
    to: '',
    subject: '',
    content: '',
    priority: 'normal'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use mock data instead of backend API
      const mockData = getMockData('parentCommunications');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (mockData) {
        // Extract children from parent schedule data
        const parentScheduleData = getMockData('parentSchedule');
        const childrenData = parentScheduleData?.children || [];
        
        // Extract teachers from conversations
        const teachersData = mockData.conversations?.map(conv => conv.participant).filter(p => p.role === 'teacher') || [];
        
        // Extract classes from children's schedules
        const classesData = childrenData.flatMap(child => 
          child.schedule?.map(session => ({
            id: session.courseId,
            name: session.courseName
          })) || []
        );
        
        // Create mock messages from conversations
        const messagesData = Object.values(mockData.messages || {}).flat().map(msg => ({
          id: msg.id,
          subject: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''),
          content: msg.content,
          fromName: msg.senderName,
          timestamp: msg.timestamp,
          priority: 'normal',
          fromId: msg.senderId,
          classId: null,
          className: null
        }));
        
        setChildren(childrenData);
        setTeachers(teachersData);
        setClasses(classesData);
        setMessages(messagesData);
      } else {
        throw new Error('Failed to load mock data');
      }
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.to || !newMessage.subject || !newMessage.content) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const messageData = {
        id: Date.now().toString(),
        subject: newMessage.subject,
        content: newMessage.content,
        fromName: 'You',
        timestamp: new Date().toISOString(),
        priority: newMessage.priority,
        fromId: 'parent',
        classId: null,
        className: null
      };

      // Add the new message to the list
      setMessages(prev => [messageData, ...prev]);
      
      // Reset form
      setNewMessage({
        to: '',
        subject: '',
        content: '',
        priority: 'normal'
      });
      
      alert('Message sent successfully!');
      
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message: ' + err.message);
    }
  };

  const filteredMessages = messages.filter(message => {
    if (filters.teacher_id && message.fromId !== filters.teacher_id) return false;
    if (filters.child_id) {
      const child = children.find(c => c.id === filters.child_id);
      if (!child) return false;
      // Add more filtering logic as needed
    }
    if (filters.class_id && message.classId !== filters.class_id) return false;
    if (filters.date_from && new Date(message.timestamp) < new Date(filters.date_from)) return false;
    if (filters.date_to && new Date(message.timestamp) > new Date(filters.date_to)) return false;
    
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading communication data...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Communication Center</h1>
          <p className="text-gray-600">Stay connected with teachers and monitor your children's progress</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message Composition */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Send New Message</h3>
              
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To *</label>
                  <select
                    required
                    value={newMessage.to}
                    onChange={(e) => setNewMessage({...newMessage, to: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select recipient</option>
                    <optgroup label="Teachers">
                      {teachers.map(teacher => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.firstName} {teacher.lastName} (Teacher)
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Administrators">
                      <option value="admin">Administration</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                  <input
                    type="text"
                    required
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={newMessage.priority}
                    onChange={(e) => setNewMessage({...newMessage, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                  <textarea
                    required
                    rows="4"
                    value={newMessage.content}
                    onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>

          {/* Messages and Filters */}
          <div className="lg:col-span-2">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teacher</label>
                  <select
                    value={filters.teacher_id}
                    onChange={(e) => setFilters({...filters, teacher_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Teachers</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.firstName} {teacher.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Child</label>
                  <select
                    value={filters.child_id}
                    onChange={(e) => setFilters({...filters, child_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Children</option>
                    {children.map(child => (
                      <option key={child.id} value={child.id}>
                        {child.firstName} {child.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                  <select
                    value={filters.class_id}
                    onChange={(e) => setFilters({...filters, class_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Classes</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                  <input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => setFilters({...filters, date_from: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                  <input
                    type="date"
                    value={filters.date_to}
                    onChange={(e) => setFilters({...filters, date_to: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => setFilters({
                      teacher_id: '',
                      child_id: '',
                      class_id: '',
                      date_from: '',
                      date_to: ''
                    })}
                    className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Messages List */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Messages ({filteredMessages.length})
                </h3>
              </div>
              
              <div className="divide-y divide-gray-200">
                {filteredMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No messages found matching your criteria.</p>
                  </div>
                ) : (
                  filteredMessages.map((message) => (
                    <div key={message.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-medium text-gray-900">{message.subject}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              message.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                              message.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              message.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {message.priority}
                            </span>
                          </div>
                          
                          <p className="text-gray-600 mb-3">{message.content}</p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>From: {message.fromName || 'Unknown'}</span>
                            <span>Date: {new Date(message.timestamp).toLocaleDateString()}</span>
                            {message.className && <span>Class: {message.className}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentCommunication;