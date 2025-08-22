import { useState } from 'react';
import { Folder, Plus, Upload, ArrowLeft, Edit, Trash2, Download, FileText } from 'lucide-react';

const FilesTab = ({ currentUser, theme }) => {
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

  return (
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
