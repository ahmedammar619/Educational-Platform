import { useState, useEffect } from 'react';
import { Folder, Plus, Upload, ArrowLeft, Edit, Trash2, Download, FileText, FileImage, FileVideo, FileAudio, File, FileSpreadsheet, FileCode, FileArchive } from 'lucide-react';
import { materialsService } from '../../../services';
import { showErrorToast, showSuccessToast } from '../../../utils/errorHandler';

const FilesTab = ({ currentUser, theme, courseId }) => {
  const [folders, setFolders] = useState([]);
  const [rootFiles, setRootFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileInputRef, setFileInputRef] = useState(null);
  const [showEditFolderModal, setShowEditFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [selectedFolderForView, setSelectedFolderForView] = useState(null);
  const [folderBreadcrumb, setFolderBreadcrumb] = useState([]);
  
  // Loading states for preventing double clicks
  const [loadingStates, updateLoadingStateStates] = useState({
    creatingFolder: false,
    uploadingFile: false,
    deletingFile: false,
    deletingFolder: false,
    editingFolder: false,
    downloadingFile: false,
    openingFile: false
  });


  // Load files when component mounts or courseId changes
  useEffect(() => {
    if (courseId) {
      // Reset navigation state when course changes
      setSelectedFolderForView(null);
      setFolderBreadcrumb([]);
      loadFiles();
    }
  }, [courseId]);

  // Removed excessive logging for performance

  // Cleanup file input when component unmounts
  useEffect(() => {
    return () => {
      if (fileInputRef) {
        document.body.removeChild(fileInputRef);
      }
    };
  }, [fileInputRef]);

  const loadFiles = async (folderId = null) => {
    try {
      setLoading(true);
      const response = await materialsService.getCourseFiles(courseId, folderId);
      console.log('🔍 FilesTab - Raw API response:', response);
      
      // Handle different response formats
      let filesData = [];
      
      // Check if response contains rate limiting information
      if (response && response._rateLimitInfo) {
        console.warn('Rate limiting detected:', response._rateLimitInfo);
        showErrorToast(null, 'Request rate limited. Please wait a moment and try again.');
        filesData = [];
      } else if (Array.isArray(response)) {
        filesData = response;
        console.log('📁 Files data from array:', filesData);
      } else if (response && Array.isArray(response.data)) {
        filesData = response.data;
        console.log('📁 Files data from response.data:', filesData);
      } else if (response && response.files && Array.isArray(response.files)) {
        filesData = response.files;
        console.log('📁 Files data from response.files:', filesData);
      } else if (response && response.message && response.message.includes('rate limit')) {
        console.warn('Rate limiting detected in message:', response.message);
        showErrorToast(null, 'Request rate limited. Please wait a moment and try again.');
        filesData = [];
      } else {
        console.log('Unexpected response format:', response);
        // Don't show error for unexpected format, just use empty array
        filesData = [];
      }
      
      // Removed excessive logging for performance
      
      // Separate folders and files
      const foldersData = filesData.filter(item => item.type === 'folder' || item.isFolder);
      const filesDataOnly = filesData.filter(item => item.type !== 'folder' && !item.isFolder);
      
      // The backend now returns files directly based on folderId
      // filesDataOnly contains the files for the current folder
      let currentFolderFiles = [];
      
      if (folderId) {
        // We're viewing a specific folder - filesDataOnly already contains files for this folder
        currentFolderFiles = filesDataOnly.map(file => ({
          ...file,
          type: 'file',
          isFolder: false
        }));
      } else {
        // We're at root - filesDataOnly already contains root-level files
        currentFolderFiles = filesDataOnly.map(file => ({
          ...file,
          type: 'file',
          isFolder: false
        }));
      }
      
      console.log('🔍 FilesTab - Processed data:', {
        foldersDataCount: foldersData.length,
        currentFolderFilesCount: currentFolderFiles.length,
        foldersData: foldersData,
        currentFolderFiles: currentFolderFiles
      });
      
      setFolders(foldersData);
      setRootFiles(currentFolderFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      
      // Check if error is related to rate limiting
      if (error.message && error.message.toLowerCase().includes('rate limit')) {
        showErrorToast(null, 'Request rate limited. Please wait a moment and try again.');
      } else {
        showErrorToast(error, 'Failed to load files. Please try again.');
      }
      
      setFolders([]);
      setRootFiles([]);
    } finally {
      setLoading(false);
    }
  };

  // Role-based access control functions
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

  // Helper function to update loading states
  const updateLoadingState = (key, value) => {
    updateLoadingStateStates(prev => ({ ...prev, [key]: value }));
  };

  const handleCreateFolder = async () => {
    if (newFolderName.trim() && courseId && !loadingStates.creatingFolder) {
      updateLoadingState('creatingFolder', true);
      try {
        const folderData = {
          name: newFolderName.trim(),
          parentFolderId: selectedFolderForView?.id || null
        };

        console.log('🔍 Creating folder with data:', {
          folderName: newFolderName.trim(),
          parentFolderId: selectedFolderForView?.id,
          parentFolderName: selectedFolderForView?.name,
          courseId: courseId
        });

        await materialsService.createFolder(courseId, folderData);
        
        // Add a small delay before reloading to avoid rate limiting
        setTimeout(async () => {
          try {
            // Reload the current folder contents (or root if not in a folder)
            await loadFiles(selectedFolderForView?.id || null);
          } catch (reloadError) {
            console.warn('Error reloading files after folder creation:', reloadError);
            // Don't show error to user, just log it
          }
        }, 500);
        
                setNewFolderName('');
        setShowNewFolderModal(false);
        showSuccessToast('Folder created successfully!');
      } catch (error) {
        console.error('Error creating folder:', error);
        
        // Check if error is related to rate limiting
        if (error.message && error.message.toLowerCase().includes('rate limit')) {
          showErrorToast(null, 'Request rate limited. Please wait a moment and try again.');
        } else {
        showErrorToast(error, 'Failed to create folder. Please try again.');
        }
      } finally {
        updateLoadingState('creatingFolder', false);
      }
    }
  };

  const handleFileUpload = async () => {
    if (uploadedFile && courseId && !loadingStates.uploadingFile) {
      updateLoadingState('uploadingFile', true);
      try {
        console.log('📤 Frontend - Starting file upload (modal):', {
          fileName: uploadedFile.name,
          fileSize: uploadedFile.size,
          courseId: courseId,
          folderId: selectedFolderForView?.id,
          folderName: selectedFolderForView?.name,
          isInSubfolder: !!selectedFolderForView
        });

        // Use selectedFolderForView if available, otherwise use the last folder in breadcrumb
        const currentFolderId = selectedFolderForView?.id || (folderBreadcrumb.length > 0 ? folderBreadcrumb[folderBreadcrumb.length - 1]?.id : null);
        
        console.log('📁 Frontend - Uploading to folder (modal):', {
          selectedFolderForViewId: selectedFolderForView?.id,
          breadcrumbLastFolderId: folderBreadcrumb.length > 0 ? folderBreadcrumb[folderBreadcrumb.length - 1]?.id : null,
          finalFolderId: currentFolderId
        });

        await materialsService.uploadFile(courseId, uploadedFile, currentFolderId);
        
        console.log('✅ Frontend - File upload successful (modal)');
        showSuccessToast('File uploaded successfully!');
        
        // Add a small delay before reloading to avoid rate limiting
        setTimeout(async () => {
          try {
            // Reload the current folder contents (or root if not in a folder)
            console.log('🔄 Frontend - Reloading files for folder (modal):', currentFolderId || 'root');
            await loadFiles(currentFolderId);
          } catch (reloadError) {
            console.warn('Error reloading files after file upload:', reloadError);
            // Don't show error to user, just log it
          }
        }, 500);
        
        setUploadedFile(null);
        setShowUploadModal(false);
      } catch (error) {
        console.error('❌ Frontend - File upload error (modal):', error);
        
        // Check if error is related to rate limiting
        if (error.message && error.message.toLowerCase().includes('rate limit')) {
          showErrorToast(null, 'Request rate limited. Please wait a moment and try again.');
        } else {
          showErrorToast(error, 'Failed to upload file. Please try again.');
        }
      } finally {
        updateLoadingState('uploadingFile', false);
      }
    }
  };

  const handleDirectFileUpload = () => {
    // Capture the current folder ID at the time of upload trigger
    const currentFolderId = selectedFolderForView?.id || (folderBreadcrumb.length > 0 ? folderBreadcrumb[folderBreadcrumb.length - 1]?.id : null);
    
    console.log('📁 Frontend - Direct file upload triggered:', {
      selectedFolderForView: selectedFolderForView,
      folderId: selectedFolderForView?.id,
      folderName: selectedFolderForView?.name,
      breadcrumbLength: folderBreadcrumb.length,
      capturedFolderId: currentFolderId
    });

    // Create a hidden file input if it doesn't exist
    let input = fileInputRef;
    if (!input) {
      input = document.createElement('input');
      input.type = 'file';
      input.style.display = 'none';
      // Pass the captured folder ID to the file select handler
      input.onchange = (event) => handleFileSelect(event, currentFolderId);
      document.body.appendChild(input);
      setFileInputRef(input);
    } else {
      // Update the existing input's onchange handler with current folder ID
      input.onchange = (event) => handleFileSelect(event, currentFolderId);
    }
    
    // Trigger the file picker
    input.click();
  };

  const handleFileSelect = async (event, capturedFolderId = null) => {
    const file = event.target.files[0];
    if (file && courseId && !loadingStates.uploadingFile) {
      updateLoadingState('uploadingFile', true);
      try {
        // Use the captured folder ID if provided, otherwise fall back to state
        const currentFolderId = capturedFolderId || selectedFolderForView?.id || (folderBreadcrumb.length > 0 ? folderBreadcrumb[folderBreadcrumb.length - 1]?.id : null);
        
        console.log('📤 Frontend - Starting file upload:', {
          fileName: file.name,
          fileSize: file.size,
          courseId: courseId,
          capturedFolderId: capturedFolderId,
          selectedFolderForViewId: selectedFolderForView?.id,
          breadcrumbLastFolderId: folderBreadcrumb.length > 0 ? folderBreadcrumb[folderBreadcrumb.length - 1]?.id : null,
          finalFolderId: currentFolderId,
          isInSubfolder: !!currentFolderId
        });

        await materialsService.uploadFile(courseId, file, currentFolderId);
        
        console.log('✅ Frontend - File upload successful');
        showSuccessToast('File uploaded successfully!');
        
        // Add a small delay before reloading to avoid rate limiting
        setTimeout(async () => {
          try {
            // Reload the current folder contents (or root if not in a folder)
            console.log('🔄 Frontend - Reloading files for folder:', currentFolderId || 'root');
            await loadFiles(currentFolderId);
          } catch (reloadError) {
            console.warn('Error reloading files after file upload:', reloadError);
            // Don't show error to user, just log it
          }
        }, 500);
      } catch (error) {
        console.error('❌ Frontend - File upload error:', error);
        showErrorToast(error, 'Failed to upload file. Please try again.');
        
                // Check if error is related to rate limiting
        if (error.message && error.message.toLowerCase().includes('rate limit')) {
          showErrorToast(null, 'Request rate limited. Please wait a moment and try again.');
        } else {
        showErrorToast(error, 'Failed to upload file. Please try again.');
      }
      } finally {
        updateLoadingState('uploadingFile', false);
      }
    }
    
    // Clean up the input
    if (fileInputRef) {
      fileInputRef.value = '';
    }
  };

  const handleEditFolder = (folder) => {
    setEditingFolder(folder);
    setEditFolderName(folder.name);
    setShowEditFolderModal(true);
  };

  const handleUpdateFolder = async () => {
    if (editFolderName.trim() && editingFolder && !loadingStates.editingFolder) {
      updateLoadingState('editingFolder', true);
      try {
        await materialsService.updateFolder(editingFolder.id, { name: editFolderName.trim() });
        
        // Update local state
        setFolders(folders.map(f =>
          f.id === editingFolder.id
            ? { ...f, name: editFolderName.trim() }
            : f
        ));
        
        setEditFolderName('');
        setEditingFolder(null);
        setShowEditFolderModal(false);
        
        showSuccessToast('Folder updated successfully!');
      } catch (error) {
        console.error('Error updating folder:', error);
        showErrorToast(error, 'Failed to update folder. Please try again.');
      } finally {
        updateLoadingState('editingFolder', false);
      }
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (window.confirm('Are you sure you want to delete this folder? This action cannot be undone.') && !loadingStates.deletingFolder) {
      updateLoadingState('deletingFolder', true);
      try {
        await materialsService.deleteFolder(folderId);
        
        // Add a small delay before reloading to avoid rate limiting
        setTimeout(async () => {
          try {
            // Reload the current folder contents (or root if not in a folder)
            await loadFiles(selectedFolderForView?.id || null);
          } catch (reloadError) {
            console.warn('Error reloading files after folder deletion:', reloadError);
            // Don't show error to user, just log it
          }
        }, 500);
        
        showSuccessToast('Folder deleted successfully!');
      } catch (error) {
        console.error('Error deleting folder:', error);
        
        // Check if error is related to rate limiting
        if (error.message && error.message.toLowerCase().includes('rate limit')) {
          showErrorToast(null, 'Request rate limited. Please wait a moment and try again.');
        } else {
          showErrorToast(error, 'Failed to delete folder. Please try again.');
        }
      } finally {
        updateLoadingState('deletingFolder', false);
      }
    }
  };

  const handleOpenFolder = async (folder) => {
    console.log('🔍 Opening folder:', {
      folderId: folder.id,
      folderName: folder.name,
      parentFolderId: folder.parentFolderId,
      courseId: folder.courseId
    });
    
    // Add current folder to breadcrumb
    setFolderBreadcrumb(prev => [...prev, folder]);
    setSelectedFolderForView(folder);
    
    console.log('🔍 State after opening folder:', {
      selectedFolderForView: folder,
      breadcrumbLength: folderBreadcrumb.length + 1
    });
    
    // Load the contents of this specific folder
    await loadFiles(folder.id);
  };

  const handleBackToFolders = async () => {
    console.log('🔍 Going back from folder:', {
      currentFolder: selectedFolderForView?.name,
      breadcrumbLength: folderBreadcrumb.length
    });

    if (folderBreadcrumb.length > 0) {
      // Remove the last folder from breadcrumb
      const newBreadcrumb = [...folderBreadcrumb];
      newBreadcrumb.pop();
      setFolderBreadcrumb(newBreadcrumb);

      if (newBreadcrumb.length > 0) {
        // Go back to the previous folder in breadcrumb
        const parentFolder = newBreadcrumb[newBreadcrumb.length - 1];
        setSelectedFolderForView(parentFolder);
        await loadFiles(parentFolder.id);
      } else {
        // Go back to root level
        setSelectedFolderForView(null);
        await loadFiles();
      }
    } else {
      // Fallback: go to root level
      setSelectedFolderForView(null);
      await loadFiles();
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (window.confirm('Are you sure you want to delete this file? This action cannot be undone.') && !loadingStates.deletingFile) {
      updateLoadingState('deletingFile', true);
      try {
        await materialsService.deleteFile(fileId);
        
        // Add a small delay before reloading to avoid rate limiting
        setTimeout(async () => {
          try {
            // Reload the current folder contents (or root if not in a folder)
            await loadFiles(selectedFolderForView?.id || null);
          } catch (reloadError) {
            console.warn('Error reloading files after file deletion:', reloadError);
            // Don't show error to user, just log it
          }
        }, 500);
        
        showSuccessToast('File deleted successfully!');
      } catch (error) {
        console.error('Error deleting file:', error);
        
        // Check if error is related to rate limiting
        if (error.message && error.message.toLowerCase().includes('rate limit')) {
          showErrorToast(null, 'Request rate limited. Please wait a moment and try again.');
        } else {
          showErrorToast(error, 'Failed to delete file. Please try again.');
        }
      } finally {
        updateLoadingState('deletingFile', false);
      }
    }
  };

  const handleDownloadFile = async (file) => {
    if (loadingStates.downloadingFile) return;
    updateLoadingState('downloadFile', true);
    try {
      console.log('📥 Downloading file:', file.fileName);
      
      // Use the authenticated download method
      const blob = await materialsService.downloadFile(file.id);
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = getCleanFileName(file.fileName || file.name);
      link.style.display = 'none';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);
      
      showSuccessToast('File download started');
    } catch (error) {
      console.error('Error downloading file:', error);
      showErrorToast(error, 'Failed to download file');
    } finally {
      updateLoadingState('downloadFile', false);
    }
  };

  const handleOpenFile = async (file) => {
    if (loadingStates.openingFile) return;
    updateLoadingState('openingFile', true);
    try {
      console.log('👁️ Opening file in FilesTab:', file.fileName);
      
      // Use the authenticated preview method
      const blob = await materialsService.previewFile(file.id);
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
    } finally {
      updateLoadingState('openingFile', false);
    }
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

  // Function to get appropriate icon based on file type
  const getFileIcon = (file) => {
    const fileName = file.fileName || file.name || '';
    const mimeType = file.mimeType || '';
    const extension = fileName.split('.').pop()?.toLowerCase() || '';

    // Image files
    if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico', 'tiff'].includes(extension)) {
      return <FileImage className="h-6 w-6 text-blue-500" />;
    }
    
    // Video files
    if (mimeType.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'].includes(extension)) {
      return <FileVideo className="h-6 w-6 text-purple-500" />;
    }
    
    // Audio files
    if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a'].includes(extension)) {
      return <FileAudio className="h-6 w-6 text-green-500" />;
    }
    
    // PDF files
    if (mimeType === 'application/pdf' || extension === 'pdf') {
      return <FileText className="h-6 w-6 text-red-500" />;
    }
    
    // Spreadsheet files
    if (mimeType.includes('spreadsheet') || ['xlsx', 'xls', 'csv', 'ods'].includes(extension)) {
      return <FileSpreadsheet className="h-6 w-6 text-green-600" />;
    }
    
    // Code files
    if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'scss', 'sass', 'php', 'py', 'java', 'cpp', 'c', 'cs', 'rb', 'go', 'rs', 'swift', 'kt'].includes(extension)) {
      return <FileCode className="h-6 w-6 text-yellow-500" />;
    }
    
    // Archive files
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z') || ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension)) {
      return <FileArchive className="h-6 w-6 text-orange-500" />;
    }
    
    // Word documents
    if (mimeType.includes('document') || ['doc', 'docx', 'odt', 'rtf'].includes(extension)) {
      return <FileText className="h-6 w-6 text-blue-600" />;
    }
    
    // PowerPoint presentations
    if (mimeType.includes('presentation') || ['ppt', 'pptx', 'odp'].includes(extension)) {
      return <FileText className="h-6 w-6 text-orange-600" />;
    }
    
    // Default file icon
    return <File className="h-6 w-6 text-gray-400" />;
  };



  return (
    <div className="h-[450px] flex flex-col">
      {/* Fixed height container with scroll */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
      {loading ? (
        <div className="text-center py-12">
          <div className="mb-6">
            <div className="relative w-32 h-32 mx-auto">
              {currentUser?.role === 'admin' && (
                <>
                  <div className="absolute top-0 left-0 w-16 h-16 bg-green-500 rounded-full opacity-80 animate-pulse"></div>
                  <div className="absolute top-4 right-0 w-16 h-16 bg-green-400 rounded-full opacity-80 animate-pulse"></div>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-green-300 rounded-full opacity-80 animate-pulse"></div>
                </>
              )}
              {currentUser?.role === 'teacher' && (
                <>
                  <div className="absolute top-0 left-0 w-16 h-16 bg-blue-500 rounded-full opacity-80 animate-pulse"></div>
                  <div className="absolute top-4 right-0 w-16 h-16 bg-blue-400 rounded-full opacity-80 animate-pulse"></div>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-blue-300 rounded-full opacity-80 animate-pulse"></div>
                </>
              )}
              {currentUser?.role === 'student' && (
                <>
                  <div className="absolute top-0 left-0 w-16 h-16 bg-red-500 rounded-full opacity-80 animate-pulse"></div>
                  <div className="absolute top-4 right-0 w-16 h-16 bg-red-400 rounded-full opacity-80 animate-pulse"></div>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-red-300 rounded-full opacity-80 animate-pulse"></div>
                </>
              )}
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Loading files...</h3>
          <p className="text-gray-600">Please wait while we fetch the files and folders.</p>
        </div>
      ) : !selectedFolderForView ? (
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
                        disabled={loadingStates.deletingFolder}
                        className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="Delete folder"
                      >
                        {loadingStates.deletingFolder ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
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
                    {getFileIcon(file)}
                    <div className="flex-1">
                      <h3 className="text-start text-gray-900 font-medium">{getCleanFileName(file.fileName || file.name)}</h3>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDownloadFile(file)}
                        disabled={loadingStates.downloadingFile}
                        className="p-1 text-green-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                        title="Download file"
                      >
                        {loadingStates.downloadingFile ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </button>
                      {canDeleteFiles() && (
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          disabled={loadingStates.deletingFile}
                          className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title="Delete file"
                        >
                          {loadingStates.deletingFile ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State - Show when no folders and no files */}
          {folders.length === 0 && rootFiles.length === 0 && (
            <div className="text-center py-12">
              <div className="mb-6">
                                <div className="relative w-32 h-32 mx-auto">
                {currentUser?.role === 'admin' && (
                  <>
                    <div className="absolute top-0 left-0 w-16 h-16 bg-green-500 rounded-full opacity-80"></div>
                    <div className="absolute top-4 right-0 w-16 h-16 bg-green-400 rounded-full opacity-80"></div>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-green-300 rounded-full opacity-80"></div>
                  </>
                )}
                {currentUser?.role === 'teacher' && (
                  <>
                    <div className="absolute top-0 left-0 w-16 h-16 bg-blue-500 rounded-full opacity-80"></div>
                    <div className="absolute top-4 right-0 w-16 h-16 bg-blue-400 rounded-full opacity-80"></div>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-blue-300 rounded-full opacity-80"></div>
                  </>
                )}
                {currentUser?.role === 'student' && (
                  <>
                    <div className="absolute top-0 left-0 w-16 h-16 bg-red-500 rounded-full opacity-80"></div>
                    <div className="absolute top-4 right-0 w-16 h-16 bg-red-400 rounded-full opacity-80"></div>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-red-300 rounded-full opacity-80"></div>
                  </>
                )}
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No files yet</h3>
              <p className="text-gray-600">Files and folders will appear here when they are uploaded.</p>
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
                    onClick={handleDirectFileUpload}
                    disabled={loadingStates.uploadingFile}
                    className={`px-3 py-2 border-2 border-${theme.primary}-600 text-${theme.primary}-600 rounded-lg hover:bg-${theme.primaryLight} transition-colors flex items-center gap-2 disabled:opacity-50`}
                  >
                    {loadingStates.uploadingFile ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5" />
                        Upload File
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Folder Header with Breadcrumb */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={handleBackToFolders}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Folder className={`h-6 w-6 text-${theme.primary}-500`} />
              <div className="flex items-center gap-1 text-sm">
                {/* Breadcrumb Navigation */}
                <button
                  onClick={() => {
                    setFolderBreadcrumb([]);
                    setSelectedFolderForView(null);
                    loadFiles();
                  }}
                  className="text-gray-600 hover:text-gray-800 hover:underline"
                >
                  Root
                </button>
                {folderBreadcrumb.map((folder, index) => (
                  <div key={folder.id} className="flex items-center gap-1">
                    <span className="text-gray-400">/</span>
                    <button
                      onClick={() => {
                        // Navigate to this folder in breadcrumb
                        const newBreadcrumb = folderBreadcrumb.slice(0, index + 1);
                        setFolderBreadcrumb(newBreadcrumb);
                        setSelectedFolderForView(folder);
                        
                        console.log('🔍 Breadcrumb navigation:', {
                          clickedFolder: folder,
                          newBreadcrumbLength: newBreadcrumb.length,
                          selectedFolderForView: folder
                        });
                        
                        loadFiles(folder.id);
                      }}
                      className="text-gray-600 hover:text-gray-800 hover:underline"
                    >
                      {folder.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Folder Content */}
          <div className="space-y-3">
            {/* Subfolders */}
            {folders.length > 0 && (
              <div className="space-y-2">
                {folders.map((subfolder) => (
                  <div 
                    key={subfolder.id} 
                    className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-sm transition-shadow cursor-pointer"
                    onClick={() => handleOpenFolder(subfolder)}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className={`h-6 w-6 text-${theme.primary}-500`} />
                      <div className="flex-1">
                        <h5 className="text-start text-gray-900 font-medium">{subfolder.name}</h5>
                      </div>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {canEditFolder() && (
                          <button
                            onClick={() => handleEditFolder(subfolder)}
                            className="p-1 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit folder"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {canDeleteFolder() && (
                          <button
                            onClick={() => handleDeleteFolder(subfolder.id)}
                            disabled={loadingStates.deletingFolder}
                            className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                            title="Delete folder"
                          >
                            {loadingStates.deletingFolder ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Files */}
            {rootFiles.length === 0 && folders.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-3">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500">No files in this folder yet</p>
              </div>
            ) : rootFiles.length > 0 ? (
              rootFiles.map((file) => (
                <div
                  key={file.id}
                  className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => handleOpenFile(file)}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getFileIcon(file)}</div>
                    <div className="flex-1">
                      <h4 className="text-start text-gray-900 font-medium">{getCleanFileName(file.fileName || file.name)}</h4>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDownloadFile(file)}
                        disabled={loadingStates.downloadingFile}
                        className="p-1 text-green-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                        title="Download file"
                      >
                        {loadingStates.downloadingFile ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </button>
                      {canDeleteFiles() && (
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          disabled={loadingStates.deletingFile}
                          className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title="Delete file"
                        >
                          {loadingStates.deletingFile ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : null}
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
                    onClick={handleDirectFileUpload}
                    disabled={loadingStates.uploadingFile}
                    className={`px-3 py-2 border-2 border-${theme.primary}-600 text-${theme.primary}-600 rounded-lg hover:bg-${theme.primaryLight} transition-colors flex items-center gap-2 disabled:opacity-50`}
                  >
                    {loadingStates.uploadingFile ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5" />
                        Upload File
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ margin: '0px' }}>
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
                disabled={!newFolderName.trim() || loadingStates.creatingFolder}
                className={`flex-1 px-4 py-2 border-2 border-${theme.primary}-600 text-${theme.primary}-600 rounded-lg hover:bg-${theme.primaryLight} disabled:opacity-50 transition-colors flex items-center justify-center gap-2`}
              >
                {loadingStates.creatingFolder ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  'Create'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload File Modal - Commented out since we now use direct file upload */}
      {/* {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {selectedFolderForView ? `Upload File to ${selectedFolderForView.name}` : 'Upload File'}
            </h3>
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
      )} */}

      {/* Edit Folder Modal */}
      {showEditFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ margin: '0px' }}>
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
                disabled={!editFolderName.trim() || loadingStates.editingFolder}
                className="flex-1 px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loadingStates.editingFolder ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    Updating...
                  </>
                ) : (
                  'Update'
                )}
              </button>
            </div>
          </div>
        </div>
      )}


      </div>
    </div>
  );
};

export default FilesTab;
