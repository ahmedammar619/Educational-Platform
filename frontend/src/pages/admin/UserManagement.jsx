import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit, Trash2, UserCheck, Eye, Key, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { usersService } from '../../services';
import PhoneInput from '../../components/ui/PhoneInput';

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
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [filters, allUsers]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersService.getAllUsers();
      const users = response.users || [];
      
      // Transform the API response to match the expected format
      const transformedUsers = users.map(u => ({
        ...u,
        created_at: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        name: u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.email,
        children: u.children || []
      }));
      
      setAllUsers(transformedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      // Fallback to empty array if API fails
      setAllUsers([]);
    } finally {
      setLoading(false);
    }
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

  const handleCreateUser = async (userData) => {
    try {
      console.log('Creating user with data:', userData); // Debug log
      
      // Call the backend API to create user
      const response = await usersService.createUser(userData);
      console.log('Backend response:', response); // Debug log
      
      // Add the new user to the local state
      const newUser = {
        ...response,
        created_at: response.createdAt ? new Date(response.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        name: `${response.firstName} ${response.lastName}`,
        children: []
      };

      setAllUsers(prev => [...prev, newUser]);
      setShowCreateModal(false);
      alert('User created successfully!');
    } catch (error) {
      console.error('Error creating user:', error);
      const errorMessage = error.message || error.response?.data?.message || 'Unknown error occurred';
      alert(`Error creating user: ${errorMessage}`);
    }
  };

  const handleUpdateUser = async (userId, userData) => {
    try {
      console.log('Updating user with data:', userData); // Debug log
      
      // Call the backend API to update user
      const response = await usersService.updateUser(userId, userData);
      console.log('Backend response:', response); // Debug log
      
      // Update the user in local state
      const updatedUser = {
        ...response,
        name: `${response.firstName} ${response.lastName}`
      };

      setAllUsers(prev => prev.map(user =>
        user.id === userId ? { ...user, ...updatedUser } : user
      ));
      setShowEditModal(false);
      setSelectedUser(null);
      alert('User updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      const errorMessage = error.message || error.response?.data?.message || 'Unknown error occurred';
      alert(`Error updating user: ${errorMessage}`);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      // Call the backend API to delete user
      await usersService.deleteUser(userId);
      
      // Remove the user from local state after successful deletion
      setAllUsers(prev => prev.filter(user => user.id !== userId));
      alert('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      
      // Handle specific error cases
      if (error.message && error.message.includes('related data')) {
        alert(
          'Cannot delete this user because they have related data (courses, enrollments, etc.).\n\n' +
          'Please remove all related data first or consider deactivating the user instead.\n\n' +
          'Error details: ' + error.message
        );
      } else {
        const errorMessage = error.message || error.response?.data?.message || 'Unknown error occurred';
        alert(`Error deleting user: ${errorMessage}`);
      }
    }
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

  // Helper function to check if user can be deleted
  const canUserBeDeleted = (user) => {
    // Allow deletion of all users - let the backend handle validation
    // The backend will check for actual related data and prevent deletion if needed
    console.log('canUserBeDeleted called for user:', user.name, user.role, 'result: true');
    return true;
  };

  // Get delete button tooltip
  const getDeleteTooltip = (user) => {
    return 'Delete User';
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
              {/* Debug info */}
              {console.log('Parent row delete button - userItem.id:', userItem.id, 'user?.id:', user?.id, 'canUserBeDeleted:', canUserBeDeleted(userItem))}
              <button
                onClick={() => handleDeleteUser(userItem.id)}
                className={`${
                  canUserBeDeleted(userItem) 
                    ? 'text-red-600 hover:text-red-900' 
                    : 'text-gray-400 cursor-not-allowed'
                } transition-colors duration-200`}
                title={getDeleteTooltip(userItem)}
                disabled={userItem.id === user?.id || !canUserBeDeleted(userItem)}
              >
                <Trash2 className={`h-4 w-4 ${!canUserBeDeleted(userItem) ? 'opacity-50' : ''}`} />
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
                <div className="text-start text-sm font-medium text-gray-900">{userItem.name}</div>
                <div className="text-start text-sm text-gray-500">{userItem.email}</div>
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
                onClick={() => handleDeleteUser(userItem.id)}
                className={`${
                  canUserBeDeleted(userItem) 
                    ? 'text-red-600 hover:text-red-900' 
                    : 'text-gray-400 cursor-not-allowed'
                } transition-colors duration-200`}
                title={getDeleteTooltip(userItem)}
                disabled={userItem.id === user?.id || !canUserBeDeleted(userItem)}
              >
                <Trash2 className={`h-4 w-4 ${!canUserBeDeleted(userItem) ? 'opacity-50' : ''}`} />
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
                onClick={() => handleDeleteUser(userItem.id)}
                className={`${
                  canUserBeDeleted(userItem) 
                    ? 'text-red-600 hover:text-red-900' 
                    : 'text-gray-400 cursor-not-allowed'
                } transition-colors duration-200`}
                title={getDeleteTooltip(userItem)}
                disabled={userItem.id === user?.id || !canUserBeDeleted(userItem)}
              >
                <Trash2 className={`h-4 w-4 ${!canUserBeDeleted(userItem) ? 'opacity-50' : ''}`} />
              </button>
            </div>
          </td>
        </tr>
      );
    }
  };

  return (
    <div className="space-y-6 h-full">
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

      {/* Deletion Rules Info */}
      {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">User Deletion Rules</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>• <strong>Teachers, Students, and Parents</strong> cannot be deleted if they have related data (courses, enrollments, materials, etc.)</p>
              <p>• <strong>Admin users</strong> can be deleted if they don't have related data</p>
              <p>• <strong>Disabled delete buttons</strong> indicate users that cannot be deleted</p>
              <p>• Consider deactivating users instead of deleting them</p>
            </div>
          </div>
        </div>
      </div> */}

      {/* Filters */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            />
          </div>

          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                    className="ml-3 relative inline-flex items-center px-4 py-2 border-2 border-gray-300 text-sm font-medium rounded-md text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all duration-200"
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
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    password: '',  // Always empty for edit mode
    role: user?.role || '',  // Fill if editing existing user
    phone: user?.role && user?.role !== 'student' ? (user?.phone || '') : '',  // Only for non-students
    birthDate: user?.role === 'student' ? (user?.birthDate || '') : undefined,  // Only for students, undefined for others
  });

  // Reset form when user prop changes
  useEffect(() => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      password: '',  // Always empty for edit mode
      role: user?.role || '',  // Fill if editing existing user
      phone: user?.role && user?.role !== 'student' ? (user?.phone || '') : '',  // Only for non-students
      birthDate: user?.role === 'student' ? (user?.birthDate || '') : undefined,  // Only for students, undefined for others
    });
  }, [user]);

  // Memoize the phone onChange function to prevent infinite re-renders
  const handlePhoneChange = useCallback((value) => {
    setFormData(prev => ({ ...prev, phone: value }));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields based on role
    if (formData.role === 'student') {
      if (!formData.birthDate) {
        alert('Birth date is required for students');
        return;
      }
      if (formData.phone) {
        alert('Phone number is not allowed for students');
        return;
      }
    } else if (formData.role === 'teacher' || formData.role === 'parent' || formData.role === 'admin') {
      if (!formData.phone) {
        alert('Phone number is required for teachers, parents, and admins');
        return;
      }
      if (formData.birthDate) {
        alert('Birth date is not allowed for teachers, parents, and admins');
        return;
      }
    }

    const submitData = { ...formData };

    // Don't send password if it's empty (for edit mode)
    if (!submitData.password && user) {
      delete submitData.password;
    }

    // Clear phone and birthDate for students
    if (submitData.role === 'student') {
      submitData.phone = '';
      // Keep birthDate for students (it's required)
    } else {
      // For non-students, completely remove birthDate field and keep phone
      delete submitData.birthDate;
    }

    // Ensure birthDate is properly formatted
    if (submitData.birthDate) {
      submitData.birthDate = submitData.birthDate; // Keep as ISO string from date input
    }

    console.log('Submitting user data:', submitData); // Debug log
    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center" style={{ margin: 0 }}>
      <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-1">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  required
                  placeholder="First name"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  required
                  placeholder="Last name"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
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
                Password {user ? '(leave empty to keep current)' : '(min 8 characters)'}
              </label>
              <input
                type="password"
                required={!user}
                minLength={8}
                placeholder="Enter password"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.role}
                onChange={(e) => {
                  const newRole = e.target.value;
                  // Clear fields when switching roles based on strict requirements
                  if (newRole === 'student') {
                    setFormData({ ...formData, role: newRole, phone: '', birthDate: '' });
                  } else if (newRole && newRole !== 'student') {
                    setFormData({ ...formData, role: newRole, birthDate: undefined });
                  } else {
                    setFormData({ ...formData, role: newRole, phone: '', birthDate: undefined });
                  }
                }}
              >
                <option value="">Select Role</option>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
                <option value="admin">Admin</option>
              </select>
              {formData.role === 'student' && (
                <p className="mt-1 text-xs text-gray-500">
                  Students: Birth date is required, phone number is forbidden
                </p>
              )}
              {formData.role && formData.role !== 'student' && (
                <p className="mt-1 text-xs text-gray-500">
                  {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}s: Phone number is required, birth date is forbidden
                </p>
              )}
            </div>

            {/* Phone number - only show for admin, teacher, parent */}
            {formData.role && formData.role !== 'student' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone *</label>
                <PhoneInput
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="Enter phone number"
                  required={true}
                />
              </div>
            )}

            {/* Date of Birth - only show for students */}
            {formData.role === 'student' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  type="date"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                />
              </div>
            )}

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