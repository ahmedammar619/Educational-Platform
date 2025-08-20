import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, UserCheck, UserX, Eye, Key, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { mockUsers } from '../../data/mockData';

const UserManagement = ({ user }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedParents, setExpandedParents] = useState(new Set());
  const [filters, setFilters] = useState({
    search: '',
    role: '',
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
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadMockUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [filters, allUsers]);

  const loadMockUsers = () => {
    setLoading(true);
    // Combine all user types into one array
    const combinedUsers = [
      ...mockUsers.students.map(u => ({ 
        ...u, 
        is_active: u.status === 'active', 
        created_at: u.joinDate,
        // Add fallback for name if firstName/lastName don't exist
        name: u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.name
      })),
      ...mockUsers.teachers.map(u => ({ 
        ...u, 
        is_active: u.status === 'active', 
        created_at: u.joinDate,
        // Add fallback for name if firstName/lastName don't exist
        name: u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.name
      })),
      ...mockUsers.parents.map(u => ({ 
        ...u, 
        is_active: u.status === 'active', 
        created_at: u.joinDate,
        // Add fallback for name if firstName/lastName don't exist
        name: u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.name
      })),
      ...mockUsers.admins.map(u => ({ 
        ...u, 
        is_active: u.status === 'active', 
        created_at: u.joinDate,
        // Add fallback for name if firstName/lastName don't exist
        name: u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.name
      }))
    ];
    setAllUsers(combinedUsers);
    setLoading(false);
  };

  const filterUsers = () => {
    let filtered = [...allUsers];

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      
      // First, get users that directly match the search
      let directMatches = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      );
      
      // Find parents of students that match the search
      const matchingStudentIds = new Set();
      directMatches.forEach(user => {
        if (user.role === 'student') {
          matchingStudentIds.add(user.id);
        }
      });
      
      // Add parents of matching students
      const parentsToInclude = allUsers.filter(user => 
        user.role === 'parent' && 
        user.children && 
        user.children.some(childId => matchingStudentIds.has(childId))
      );
      
      // Combine direct matches with parents of matching students
      const allMatches = [...directMatches];
      parentsToInclude.forEach(parent => {
        if (!allMatches.some(match => match.id === parent.id)) {
          allMatches.push(parent);
        }
      });
      
      filtered = allMatches;
    }

    // Apply role filter
    if (filters.role) {
      filtered = filtered.filter(user => user.role === filters.role);
    }

    // Set the filtered users (this will be used by getParentChildRows)
    setFilteredUsers(filtered);
    
    // Calculate pagination based on the filtered results, excluding students
    const paginationUsers = filtered.filter(user => user.role !== 'student');
    const total = paginationUsers.length;
    const pages = Math.ceil(total / filters.limit);
    
    setPagination({
      page: filters.page,
      limit: filters.limit,
      total,
      pages
    });
  };

  const handleCreateUser = (userData) => {
    const newUser = {
      id: Date.now(),
      ...userData,
      is_active: true,
      created_at: new Date().toISOString().split('T')[0],
      status: 'active'
    };

    setAllUsers(prev => [...prev, newUser]);
    setShowCreateModal(false);
    alert('User created successfully!');
  };

  const handleUpdateUser = (userId, userData) => {
    setAllUsers(prev => prev.map(user =>
      user.id === userId ? { ...user, ...userData } : user
    ));
    setShowEditModal(false);
    setSelectedUser(null);
    alert('User updated successfully!');
  };

  const handleDeactivateUser = (userId) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;

    setAllUsers(prev => prev.map(user =>
      user.id === userId ? { ...user, is_active: false, status: 'inactive' } : user
    ));
    alert('User deactivated successfully!');
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-green-100 text-green-800';
      case 'teacher': return 'bg-blue-100 text-blue-800';
      case 'parent': return 'bg-purple-100 text-purple-800';
      case 'student': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleParentExpansion = (parentId) => {
    setExpandedParents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(parentId)) {
        newSet.delete(parentId);
      } else {
        newSet.add(parentId);
      }
      return newSet;
    });
  };

  const getParentChildRows = () => {
    const rows = [];
    const processedUsers = new Set();

    // Use filtered users if available, otherwise use all users
    const usersToProcess = filteredUsers.length > 0 ? filteredUsers : allUsers;

    // Special handling for student role filter - show students with their parents
    if (filters.role === 'student') {
      const students = usersToProcess.filter(u => u.role === 'student');
      const parentIds = new Set();
      
      // Collect all parent IDs for students
      students.forEach(student => {
        if (student.parentId) {
          parentIds.add(student.parentId);
        }
      });
      
      // Add parents first
      const parents = allUsers.filter(u => u.role === 'parent' && parentIds.has(u.id));
      parents.forEach(parent => {
        rows.push({
          ...parent,
          isParent: true,
          rowSpan: 1
        });
        processedUsers.add(parent.id);
        
        // Add children if expanded
        if (expandedParents.has(parent.id) && parent.children) {
          const children = allUsers.filter(u =>
            u.role === 'student' && parent.children.includes(u.id) && 
            usersToProcess.some(filteredUser => filteredUser.id === u.id)
          );
          
          children.forEach(child => {
            rows.push({
              ...child,
              isChild: true,
              parentId: parent.id,
              parentName: parent.name,
              rowSpan: 1
            });
            processedUsers.add(child.id);
          });
        }
      });
      
      // Add students without parents
      const studentsWithoutParents = students.filter(s => !s.parentId);
      studentsWithoutParents.forEach(student => {
        rows.push({
          ...student,
          rowSpan: 1
        });
        processedUsers.add(student.id);
      });
      
      return rows;
    }

    // Get all parents from the filtered results
    const parents = usersToProcess.filter(u => u.role === 'parent');
    
    parents.forEach(parent => {
      if (processedUsers.has(parent.id)) return;
      
      // Add parent row
      rows.push({
        ...parent,
        isParent: true,
        rowSpan: 1
      });
      processedUsers.add(parent.id);

      // Add child rows if expanded
      if (expandedParents.has(parent.id) && parent.children) {
        // Get children from the original allUsers to maintain relationships
        const children = allUsers.filter(u =>
          u.role === 'student' && parent.children.includes(u.id)
        );
        
        children.forEach(child => {
          if (processedUsers.has(child.id)) return;
          
          rows.push({
            ...child,
            isChild: true,
            parentId: parent.id,
            parentName: parent.name,
            rowSpan: 1
          });
          processedUsers.add(child.id);
        });
      }
    });

    // Add remaining users (teachers, admins, students without parents)
    const remainingUsers = usersToProcess.filter(u =>
      !processedUsers.has(u.id) && u.role !== 'parent' && u.role !== 'student'
    );
    
    remainingUsers.forEach(user => {
      rows.push({
        ...user,
        rowSpan: 1
      });
    });

    return rows;
  };

  const getPaginatedRows = () => {
    const allRows = getParentChildRows();
    const startIndex = (filters.page - 1) * filters.limit;
    const endIndex = startIndex + parseInt(filters.limit);
    return allRows.slice(startIndex, endIndex);
  };

  const getTotalDisplayedRows = () => {
    const rows = getParentChildRows();
    return rows.length;
  };

  const renderUserRow = (userItem, index) => {
    if (userItem.isParent) {
      // Parent row with expandable children
      const children = allUsers.filter(u =>
        u.role === 'student' && userItem.children?.includes(u.id)
      );
      const hasChildren = children.length > 0;
      const isExpanded = expandedParents.has(userItem.id);

      return (
        <tr key={`parent-${userItem.id}`} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10">
                <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                  <span className=" text-white text-sm font-medium">
                    {userItem.name.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <div className="text-start text-sm font-medium text-gray-900">{userItem.name}</div>
                <div className="text-start text-sm text-gray-500">{userItem.email}</div>
              </div>
              {hasChildren && (
                <button
                  onClick={() => toggleParentExpansion(userItem.id)}
                  className="ml-2 p-1 hover:bg-purple-100 rounded"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-purple-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-purple-600" />
                  )}
                </button>
              )}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(userItem.role)}`}>
              {userItem.role}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => {
                  setSelectedUser(userItem);
                  setShowEditModal(true);
                }}
                className="text-blue-600 hover:text-blue-900"
                title="Edit User"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeactivateUser(userItem.id)}
                className="text-red-600 hover:text-red-900"
                title="Deactivate User"
                disabled={userItem.id === user.id}
              >
                <UserX className="h-4 w-4" />
              </button>
            </div>
          </td>
        </tr>
      );
    } else if (userItem.isChild) {
      // Child row (indented under parent)
      return (
        <tr key={`child-${userItem.id}`} className="hover:bg-gray-50 bg-red-50">
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center ml-8">
              <div className="flex-shrink-0 h-8 w-8">
                <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {userItem.name.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">{userItem.name}</div>
                <div className="text-sm text-gray-500">{userItem.email}</div>
              </div>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(userItem.role)}`}>
              {userItem.role}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => {
                  setSelectedUser(userItem);
                  setShowEditModal(true);
                }}
                className="text-blue-600 hover:text-blue-900"
                title="Edit User"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeactivateUser(userItem.id)}
                className="text-red-600 hover:text-red-900"
                title="Deactivate User"
                disabled={userItem.id === user.id}
              >
                <UserX className="h-4 w-4" />
              </button>
            </div>
          </td>
        </tr>
      );
    } else {
      // Regular user row (teacher, admin, or student without parent)
      return (
        <tr key={userItem.id} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10">
                <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {userItem.name.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-900">{userItem.name}</div>
                <div className="text-sm text-gray-500">{userItem.email}</div>
              </div>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(userItem.role)}`}>
              {userItem.role}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => {
                  setSelectedUser(userItem);
                  setShowEditModal(true);
                }}
                className="text-blue-600 hover:text-blue-900"
                title="Edit User"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeactivateUser(userItem.id)}
                className="text-red-600 hover:text-red-900"
                title="Deactivate User"
                disabled={userItem.id === user.id}
              >
                <UserX className="h-4 w-4" />
              </button>
            </div>
          </td>
        </tr>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage student and teacher accounts</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 border-2 border-green-600 text-green-600 px-4 py-2 rounded-lg hover:bg-green-600 hover:text-white transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            />
          </div>

          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 1 })}
          >
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="parent">Parents</option>
            <option value="admin">Admins</option>
          </select>

          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.limit}
            onChange={(e) => setFilters({ ...filters, limit: e.target.value, page: 1 })}
          >
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getPaginatedRows().map((userItem, index) =>
                    renderUserRow(userItem, index)
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                    disabled={filters.page === 1}
                    className="relative inline-flex items-center px-4 py-2 border-2 border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all duration-200"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, page: Math.min(pagination?.pages || 1, filters.page + 1) })}
                    disabled={filters.page === (pagination?.pages || 1)}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border-2 border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all duration-200"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{((filters.page - 1) * filters.limit) + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(filters.page * filters.limit, getTotalDisplayedRows())}
                      </span> of{' '}
                      <span className="font-medium">{pagination?.total || 0}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      {Array.from({ length: pagination?.pages || 0 }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setFilters({ ...filters, page })}
                          className={`relative inline-flex items-center px-4 py-2 border-2 text-sm font-medium transition-all duration-200 ${page === filters.page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                        >
                          {page}
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <UserModal
          title="Create New User"
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateUser}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <UserModal
          title="Edit User"
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSubmit={(userData) => handleUpdateUser(selectedUser.id, userData)}
        />
      )}
    </div>
  );
};

