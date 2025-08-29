import { useState, useEffect } from 'react';
import { Edit, Trash2, Download, FileText, X, Paperclip } from 'lucide-react';
import { materialsService } from '../../../services';
import { showErrorToast, showSuccessToast } from '../../../utils/errorHandler';

const PostsTab = ({ currentUser, theme, courseId }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newPost, setNewPost] = useState('');
  const [showWritePost, setShowWritePost] = useState(false);
  const [postSubject, setPostSubject] = useState('');
  const [postMessage, setPostMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [showEditPostModal, setShowEditPostModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editPostSubject, setEditPostSubject] = useState('');
  const [editPostMessage, setEditPostMessage] = useState('');

  // Load posts when component mounts or courseId changes
  useEffect(() => {
    if (courseId) {
      loadPosts();
    }
  }, [courseId]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const postsData = await materialsService.getCoursePosts(courseId);
      console.log('Posts loaded:', postsData);
      
      let processedPosts = [];
      if (Array.isArray(postsData)) {
        processedPosts = postsData;
      } else if (typeof postsData === 'object' && postsData !== null) {
        // If it's an object, try to extract values from numeric keys
        processedPosts = Object.values(postsData).filter(item => 
          item && typeof item === 'object' && item.id && item.subject
        );
      }
      
      console.log('Processed posts:', processedPosts);
      console.log('Current user:', currentUser);
      console.log('Post author IDs:', processedPosts.map(p => ({ postId: p.id, authorId: p.authorId, author: p.author })));
      setPosts(processedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      showErrorToast(error, 'Failed to load posts. Please try again.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Role-based access control functions
  const canCreatePost = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'teacher';
  };

  const canEditPost = (post) => {
    if (currentUser?.role === 'admin') return true;
    if (currentUser?.role === 'teacher') return true;
    if (currentUser?.role === 'student') {
      return post.author?.id === currentUser?.id;
    }
    return false;
  };

  const canDeletePost = (post) => {
    if (currentUser?.role === 'admin') return true;
    if (currentUser?.role === 'teacher') return true;
    if (currentUser?.role === 'student') {
      return post.author?.id === currentUser?.id;
    }
    return false;
  };



  const handleCreateRichPost = async () => {
    if (postSubject.trim() && postMessage.trim() && courseId) {
      try {
        const postData = {
          subject: postSubject,
          description: postMessage,
        };

        // If there are attached files, send the first one (for now, we'll support single file upload)
        const fileToUpload = attachedFiles.length > 0 ? attachedFiles[0].file : null;
        
        const newPost = await materialsService.createPost(courseId, postData, fileToUpload);
        
        // Reload posts to get the updated list
        await loadPosts();
        
        setPostSubject('');
        setPostMessage('');
        setAttachedFiles([]);
        setShowWritePost(false);
        showSuccessToast('Post created successfully!');
      } catch (error) {
        console.error('Error creating post:', error);
        showErrorToast(error, 'Failed to create post. Please try again.');
      }
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setEditPostSubject(post.subject || '');
    setEditPostMessage(post.description || post.content || '');
    setShowEditPostModal(true);
  };

  const handleUpdatePost = async () => {
    if (editPostMessage.trim() && editingPost) {
      try {
        const updateData = {
          subject: editPostSubject.trim() || undefined,
          description: editPostMessage.trim()
        };

        await materialsService.updatePost(editingPost.id, updateData);
        
        // Reload posts to get the updated list
        await loadPosts();
        
        setEditPostSubject('');
        setEditPostMessage('');
        setEditingPost(null);
        setShowEditPostModal(false);
        showSuccessToast('Post updated successfully!');
      } catch (error) {
        console.error('Error updating post:', error);
        showErrorToast(error, 'Failed to update post. Please try again.');
      }
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        await materialsService.deletePost(postId);
        
        // Reload posts to get the updated list
        await loadPosts();
        
        showSuccessToast('Post deleted successfully!');
      } catch (error) {
        console.error('Error deleting post:', error);
        showErrorToast(error, 'Failed to delete post. Please try again.');
      }
    }
  };

  const handleFileAttachment = (event) => {
    const files = Array.from(event.target.files);
    
    // For now, we only support single file upload
    if (files.length > 1) {
      showErrorToast(null, 'Only one file can be attached per post. Please select a single file.');
      return;
    }
    
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

  const handleDownloadFile = async (attachment) => {
    try {
      if (!attachment.id) {
        showErrorToast(null, 'File attachment not found');
        return;
      }
      
      // Create download link
      const downloadUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/materials/attachments/${attachment.id}/download`;
      
      // Create a temporary link and trigger download
    const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = attachment.fileName || attachment.name || 'download';
    document.body.appendChild(link);
    link.click();
      document.body.removeChild(link);
      
      showSuccessToast('File download started');
    } catch (error) {
      console.error('Error downloading file:', error);
      showErrorToast(error, 'Failed to download file');
    }
  };

  const handleOpenFile = async (attachment) => {
    try {
      if (!attachment.id) {
        showErrorToast(null, 'File attachment not found');
        return;
      }
      
      // Open file in new tab for preview
      const previewUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/materials/attachments/${attachment.id}/preview`;
      window.open(previewUrl, '_blank');
      
    } catch (error) {
      console.error('Error opening file:', error);
      showErrorToast(error, 'Failed to open file');
    }
  };

  return (
    <div className="space-y-6">
      {/* Posts List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="mb-6">
            <div className="relative w-32 h-32 mx-auto">
              <div className="absolute top-0 left-0 w-16 h-16 bg-green-500 rounded-full opacity-80 animate-pulse"></div>
              <div className="absolute top-4 right-0 w-16 h-16 bg-green-400 rounded-full opacity-80 animate-pulse"></div>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-green-300 rounded-full opacity-80 animate-pulse"></div>
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Loading posts...</h3>
          <p className="text-gray-600">Please wait while we fetch the latest posts.</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-6">
            <div className="relative w-32 h-32 mx-auto">
              <div className="absolute top-0 left-0 w-16 h-16 bg-green-500 rounded-full opacity-80"></div>
              <div className="absolute top-4 right-0 w-16 h-16 bg-green-400 rounded-full opacity-80"></div>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-green-300 rounded-full opacity-80"></div>
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Let's get the conversation started</h3>
          <p className="text-gray-600">Post in channel</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow">
              {/* Post Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={`w-10 h-10 ${(post.authorId === currentUser?.id ? currentUser?.role : post.author?.role) === 'admin' ? 'bg-green-600' : 'bg-blue-500'} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white font-medium">
                        {post.authorId === currentUser?.id ? (
                          currentUser?.firstName?.charAt(0)?.toUpperCase() || 
                          currentUser?.name?.charAt(0)?.toUpperCase() || 'U'
                        ) : (
                          post.author?.firstName?.charAt(0)?.toUpperCase() || 
                          post.author?.lastName?.charAt(0)?.toUpperCase() || 'U'
                        )}
                      </span>
                      </div>
                  </div>
                  <div>
                    <span className="text-gray-900 font-medium">
                      {post.authorId === currentUser?.id ? (
                        currentUser?.firstName && currentUser?.lastName
                          ? `${currentUser.firstName} ${currentUser.lastName}`
                          : currentUser?.name || 'Current User'
                      ) : (
                        post.author?.firstName && post.author?.lastName
                          ? `${post.author.firstName} ${post.author.lastName}`
                          : post.author?.email || 'Unknown User'
                      )}
                    </span>
                    <span className="text-gray-500 text-sm ml-2">
                      {new Date(post.createdAt).toLocaleString()}
                    </span>
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
              <div className="text-start text-gray-700 mx-5 mb-3">{post.description || post.content}</div>

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
                          title={`Click to open ${attachment.fileName || attachment.name}`}
                        >
                          <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-start text-sm font-medium text-gray-900 truncate">{attachment.fileName || attachment.name}</p>
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
            <Edit className="h-5 w-5" />
            Post in channel
          </button>
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

            {/* User Info */}
            <div className="border-b border-gray-200 flex items-center gap-3 p-2 mb-2">
              <div className={`w-8 h-8 ${currentUser?.role === 'admin' ? 'bg-green-500' : 'bg-blue-500'} rounded-full flex items-center justify-center flex-shrink-0`}>
                <span className="text-white font-medium">
                  {currentUser?.firstName?.charAt(0)?.toUpperCase() || 
                   currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="text-gray-900 font-medium">
                  {currentUser?.firstName && currentUser?.lastName
                    ? `${currentUser.firstName} ${currentUser.lastName}`
                    : currentUser?.name || 'Current User'}
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

      {/* Edit Post Modal */}
      {showEditPostModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ margin: '0px' }}>
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
              <div className={`w-10 h-10 ${currentUser?.role === 'admin' ? 'bg-green-500' : 'bg-blue-500'} rounded-full flex items-center justify-center flex-shrink-0`}>
                <span className=" text-white font-medium">
                  {currentUser?.firstName?.charAt(0)?.toUpperCase() || 
                   currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="text-start text-gray-900 font-medium">
                  {currentUser?.firstName && currentUser?.lastName
                    ? `${currentUser.firstName} ${currentUser.lastName}`
                    : currentUser?.name || 'Current User'}
                </p>
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
                className="w-full bg-gray-50 text-gray-900 placeholder-gray-500 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 border border-gray-300"
              />
            </div>

            {/* Message Field */}
            <div className="mb-6">
              <label className="block text-start text-gray-700 text-sm mb-2">Message</label>
              <textarea
                value={editPostMessage}
                onChange={(e) => setEditPostMessage(e.target.value)}
                placeholder="Write your message here..."
                className="w-full bg-gray-50 text-gray-900 placeholder-gray-500 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-green-500 border border-gray-300"
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
                className="px-6 py-2 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Update Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostsTab;
