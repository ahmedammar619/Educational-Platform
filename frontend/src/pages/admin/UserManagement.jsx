import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Plus, Trash2, UserCheck, Eye, EyeOff, Key, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { usersService, studentsService } from '../../services';
import PhoneInput from '../../components/ui/PhoneInput';
import { showSuccessToast, showErrorToast, showLoadingToast, dismissToast } from '../../utils/toast.js';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';

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
  const [showLimitDropdown, setShowLimitDropdown] = useState(false);
  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    userId: null
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showLimitDropdown && !event.target.closest('.relative')) {
        setShowLimitDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLimitDropdown]);

  useEffect(() => {
    filterUsers();
  }, [filters, allUsers]);


  const fetchUsers = async () => {
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
    } catch (err) {
      console.error('Error fetching users:', err);
      // Fallback to empty array if API fails
      setAllUsers([]);

      // Show error toast
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

  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const handleCreateUser = async (userData) => {
    // Prevent double-clicking
    if (isCreatingUser) {
      console.warn('🚫 User creation already in progress, ignoring duplicate request');
      return;
    }

    setIsCreatingUser(true);
    const loadingToast = showLoadingToast('Creating user...');

    try {
      console.log('Creating user with data:', userData); // Debug log

      // Call the backend API to create user
      const response = await usersService.createUser(userData);
      console.log('Backend response:', response); // Debug log

      // Create the new user object
      const newUser = {
        ...response,
        created_at: response.createdAt ? new Date(response.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        name: `${response.firstName} ${response.lastName}`,
        children: []
      };

      // If this is a student with a parent, ONLY update the parent's children array (don't add to main list)
      if (userData.role === 'student' && userData.parentId) {
        console.log('Student created with parentId:', userData.parentId);

        // Create the student object with parent info
        const studentWithParent = {
          ...newUser,
          birthDate: userData.birthDate,
          parentId: userData.parentId,
          isStudent: true
        };

        setAllUsers(prev => {
          // Only update the parent's children array (don't add student to main users array)
          return prev.map(user => {
            if (user.id === userData.parentId) {
              const updatedChildren = [...(user.children || []), studentWithParent];

              console.log(`Updated parent ${user.name} with new child:`, newUser.name);

              return {
                ...user,
                children: updatedChildren,
                studentIds: updatedChildren.map(c => c.id)
              };
            }
            return user;
          });
        });
      } else {
        // For non-student users or students without parents, add to the main list
        setAllUsers(prev => [...prev, newUser]);
      }

      setShowCreateModal(false);

      // Dismiss loading toast and show success toast
      dismissToast(loadingToast);
      showSuccessToast('User created successfully!');
    } catch (error) {
      console.error('Error creating user:', error);
      
      // Dismiss loading toast
      dismissToast(loadingToast);
      
      // Re-throw the error so it can be handled by the modal
      throw error;
    } finally {
      setIsCreatingUser(false);
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
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users`, {
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

  const [deletingUsers, setDeletingUsers] = useState(new Set());

  const handleDeleteUser = async (userId) => {
    // Prevent double-clicking
    if (deletingUsers.has(userId)) {
      console.warn('🚫 User deletion already in progress, ignoring duplicate request');
      return;
    }

    // Find the user to get their name for the confirmation message
    const userToDelete = allUsers.find(u => u.id === userId);
    const userName = userToDelete?.name || 'this user';

    // Show confirmation dialog
    setConfirmationDialog({
      isOpen: true,
      title: 'Delete User',
      message: `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      onConfirm: () => performUserDeletion(userId, userToDelete),
      userId: userId
    });
  };

  const performUserDeletion = async (userId, userToDelete) => {
    // Close confirmation dialog
    setConfirmationDialog({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: null,
      userId: null
    });

    // User confirmed deletion
    setDeletingUsers(prev => new Set(prev).add(userId));
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
      setAllUsers(prev => {
        // If deleting a parent, remove the parent AND all their children
        if (userToDelete?.role === 'parent') {
          console.log(`🗑️ Deleting parent ${userToDelete.name} and all children`);
          const childrenIds = userToDelete.children?.map(child => child.id) || [];
          console.log(`👶 Children to remove: ${childrenIds.join(', ')}`);

          // Remove the parent and all their children
          return prev.filter(user =>
            user.id !== userId && // Remove the parent
            !childrenIds.includes(user.id) // Remove all children
          );
        }
        // If deleting a student, also remove them from their parent's children array
        else if (userToDelete?.role === 'student' && userToDelete?.parentId) {
          return prev.map(user => {
            if (user.id === userToDelete.parentId) {
              // Remove the student from parent's children array
              const updatedChildren = (user.children || []).filter(child => child.id !== userId);
              return {
                ...user,
                children: updatedChildren,
                studentIds: updatedChildren.map(c => c.id)
              };
            }
            return user;
          }).filter(user => user.id !== userId); // Remove the deleted user
        } else {
          // For other roles, just remove the user
          return prev.filter(user => user.id !== userId);
        }
      });

      // Dismiss loading toast and show success toast
      dismissToast(loadingToast);
      showSuccessToast(`${userToDelete?.name || 'User'} deleted successfully!`);
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
          'Cannot delete this user because they have related data (courses, classes, etc.). ' +
          'Please remove all related data first or consider deactivating the user instead.'
        );
      } else {
        const errorMessage = error.message || error.response?.data?.message || 'Unknown error occurred';
        showErrorToast(`Error deleting user: ${errorMessage}`);
      }
    } finally {
      setDeletingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
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
              {/* Debug info */}
              {console.log('Parent row delete button - userItem.id:', userItem.id, 'user?.id:', user?.id, 'canUserBeDeleted:', canUserBeDeleted(userItem))}
              <button
                onClick={() => handleDeleteUser(userItem.id)}
                className={`${canUserBeDeleted(userItem)
                  ? 'text-red-600 hover:text-red-900'
                  : 'text-gray-400 cursor-not-allowed'
                  } transition-colors duration-200`}
                title={getDeleteTooltip(userItem)}
                disabled={userItem.id === user?.id || !canUserBeDeleted(userItem) || deletingUsers.has(userItem.id)}
              >
                {deletingUsers.has(userItem.id) ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                ) : (
                  <Trash2 className={`h-4 w-4 ${!canUserBeDeleted(userItem) ? 'opacity-50' : ''}`} />
                )}
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
                onClick={() => handleDeleteUser(userItem.id)}
                className={`${canUserBeDeleted(userItem)
                  ? 'text-red-600 hover:text-red-900'
                  : 'text-gray-400 cursor-not-allowed'
                  } transition-colors duration-200`}
                title={getDeleteTooltip(userItem)}
                disabled={userItem.id === user?.id || !canUserBeDeleted(userItem) || deletingUsers.has(userItem.id)}
              >
                {deletingUsers.has(userItem.id) ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                ) : (
                  <Trash2 className={`h-4 w-4 ${!canUserBeDeleted(userItem) ? 'opacity-50' : ''}`} />
                )}
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
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${userItem.role === 'teacher'
                    ? 'bg-blue-500'
                    : userItem.role === 'student' && !userItem.parent
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
                onClick={() => handleDeleteUser(userItem.id)}
                className={`${canUserBeDeleted(userItem)
                  ? 'text-red-600 hover:text-red-900'
                  : 'text-gray-400 cursor-not-allowed'
                  } transition-colors duration-200`}
                title={getDeleteTooltip(userItem)}
                disabled={userItem.id === user?.id || !canUserBeDeleted(userItem) || deletingUsers.has(userItem.id)}
              >
                {deletingUsers.has(userItem.id) ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                ) : (
                  <Trash2 className={`h-4 w-4 ${!canUserBeDeleted(userItem) ? 'opacity-50' : ''}`} />
                )}
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
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage student and teacher accounts</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={isCreatingUser}
            className="flex items-center space-x-2 border-2 border-green-600 text-green-600 px-4 py-2 rounded-lg hover:bg-green-600 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingUser ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Add User</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Relationship Summary */}
      {/* <div className="bg-white p-4 rounded-lg shadow-sm border">
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
      </div> */}

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
              <p>• <strong>Teachers, Students, and Parents</strong> cannot be deleted if they have related data (courses, classes, materials, etc.)</p>
              <p>• <strong>Admin users</strong> can be deleted if they don't have related data</p>
              <p>• <strong>Disabled delete buttons</strong> indicate users that cannot be deleted</p>
              <p>• Consider deactivating users instead of deleting them</p>
            </div>
          </div>
        </div>
      </div> */}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border">
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

          <div className="relative">
            <button
              type="button"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-left flex justify-between items-center"
              onClick={() => setShowLimitDropdown(!showLimitDropdown)}
            >
              <span>{filters.limit} per page</span>
              <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showLimitDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showLimitDropdown && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-300 rounded-md shadow-lg z-50">
                <button
                  type="button"
                  className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-50 ${filters.limit === '10' ? 'bg-blue-50 text-blue-600' : ''}`}
                  onClick={() => {
                    setFilters({ ...filters, limit: '10', page: 1 });
                    setShowLimitDropdown(false);
                  }}
                >
                  10 per page
                </button>
                <button
                  type="button"
                  className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-50 ${filters.limit === '25' ? 'bg-blue-50 text-blue-600' : ''}`}
                  onClick={() => {
                    setFilters({ ...filters, limit: '25', page: 1 });
                    setShowLimitDropdown(false);
                  }}
                >
                  25 per page
                </button>
                <button
                  type="button"
                  className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-50 ${filters.limit === '50' ? 'bg-blue-50 text-blue-600' : ''}`}
                  onClick={() => {
                    setFilters({ ...filters, limit: '50', page: 1 });
                    setShowLimitDropdown(false);
                  }}
                >
                  50 per page
                </button>
              </div>
            )}
          </div>
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

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        onClose={() => setConfirmationDialog({
          isOpen: false,
          title: '',
          message: '',
          onConfirm: null,
          userId: null
        })}
        onConfirm={confirmationDialog.onConfirm}
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        confirmButtonVariant="danger"
        isLoading={deletingUsers.has(confirmationDialog.userId)}
      />

    </div>
  );
};

// User Modal Component
const UserModal = ({ title, user, onClose, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    email: '',
    role: '',
    firstName: '',
    lastName: '',
    password: '',
  });

  // Reset form when modal opens
  useEffect(() => {
    setFormData({
      email: '',
      role: '',
      firstName: '',
      lastName: '',
      password: '',
    });
    setErrors({});
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});
    setLoading(true);

    try {
      // Handle new user creation with different logic for admin vs teacher
      let submitData;
      
      if (formData.role === 'admin') {
        // For admin users, create with full details
        submitData = {
          email: formData.email,
          role: formData.role,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: '' // Optional for admin
        };
      } else {
        // For teacher users, create without password - they'll set it via verification email
        submitData = {
          email: formData.email,
          role: formData.role,
          // No password - teacher will set it via verification email
          firstName: `New ${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}`, // Placeholder name
          lastName: 'User', // Placeholder name
          phone: '', // Empty - to be filled via verification flow
        };
      }

      console.log('Creating new user data:', submitData);
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error in UserModal submit:', error);
      
      // Handle different types of errors - extract the most detailed error message
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error.response?.data) {
        // Try multiple possible error message fields
        errorMessage = error.response.data.message || 
                      error.response.data.error || 
                      error.response.data.details ||
                      error.response.data.error_description ||
                      'An unexpected error occurred. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      const statusCode = error.response?.status;
      
      console.log('Full error object:', error);
      console.log('Error response:', error.response);
      console.log('Error response data:', error.response?.data);
      console.log('Status code:', statusCode);
      console.log('Error message:', errorMessage);
      
      // Handle specific error cases with better user-friendly messages
      if (statusCode === 409) {
        // 409 Conflict - User already exists
        if (errorMessage.toLowerCase().includes('email')) {
          setErrors({ email: 'This email is already registered. Please use a different email address.' });
        } else {
          setErrors({ general: 'A user with this information already exists. Please check your details and try again.' });
        }
      } else if (statusCode === 400) {
        // 400 Bad Request - Validation errors
        if (errorMessage.toLowerCase().includes('email')) {
          setErrors({ email: errorMessage });
        } else {
          setErrors({ general: errorMessage });
        }
      } else if (statusCode === 422) {
        // 422 Unprocessable Entity - Validation errors
        setErrors({ general: errorMessage });
      } else if (statusCode >= 500) {
        // Server errors
        setErrors({ general: 'Server error occurred. Please try again later or contact support.' });
      } else {
        // Other errors - show the actual message from server
        setErrors({ general: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center" style={{ margin: 0 }}>
      <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="mt-1">
          <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
          
          {/* General Error Display */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{errors.general}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-3">

            <div>
              <label className="block text-sm font-medium text-gray-700">Email or Username</label>
              <input
                type="text"
                required
                placeholder="Enter email address or username"
                className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.email 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
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
                  setFormData({ 
                    ...formData, 
                    role: newRole,
                    firstName: '',
                    lastName: '',
                    password: ''
                  });
                  // Clear errors when changing role
                  setErrors({});
                }}
              >
                <option value="">Select Role</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
              {formData.role === 'admin' && (
                <p className="mt-1 text-xs text-blue-600">
                  <strong>Admin users:</strong> Complete profile required. They can login immediately without profile completion.
                </p>
              )}
            </div>

            {/* Admin-specific fields */}
            {formData.role === 'admin' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter first name"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter last name"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter password"
                      className="mt-1 block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Password must contain: at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character
                  </p>
                </div>
              </>
            )}


            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border-2 border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border-2 border-green-600 text-green-600 rounded-md hover:bg-green-600 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                    Creating...
                  </>
                ) : (
                  'Create'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;