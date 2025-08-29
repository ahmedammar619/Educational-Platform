import { useState, useEffect, useRef } from 'react';
import { Edit, Trash2, Download, FileText, X, Paperclip, FileImage, FileVideo, File, Archive, FileType } from 'lucide-react';
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
  const [editAttachedFiles, setEditAttachedFiles] = useState([]);
  const scrollContainerRef = useRef(null);
  
  // Loading states for preventing double clicks
  const [loadingStates, setLoadingStates] = useState({
    creatingPost: false,
    updatingPost: false,
    deletingPost: false,
    downloadingFile: false,
    openingFile: false,
    removingAttachment: false
  });

  // Function to scroll to bottom (latest posts)
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  // Helper function to update loading states
  const updateLoadingState = (key, value) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  };

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
      
      // Scroll to bottom after posts are loaded (latest posts)
      setTimeout(() => {
        scrollToBottom();
      }, 100);
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
    if (postSubject.trim() && postMessage.trim() && courseId && !loadingStates.creatingPost) {
      updateLoadingState('creatingPost', true);
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
        
        // Scroll to bottom to show the new post
        setTimeout(() => {
          scrollToBottom();
        }, 100);
        
        setPostSubject('');
        setPostMessage('');
        setAttachedFiles([]);
        setShowWritePost(false);
        showSuccessToast('Post created successfully!');
      } catch (error) {
        console.error('Error creating post:', error);
        showErrorToast(error, 'Failed to create post. Please try again.');
      } finally {
        updateLoadingState('creatingPost', false);
      }
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setEditPostSubject(post.subject || '');
    setEditPostMessage(post.description || post.content || '');
    
    // Set existing attachments for editing
    if (post.attachments && post.attachments.length > 0) {
      const existingAttachments = post.attachments.map(attachment => ({
        id: attachment.id,
        name: attachment.fileName,
        type: attachment.fileName?.split('.').pop() || 'unknown',
        size: `${(attachment.fileSize / 1024 / 1024).toFixed(1)} MB`,
        isExisting: true, // Flag to identify existing attachments
        attachment: attachment // Keep reference to original attachment
      }));
      setEditAttachedFiles(existingAttachments);
    } else {
      setEditAttachedFiles([]);
    }
    
    setShowEditPostModal(true);
  };

  const handleUpdatePost = async () => {
    if (editPostMessage.trim() && editingPost && !loadingStates.updatingPost) {
      updateLoadingState('updatingPost', true);
      try {
        const updateData = {
          subject: editPostSubject.trim() || undefined,
          description: editPostMessage.trim()
        };

        // Check if there are new files to upload
        const newFiles = editAttachedFiles.filter(att => !att.isExisting);
        const fileToUpload = newFiles.length > 0 ? newFiles[0].file : null;

        await materialsService.updatePost(editingPost.id, updateData, fileToUpload);
        
        // Reload posts to get the updated list
        await loadPosts();
        
        // Scroll to bottom to show the updated post
        setTimeout(() => {
          scrollToBottom();
        }, 100);
        
        setEditPostSubject('');
        setEditPostMessage('');
        setEditAttachedFiles([]);
        setEditingPost(null);
        setShowEditPostModal(false);
        showSuccessToast('Post updated successfully!');
      } catch (error) {
        console.error('Error updating post:', error);
        showErrorToast(error, 'Failed to update post. Please try again.');
      } finally {
        updateLoadingState('updatingPost', false);
      }
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.') && !loadingStates.deletingPost) {
      updateLoadingState('deletingPost', true);
      try {
        await materialsService.deletePost(postId);
        
        // Reload posts to get the updated list
        await loadPosts();
        
        showSuccessToast('Post deleted successfully!');
      } catch (error) {
        console.error('Error deleting post:', error);
        showErrorToast(error, 'Failed to delete post. Please try again.');
      } finally {
        updateLoadingState('deletingPost', false);
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

  const handleEditFileAttachment = (event) => {
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
      file: file,
      isExisting: false // Flag to identify new attachments
    }));
    setEditAttachedFiles([...editAttachedFiles, ...newAttachments]);
  };

  const handleRemoveEditAttachment = async (attachmentId) => {
    try {
      // Find the attachment to check if it's an existing one
      const attachment = editAttachedFiles.find(att => att.id === attachmentId);
      
      if (attachment && attachment.isExisting) {
        // If it's an existing attachment, delete it from the database
        await materialsService.deleteAttachment(attachmentId);
        showSuccessToast('Attachment deleted successfully!');
      }
      
      // Remove from the UI regardless of whether it was existing or new
      setEditAttachedFiles(editAttachedFiles.filter(att => att.id !== attachmentId));
    } catch (error) {
      console.error('Error deleting attachment:', error);
      showErrorToast(error, 'Failed to delete attachment. Please try again.');
    }
  };

  // Function to get appropriate icon for file type
  const getFileIcon = (fileName, mimeType) => {
    const ext = fileName?.split('.').pop()?.toLowerCase() || '';
    
    // Image files
    if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
      return <FileImage className="h-4 w-4 text-blue-500 flex-shrink-0" />;
    }
    
    // Video files
    if (mimeType?.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(ext)) {
      return <FileVideo className="h-4 w-4 text-red-500 flex-shrink-0" />;
    }
    
    // PDF files
    if (ext === 'pdf' || mimeType === 'application/pdf') {
      return <FileType className="h-4 w-4 text-red-600 flex-shrink-0" />;
    }
    
    // Word documents
    if (['doc', 'docx'].includes(ext) || mimeType?.includes('word')) {
      return <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />;
    }
    
    // Archive files
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || mimeType?.includes('zip') || mimeType?.includes('rar')) {
      return <Archive className="h-4 w-4 text-yellow-600 flex-shrink-0" />;
    }
    
    // Default file icon
    return <File className="h-4 w-4 text-gray-400 flex-shrink-0" />;
  };

  // Function to check if file is an image
  const isImageFile = (fileName, mimeType) => {
    const ext = fileName?.split('.').pop()?.toLowerCase() || '';
    return mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
  };

  // Function to check if file is a video
  const isVideoFile = (fileName, mimeType) => {
    const ext = fileName?.split('.').pop()?.toLowerCase() || '';
    return mimeType?.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(ext);
  };

  // Function to extract clean file name without timestamp and random numbers
  const getCleanFileName = (fileName) => {
    if (!fileName) return 'Unknown File';
    
    // Remove various timestamp and random patterns:
    // Pattern 1: -1756473298101-159680209 (13-digit timestamp + 9-digit random)
    // Pattern 2: -1756453706003-t0ydrv (13-digit timestamp + random string)
    let cleanName = fileName.replace(/-\d{13}-\d{9}/, ''); // Pattern 1
    cleanName = cleanName.replace(/-\d{13}-[a-zA-Z0-9]+/, ''); // Pattern 2
    
    return cleanName;
  };

  const handleDownloadFile = async (attachment) => {
    try {
      if (!attachment.id) {
        showErrorToast(null, 'File attachment not found');
        return;
      }

      const blob = await materialsService.downloadAttachment(attachment.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = getCleanFileName(attachment.fileName || attachment.name);
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
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
      
      const fileName = attachment.fileName || attachment.name;
      console.log('👁️ Opening file in PostsTab:', fileName);
      
      // Use the authenticated preview for all file types
      const blob = await materialsService.previewAttachment(attachment.id);
      const url = window.URL.createObjectURL(blob);
      
      // Open file in new tab/window
      window.open(url, '_blank');
      
      showSuccessToast('File opened in new tab');
      
      // Clean up the URL after a short delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
      
    } catch (error) {
      console.error('Error opening file:', error);
      showErrorToast(error, 'Failed to open file');
    }
  };

  // Function to get authenticated URL for images and videos
  const getAuthenticatedUrl = async (attachmentId) => {
    try {
      const blob = await materialsService.previewAttachment(attachmentId);
      return window.URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error getting authenticated URL:', error);
      return null;
    }
  };

  // Component for authenticated image display
  const AuthenticatedImage = ({ attachment, fileName }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
      const loadImage = async () => {
        try {
          setLoading(true);
          const url = await getAuthenticatedUrl(attachment.id);
          if (url) {
            setImageUrl(url);
          } else {
            setError(true);
          }
        } catch (err) {
          console.error('Error loading image:', err);
          setError(true);
        } finally {
          setLoading(false);
        }
      };

      loadImage();

      // Cleanup function to revoke object URL
      return () => {
        if (imageUrl) {
          window.URL.revokeObjectURL(imageUrl);
        }
      };
    }, [attachment.id]);

    if (loading) {
      return (
        <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
          <div className="text-gray-500">Loading image...</div>
        </div>
      );
    }

    if (error || !imageUrl) {
      return (
        <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
          <div className="text-gray-500">Failed to load image</div>
        </div>
      );
    }

    return (
      <div className="relative group">
        <div className="relative">
          <img
            src={imageUrl}
            alt={fileName}
            className="max-w-full h-auto max-h-96 rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => handleOpenFile(attachment)}
            title={`Click to open ${fileName}`}
          />
          {/* Download overlay */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownloadFile(attachment);
            }}
            className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all opacity-0 group-hover:opacity-100"
            title={`Download ${fileName}`}
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1 truncate">
          {getCleanFileName(fileName)}
        </p>
      </div>
    );
  };

  // Component for authenticated video display
  const AuthenticatedVideo = ({ attachment, fileName }) => {
    const [videoUrl, setVideoUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
      const loadVideo = async () => {
        try {
          setLoading(true);
          const url = await getAuthenticatedUrl(attachment.id);
          if (url) {
            setVideoUrl(url);
          } else {
            setError(true);
          }
        } catch (err) {
          console.error('Error loading video:', err);
          setError(true);
        } finally {
          setLoading(false);
        }
      };

      loadVideo();

      // Cleanup function to revoke object URL
      return () => {
        if (videoUrl) {
          window.URL.revokeObjectURL(videoUrl);
        }
      };
    }, [attachment.id]);

    if (loading) {
      return (
        <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
          <div className="text-gray-500">Loading video...</div>
        </div>
      );
    }

    if (error || !videoUrl) {
      return (
        <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
          <div className="text-gray-500">Failed to load video</div>
        </div>
      );
    }

    return (
      <div className="relative group">
        <div className="relative">
          <video
            src={videoUrl}
            controls
            className="max-w-full h-auto max-h-96 rounded-lg border border-gray-200"
            title={fileName}
          />
          {/* Download overlay */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownloadFile(attachment);
            }}
            className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all opacity-0 group-hover:opacity-100"
            title={`Download ${fileName}`}
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1 truncate">
          {getCleanFileName(fileName)}
        </p>
      </div>
    );
  };

  return (
    <div className="h-[450px] flex flex-col">
      {/* Fixed height container with scroll */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto space-y-6 pr-2">
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
                      disabled={loadingStates.deletingPost}
                      className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                      title="Delete post"
                    >
                      {loadingStates.deletingPost ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {post.attachments.map((attachment) => {
                        const fileName = attachment.fileName || attachment.name;
                        const isImage = isImageFile(fileName, attachment.mimeType);
                        const isVideo = isVideoFile(fileName, attachment.mimeType);
                        
                        if (isImage) {
                          // Display image inline with authentication
                          return (
                            <AuthenticatedImage 
                              key={attachment.id} 
                              attachment={attachment} 
                              fileName={fileName} 
                            />
                          );
                        } else if (isVideo) {
                          // Display video inline with authentication
                          return (
                            <AuthenticatedVideo 
                              key={attachment.id} 
                              attachment={attachment} 
                              fileName={fileName} 
                            />
                          );
                        } else {
                          // Display other files as before with enhanced icons
                          return (
                        <div
                          key={attachment.id}
                              className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200 min-w-0 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleOpenFile(attachment)}
                              title={`Click to open ${fileName}`}
                        >
                              {getFileIcon(fileName, attachment.mimeType)}
                          <div className="flex-1 min-w-0">
                                <p className="text-start text-xs font-medium text-gray-900 truncate">
                                  {(() => {
                                    const parts = fileName.split('-');
                                    if (parts.length >= 3) {
                                      const originalName = parts.slice(0, -2).join('-');
                                      const randomAndExt = parts[parts.length - 1];
                                      const ext = randomAndExt.split('.')[1] || '';
                                      return `${originalName}${ext ? '.' + ext : ''}`;
                                    }
                                    return fileName;
                                  })()}
                                </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadFile(attachment);
                            }}
                            className="p-1 text-green-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors flex-shrink-0"
                                title={`Download ${fileName}`}
                          >
                            <Download className="h-3 w-3" />
                          </button>
                        </div>
                          );
                        }
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Bottom Post Button - Fixed at bottom */}
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
                  disabled={!postSubject.trim() || !postMessage.trim() || loadingStates.creatingPost}
                  className={`px-6 py-2 border-2 border-${theme.primary}-600 text-${theme.primary}-600 rounded-lg hover:bg-${theme.primaryLight} disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2`}
                >
                  {loadingStates.creatingPost ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      Posting...
                    </>
                  ) : (
                    'Post'
                  )}
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
                  setEditAttachedFiles([]);
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

            {/* Attached Files Display */}
            {editAttachedFiles.length > 0 && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Attached Files:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {editAttachedFiles.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 min-w-0">
                      <div className="flex items-center gap-2 p-1 min-w-0 flex-1">
                        {getFileIcon(attachment.name, attachment.type)}
                        <div className="min-w-0 flex-1">
                          <p className="text-start text-sm font-medium text-gray-900 truncate">
                            {getCleanFileName(attachment.name)}
                          </p>
                          <p className="text-start text-xs text-gray-500 truncate">{attachment.type.toUpperCase()} • {attachment.size}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveEditAttachment(attachment.id)}
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
                    onChange={handleEditFileAttachment}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.zip,.rar"
                  />
                </label>
              </div>

              <button
                onClick={handleUpdatePost}
                disabled={!editPostMessage.trim() || loadingStates.updatingPost}
                className="px-6 py-2 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loadingStates.updatingPost ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    Updating...
                  </>
                ) : (
                  'Update Post'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostsTab;