// User Modal Component
const UserModal = ({ title, user, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',  // Always empty
    role: '',      // Always empty for new users
    phone: user?.phone || '',
    date_of_birth: user?.date_of_birth || '',
    is_active: user?.is_active !== undefined ? user.is_active : true
  });

  // Reset form when user prop changes
  useEffect(() => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      password: '',  // Always empty
      role: user?.role || '',  // Only fill if editing existing user
      phone: user?.phone || '',
      date_of_birth: user?.date_of_birth || '',
      is_active: user?.is_active !== undefined ? user.is_active : true
    });
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };

    // Don't send password if it's empty (for edit mode)
    if (!submitData.password && user) {
      delete submitData.password;
    }

    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center" style={{ margin: 0 }}>
      <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-1">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
          <form onSubmit={handleSubmit} className="space-y-1">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                required
                placeholder="Enter full name"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                required
                placeholder="Enter email address"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password {user ? '(leave empty to keep current)' : ''}
              </label>
              <input
                type="password"
                required={!user}
                placeholder="Enter password (min 6 characters)"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="">Select Role</option>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                placeholder="Enter phone number"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
              <input
                type="date"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border-2 border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border-2 border-green-600 text-green-600 rounded-md hover:bg-green-600 hover:text-white transition-all duration-200"
              >
                {user ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;