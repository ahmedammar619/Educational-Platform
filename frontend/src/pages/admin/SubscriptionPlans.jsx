import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  DollarSign,
  Calendar,
  Users,
  Tag,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import paymentService from '../../services/paymentService';
import { showErrorToast, showSuccessToast } from '../../utils/toast';

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    planType: 'recurring',
    billingInterval: 'month',
    price: '',
    currency: 'usd',
    isBasePlan: false,
    isActive: true,
    maxStudents: '',
    features: '',
    startDate: '',
    endDate: '',
    maxEnrollments: '',
    category: '',
    displayOrder: '0'
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await paymentService.getAllPlans(true);
      setPlans(data);
    } catch (error) {
      showErrorToast('Failed to load subscription plans');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const planData = {
        ...formData,
        price: parseInt(formData.price) * 100, // Convert dollars to cents
        maxStudents: formData.maxStudents ? parseInt(formData.maxStudents) : null,
        maxEnrollments: formData.maxEnrollments ? parseInt(formData.maxEnrollments) : null,
        displayOrder: parseInt(formData.displayOrder),
        features: formData.features ? formData.features.split('\n').filter(f => f.trim()) : [],
        startDate: formData.startDate || null,
        endDate: formData.endDate || null
      };

      if (editingPlan) {
        await paymentService.updatePlan(editingPlan.id, planData);
        showSuccessToast('Plan updated successfully!');
      } else {
        await paymentService.createPlan(planData);
        showSuccessToast('Plan created successfully!');
      }

      setShowModal(false);
      resetForm();
      loadPlans();
    } catch (error) {
      showErrorToast(error.response?.data?.message || 'Failed to save plan');
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      planType: plan.planType,
      billingInterval: plan.billingInterval,
      price: (plan.price / 100).toString(),
      currency: plan.currency,
      isBasePlan: plan.is_base_plan || plan.isBasePlan,
      isActive: plan.isActive,
      maxStudents: plan.max_students || plan.maxStudents || '',
      features: Array.isArray(plan.features) ? plan.features.join('\n') : '',
      startDate: plan.start_date || plan.startDate || '',
      endDate: plan.end_date || plan.endDate || '',
      maxEnrollments: plan.max_enrollments || plan.maxEnrollments || '',
      category: plan.category || '',
      displayOrder: (plan.display_order || plan.displayOrder || 0).toString()
    });
    setShowModal(true);
  };

  const handleDelete = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;

    try {
      await paymentService.deletePlan(planId);
      showSuccessToast('Plan deleted successfully!');
      loadPlans();
    } catch (error) {
      showErrorToast(error.response?.data?.message || 'Failed to delete plan');
    }
  };

  const handleToggleStatus = async (planId) => {
    try {
      await paymentService.togglePlanStatus(planId);
      showSuccessToast('Plan status updated!');
      loadPlans();
    } catch (error) {
      showErrorToast('Failed to toggle plan status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      planType: 'recurring',
      billingInterval: 'month',
      price: '',
      currency: 'usd',
      isBasePlan: false,
      isActive: true,
      maxStudents: '',
      features: '',
      startDate: '',
      endDate: '',
      maxEnrollments: '',
      category: '',
      displayOrder: '0'
    });
    setEditingPlan(null);
  };

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (plan.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || plan.planType === filterType;
    const matchesCategory = filterCategory === 'all' || plan.category === filterCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  const categories = [...new Set(plans.map(p => p.category).filter(Boolean))];

  const getPlanTypeBadge = (type) => {
    const badges = {
      recurring: 'bg-blue-100 text-blue-800',
      one_time: 'bg-green-100 text-green-800'
    };
    return badges[type] || 'bg-green-100 text-green-800'; // Default to one-time badge
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
        <p className="text-gray-600 mt-2">Manage your subscription plans, events, and courses</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Plans</p>
              <p className="text-2xl font-bold">{plans.length}</p>
            </div>
            <Tag className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Plans</p>
              <p className="text-2xl font-bold">{plans.filter(p => p.isActive).length}</p>
            </div>
            <ToggleRight className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Recurring</p>
              <p className="text-2xl font-bold">{plans.filter(p => p.planType === 'recurring').length}</p>
            </div>
            <RefreshCw className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Events</p>
              <p className="text-2xl font-bold">{plans.filter(p => p.planType === 'one_time').length}</p>
            </div>
            <Calendar className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search plans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="recurring">Recurring</option>
            <option value="one_time">One-Time</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Plan
          </button>
        </div>
      </div>

      {/* Plans List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.map(plan => (
          <div key={plan.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                </div>
                <button
                  onClick={() => handleToggleStatus(plan.id)}
                  className="ml-2"
                >
                  {plan.isActive ? (
                    <ToggleRight className="w-6 h-6 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-gray-400" />
                  )}
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-blue-600">
                    ${(plan.price / 100).toFixed(2)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPlanTypeBadge(plan.planType)}`}>
                    {plan.planType === 'recurring' ? 'Recurring Payment' : 'One-Time Payment'}
                  </span>
                </div>

                {plan.billingInterval !== 'one_time' && (
                  <p className="text-sm text-gray-600">per {plan.billingInterval}</p>
                )}

                {plan.category && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Tag className="w-4 h-4" />
                    {plan.category}
                  </div>
                )}

                {plan.maxEnrollments && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    {plan.currentEnrollments || 0} / {plan.maxEnrollments} enrolled
                  </div>
                )}

                {(plan.startDate || plan.endDate) && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(plan)}
                  className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPlans.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No plans found</h3>
          <p className="text-gray-600 mb-4">Create your first subscription plan to get started</p>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Plan
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">
                {editingPlan ? 'Edit Plan' : 'Create New Plan'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plan Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Plan Type</label>
                    <select
                      value={formData.planType}
                      onChange={(e) => setFormData({ ...formData, planType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="recurring">Recurring</option>
                      <option value="one_time">One-Time</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Billing Interval</label>
                    <select
                      value={formData.billingInterval}
                      onChange={(e) => setFormData({ ...formData, billingInterval: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="month">Monthly</option>
                      <option value="year">Yearly</option>
                      <option value="week">Weekly</option>
                      <option value="one_time">One-Time</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price (USD)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Base Plans, Events"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Students</label>
                    <input
                      type="number"
                      value={formData.maxStudents}
                      onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Enrollments</label>
                    <input
                      type="number"
                      value={formData.maxEnrollments}
                      onChange={(e) => setFormData({ ...formData, maxEnrollments: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="1"
                      placeholder="For events only"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Features (one per line)</label>
                  <textarea
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="4"
                    placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isBasePlan}
                      onChange={(e) => setFormData({ ...formData, isBasePlan: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">Base Plan</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlans;
