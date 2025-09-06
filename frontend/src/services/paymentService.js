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
}

export default new PaymentService();
