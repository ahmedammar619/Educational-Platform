import React, { useState, useRef, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Shield, Edit, LogOut, ChevronRight } from 'lucide-react';
import { parentsService, studentsService } from '../../services';

const UserProfilePopup = ({ user, isOpen, onClose, onEdit, onLogout }) => {
  const popupRef = useRef(null);
  const [parentData, setParentData] = useState(null);
  const [childrenData, setChildrenData] = useState([]);
  const [loadingRelationships, setLoadingRelationships] = useState(false);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      });
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Fetch relationship data when popup opens
  useEffect(() => {
    if (isOpen && user) {
      fetchRelationshipData();
    }
  }, [isOpen, user]);

  const fetchRelationshipData = async () => {
    if (!user) return;

    setLoadingRelationships(true);
    try {
      if (user.role === 'student') {
        // Fetch parent data for student
        try {
          const response = await studentsService.getStudentById(user.id);
          if (response && response.parent) {
            setParentData(response.parent);
          }
        } catch (error) {
          console.log('No parent data available for student');
        }
      } else if (user.role === 'parent') {
        // Fetch children data for parent
        try {
          const response = await parentsService.getMyChildrenDetailed(user.id);
          const children = response?.children || response?.data || [];
          setChildrenData(children);
        } catch (error) {
          console.log('No children data available for parent');
        }
      }
    } catch (error) {
      console.error('Error fetching relationship data:', error);
    } finally {
      setLoadingRelationships(false);
    }
  };

  if (!isOpen || !user) return null;

  // Get user display name
  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.name || 'User';
  };

  // Get user initial
  const getUserInitial = () => {
    if (user?.firstName) {
      return user.firstName.charAt(0);
    }
    if (user?.name) {
      return user.name.charAt(0);
    }
    return 'U';
  };

  // Format role display
  const formatRole = (role) => {
    if (!role) return 'User';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Get role-based colors
  const getRoleColors = (role) => {
    const colorSchemes = {
      admin: {
        icon: 'text-green-600',
        avatar: 'bg-green-600',
        accent: 'text-green-600'
      },
      student: {
        icon: 'text-red-600',
        avatar: 'bg-red-600',
        accent: 'text-red-600'
      },
      parent: {
        icon: 'text-purple-600',
        avatar: 'bg-purple-600',
        accent: 'text-purple-600'
      },
      teacher: {
        icon: 'text-blue-600',
        avatar: 'bg-blue-600',
        accent: 'text-blue-600'
      }
    };
    return colorSchemes[role] || colorSchemes.student;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Not available';
    }
  };

  const colors = getRoleColors(user?.role);

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        ref={popupRef}
        className="absolute top-16 right-4 bg-white rounded-lg shadow-xl border w-80 max-h-96 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* User Profile Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${colors.avatar} rounded-full flex items-center justify-center`}>
              <span className="text-white text-sm font-medium">
                {getUserInitial()}
              </span>
            </div>
            <div className="flex-1 text-start">
              <p className="text-sm font-medium text-gray-900">
                {getUserDisplayName()}
              </p>
              <p className={`text-xs ${colors.accent}`}>
                {formatRole(user.role)}
              </p>
            </div>
          </div>
        </div>

        {/* User Data Items */}
        <div className="py-2 ">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <Mail className={`h-5 w-5 ${colors.icon}`} />
              <div className="flex-1 text-start">
                <p className="text-xs text-gray-500">Email or Username</p>
                <p className="text-sm text-gray-900">{user.email || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {user.phone && (
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <Phone className={`h-5 w-5 ${colors.icon}`} />
                <div className="flex-1 text-start">
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm text-gray-900">{user.phone}</p>
                </div>
              </div>
            </div>
          )}

          {user.birthDate && (
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <Calendar className={`h-5 w-5 ${colors.icon}`} />
                <div className="flex-1 text-start">
                  <p className="text-xs text-gray-500">Birth Date</p>
                  <p className="text-sm text-gray-900">{formatDate(user.birthDate)}</p>
                </div>
              </div>
            </div>
          )}


          {/* Additional Info for Students */}
          {/* {user.role === 'student' && (
            <div className="px-4 py-3 border-b border-gray-100 bg-red-50">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-red-600" />
                <div className="flex-1 text-start">
                  <p className="text-xs text-red-600">Parent Information</p>
                  {loadingRelationships ? (
                    <p className="text-sm text-red-700">Loading...</p>
                  ) : parentData ? (
                    <>
                      <p className="text-sm text-red-900">
                        {parentData.firstName} {parentData.lastName}
                      </p>
                      <p className="text-xs text-red-700">{parentData.email}</p>
                    </>
                  ) : (
                    <p className="text-sm text-red-700">No parent information available</p>
                  )}
                </div>
              </div>
            </div>
          )} */}

          {/* Additional Info for Parents */}
          {/* {user.role === 'parent' && (
            <div className="px-4 py-3 border-b border-gray-100 bg-purple-50">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-purple-600" />
                <div className="flex-1 text-start">
                  <p className="text-xs text-purple-600">Children</p>
                  {loadingRelationships ? (
                    <p className="text-sm text-purple-700">Loading...</p>
                  ) : childrenData && childrenData.length > 0 ? (
                    <>
                      <p className="text-sm text-purple-700 mb-1">({childrenData.length} children)</p>
                      <div className="space-y-1">
                        {childrenData.map((child, index) => (
                          <p key={index} className="text-sm text-purple-900">
                            {child.firstName} {child.lastName}
                          </p>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-purple-700">No children information available</p>
                  )}
                </div>
              </div>
            </div>
          )} */}
        </div>

        {/* Action Buttons */}
        <div className="py-2">
          {/* <button
            onClick={onEdit}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Edit className={`h-5 w-5 ${colors.icon}`} />
              <span className="text-sm text-gray-900">Edit Profile</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button> */}

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <LogOut className={`h-5 w-5 ${colors.icon}`} />
              <span className="text-sm text-gray-900">Log out</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePopup;
