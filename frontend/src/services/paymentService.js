import api from './api';

class PaymentService {
  // Get Stripe configuration
  async getStripeConfig() {
    try {
      const response = await api.get('/api/payments/config');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching Stripe config:', error);
      throw error;
    }
  }

  // Create subscription for a student (redirects to Stripe Checkout)
  async createSubscription(studentId) {
    try {
      console.log('💳 Creating subscription for student:', studentId);
      const response = await api.post(`/api/payments/subscribe/${studentId}`);
      
      // If we get a checkout URL, redirect to Stripe
      if (response.data.checkoutUrl) {
        console.log('🚀 Redirecting to Stripe Checkout:', response.data.checkoutUrl);
        window.location.href = response.data.checkoutUrl;
        return response.data;
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error creating subscription:', error);
      throw error;
    }
  }

  // Cancel subscription for a student
  async cancelSubscription(studentId) {
    try {
      console.log('❌ Canceling subscription for student:', studentId);
      const response = await api.delete(`/api/payments/subscribe/${studentId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error canceling subscription:', error);
      throw error;
    }
  }

  // Reactivate subscription
  async reactivateSubscription(studentId) {
    try {
      console.log('🔄 Reactivating subscription for student:', studentId);
      const response = await api.post(`/api/payments/reactivate/${studentId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error reactivating subscription:', error);
      throw error;
    }
  }

  // Handle checkout session success
  async handleCheckoutSuccess(sessionId) {
    try {
      console.log('🎉 Handling checkout success for session:', sessionId);
      const response = await api.post('/api/payments/checkout-success', { sessionId });
      return response.data;
    } catch (error) {
      console.error('❌ Error handling checkout success:', error);
      throw error;
    }
  }

  // Get all subscriptions for the current parent
  async getParentSubscriptions() {
    try {
      const response = await api.get('/api/payments/subscriptions');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching subscriptions:', error);
      throw error;
    }
  }

  // Get all invoices for the current parent
  async getParentInvoices() {
    try {
      const response = await api.get('/api/payments/invoices');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching invoices:', error);
      throw error;
    }
  }

  // Get subscription for a specific student
  async getStudentSubscription(studentId) {
    try {
      const response = await api.get(`/payments/student/${studentId}/subscription`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching student subscription:', error);
      throw error;
    }
  }

  // Get real-time subscription status from Stripe
  async getStudentSubscriptionStatus(studentId) {
    try {
      console.log('🔍 Fetching real-time subscription status for student:', studentId);
      const response = await api.get(`/api/payments/status/${studentId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching student subscription status:', error);
      throw error;
    }
  }

  // Get invoices for a specific student
  async getStudentInvoices(studentId) {
    try {
      const response = await api.get(`/payments/student/${studentId}/invoices`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching student invoices:', error);
      throw error;
    }
  }

  // Admin methods (for admin dashboard)
  async getAllSubscriptions() {
    try {
      const response = await api.get('/payments/admin/subscriptions');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching all subscriptions:', error);
      throw error;
    }
  }

  async getSubscriptionStats() {
    try {
      const response = await api.get('/payments/admin/stats');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching subscription stats:', error);
      throw error;
    }
  }

  // Helper methods
  formatAmount(amountInCents) {
    return (amountInCents / 100).toFixed(2);
  }

  formatCurrency(amountInCents, currency = 'USD') {
    const amount = this.formatAmount(amountInCents);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  }

  getSubscriptionStatusBadge(status) {
    const statusMap = {
      active: { label: 'Active', class: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inactive', class: 'bg-gray-100 text-gray-800' },
      past_due: { label: 'Past Due', class: 'bg-red-100 text-red-800' },
      canceled: { label: 'Canceled', class: 'bg-gray-100 text-gray-800' },
      incomplete: { label: 'Incomplete', class: 'bg-yellow-100 text-yellow-800' },
      trialing: { label: 'Trial', class: 'bg-blue-100 text-blue-800' },
      unpaid: { label: 'Unpaid', class: 'bg-red-100 text-red-800' },
    };

    return statusMap[status] || { label: status, class: 'bg-gray-100 text-gray-800' };
  }

  // Admin payment management methods
  async getAdminPaymentStats() {
    try {
      const response = await api.get('/api/payments/admin/stats');
      return response.data;
    } catch (error) {
      console.error('Error getting admin payment stats:', error);
      throw error;
    }
  }

  async getAdminSubscriptions(filters = {}) {
    try {
      const response = await api.get('/api/payments/admin/subscriptions', {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Error getting admin subscriptions:', error);
      throw error;
    }
  }

  async getAdminInvoices(filters = {}) {
    try {
      const response = await api.get('/api/payments/admin/invoices', {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Error getting admin invoices:', error);
      throw error;
    }
  }

  async getAdminWebhookEvents(filters = {}) {
    try {
      const response = await api.get('/api/payments/admin/webhook-events', {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Error getting admin webhook events:', error);
      throw error;
    }
  }

  // New methods for real-time Stripe data
  async getStripeSubscriptions(filters = {}) {
    try {
      const response = await api.get('/api/payments/admin/stripe/subscriptions', {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Error getting Stripe subscriptions:', error);
      throw error;
    }
  }

  async getStripeInvoices(filters = {}) {
    try {
      const response = await api.get('/api/payments/admin/stripe/invoices', {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Error getting Stripe invoices:', error);
      throw error;
    }
  }

  async getStripeStats() {
    try {
      const response = await api.get('/api/payments/admin/stripe/stats');
      return response.data;
    } catch (error) {
      console.error('Error getting Stripe stats:', error);
      throw error;
    }
  }

  async syncStripeData(customerIds = null) {
    try {
      const response = await api.post('/api/payments/admin/stripe/sync', {
        customerIds: customerIds
      });
      return response.data;
    } catch (error) {
      console.error('Error syncing Stripe data:', error);
      throw error;
    }
  }

  // ============ NEW SUBSCRIPTION PLANS SYSTEM ============

  // ADMIN: Subscription Plan Management
  async getAllPlans(includeInactive = false) {
    try {
      const response = await api.get('/api/subscription-plans/admin/plans', {
        params: { includeInactive }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting all plans:', error);
      throw error;
    }
  }

  async createPlan(planData) {
    try {
      const response = await api.post('/api/subscription-plans/admin/plans', planData);
      return response.data;
    } catch (error) {
      console.error('Error creating plan:', error);
      throw error;
    }
  }

  async updatePlan(planId, planData) {
    try {
      const response = await api.put(`/api/subscription-plans/admin/plans/${planId}`, planData);
      return response.data;
    } catch (error) {
      console.error('Error updating plan:', error);
      throw error;
    }
  }

  async deletePlan(planId) {
    try {
      const response = await api.delete(`/api/subscription-plans/admin/plans/${planId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting plan:', error);
      throw error;
    }
  }

  async togglePlanStatus(planId) {
    try {
      const response = await api.post(`/api/subscription-plans/admin/plans/${planId}/toggle-status`);
      return response.data;
    } catch (error) {
      console.error('Error toggling plan status:', error);
      throw error;
    }
  }

  // ADMIN: Student Subscription Management
  async getAllStudentSubscriptions(filters = {}) {
    try {
      const response = await api.get('/api/subscription-plans/admin/subscriptions', {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Error getting student subscriptions:', error);
      throw error;
    }
  }

  async getStudentSubscriptionById(subscriptionId) {
    try {
      const response = await api.get(`/api/subscription-plans/admin/subscriptions/${subscriptionId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting subscription details:', error);
      throw error;
    }
  }

  async updateStudentSubscription(subscriptionId, data) {
    try {
      const response = await api.put(`/api/subscription-plans/admin/subscriptions/${subscriptionId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  async cancelStudentSubscriptionAdmin(subscriptionId, cancelAtPeriodEnd = true) {
    try {
      const response = await api.post(`/api/subscription-plans/admin/subscriptions/${subscriptionId}/cancel`, null, {
        params: { cancelAtPeriodEnd }
      });
      return response.data;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  async createManualPayment(paymentData) {
    try {
      const response = await api.post('/api/subscription-plans/admin/payments/manual', paymentData);
      return response.data;
    } catch (error) {
      console.error('Error creating manual payment:', error);
      throw error;
    }
  }

  async getPaymentStats() {
    try {
      const response = await api.get('/api/subscription-plans/admin/stats');
      return response.data;
    } catch (error) {
      console.error('Error getting payment stats:', error);
      throw error;
    }
  }

  // PARENT: Browse and Subscribe
  async getAvailablePlans() {
    try {
      const response = await api.get('/api/subscription-plans/available');
      return response.data;
    } catch (error) {
      console.error('Error getting available plans:', error);
      throw error;
    }
  }

  async subscribeStudentToPlan(studentId, planId, notes = null) {
    try {
      const response = await api.post('/api/subscription-plans/subscribe', {
        studentId,
        planId,
        notes
      });

      // If we get a checkout URL, redirect to Stripe
      if (response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      }

      return response.data;
    } catch (error) {
      console.error('Error subscribing to plan:', error);
      throw error;
    }
  }

  async bulkSubscribeStudent(studentId, planIds, notes = null) {
    try {
      const response = await api.post('/api/subscription-plans/bulk-subscribe', {
        studentId,
        planIds,
        notes
      });
      return response.data;
    } catch (error) {
      console.error('Error bulk subscribing:', error);
      throw error;
    }
  }

  async getMySubscriptions() {
    try {
      const response = await api.get('/api/subscription-plans/my-subscriptions');
      return response.data;
    } catch (error) {
      console.error('Error getting my subscriptions:', error);
      throw error;
    }
  }

  async getMyPayments() {
    try {
      const response = await api.get('/api/subscription-plans/my-payments');
      return response.data;
    } catch (error) {
      console.error('Error getting my payments:', error);
      throw error;
    }
  }
}

export default new PaymentService();
