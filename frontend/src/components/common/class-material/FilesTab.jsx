import { useState, useEffect } from 'react';
import { Folder, Plus, Upload, ArrowLeft, Edit, Trash2, Download, FileText } from 'lucide-react';
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
  const [showEditFolderModal, setShowEditFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [selectedFolderForView, setSelectedFolderForView] = useState(null);
  const [showEditFileModal, setShowEditFileModal] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  const [editFileName, setEditFileName] = useState('');

  // Load files when component mounts or courseId changes
  useEffect(() => {
    if (courseId) {
      loadFiles();
    }
  }, [courseId]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await materialsService.getCourseFiles(courseId);
      
      // Handle different response formats
      let filesData = [];
      if (Array.isArray(response)) {
        filesData = response;
      } else if (response && Array.isArray(response.data)) {
        filesData = response.data;
      } else if (response && response.files && Array.isArray(response.files)) {
        filesData = response.files;
      } else {
        console.log('Unexpected response format:', response);
        filesData = [];
      }
      
      // Separate folders and root files
      const foldersData = filesData.filter(item => item.type === 'folder' || item.isFolder);
      const filesDataOnly = filesData.filter(item => item.type !== 'folder' && !item.isFolder);
      setFolders(foldersData);
      setRootFiles(filesDataOnly);
    } catch (error) {
      console.error('Error loading files:', error);
      showErrorToast(error, 'Failed to load files. Please try again.');
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

  const handleCreateFolder = async () => {
    if (newFolderName.trim() && courseId) {
      try {
        const folderData = {
          name: newFolderName.trim(),
          parentFolderId: selectedFolderForView?.id || null
        };

        await materialsService.createFolder(courseId, folderData);
        
        // Reload files to get the updated list
        await loadFiles();
        
        setNewFolderName('');
        setShowNewFolderModal(false);
        showSuccessToast('Folder created successfully!');
      } catch (error) {
        console.error('Error creating folder:', error);
        showErrorToast(error, 'Failed to create folder. Please try again.');
      }
    }
  };

  const handleFileUpload = async () => {
    if (uploadedFile && courseId) {
      try {
        await materialsService.uploadFile(courseId, uploadedFile, selectedFolderForView?.id);
        
        // Reload files to get the updated list
        await loadFiles();
        
        setUploadedFile(null);
        setShowUploadModal(false);
        showSuccessToast('File uploaded successfully!');
      } catch (error) {
        console.error('Error uploading file:', error);
        showErrorToast(error, 'Failed to upload file. Please try again.');
      }
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

  const handleDeleteFolder = async (folderId) => {
    if (window.confirm('Are you sure you want to delete this folder? This action cannot be undone.')) {
      try {
        await materialsService.deleteFolder(folderId);
        
        // Reload files to get the updated list
        await loadFiles();
        
        showSuccessToast('Folder deleted successfully!');
      } catch (error) {
        console.error('Error deleting folder:', error);
        showErrorToast(error, 'Failed to delete folder. Please try again.');
      }
    }
  };

  const handleOpenFolder = (folder) => {
    setSelectedFolderForView(folder);
  };

  const handleBackToFolders = () => {
    setSelectedFolderForView(null);
  };

  const handleDeleteFile = async (fileId) => {
    if (window.confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      try {
        await materialsService.deleteFile(fileId);
        
        // Reload files to get the updated list
        await loadFiles();
        
        showSuccessToast('File deleted successfully!');
      } catch (error) {
        console.error('Error deleting file:', error);
        showErrorToast(error, 'Failed to delete file. Please try again.');
      }
    }
  };

  const handleDownloadFile = async (file) => {
    try {
      // In a real implementation, this would download the actual file from the backend
      // For now, we'll show a message that this feature needs backend implementation
      showErrorToast(null, 'File download feature needs backend implementation');
    } catch (error) {
      console.error('Error downloading file:', error);
      showErrorToast(error, 'Failed to download file');
    }
  };

  const handleOpenFile = async (file) => {
    try {
      // In a real implementation, this would open the actual file from the backend
      // For now, we'll show a message that this feature needs backend implementation
      showErrorToast(null, 'File preview feature needs backend implementation');
    } catch (error) {
      console.error('Error opening file:', error);
      showErrorToast(error, 'Failed to open file');
    }
  };

  const handleEditFile = (file) => {
    setEditingFile(file);
    setEditFileName(file.name);
    setShowEditFileModal(true);
  };

  const handleUpdateFile = async () => {
    if (editFileName.trim() && editingFile) {
      try {
        // Note: The backend doesn't have a file rename endpoint yet
        // This would need to be implemented in the backend
        showErrorToast(null, 'File rename feature needs backend implementation');
        
        setEditFileName('');
        setEditingFile(null);
        setShowEditFileModal(false);
      } catch (error) {
        console.error('Error updating file:', error);
        showErrorToast(error, 'Failed to update file. Please try again.');
      }
    }
  };

  return (
    <div className="space-y-3">
      {loading ? (
        <div className="text-center py-12">
          <div className="mb-6">
            <div className="relative w-32 h-32 mx-auto">
              <div className="absolute top-0 left-0 w-16 h-16 bg-blue-500 rounded-full opacity-80 animate-pulse"></div>
              <div className="absolute top-4 right-0 w-16 h-16 bg-blue-400 rounded-full opacity-80 animate-pulse"></div>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-blue-300 rounded-full opacity-80 animate-pulse"></div>
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
                          onClick={() => handleDeleteFile(file.id)}
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
                          onClick={() => handleDeleteFile(file.id)}
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

export default FilesTab;
