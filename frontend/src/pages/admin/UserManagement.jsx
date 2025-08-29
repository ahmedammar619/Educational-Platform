import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Plus, Edit, Trash2, UserCheck, Eye, EyeOff, Key, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { usersService, studentsService } from '../../services';
import PhoneInput from '../../components/ui/PhoneInput';
import { showSuccessToast, showErrorToast, showConfirmToast, showLoadingToast, dismissToast } from '../../utils/toast.jsx';

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
  const hasShownSuccessToast = useRef(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [filters, allUsers]);

  // Cleanup effect to reset toast flags
  useEffect(() => {
    return () => {
      hasShownSuccessToast.current = false;
    };
  }, []);

  const fetchUsers = async () => {
    const loadingToast = showLoadingToast('Loading users...');
    
    try {
      setLoading(true);
      
      // Fetch both users and students to build the complete relationship structure
      const [usersResponse, studentsResponse] = await Promise.all([
        usersService.getAllUsers(),
        studentsService.getAllStudents()
      ]);
      
      const users = usersResponse.users || [];
      const students = studentsResponse.students || [];
      
      // Create a map of students by their user ID for quick lookup
      const studentsMap = new Map();
      students.forEach(student => {
        studentsMap.set(student.user.id, {
          ...student.user,
          birthDate: student.birthDate,
          parentId: student.parentId,
          isStudent: true
        });
      });
      
      // Transform users and build parent-child relationships
      const transformedUsers = users.map(u => {
        const baseUser = {
          ...u,
          created_at: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          name: u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.email,
        };
        
        if (u.role === 'parent') {
          // For parents, find their children from the students data
          const children = students.filter(s => s.parentId === u.id).map(s => ({
            ...s.user,
            birthDate: s.birthDate,
            parentId: s.parentId,
            isStudent: true
          }));
          
          console.log(`Parent ${u.firstName} ${u.lastName} has children:`, children);
          
          return {
            ...baseUser,
            children: children,
            studentIds: children.map(c => c.id)
          };
        } else if (u.role === 'student') {
          // For students, find their parent info
          const studentData = studentsMap.get(u.id);
          if (studentData) {
            const parentInfo = studentData.parentId ? {
              id: studentData.parentId,
              // Find parent user details
              ...users.find(p => p.id === studentData.parentId)
            } : null;
            
            console.log(`Student ${u.firstName} ${u.lastName} has parent:`, parentInfo);
            
            return {
              ...baseUser,
              ...studentData,
              parent: parentInfo
            };
          }
        }
        
        return baseUser;
      });
      
      console.log('Transformed users:', transformedUsers);
      setAllUsers(transformedUsers);
      
      // Dismiss loading toast and show success toast only once
      dismissToast(loadingToast);
      if (!hasShownSuccessToast.current) {
        showSuccessToast(`Loaded ${transformedUsers.length} users successfully!`);
        hasShownSuccessToast.current = true;
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      // Fallback to empty array if API fails
      setAllUsers([]);
      
      // Dismiss loading toast and show error toast
      dismissToast(loadingToast);
      showErrorToast('Failed to load users. Please try again.');
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
        user.children.some(child => matchingStudentIds.has(child.id))
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
      if (filters.role === 'student') {
        // For student filter, include both students and their parents
        const students = filtered.filter(user => user.role === 'student');
        const parentIds = new Set();
        
        // Collect parent IDs of students
        students.forEach(student => {
          if (student.parent && student.parent.id) {
            parentIds.add(student.parent.id);
          }
        });
        
        // Add parents to the filtered results
        const parents = allUsers.filter(user => user.role === 'parent' && parentIds.has(user.id));
        filtered = [...students, ...parents];
      } else {
        filtered = filtered.filter(user => user.role === filters.role);
      }
    }

    // Set the filtered users (this will be used by getParentChildRows)
    setFilteredUsers(filtered);

    // Calculate pagination based on the filtered results
    let paginationUsers;
    if (filters.role === 'student') {
      // For student filter, count parents and individual students (not children under parents)
      const parents = filtered.filter(user => user.role === 'parent');
      const individualStudents = filtered.filter(user => 
        user.role === 'student' && (!user.parent || !user.parent.id)
      );
      paginationUsers = [...parents, ...individualStudents];
    } else {
      // For other filters, exclude students from pagination count
      paginationUsers = filtered.filter(user => user.role !== 'student');
    }
    
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
    const loadingToast = showLoadingToast('Creating user...');
    
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
      
      // Dismiss loading toast and show success toast
      dismissToast(loadingToast);
      showSuccessToast(`User ${response.firstName} ${response.lastName} created successfully!`);
      
      // Reset the success toast flag so it can show again on next fetch
      hasShownSuccessToast.current = false;
    } catch (error) {
      console.error('Error creating user:', error);
      const errorMessage = error.message || error.response?.data?.message || 'Unknown error occurred';
      
      // Dismiss loading toast and show error toast
      dismissToast(loadingToast);
      showErrorToast(`Error creating user: ${errorMessage}`);
    }
  };

  const handleUpdateUser = async (userId, userData) => {
    const loadingToast = showLoadingToast('Updating user...');
    
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
      
      // Dismiss loading toast and show success toast
      dismissToast(loadingToast);
      showSuccessToast(`User ${response.firstName} ${response.lastName} updated successfully!`);
      
      // Reset the success toast flag so it can show again on next fetch
      hasShownSuccessToast.current = false;
    } catch (error) {
      console.error('Error updating user:', error);
      const errorMessage = error.message || error.response?.data?.message || 'Unknown error occurred';
      
      // Dismiss loading toast and show error toast
      dismissToast(loadingToast);
      showErrorToast(`Error updating user: ${errorMessage}`);
    }
  };

  // Test token function
  const testToken = async () => {
    const loadingToast = showLoadingToast('Testing token...');
    
    try {
      const token = localStorage.getItem('token');
      console.log('🔐 Testing token:', {
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'none'
      });

      // Test with a simple GET request first
      console.log('🧪 Testing token with GET /api/users...');
      const response = await fetch('http://localhost:3000/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Test response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Token test successful:', data);
        
        // Dismiss loading toast and show success toast
        dismissToast(loadingToast);
        showSuccessToast('Token is working! You can now try to delete a user.');
      } else {
        const errorData = await response.text();
        console.log('❌ Token test failed:', errorData);
        
        // Dismiss loading toast and show error toast
        dismissToast(loadingToast);
        showErrorToast(`Token test failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Token test error:', error);
      
      // Dismiss loading toast and show error toast
      dismissToast(loadingToast);
      showErrorToast(`Token test error: ${error.message}`);
    }
  };

  const handleDeleteUser = async (userId) => {
    // Find the user to get their name for the confirmation message
    const userToDelete = allUsers.find(u => u.id === userId);
    const userName = userToDelete?.name || 'this user';
    
    // Show beautiful confirmation toast
    showConfirmToast(
      `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      async () => {
        // User confirmed deletion
        const loadingToast = showLoadingToast('Deleting user...');
        
        try {
          console.log('🗑️ Attempting to delete user:', userId);
          
          // Check if we have a token
          const token = localStorage.getItem('token');
          console.log('🔐 Token check:', {
            hasToken: !!token,
            tokenLength: token ? token.length : 0,
            tokenPreview: token ? `${token.substring(0, 20)}...` : 'none'
          });
          
          // Call the backend API to delete user
          console.log('📡 Calling usersService.deleteUser...');
          await usersService.deleteUser(userId);
          
          console.log('✅ User deleted successfully from backend');
          
          // Remove the user from local state after successful deletion
          setAllUsers(prev => prev.filter(user => user.id !== userId));
          
          // Dismiss loading toast and show success toast
          dismissToast(loadingToast);
          showSuccessToast(`${userName} deleted successfully!`);
        } catch (error) {
          console.error('❌ Error deleting user:', error);
          console.error('❌ Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            statusText: error.response?.statusText
          });
          
          // Dismiss loading toast and show error toast
          dismissToast(loadingToast);
          
          // Handle specific error cases
          if (error.message && error.message.includes('related data')) {
            showErrorToast(
              'Cannot delete this user because they have related data (courses, enrollments, etc.). ' +
              'Please remove all related data first or consider deactivating the user instead.'
            );
          } else {
            const errorMessage = error.message || error.response?.data?.message || 'Unknown error occurred';
            showErrorToast(`Error deleting user: ${errorMessage}`);
          }
        }
      },
      () => {
        // User cancelled deletion - no action needed
        console.log('User cancelled deletion');
      }
    );
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
        if (student.parent && student.parent.id) {
          parentIds.add(student.parent.id);
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
            u.role === 'student' && parent.children.some(child => child.id === u.id) &&
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

      // Add students without parents (individual students)
      const studentsWithoutParents = students.filter(s => !s.parent || !s.parent.id);
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
          u.role === 'student' && parent.children.some(child => child.id === u.id)
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

    // Add students without parents that haven't been processed yet
    const studentsWithoutParents = usersToProcess.filter(u =>
      u.role === 'student' && !u.parent && !processedUsers.has(u.id)
    );

    studentsWithoutParents.forEach(student => {
      rows.push({
        ...student,
        rowSpan: 1
      });
      processedUsers.add(student.id);
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
        u.role === 'student' && userItem.children?.some(child => child.id === u.id)
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
            <div className="text-sm text-gray-900 font-mono">{userItem.id}</div>
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
            <div className="text-sm text-gray-900 font-mono">{userItem.id}</div>
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
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  userItem.role === 'student' && !userItem.parent 
                    ? 'bg-red-500' 
                    : 'bg-green-500'
                }`}>
                  <span className="text-white text-sm font-medium">
                    {userItem.name.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-start text-sm font-medium text-gray-900">{userItem.name}</div>
                <div className="text-start text-sm text-gray-500">{userItem.email}</div>
              </div>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm text-gray-900 font-mono">{userItem.id}</div>
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
    <div className="space-y-6 h-full mb-10">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage student and teacher accounts</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 border-2 border-green-600 text-green-600 px-4 py-2 rounded-lg hover:bg-green-600 hover:text-white transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Relationship Summary */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Parent-Child Relationship Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {allUsers.filter(u => u.role === 'parent').length}
            </div>
            <div className="text-gray-600">Total Parents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {allUsers.filter(u => u.role === 'student' && u.parent).length}
            </div>
            <div className="text-gray-600">Students with Parents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {allUsers.filter(u => u.role === 'student' && !u.parent).length}
            </div>
            <div className="text-gray-600">Individual Students</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {allUsers.filter(u => u.role === 'teacher').length}
            </div>
            <div className="text-gray-600">Teachers</div>
          </div>
        </div>
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
              className="w-full pl-10 py-2 pr-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                      ID
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
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    password: '',  // Always empty for edit mode
    role: user?.role || '',  // Fill if editing existing user
    phone: user?.phone || '',  // Phone is optional for all users
    birthDate: user?.birthDate || '',  // Birth date for students
    courses: user?.courses || '',  // Courses for teachers
    studentIds: user?.studentIds || '',  // Student IDs for parents
    parentId: user?.parentId || '',  // Parent ID for students
  });

  // Reset form when user prop changes
  useEffect(() => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      password: '',  // Always empty for edit mode
      role: user?.role || '',  // Fill if editing existing user
      phone: user?.phone || '',  // Phone is optional for all users
      birthDate: user?.birthDate || '',  // Birth date for students
      courses: user?.courses || '',  // Courses for teachers
      studentIds: user?.studentIds || '',  // Student IDs for parents
      parentId: user?.parentId || '',  // Parent ID for students
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
        showErrorToast('Birth date is required for students');
        return;
      }
    }

    const submitData = { ...formData };

    // Don't send password if it's empty (for edit mode)
    if (!submitData.password && user) {
      delete submitData.password;
    }

    // Clean up the data based on role
    if (submitData.role === 'student') {
      // For students: keep birthDate, phone is optional, handle parentId
      if (!submitData.phone) {
        delete submitData.phone; // Don't send empty phone for students
      }
      delete submitData.courses; // Remove courses for students
      delete submitData.studentIds; // Remove studentIds for students
      // Handle parentId for students
      if (!submitData.parentId) {
        delete submitData.parentId; // Don't send empty parentId
      }
    } else if (submitData.role === 'teacher') {
      // For teachers: remove birthDate, phone is optional, handle courses
      delete submitData.birthDate;
      delete submitData.studentIds; // Remove studentIds for teachers
      delete submitData.parentId; // Remove parentId for teachers
      if (!submitData.phone) {
        delete submitData.phone; // Don't send empty phone
      }
      // Convert courses string to array if provided
      if (submitData.courses) {
        submitData.courses = submitData.courses.split(',').map(course => course.trim()).filter(course => course);
      } else {
        delete submitData.courses; // Don't send empty courses
      }
    } else if (submitData.role === 'parent') {
      // For parents: remove birthDate and courses, phone is optional, handle studentIds
      delete submitData.birthDate;
      delete submitData.courses; // Remove courses for parents
      delete submitData.parentId; // Remove parentId for parents
      if (!submitData.phone) {
        delete submitData.phone; // Don't send empty phone
      }
      // Convert studentIds string to array if provided
      if (submitData.studentIds) {
        submitData.studentIds = submitData.studentIds.split(',').map(id => id.trim()).filter(id => id);
      } else {
        delete submitData.studentIds; // Don't send empty studentIds
      }
    } else {
      // For other roles (admin): remove birthDate, courses, studentIds, and parentId, phone is optional
      delete submitData.birthDate;
      delete submitData.courses;
      delete submitData.studentIds;
      delete submitData.parentId;
      if (!submitData.phone) {
        delete submitData.phone; // Don't send empty phone
      }
    }

    // Ensure birthDate is properly formatted for students
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
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required={!user}
                  minLength={8}
                  placeholder="Enter password"
                  className="mt-1 block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.role}
                onChange={(e) => {
                  const newRole = e.target.value;
                  // Clear fields when switching roles
                  if (newRole === 'student') {
                    setFormData({ ...formData, role: newRole, birthDate: '', courses: '', studentIds: '', parentId: '' });
                  } else if (newRole === 'teacher') {
                    setFormData({ ...formData, role: newRole, birthDate: '', courses: '', studentIds: '', parentId: '' });
                  } else if (newRole === 'parent') {
                    setFormData({ ...formData, role: newRole, birthDate: '', courses: '', studentIds: '', parentId: '' });
                  } else {
                    setFormData({ ...formData, role: newRole, birthDate: '', courses: '', studentIds: '', parentId: '' });
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
                  Students: Birth date is required, phone number and parent ID are optional
                </p>
              )}
              {formData.role === 'teacher' && (
                <p className="mt-1 text-xs text-gray-500">
                  Teachers: Phone number and courses are optional
                </p>
              )}
              {formData.role === 'parent' && (
                <p className="mt-1 text-xs text-gray-500">
                  Parents: Phone number and student IDs are optional
                </p>
              )}
              {formData.role === 'admin' && (
                <p className="mt-1 text-xs text-gray-500">
                  Admins: Phone number is optional
                </p>
              )}
            </div>

            {/* Phone number - optional for all users */}
            {formData.role && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone (Optional)</label>
                <PhoneInput
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="Enter phone number"
                  required={false}
                />
              </div>
            )}

            {/* Date of Birth - required for students */}
            {formData.role === 'student' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth *</label>
                <input
                  type="date"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                />
                <p className="mt-1 text-xs text-gray-500">Required for student accounts</p>
              </div>
            )}

            {/* Courses - for teachers */}
            {formData.role === 'teacher' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Courses (Optional)</label>
                <input
                  type="text"
                  placeholder="Enter courses separated by commas"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.courses || ''}
                  onChange={(e) => setFormData({ ...formData, courses: e.target.value })}
                />
                <p className="mt-1 text-xs text-gray-500">Enter course names separated by commas (e.g., Math, Science)</p>
              </div>
            )}

            {/* Student IDs - for parents */}
            {formData.role === 'parent' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Student IDs (Optional)</label>
                <input
                  type="text"
                  placeholder="Enter student IDs separated by commas"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.studentIds || ''}
                  onChange={(e) => setFormData({ ...formData, studentIds: e.target.value })}
                />
                <p className="mt-1 text-xs text-gray-500">Enter student IDs separated by commas (e.g., uuid1, uuid2)</p>
              </div>
            )}

            {/* Parent ID - for students */}
            {formData.role === 'student' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Parent ID (Optional)</label>
                <input
                  type="text"
                  placeholder="Enter parent user ID"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.parentId || ''}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                />
                <p className="mt-1 text-xs text-gray-500">Enter the UUID of the parent user (leave empty for individual students)</p>
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