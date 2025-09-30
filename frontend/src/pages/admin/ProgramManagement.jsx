import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, DollarSign, Search, Filter, X, ChevronDown, ChevronRight, UserPlus, UserX, BookOpen, ArrowRight } from 'lucide-react';
import { programsService, classesService, studentsService } from '../../services';
import { showErrorToast, showSuccessToast, getErrorMessage } from '../../utils/errorHandler';
import { showWarningToast } from '../../utils/toast.js';
import { ConfirmationDialog, AlertDialog } from '../../components/ui';
import useConfirmation from '../../hooks/useConfirmation';
import useAlert from '../../hooks/useAlert';
import ClassManagement from './ClassManagement';

const ProgramManagement = ({ user }) => {
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();
  const { alertState, showAlert, hideAlert } = useAlert();
  const [programs, setPrograms] = useState([]);
  const [filteredPrograms, setFilteredPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPrograms, setExpandedPrograms] = useState(new Set());
  const [filters, setFilters] = useState({
    search: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [showCreateProgramModal, setShowCreateProgramModal] = useState(false);
  const [showEditProgramModal, setShowEditProgramModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showViewStudentsModal, setShowViewStudentsModal] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [enrollingStudents, setEnrollingStudents] = useState(new Set());
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showClassManagement, setShowClassManagement] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    classIds: [],
    studentIds: []
  });

  useEffect(() => {
    loadPrograms();
    loadAllStudents();
    loadAllClasses();
  }, []);

  useEffect(() => {
    filterPrograms();
  }, [filters, programs]);

  const loadAllStudents = async () => {
    try {
      const studentsData = await studentsService.getAllStudents();
      setAllStudents(studentsData.students || []);
    } catch (error) {
      console.error('Error loading students:', error);
      showErrorToast('Failed to load students');
    }
  };

  const loadAllClasses = async () => {
    try {
      const classesData = await classesService.getAllClasses();
      let classesArray = [];
      if (Array.isArray(classesData)) {
        classesArray = classesData;
      } else if (classesData && typeof classesData === 'object') {
        classesArray = Object.values(classesData).filter(item => 
          item && typeof item === 'object' && item.id && !item._rateLimitInfo
        );
      }
      setAllClasses(classesArray);
    } catch (error) {
      console.error('Error loading classes:', error);
      showErrorToast('Failed to load classes');
    }
  };

  const loadPrograms = async () => {
    try {
      setLoading(true);
      const programsData = await programsService.getAllPrograms();
      
      let programsArray = [];
      if (Array.isArray(programsData)) {
        programsArray = programsData;
      } else if (programsData && typeof programsData === 'object') {
        programsArray = Object.values(programsData).filter(item => 
          item && typeof item === 'object' && item.id && !item._rateLimitInfo
        );
      }
      
      setPrograms(programsArray);
    } catch (error) {
      console.error('Error loading programs:', error);
      showErrorToast('Failed to load programs');
    } finally {
      setLoading(false);
    }
  };

  const filterPrograms = () => {
    let filtered = [...programs];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(program =>
        program.name.toLowerCase().includes(searchLower)
      );
    }

    setFilteredPrograms(filtered);
  };

  const handleCreateProgram = async () => {
    try {
      const newProgram = await programsService.createProgram(formData);
      setPrograms(prev => [...prev, newProgram]);
      setShowCreateProgramModal(false);
      resetForm();
      showSuccessToast('Program created successfully');
    } catch (error) {
      console.error('Error creating program:', error);
      showErrorToast(getErrorMessage(error) || 'Failed to create program');
    }
  };

  const handleUpdateProgram = async () => {
    try {
      const updatedProgram = await programsService.updateProgram(selectedProgram.id, formData);
      setPrograms(prev => prev.map(p => p.id === selectedProgram.id ? updatedProgram : p));
      setShowEditProgramModal(false);
      setSelectedProgram(null);
      resetForm();
      showSuccessToast('Program updated successfully');
    } catch (error) {
      console.error('Error updating program:', error);
      showErrorToast(getErrorMessage(error) || 'Failed to update program');
    }
  };

  const handleDeleteProgram = async (program) => {
    try {
      await programsService.deleteProgram(program.id);
      setPrograms(prev => prev.filter(p => p.id !== program.id));
      showSuccessToast('Program deleted successfully');
    } catch (error) {
      console.error('Error deleting program:', error);
      showErrorToast(getErrorMessage(error) || 'Failed to delete program');
    }
  };

  const handleEnrollStudents = async () => {
    try {
      const studentIds = Array.from(enrollingStudents);
      await programsService.enrollStudents(selectedProgram.id, { studentIds });
      
      // Update the program in the list
      setPrograms(prev => prev.map(p => 
        p.id === selectedProgram.id 
          ? { ...p, studentIds: [...p.studentIds, ...studentIds] }
          : p
      ));
      
      setShowEnrollModal(false);
      setEnrollingStudents(new Set());
      setSelectedProgram(null);
      showSuccessToast('Students enrolled successfully');
    } catch (error) {
      console.error('Error enrolling students:', error);
      showErrorToast(getErrorMessage(error) || 'Failed to enroll students');
    }
  };

  const handleRemoveStudent = async (program, studentId) => {
    try {
      await programsService.removeStudent(program.id, studentId);
      
      // Update the program in the list
      setPrograms(prev => prev.map(p => 
        p.id === program.id 
          ? { ...p, studentIds: p.studentIds.filter(id => id !== studentId) }
          : p
      ));
      
      showSuccessToast('Student removed successfully');
    } catch (error) {
      console.error('Error removing student:', error);
      showErrorToast(getErrorMessage(error) || 'Failed to remove student');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: 0,
      classIds: [],
      studentIds: []
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateProgramModal(true);
  };

  const openEditModal = (program) => {
    setSelectedProgram(program);
    setFormData({
      name: program.name,
      price: program.price,
      classIds: program.classIds || [],
      studentIds: program.studentIds || []
    });
    setShowEditProgramModal(true);
  };

  const openEnrollModal = (program) => {
    setSelectedProgram(program);
    setEnrollingStudents(new Set());
    setShowEnrollModal(true);
  };

  const toggleProgramExpansion = (programId) => {
    setExpandedPrograms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(programId)) {
        newSet.delete(programId);
      } else {
        newSet.add(programId);
      }
      return newSet;
    });
  };

  const getStudentName = (studentId) => {
    const student = allStudents.find(s => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : 'Unknown Student';
  };

  const getClassName = (classId) => {
    const classItem = allClasses.find(c => c.id === classId);
    return classItem ? classItem.name : 'Unknown Class';
  };

  const handleProgramClick = (program) => {
    setSelectedProgram(program);
    setShowClassManagement(true);
  };

  const handleBackToPrograms = () => {
    setShowClassManagement(false);
    setSelectedProgram(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Show ClassManagement when a program is selected
  if (showClassManagement && selectedProgram) {
    return (
      <ClassManagement 
        user={user} 
        selectedProgram={selectedProgram}
        onBackToPrograms={handleBackToPrograms}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Program Management</h1>
          <p className="text-sm text-gray-600 mt-1">Create and manage educational programs</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center px-4 py-2 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Program
        </button>
      </div>

      {/* Programs Grid */}
      {filteredPrograms.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">No programs found</div>
            <div className="text-gray-400">Create your first program to get started</div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 sm:p-6">
            <div className="space-y-6">
              {filteredPrograms.map((program) => (
                <div 
                  key={program.id} 
                  className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => handleProgramClick(program)}
                >
                  {/* Program Header */}
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-blue-600" />
                          <div>
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                              {program.name}
                            </h3>
                          </div>
                        </div>
                      </div>

                      {/* Program Actions */}
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        {/* <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProgram(program);
                            setShowViewStudentsModal(true);
                          }}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title={`View ${program.studentIds?.length || 0} enrolled students`}
                        >
                          <Users className="w-4 h-4" />
                        </button> */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(program);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Program"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            showConfirmation(
                              'Delete Program',
                              `Are you sure you want to delete "${program.name}"? This action cannot be undone.`,
                              () => handleDeleteProgram(program)
                            );
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Program"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Program Info */}
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-1 gap-3 sm:gap-1">
                      <div className="text-center bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 flex items-center justify-center gap-1 mb-1">
                          <DollarSign className="h-3 w-3 text-gray-400" /> Price
                        </p>
                        <p className="font-medium text-gray-900 text-sm">${program.price}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Program Modal */}
      {showCreateProgramModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create Program</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Program name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateProgramModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProgram}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Program Modal */}
      {showEditProgramModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Program</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  step="0.01"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditProgramModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProgram}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enroll Students Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Enroll Students</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {allStudents.map(student => (
                <label key={student.id} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={enrollingStudents.has(student.id)}
                    onChange={(e) => {
                      const newSet = new Set(enrollingStudents);
                      if (e.target.checked) {
                        newSet.add(student.id);
                      } else {
                        newSet.delete(student.id);
                      }
                      setEnrollingStudents(newSet);
                    }}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">
                    {student.firstName} {student.lastName}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEnrollModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEnrollStudents}
                disabled={enrollingStudents.size === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enroll ({enrollingStudents.size})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Students Modal */}
      {showViewStudentsModal && selectedProgram && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Students in {selectedProgram.name}</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {selectedProgram.studentIds && selectedProgram.studentIds.length > 0 ? (
                allStudents
                  .filter(student => selectedProgram.studentIds.includes(student.id))
                  .map(student => (
                    <div key={student.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {student.firstName ? student.firstName.charAt(0) : 'S'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </span>
                        <p className="text-xs text-gray-500">{student.email}</p>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No students enrolled in this program</p>
                </div>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowViewStudentsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationState.isOpen}
        title={confirmationState.title}
        message={confirmationState.message}
        onConfirm={handleConfirm}
        onCancel={hideConfirmation}
      />

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        onClose={hideAlert}
      />
    </div>
  );
};

export default ProgramManagement;
