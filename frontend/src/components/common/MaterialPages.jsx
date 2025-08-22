import { useState, useEffect } from 'react';
import {
  MessageSquare,
  FileText,
  Folder,
  Plus,
  Upload,
  MoreVertical,
  Reply,
  SmilePlus,
  Paperclip,
  MapPin,
  X,
  Send,
  ArrowLeft,
  Edit,
  Trash2,
  Download
} from 'lucide-react';

const MaterialPages = ({ classData, onBack, currentUser }) => {
  // Get theme colors based on user role
  const getThemeColors = () => {
    switch (currentUser?.role) {
      case 'student':
        return {
          primary: 'red',
          primaryLight: 'red-50',
          primaryDark: 'red-700',
          primaryHover: 'red-600',
          primaryBorder: 'red-200',
          primaryBg: 'red-100',
          primaryText: 'red-800'
        };
      case 'admin':
        return {
          primary: 'green',
          primaryLight: 'green-50',
          primaryDark: 'green-700',
          primaryHover: 'green-600',
          primaryBorder: 'green-200',
          primaryBg: 'green-100',
          primaryText: 'green-800'
        };
      case 'teacher':
        return {
          primary: 'blue',
          primaryLight: 'blue-50',
          primaryDark: 'blue-700',
          primaryHover: 'blue-600',
          primaryBorder: 'blue-200',
          primaryBg: 'blue-100',
          primaryText: 'blue-800'
        };
      default:
        return {
          primary: 'blue',
          primaryLight: 'blue-50',
          primaryDark: 'blue-700',
          primaryHover: 'blue-600',
          primaryBorder: 'blue-200',
          primaryBg: 'blue-100',
          primaryText: 'blue-800'
        };
    }
  };

  const theme = getThemeColors();

  // Role-based access control functions - defined first to avoid initialization errors
  const canCreatePost = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'teacher';
  };

  const canEditPost = (post) => {
    if (currentUser?.role === 'admin') return true;
    if (currentUser?.role === 'teacher') return true;
    if (currentUser?.role === 'student') {
      return post.user?.name === currentUser?.name;
    }
    return false;
  };

  const canDeletePost = (post) => {
    if (currentUser?.role === 'admin') return true;
    if (currentUser?.role === 'teacher') return true;
    if (currentUser?.role === 'student') {
      return post.user?.name === currentUser?.name;
    }
    return false;
  };

  const canCreateFolder = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'teacher';
  };

  const canEditFolder = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'teacher';
  };

  const canDeleteFolder = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'teacher';
  };

  const canUploadFiles = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'teacher';
  };

  const canEditFiles = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'teacher';
  };

  const canDeleteFiles = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'teacher';
  };

  const canManageZoom = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'teacher';
  };

  const canViewPosts = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'teacher' || currentUser?.role === 'student';
  };

  const canViewFiles = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'teacher' || currentUser?.role === 'student';
  };

  const canViewZoom = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'teacher' || currentUser?.role === 'student';
  };

  // Set default tab based on user permissions
  const getDefaultTab = () => {
    if (canViewPosts()) return 'posts';
    if (canViewFiles()) return 'files';
    if (canViewZoom()) return 'zoom';
    return 'posts'; // fallback
  };

  const [activeTab, setActiveTab] = useState(getDefaultTab());
  const [posts, setPosts] = useState([
    {
      id: 1,
      user: {
        name: 'youssef ossama',
        avatar: 'y',
        avatarColor: 'bg-blue-500',
        status: 'active'
      },
      content: 'lecture 1',
      timestamp: '12/7/2023 4:32 PM',
      reactions: [],
      replies: [
        {
          id: 1,
          user: {
            name: 'YO',
            avatar: 'YO',
            avatarColor: 'bg-pink-500'
          }
        }
      ]
    }
  ]);
  const [folders, setFolders] = useState([
    {
      id: 1,
      name: 'Lecture Materials',
      files: [
        { id: 1, name: 'Lecture 1 - Introduction.pdf', type: 'pdf', size: '2.3 MB' }
      ],
      subfolders: []
    },
    {
      id: 2,
      name: 'Assignments',
      files: [
        { id: 3, name: 'Assignment 1.docx', type: 'docx', size: '1.8 MB' },
        { id: 4, name: 'Assignment 2.pdf', type: 'pdf', size: '3.2 MB' }
      ],
      subfolders: []
    },
    {
      id: 3,
      name: 'Resources',
      files: [
        { id: 5, name: 'Study Guide.pdf', type: 'pdf', size: '4.7 MB' }
      ],
      subfolders: []
    }
  ]);
  const [rootFiles, setRootFiles] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [showWritePost, setShowWritePost] = useState(false);
  const [postSubject, setPostSubject] = useState('');
  const [postMessage, setPostMessage] = useState('');
  const [showEditFolderModal, setShowEditFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [showEditPostModal, setShowEditPostModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editPostSubject, setEditPostSubject] = useState('');
  const [editPostMessage, setEditPostMessage] = useState('');
  const [selectedFolderForView, setSelectedFolderForView] = useState(null);
  const [showEditFileModal, setShowEditFileModal] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  const [editFileName, setEditFileName] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);

  // Update active tab when user role changes
  useEffect(() => {
    const newDefaultTab = getDefaultTab();
    if (activeTab !== newDefaultTab && !canViewTab(activeTab)) {
      setActiveTab(newDefaultTab);
    }
  }, [currentUser?.role]);

  // Helper function to check if user can view a specific tab
  const canViewTab = (tabName) => {
    switch (tabName) {
      case 'posts': return canViewPosts();
      case 'files': return canViewFiles();
      case 'zoom': return canViewZoom();
      default: return false;
    }
  };

  const handleCreatePost = () => {
    if (newPost.trim()) {
      const post = {
        id: Date.now(),
        user: {
          name: 'teacher',
          avatar: 'T',
          avatarColor: 'bg-blue-500',
          status: 'active'
        },
        content: newPost,
        timestamp: new Date().toLocaleString(),
        reactions: [],
        replies: []
      };
      setPosts([post, ...posts]);
      setNewPost('');
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      const folder = {
        id: Date.now(),
        name: newFolderName,
        files: [],
        subfolders: []
      };

      if (selectedFolderForView) {
        // Create folder inside the current folder
        setFolders(folders.map(f =>
          f.id === selectedFolderForView.id
            ? { ...f, subfolders: [...f.subfolders, folder] }
            : f
        ));

        // Update the selected folder view
        setSelectedFolderForView(prev => ({
          ...prev,
          subfolders: [...prev.subfolders, folder]
        }));
      } else {
        // Create folder at root level
        setFolders([...folders, folder]);
      }

      setNewFolderName('');
      setShowNewFolderModal(false);
    }
  };

  const handleFileUpload = () => {
    if (uploadedFile) {
      const file = {
        id: Date.now(),
        name: uploadedFile.name,
        type: uploadedFile.name.split('.').pop(),
        size: `${(uploadedFile.size / 1024 / 1024).toFixed(1)} MB`
      };

      if (selectedFolderForView) {
        // Upload to specific folder
        setFolders(folders.map(f =>
          f.id === selectedFolderForView.id
            ? { ...f, files: [...f.files, file] }
            : f
        ));

        // Update the selected folder view
        setSelectedFolderForView(prev => ({
          ...prev,
          files: [...prev.files, file]
        }));
      } else {
        // Upload to root level (files tab) - add to rootFiles array
        setRootFiles([...rootFiles, file]);
      }

      setUploadedFile(null);
      setShowUploadModal(false);
    }
  };

  const handleCreateRichPost = () => {
    if (postSubject.trim() && postMessage.trim()) {
      const post = {
        id: Date.now(),
        user: {
          name: currentUser?.name || 'username',
          avatar: currentUser?.name?.charAt(0)?.toUpperCase() || 'U',
          avatarColor: 'bg-blue-500',
          status: 'active'
        },
        subject: postSubject,
        content: postMessage,
        timestamp: new Date().toLocaleString(),
        reactions: [],
        replies: [],
        attachments: attachedFiles
      };
      setPosts([post, ...posts]);
      setPostSubject('');
      setPostMessage('');
      setAttachedFiles([]);
      setShowWritePost(false);
    }
  };

  const handleEditFolder = (folder) => {
    setEditingFolder(folder);
    setEditFolderName(folder.name);
    setShowEditFolderModal(true);
  };

  const handleUpdateFolder = () => {
    if (editFolderName.trim() && editingFolder) {
      setFolders(folders.map(f =>
        f.id === editingFolder.id
          ? { ...f, name: editFolderName.trim() }
          : f
      ));
      setEditFolderName('');
      setEditingFolder(null);
      setShowEditFolderModal(false);
    }
  };

  const handleDeleteFolder = (folderId) => {
    if (window.confirm('Are you sure you want to delete this folder? This action cannot be undone.')) {
      setFolders(folders.filter(f => f.id !== folderId));
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setEditPostSubject(post.subject || '');
    setEditPostMessage(post.content);
    setShowEditPostModal(true);
  };

  const handleUpdatePost = () => {
    if (editPostMessage.trim() && editingPost) {
      setPosts(posts.map(p =>
        p.id === editingPost.id
          ? {
            ...p,
            subject: editPostSubject.trim() || undefined,
            content: editPostMessage.trim()
          }
          : p
      ));
      setEditPostSubject('');
      setEditPostMessage('');
      setEditingPost(null);
      setShowEditPostModal(false);
    }
  };

  const handleDeletePost = (postId) => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      setPosts(posts.filter(p => p.id !== postId));
    }
  };

  const handleOpenFolder = (folder) => {
    setSelectedFolderForView(folder);
  };

  const handleBackToFolders = () => {
    setSelectedFolderForView(null);
  };

  const handleDeleteFile = (folderId, fileId) => {
    if (window.confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      setFolders(folders.map(f =>
        f.id === folderId
          ? { ...f, files: f.files.filter(file => file.id !== fileId) }
          : f
      ));

      // Update the selected folder view if it's currently open
      if (selectedFolderForView && selectedFolderForView.id === folderId) {
        setSelectedFolderForView(prev => ({
          ...prev,
          files: prev.files.filter(file => file.id !== fileId)
        }));
      }
    }
  };

  const handleDeleteRootFile = (fileId) => {
    if (window.confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      setRootFiles(rootFiles.filter(file => file.id !== fileId));
    }
  };

  const handleDownloadFile = (file) => {
    // Create a blob URL for the file (in a real app, this would be the actual file data)
    const blob = new Blob(['File content for ' + file.name], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);

    // Create a temporary link element and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleOpenFile = (file) => {
    // Create a blob URL for the file (in a real app, this would be the actual file data)
    const blob = new Blob(['File content for ' + file.name], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);

    // Open file in new tab
    window.open(url, '_blank');

    // Clean up after a delay to allow the file to open
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1000);
  };

  const handleEditFile = (file) => {
    setEditingFile(file);
    setEditFileName(file.name);
    setShowEditFileModal(true);
  };

  const handleUpdateFile = () => {
    if (editFileName.trim() && editingFile) {
      if (selectedFolderForView) {
        // Update file in folder
        setFolders(folders.map(f =>
          f.id === selectedFolderForView.id
            ? {
              ...f, files: f.files.map(file =>
                file.id === editingFile.id
                  ? { ...file, name: editFileName.trim() }
                  : file
              )
            }
            : f
        ));

        // Update the selected folder view
        setSelectedFolderForView(prev => ({
          ...prev,
          files: prev.files.map(file =>
            file.id === editingFile.id
              ? { ...file, name: editFileName.trim() }
              : file
          )
        }));
      } else {
        // Update root file
        setRootFiles(rootFiles.map(file =>
          file.id === editingFile.id
            ? { ...file, name: editFileName.trim() }
            : file
        ));
      }

      setEditFileName('');
      setEditingFile(null);
      setShowEditFileModal(false);
    }
  };

  const handleFileAttachment = (event) => {
    const files = Array.from(event.target.files);
    const newAttachments = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      type: file.name.split('.').pop(),
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      file: file
    }));
    setAttachedFiles([...attachedFiles, ...newAttachments]);
  };

  const handleRemoveAttachment = (attachmentId) => {
    setAttachedFiles(attachedFiles.filter(att => att.id !== attachmentId));
  };

  const getFileIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'pdf': return '📄';
      case 'docx': return '📝';
      case 'pptx': return '📊';
      case 'xlsx': return '📈';
      default: return '📁';
    }
  };

  // Role-based welcome message
  const getWelcomeMessage = () => {
    if (!currentUser?.role) return 'Welcome to the class materials';

    switch (currentUser.role) {
      case 'admin':
        return 'Welcome, Administrator! You have full access to all features.';
      case 'teacher':
        return 'Welcome, Teacher! You can create, edit, and manage all class materials.';
      case 'student':
        return 'Welcome, Student! You can view materials and participate in discussions.';
      case 'parent':
        return 'Welcome, Parent! You can view class materials and monitor your child\'s progress.';
      default:
        return 'Welcome to the class materials';
    }
  };

  // Role-based permissions summary
  const getPermissionsSummary = () => {
    if (!currentUser?.role) return null;

    const permissions = [];
    if (canCreatePost()) permissions.push('Create posts');
    if (canCreateFolder()) permissions.push('Create folders');
    if (canUploadFiles()) permissions.push('Upload files');
    if (canManageZoom()) permissions.push('Manage Zoom meetings');

    if (permissions.length === 0) {
      permissions.push('View only');
    }

    return permissions.join(', ');
  };

  return (
    <div className="h-screen h-100 flex flex-col space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{classData?.name}</h1>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="flex border-b border-gray-200">
          {canViewPosts() && (
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'posts'
                ? `text-${theme.primary}-600 border-b-2 border-${theme.primary}-600 bg-${theme.primaryLight}`
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              Posts
            </button>
          )}
          {canViewFiles() && (
            <button
              onClick={() => setActiveTab('files')}
              className={`px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'files'
                ? `text-${theme.primary}-600 border-b-2 border-${theme.primary}-600 bg-${theme.primaryLight}`
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              Files
            </button>
          )}
          {canViewZoom() && (
            <button
              onClick={() => setActiveTab('zoom')}
              className={`px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'zoom'
                ? `text-${theme.primary}-600 border-b-2 border-${theme.primary}-600 bg-${theme.primaryLight}`
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              Zoom
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          {activeTab === 'posts' ? (
            <div className="space-y-6">
              {/* Posts List */}
              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mb-6">
                    <div className="relative w-32 h-32 mx-auto">
                      <div className="absolute top-0 left-0 w-16 h-16 bg-blue-500 rounded-full opacity-80"></div>
                      <div className="absolute top-4 right-0 w-16 h-16 bg-blue-400 rounded-full opacity-80"></div>
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-blue-300 rounded-full opacity-80"></div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Let's get the conversation started</h3>
                  <p className="text-gray-600">Try @mentioning a student or teacher to begin sharing ideas.</p>
                  {canCreatePost() && (
                    <button
                      onClick={() => setShowWritePost(true)}
                      className={`mt-6 px-6 py-3 border-2 border-${theme.primary}-600 text-${theme.primary}-600 rounded-lg hover:bg-${theme.primaryLight} transition-colors flex items-center gap-2 mx-auto`}
                    >
                      <Edit className="h-5 w-5" />
                      Post in channel
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow">
                      {/* Post Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className={`w-10 h-10 ${post.user.avatarColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                              <span className="text-white font-medium">{post.user.avatar}</span>
                            </div>
                            {post.user.status === 'inactive' && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                <X className="h-2 w-2 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="text-gray-900 font-medium">{post.user.name}</span>
                            <span className="text-gray-500 text-sm ml-2">{post.timestamp}</span>
                          </div>
                        </div>

                                                 {/* Post Actions */}
                         <div className="flex gap-1">
                           {canEditPost(post) && (
                             <button
                               onClick={() => handleEditPost(post)}
                               className="p-1 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                               title="Edit post"
                             >
                               <Edit className="h-4 w-4" />
                             </button>
                           )}
                           {canDeletePost(post) && (
                             <button
                               onClick={() => handleDeletePost(post.id)}
                               className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                               title="Delete post"
                             >
                               <Trash2 className="h-4 w-4" />
                             </button>
                           )}
                         </div>
                      </div>

                      {/* Post Subject */}
                      {post.subject && (
                        <div className="text-start text-gray-900 font-semibold mb-2 mx-5">{post.subject}</div>
                      )}

                      {/* Post Content */}
                      <div className="text-start text-gray-700 mx-5 mb-3">{post.content}</div>

                      {/* Attached Files */}
                      {post.attachments && post.attachments.length > 0 && (
                        <div className="mx-5 mb-3">
                          <div className="border-t border-gray-100 pt-3">
                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                              {post.attachments.map((attachment) => (
                                <div
                                  key={attachment.id}
                                  className="flex items-center gap-2 p-3 bg-gray-50 rounded border border-gray-200 min-w-0 cursor-pointer hover:bg-gray-100 transition-colors"
                                  onClick={() => handleOpenFile(attachment)}
                                  title={`Click to open ${attachment.name}`}
                                >
                                  <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-start text-sm font-medium text-gray-900 truncate">{attachment.name}</p>
                                  </div>
                                                                     <button
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       handleDownloadFile(attachment);
                                     }}
                                     className="p-1 text-green-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors flex-shrink-0"
                                     title={`Download ${attachment.name}`}
                                   >
                                     <Download className="h-3 w-3" />
                                   </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom Post Button */}
              {canCreatePost() && (
                <div className="text-center pt-3 border-t border-gray-200">
                                  <button
                  onClick={() => setShowWritePost(true)}
                  className={`px-3 py-2 border-2 border-${theme.primary}-600 text-${theme.primary}-600 rounded-lg hover:bg-${theme.primaryLight} transition-colors flex items-center gap-2`}
                >
                    <Edit className="h-3 w-3" />
                    Post in channel
                  </button>
                </div>
              )}
            </div>
          ) : activeTab === 'files' ? (
            <div className="space-y-3">
              {!selectedFolderForView ? (
                <>

                  {/* Folders Grid */}
                  <div className="space-y-3">
                    {folders.map((folder) => (
                      <div
                        key={folder.id}
                        className="bg-white rounded-lg p-2 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleOpenFolder(folder)}
                      >
                        <div className="flex items-center gap-2">
                          <Folder className={`h-6 w-6 text-${theme.primary}-500`} />
                          <div className="flex-1">
                            <h3 className="text-start text-gray-900 font-medium">{folder.name}</h3>
                          </div>
                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            {canEditFolder() && (
                              <button
                                onClick={() => handleEditFolder(folder)}
                                className="p-1 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit folder"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                            {canDeleteFolder() && (
                              <button
                                onClick={() => handleDeleteFolder(folder.id)}
                                className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete folder"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Root Files */}
                  {rootFiles.length > 0 && (
                    <div className="space-y-3">
                      {rootFiles.map((file) => (
                        <div
                          key={file.id}
                          className="bg-white rounded-lg p-2 border border-gray-200 hover:shadow-sm transition-shadow cursor-pointer"
                          onClick={() => handleOpenFile(file)}
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-6 w-6 text-gray-400" />
                            <div className="flex-1">
                              <h3 className="text-start text-gray-900 font-medium">{file.name}</h3>
                            </div>
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleDownloadFile(file)}
                                className="p-1 text-green-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Download file"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              {canEditFiles() && (
                                <button
                                  onClick={() => handleEditFile(file)}
                                  className="p-1 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Edit file name"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                              {canDeleteFiles() && (
                                <button
                                  onClick={() => handleDeleteRootFile(file.id)}
                                  className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete file"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Bottom Action Buttons */}
                  {(canCreateFolder() || canUploadFiles()) && (
                    <div className="text-center pt-3 border-t border-gray-200">
                      <div className="flex gap-3">
                        {canCreateFolder() && (
                          <button
                            onClick={() => setShowNewFolderModal(true)}
                            className={`px-3 py-2 border-2 border-${theme.primary}-600 text-${theme.primary}-600 rounded-lg hover:bg-${theme.primaryLight} transition-colors flex items-center gap-2`}
                          >
                            <Folder className="h-5 w-5" />
                            New Folder
                          </button>
                        )}
                        {canUploadFiles() && (
                          <button
                            onClick={() => setShowUploadModal(true)}
                            className={`px-3 py-2 border-2 border-${currentUser?.role === 'admin' ? 'blue' : 'green'}-600 text-${currentUser?.role === 'admin' ? 'blue' : 'green'}-600 rounded-lg hover:bg-${currentUser?.role === 'admin' ? 'blue' : 'green'}-50 transition-colors flex items-center gap-2`}
                          >
                            <Upload className="h-5 w-5" />
                            Upload File
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Folder Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <button
                      onClick={handleBackToFolders}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-2">
                      <Folder className={`h-6 w-6 text-${theme.primary}-500`} />
                      <h2 className="text-xl font-bold text-gray-900">{selectedFolderForView.name}</h2>
                    </div>
                  </div>

                  {/* Folder Content */}
                  <div className="space-y-3">
                    {/* Subfolders */}
                    {selectedFolderForView.subfolders && selectedFolderForView.subfolders.length > 0 && (
                      <div className="space-y-2">
                        {selectedFolderForView.subfolders.map((subfolder) => (
                          <div key={subfolder.id} className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-2">
                              <Folder className={`h-6 w-6 text-${theme.primary}-500`} />
                              <div className="flex-1">
                                <h5 className="text-start text-gray-900 font-medium">{subfolder.name}</h5>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Files */}
                    {selectedFolderForView.files.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-3">
                          <FileText className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500">No files in this folder yet</p>
                      </div>
                    ) : (
                      selectedFolderForView.files.map((file) => (
                        <div
                          key={file.id}
                          className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-sm transition-shadow cursor-pointer"
                          onClick={() => handleOpenFile(file)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-2xl"><FileText className="h-6 w-6 text-gray-400" /></div>
                            <div className="flex-1">
                              <h4 className="text-start text-gray-900 font-medium">{file.name}</h4>
                            </div>
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleDownloadFile(file)}
                                className="p-1 text-green-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Download file"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              {canEditFiles() && (
                                <button
                                  onClick={() => handleEditFile(file)}
                                  className="p-1 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Edit file name"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                              {canDeleteFiles() && (
                                <button
                                  onClick={() => handleDeleteFile(selectedFolderForView.id, file.id)}
                                  className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete file"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Folder Action Buttons */}
                  {(canCreateFolder() || canUploadFiles()) && (
                    <div className="text-center pt-3 border-t border-gray-200">
                      <div className="flex gap-3">
                        {canCreateFolder() && (
                          <button
                            onClick={() => setShowNewFolderModal(true)}
                            className={`px-3 py-2 border-2 border-${theme.primary}-600 text-${theme.primary}-600 rounded-lg hover:bg-${theme.primaryLight} transition-colors flex items-center gap-2`}
                          >
                            <Folder className="h-5 w-5" />
                            New Folder
                          </button>
                        )}
                        {canUploadFiles() && (
                          <button
                            onClick={() => setShowUploadModal(true)}
                            className={`px-3 py-2 border-2 border-${currentUser?.role === 'admin' ? 'blue' : 'green'}-600 text-${currentUser?.role === 'admin' ? 'blue' : 'green'}-600 rounded-lg hover:bg-${currentUser?.role === 'admin' ? 'blue' : 'green'}-50 transition-colors flex items-center gap-2`}
                          >
                            <Upload className="h-5 w-5" />
                            Upload File
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Zoom Content */}
              <div className="text-center py-12">
                <div className="mb-6">
                  <div className="w-24 h-24 bg-blue-500 rounded-full mx-auto flex items-center justify-center">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Zoom Meetings</h3>
                <p className="text-gray-600 mb-6">Schedule and manage your virtual class sessions</p>

                {/* Zoom Actions */}
                {canManageZoom() ? (
                  <div className="flex gap-3 justify-center">
                    <button className={`px-6 py-3 border-2 border-${theme.primary}-600 text-${theme.primary}-600 rounded-lg hover:bg-${theme.primaryLight} transition-colors flex items-center gap-2`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      New Meeting
                    </button>
                    <button className={`px-6 py-3 border-2 border-${currentUser?.role === 'admin' ? 'blue' : 'green'}-600 text-${currentUser?.role === 'admin' ? 'blue' : 'green'}-600 rounded-lg hover:bg-${currentUser?.role === 'admin' ? 'blue' : 'green'}-50 transition-colors flex items-center gap-2`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Schedule Meeting
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-500 text-sm">Contact your teacher or administrator to schedule meetings</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {selectedFolderForView ? `Create New Subfolder in ${selectedFolderForView.name}` : 'Create New Folder'}
            </h3>
                         <input
               type="text"
               value={newFolderName}
               onChange={(e) => setNewFolderName(e.target.value)}
               placeholder="Folder name"
               className="w-full bg-gray-50 text-gray-900 placeholder-gray-500 rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
             />
            <div className="flex gap-3">
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="flex-1 px-4 py-2 border-2 border-gray-400 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className={`flex-1 px-4 py-2 border-2 border-${theme.primary}-600 text-${theme.primary}-600 rounded-lg hover:bg-${theme.primaryLight} disabled:opacity-50 transition-colors`}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload File Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {selectedFolderForView ? `Upload File to ${selectedFolderForView.name}` : 'Upload File'}
            </h3>



            {/* File Upload */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm mb-2">Select File</label>
              <input
                type="file"
                onChange={(e) => setUploadedFile(e.target.files[0])}
                                 className="w-full bg-gray-50 text-gray-900 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-4 py-2 border-2 border-gray-400 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFileUpload}
                disabled={!uploadedFile}
                className="flex-1 px-4 py-2 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 disabled:opacity-50 transition-colors"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Folder Modal */}
      {showEditFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Folder</h3>
            <input
              type="text"
              value={editFolderName}
              onChange={(e) => setEditFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full bg-gray-50 text-gray-900 placeholder-gray-500 rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEditFolderModal(false);
                  setEditingFolder(null);
                  setEditFolderName('');
                }}
                className="flex-1 px-4 py-2 border-2 border-gray-400 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateFolder}
                disabled={!editFolderName.trim()}
                className="flex-1 px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {showEditPostModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-4xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Post</h3>
              <button
                onClick={() => {
                  setShowEditPostModal(false);
                  setEditingPost(null);
                  setEditPostSubject('');
                  setEditPostMessage('');
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-medium">T</span>
              </div>
              <div>
                <p className="text-gray-900 font-medium">Teacher</p>
                <p className="text-gray-500 text-sm">Editing post in class channel</p>
              </div>
            </div>

            {/* Subject Field */}
            <div className="mb-4">
              <label className="block text-start text-gray-700 text-sm mb-2">Subject (optional)</label>
              <input
                type="text"
                value={editPostSubject}
                onChange={(e) => setEditPostSubject(e.target.value)}
                placeholder="Enter post subject..."
                className="w-full bg-gray-50 text-gray-900 placeholder-gray-500 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
              />
            </div>

            {/* Message Field */}
            <div className="mb-6">
              <label className="block text-start text-gray-700 text-sm mb-2">Message</label>
              <textarea
                value={editPostMessage}
                onChange={(e) => setEditPostMessage(e.target.value)}
                placeholder="Write your message here..."
                className="w-full bg-gray-50 text-gray-900 placeholder-gray-500 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
                rows="6"
              />
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                  <Paperclip className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={handleUpdatePost}
                disabled={!editPostMessage.trim()}
                className="px-6 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Update Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Write Post Modal */}
      {showWritePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ margin: '0px' }}>
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-4xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Post in channel</h3>
              <button
                onClick={() => {
                  setShowWritePost(false);
                  setAttachedFiles([]);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            {/* <div className="flex border-b border-gray-200 mb-4">
               <button className="px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600 bg-blue-50">
                 Posts
               </button>
               <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50">
                 Zoom
               </button>
             </div> */}

            {/* User Info */}
            <div className="border-b border-gray-200 flex items-center gap-3 p-2 mb-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-medium">
                  {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="text-gray-900 font-medium">
                  {currentUser?.name || 'username'}
                </p>
              </div>
            </div>

            {/* Content Area with Border */}
            <div className="rounded-lg p-1">
              {/* Subject Field */}
              <div className="mb-4">
                <label className="block text-start text-gray-700 text-sm mb-2">Add a subject</label>
                <input
                  type="text"
                  value={postSubject}
                  onChange={(e) => setPostSubject(e.target.value)}
                  placeholder="Enter post subject..."
                  className="w-full bg-gray-50 text-gray-900 placeholder-gray-500 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
                />
              </div>

              {/* Message Field */}
              <div className="mb-6">
                <label className="block text-start text-gray-700 text-sm mb-2">Type a message</label>
                <textarea
                  value={postMessage}
                  onChange={(e) => setPostMessage(e.target.value)}
                  placeholder="Write your message here..."
                  className="w-full bg-gray-50 text-gray-900 placeholder-gray-500 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
                  rows="6"
                />
              </div>

              {/* Attached Files Display */}
              {attachedFiles.length > 0 && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Attached Files:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {attachedFiles.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 min-w-0">
                        <div className="flex items-center gap-2 p-1 min-w-0 flex-1">
                          <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-start text-sm font-medium text-gray-900 truncate">{attachment.name}</p>
                            <p className="text-start text-xs text-gray-500 truncate">{attachment.type.toUpperCase()} • {attachment.size}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveAttachment(attachment.id)}
                          className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                          title="Remove attachment"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <label className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <Paperclip className="h-4 w-4" />
                    <input
                      type="file"
                      multiple
                      onChange={handleFileAttachment}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.zip,.rar"
                    />
                  </label>
                </div>

                <button
                  onClick={handleCreateRichPost}
                  disabled={!postSubject.trim() || !postMessage.trim()}
                  className={`px-6 py-2 border-2 border-${theme.primary}-600 text-${theme.primary}-600 rounded-lg hover:bg-${theme.primaryLight} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit File Modal */}
      {showEditFileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit File Name</h3>
                         <input
               type="text"
               value={editFileName}
               onChange={(e) => setEditFileName(e.target.value)}
               placeholder="File name"
               className="w-full bg-gray-50 text-gray-900 placeholder-gray-500 rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
             />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEditFileModal(false);
                  setEditingFile(null);
                  setEditFileName('');
                }}
                className="flex-1 px-4 py-2 border-2 border-gray-400 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateFile}
                disabled={!editFileName.trim()}
                className={`flex-1 px-4 py-2 border-2 border-${theme.primary}-600 text-${theme.primary}-600 rounded-lg hover:bg-${theme.primaryLight} disabled:opacity-50 transition-colors`}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialPages;

