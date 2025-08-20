import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Clock, DollarSign, Calendar, Search, Filter, User, BookOpen, X } from 'lucide-react';
import { mockClasses, mockUsers } from '../../data/mockData';

const ClassManagement = ({ user }) => {
    const [classes, setClasses] = useState([]);
    const [filteredClasses, setFilteredClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        teacher: '',
        page: 1,
        limit: 10
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);

    useEffect(() => {
        loadMockClasses();
    }, []);

    useEffect(() => {
        filterClasses();
    }, [filters, classes]);

    const loadMockClasses = () => {
        setLoading(true);
        // Use mock classes data
        setClasses(mockClasses || []);
        setLoading(false);
    };

    const filterClasses = () => {
        let filtered = [...classes];

        // Apply search filter
        if (filters.search) {
            filtered = filtered.filter(classItem => {
                const teacher = mockUsers.teachers.find(t => t.id === classItem.teacherId);
                const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Teacher TBD';
                
                return classItem.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                       teacherName.toLowerCase().includes(filters.search.toLowerCase());
            });
        }

        // Apply teacher filter
        if (filters.teacher) {
            filtered = filtered.filter(classItem => {
                const teacher = mockUsers.teachers.find(t => t.id === classItem.teacherId);
                const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Teacher TBD';
                
                return teacherName.toLowerCase().includes(filters.teacher.toLowerCase());
            });
        }

        // Calculate pagination
        const total = filtered.length;
        const pages = Math.ceil(total / filters.limit);
        const startIndex = (filters.page - 1) * filters.limit;
        const endIndex = startIndex + parseInt(filters.limit);

        setFilteredClasses(filtered.slice(startIndex, endIndex));
        setPagination({
            page: filters.page,
            limit: filters.limit,
            total,
            pages
        });
    };

    const handleCreateClass = (classData) => {
        const newClass = {
            id: Date.now(),
            name: classData.name,
            description: classData.description,
            teacherId: classData.teacherId,
            price: classData.price,
            schedule: classData.schedule,
            students: classData.students || [],
            numberOfSessions: classData.numberOfSessions,
            sessionDuration: classData.sessionDuration,
            status: classData.status || 'active',
            created_at: new Date().toISOString().split('T')[0]
        };

        setClasses(prev => [...prev, newClass]);
        setShowCreateModal(false);
        alert('Class created successfully!');
    };

    const handleUpdateClass = (classId, classData) => {
        setClasses(prev => prev.map(classItem => {
            if (classItem.id === classId) {
                return {
                    ...classItem,
                    name: classData.name,
                    description: classData.description,
                    teacherId: classData.teacherId,
                    price: classData.price,
                    schedule: classData.schedule,
                    numberOfSessions: classData.numberOfSessions,
                    sessionDuration: classData.sessionDuration
                };
            }
            return classItem;
        }));
        setShowEditModal(false);
        setSelectedClass(null);
        alert('Class updated successfully!');
    };

    const handleDeleteClass = (classId) => {
        if (!confirm('Are you sure you want to delete this class?')) return;

        setClasses(prev => prev.filter(classItem => classItem.id !== classId));
        alert('Class deleted successfully!');
    };

    const handleEnrollStudents = (classId, studentIds) => {
        setClasses(prev => prev.map(classItem => {
            if (classItem.id === classId) {
                const currentStudents = classItem.students || [];
                const newStudents = [...new Set([...currentStudents, ...studentIds])];
                return { ...classItem, students: newStudents };
            }
            return classItem;
        }));
        setShowEnrollModal(false);
        setSelectedClass(null);
        alert('Students enrolled successfully!');
    };

    const getSubjectColor = (subject) => {
        const subjectLower = subject.toLowerCase();
        if (subjectLower.includes('quran')) return 'bg-green-100 text-green-800';
        if (subjectLower.includes('arabic')) return 'bg-blue-100 text-blue-800';
        if (subjectLower.includes('islamic')) return 'bg-purple-100 text-purple-800';
        if (subjectLower.includes('tajweed')) return 'bg-yellow-100 text-yellow-800';
        if (subjectLower.includes('hadith')) return 'bg-pink-100 text-pink-800';
        return 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Class Management</h1>
                    <p className="text-sm sm:text-base text-gray-600">Manage classes and schedules</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center justify-center space-x-2 border-2 border-green-600 text-green-600 px-3 sm:px-4 py-2 rounded-lg hover:bg-green-600 hover:text-white transition-all duration-200 text-sm sm:text-base"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add Class</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search classes..."
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                        />
                    </div>

                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        value={filters.teacher}
                        onChange={(e) => setFilters({ ...filters, teacher: e.target.value, page: 1 })}
                    >
                        <option value="">All Teachers</option>
                        {mockUsers.teachers.map((teacher) => (
                            <option key={teacher.id} value={`${teacher.firstName} ${teacher.lastName}`}>
                                {teacher.firstName} {teacher.lastName}
                            </option>
                        ))}
                    </select>

                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        value={filters.limit}
                        onChange={(e) => setFilters({ ...filters, limit: e.target.value, page: 1 })}
                    >
                        <option value="10">10 per page</option>
                        <option value="25">25 per page</option>
                        <option value="50">50 per page</option>
                    </select>
                </div>
            </div>

            {/* Classes Cards */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <>
                    <div className="space-y-3 sm:space-y-4">
                        {filteredClasses.map((classItem) => {
                            const teacher = mockUsers.teachers.find(t => t.id === classItem.teacherId);
                            const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Teacher TBD';
                            
                            return (
                                <div
                                    key={classItem.id}
                                    className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all w-full p-3 sm:p-4 flex flex-col gap-3 sm:gap-4"
                                >
                                    {/* Top Row - Name, Teacher, Actions */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">{classItem.name}</h3>
                                            </div>
                                            <span className="hidden sm:inline text-sm text-gray-500">|</span>
                                            <p className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1">
                                                <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                                                {teacherName}
                                            </p>
                                        </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 sm:gap-3 opacity-80 hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => {
                                                setSelectedClass(classItem);
                                                setShowEnrollModal(true);
                                            }}
                                            className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-colors"
                                            title="Enroll Students"
                                        >
                                            <Users className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedClass(classItem);
                                                setShowEditModal(true);
                                            }}
                                            className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                            title="Edit Class"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClass(classItem.id)}
                                            className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                            title="Delete Class"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Bottom Row - Students, Date, Price, Class Material */}
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center w-full gap-3 sm:gap-0">
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                                            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" /> Students
                                        </p>
                                        <p className="font-medium text-gray-900 text-sm sm:text-base">{classItem.students?.length || 0}</p>
                                    </div>

                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" /> Schedule
                                        </p>
                                        <p className="font-medium text-gray-900 text-xs sm:text-sm">
                                            {classItem.schedule && Array.isArray(classItem.schedule) 
                                              ? classItem.schedule.map(item => `${item.day} ${item.startTime}-${item.endTime}`).join(', ')
                                              : classItem.schedule || 'Schedule TBD'
                                            }
                                        </p>
                                    </div>

                                    {classItem.price && (
                                        <div className="text-center">
                                            <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                                                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" /> Price
                                            </p>
                                            <p className="font-medium text-gray-900 text-sm sm:text-base">USD {classItem.price}</p>
                                        </div>
                                    )}

                                    <div className="text-center">
                                        <button
                                            onClick={() => {
                                                // Handle class material click
                                                console.log('Class material clicked for:', classItem.name);
                                            }}
                                            className="w-full sm:w-auto px-3 py-2 border-2 border-green-600 text-green-600 font-semibold text-xs rounded-lg hover:bg-green-600 hover:text-white transition-all duration-200 uppercase"
                                        >
                                            Class Material
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.pages > 1 && (
                        <div className="bg-white px-3 sm:px-4 py-3 flex items-center justify-between border-t border-gray-200 mt-6 rounded-b-lg">
                            {/* Mobile */}
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                                    disabled={filters.page === 1}
                                    className="px-3 sm:px-4 py-2 border-2 border-green-600 text-green-600 text-xs sm:text-sm rounded-md bg-white hover:bg-green-50 disabled:opacity-50 transition-all duration-200"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setFilters({ ...filters, page: Math.min(pagination?.pages || 1, filters.page + 1) })}
                                    disabled={filters.page === (pagination?.pages || 1)}
                                    className="px-3 sm:px-4 py-2 border-2 border-green-600 text-green-600 text-xs sm:text-sm rounded-md bg-white hover:bg-green-50 disabled:opacity-50 transition-all duration-200"
                                >
                                    Next
                                </button>
                            </div>

                            {/* Desktop */}
                            <div className="hidden sm:flex sm:items-center sm:justify-between w-full">
                                <p className="text-xs sm:text-sm text-gray-700">
                                    Showing <span className="font-medium">{((filters.page - 1) * filters.limit) + 1}</span> to{' '}
                                    <span className="font-medium">{Math.min(filters.page * filters.limit, pagination?.total || 0)}</span> of{' '}
                                    <span className="font-medium">{pagination?.total || 0}</span> results
                                </p>
                                <nav className="flex space-x-1">
                                    {Array.from({ length: pagination?.pages || 0 }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => setFilters({ ...filters, page })}
                                            className={`px-2 sm:px-3 py-1 border-2 text-xs sm:text-sm rounded-md transition-all duration-200 ${page === filters.page
                                                ? 'bg-green-50 border-green-600 text-green-600'
                                                : 'bg-white border-green-600 text-green-600 hover:bg-green-50'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                        </div>
                    )}
                </>
            )}


            {/* Create Class Modal */}
            {showCreateModal && (
                <ClassModal
                    title="Create New Class"
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={handleCreateClass}
                />
            )}

            {/* Edit Class Modal */}
            {showEditModal && selectedClass && (
                <ClassModal
                    title="Edit Class"
                    classData={selectedClass}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedClass(null);
                    }}
                    onSubmit={(classData) => handleUpdateClass(selectedClass.id, classData)}
                />
            )}

            {/* Enroll Students Modal */}
            {showEnrollModal && selectedClass && (
                <EnrollModal
                    classData={selectedClass}
                    onClose={() => {
                        setShowEnrollModal(false);
                        setSelectedClass(null);
                    }}
                    onSubmit={(studentIds) => handleEnrollStudents(selectedClass.id, studentIds)}
                />
            )}
        </div>
    );
};

// Class Modal Component
const ClassModal = ({ title, classData, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        name: classData?.name || '',
        description: classData?.description || '',
        teacher: classData?.teacher || '',
        price: classData?.price || '',
        sessions: classData?.sessions || []
    });

    // Reset form when user prop changes
    useEffect(() => {
        setFormData({
            name: classData?.name || '',
            description: classData?.description || '',
            teacher: classData?.teacher || '',
            price: classData?.price || '',
            sessions: classData?.sessions || []
        });
    }, [classData]);

    const [showAddSession, setShowAddSession] = useState(false);
    const [newSession, setNewSession] = useState({
        day: 'Sunday',
        startTime: '08:00',
        endTime: '09:00'
    });

    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const generateTimeOptions = () => {
        const times = [];
        for (let hour = 8; hour <= 20; hour++) {
            const timeString = `${hour.toString().padStart(2, '0')}:00`;
            times.push(timeString);
        }
        return times;
    };

    const addSession = () => {
        if (newSession.startTime >= newSession.endTime) {
            alert('End time must be after start time');
            return;
        }

        const sessionExists = formData.sessions.some(session =>
            session.day === newSession.day &&
            ((newSession.startTime >= session.startTime && newSession.startTime < session.endTime) ||
                (newSession.endTime > session.startTime && newSession.endTime <= session.endTime) ||
                (newSession.startTime <= session.startTime && newSession.endTime >= session.endTime))
        );

        if (sessionExists) {
            alert('Session time conflicts with existing session on the same day');
            return;
        }

        setFormData({
            ...formData,
            sessions: [...formData.sessions, { ...newSession }]
        });

        setNewSession({
            day: 'Sunday',
            startTime: '08:00',
            endTime: '09:00'
        });
        setShowAddSession(false);
    };

    const removeSession = (index) => {
        setFormData({
            ...formData,
            sessions: formData.sessions.filter((_, i) => i !== index)
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (formData.sessions.length === 0) {
            alert('Please add at least one session');
            return;
        }

        // Convert sessions to the new schedule format
        const schedule = formData.sessions.map(session => ({
            day: session.day,
            startTime: session.startTime,
            endTime: session.endTime
        }));

        // Create the class data with the new structure
        const classData = {
            ...formData,
            teacherId: parseInt(formData.teacher), // Convert to number
            schedule: schedule,
            students: [],
            numberOfSessions: schedule.length,
            sessionDuration: 120, // Default to 120 minutes
            status: 'active'
        };

        onSubmit(classData);
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style={{ margin: 0 }}>
            <div className="relative top-4 sm:top-10 mx-auto p-4 sm:p-5 border w-11/12 sm:w-96 shadow-lg rounded-md bg-white">
                <div className="mt-1">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">{title}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Class Name</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                rows="3"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Teacher</label>
                            <select
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                value={formData.teacher}
                                onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                            >
                                <option value="">Select a teacher</option>
                                {mockUsers.teachers.map((teacher) => (
                                    <option key={teacher.id} value={teacher.id}>
                                        {teacher.firstName} {teacher.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Price (USD)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>

                        {/* Sessions Management */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Class Sessions</label>

                            {/* Existing Sessions */}
                            {formData.sessions.length > 0 && (
                                <div className="mb-4 space-y-2">
                                    {formData.sessions.map((session, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-md">
                                            <span className="text-xs sm:text-sm font-medium text-blue-900">
                                                {session.day}: {session.startTime} - {session.endTime}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeSession(index)}
                                                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 transition-colors"
                                            >
                                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add Session Button */}
                            {!showAddSession ? (
                                <button
                                    type="button"
                                    onClick={() => setShowAddSession(true)}
                                    className="w-full p-2 sm:p-3 border-2 border-dashed border-green-300 rounded-md text-green-600 hover:border-green-400 hover:text-green-700 transition-colors text-sm"
                                >
                                    + Add Session
                                </button>
                            ) : (
                                /* Add Session Form */
                                <div className="p-3 sm:p-4 border border-gray-300 rounded-md bg-gray-50">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Day</label>
                                            <select
                                                className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                value={newSession.day}
                                                onChange={(e) => setNewSession({ ...newSession, day: e.target.value })}
                                            >
                                                {weekDays.map(day => (
                                                    <option key={day} value={day}>{day}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
                                            <select
                                                className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                value={newSession.startTime}
                                                onChange={(e) => setNewSession({ ...newSession, startTime: e.target.value })}
                                            >
                                                {generateTimeOptions().map(time => (
                                                    <option key={time} value={time}>{time}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
                                            <select
                                                className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                value={newSession.endTime}
                                                onChange={(e) => setNewSession({ ...newSession, endTime: e.target.value })}
                                            >
                                                {generateTimeOptions().map(time => (
                                                    <option key={time} value={time}>{time}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowAddSession(false)}
                                            className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-600 hover:text-gray-800"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={addSession}
                                            className="px-2 sm:px-3 py-1 text-xs sm:text-sm border-2 border-green-600 text-green-600 rounded hover:bg-green-500 hover:text-white transition-all duration-200"
                                        >
                                            Add Session
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-3 sm:px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-3 sm:px-4 py-2 border-2 border-green-600 text-green-600 rounded-md hover:bg-green-500 hover:text-white transition-all duration-200 text-sm"
                            >
                                {classData ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// Enroll Students Modal Component
const EnrollModal = ({ classData, onClose, onSubmit }) => {
    const [selectedStudents, setSelectedStudents] = useState([]);

    // Get available students (not already enrolled in this class)
    const availableStudents = mockUsers.students.filter(student =>
        !classData.students?.includes(student.id)
    );

    const handleStudentToggle = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedStudents.length === 0) {
            alert('Please select at least one student');
            return;
        }
        onSubmit(selectedStudents);
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-11/12 sm:w-2/3 max-w-2xl shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900">
                            Enroll Students in {classData.name}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <span className="sr-only">Close</span>
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-3">
                                Select students to enroll in this class:
                            </p>

                            {availableStudents.length === 0 ? (
                                <p className="text-gray-500 text-center py-4 text-sm">
                                    No available students to enroll
                                </p>
                            ) : (
                                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                                    {availableStudents.map((student) => (
                                        <label
                                            key={student.id}
                                            className="flex items-center p-2 sm:p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedStudents.includes(student.id)}
                                                onChange={() => handleStudentToggle(student.id)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <div className="ml-3 flex items-center">
                                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <span className="text-white text-xs sm:text-sm font-medium">
                                                        {student.firstName ? student.firstName.charAt(0) : student.fullName.charAt(0)}
                                                    </span>
                                                </div>
                                                <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                                                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                                        {student.firstName && student.lastName 
                                                          ? `${student.firstName} ${student.lastName}` 
                                                          : student.fullName
                                                        }
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {student.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                            <p className="text-xs sm:text-sm text-gray-600">
                                {selectedStudents.length} student(s) selected
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-3 sm:px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={selectedStudents.length === 0}
                                    className="px-3 sm:px-4 py-2 border-2 border-green-600 text-green-600 rounded-md hover:bg-green-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                                >
                                    Enroll Students
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ClassManagement;