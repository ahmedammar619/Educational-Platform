import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Calendar,
  Filter,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  User
} from 'lucide-react';
import paymentService from '../../services/paymentService';
import { showErrorToast, showSuccessToast } from '../../utils/toast';

const AdminPayments = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('subscriptions');
  const [paymentStats, setPaymentStats] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [webhookEvents, setWebhookEvents] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: '30',
    search: ''
  });

  useEffect(() => {
    loadPaymentData();
  }, [filters]);

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      const [statsData, subscriptionsData, invoicesData, webhooksData] = await Promise.all([
        paymentService.getAdminPaymentStats(),
        paymentService.getAdminSubscriptions(filters),
        paymentService.getAdminInvoices(filters),
        paymentService.getAdminWebhookEvents(filters)
      ]);
      
      setPaymentStats(statsData);
      setSubscriptions(subscriptionsData);
      setInvoices(invoicesData);
      setWebhookEvents(webhooksData);
      
      // Debug logging
      console.log('📊 Payment stats:', statsData);
      console.log('📋 Subscriptions data:', subscriptionsData);
      console.log('💳 Invoices data:', invoicesData);
      console.log('🔍 Webhook events data:', webhooksData);
    } catch (error) {
      console.error('Error loading payment data:', error);
      showErrorToast('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPaymentData();
    setRefreshing(false);
    showSuccessToast('Payment data refreshed');
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleViewDetails = (type, item) => {
    console.log(`View details for ${type}:`, item);
    
    // Create detailed information based on type
    let details = '';
    
    if (type === 'subscription') {
      const studentName = item.studentName || `${item.student?.user?.firstName || ''} ${item.student?.user?.lastName || ''}`.trim() || 'Unknown Student';
      details = `
Subscription Details:
- ID: ${item.id}
- Student: ${studentName}
- Student Email: ${item.student?.user?.email || 'N/A'}
- Parent: ${item.user?.firstName || 'N/A'} ${item.user?.lastName || 'N/A'}
- Parent Email: ${item.user?.email || 'N/A'}
- Status: ${item.status}
- Amount: ${formatCurrency(item.amount, item.currency)}
- Stripe Subscription ID: ${item.stripeSubscriptionId || 'N/A'}
- Created: ${formatDate(item.createdAt)}
- Current Period: ${item.currentPeriodStart ? formatDate(item.currentPeriodStart) : 'N/A'} - ${item.currentPeriodEnd ? formatDate(item.currentPeriodEnd) : 'N/A'}
      `;
    } else if (type === 'invoice') {
      const studentName = item.studentName || `${item.student?.user?.firstName || ''} ${item.student?.user?.lastName || ''}`.trim() || 'Unknown Student';
      details = `
Invoice Details:
- ID: ${item.id}
- Stripe Invoice ID: ${item.stripeInvoiceId}
- Student: ${studentName}
- Student Email: ${item.student?.user?.email || 'N/A'}
- Parent: ${item.user?.firstName || 'N/A'} ${item.user?.lastName || 'N/A'}
- Amount Paid: ${formatCurrency(item.amountPaid, item.currency)}
- Status: ${item.status}
- Paid At: ${item.paidAt ? formatDate(item.paidAt) : 'N/A'}
- Created: ${formatDate(item.createdAt)}
      `;
    } else if (type === 'webhook') {
      details = `
Webhook Event Details:
- ID: ${item.id}
- Stripe Event ID: ${item.stripeEventId}
- Type: ${item.type}
- Created: ${formatDate(item.createdAt)}
- Payload: ${JSON.stringify(item.payload, null, 2)}
      `;
    }
    
    // Show details in an alert (you can replace this with a modal later)
    alert(details);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'canceled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'incomplete':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'past_due':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'incomplete':
        return 'bg-yellow-100 text-yellow-800';
      case 'past_due':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount, currency = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Group subscriptions by parent
  const groupedSubscriptions = subscriptions.reduce((acc, subscription) => {
    const parentId = subscription.userId;
    if (!acc[parentId]) {
      acc[parentId] = {
        parent: subscription.user || { firstName: 'Unknown', lastName: 'Parent', email: 'unknown@example.com' },
        subscriptions: []
      };
    }
    acc[parentId].subscriptions.push(subscription);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-2 text-lg">Loading payment data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600">Monitor subscriptions, invoices, and payment analytics</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {paymentStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(paymentStats.totalRevenue)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {paymentStats.activeSubscriptions}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900">
                  {paymentStats.totalInvoices}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(paymentStats.monthlyRevenue)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="canceled">Canceled</option>
              <option value="incomplete">Incomplete</option>
              <option value="past_due">Past Due</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 flex-1">
            <input
              type="text"
              placeholder="Search subscriptions, invoices..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="flex-1 border border-gray-300 rounded-md px-3 py-1 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button 
              onClick={() => handleTabChange('subscriptions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'subscriptions' 
                  ? 'border-purple-500 text-purple-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Subscriptions
            </button>
            <button 
              onClick={() => handleTabChange('invoices')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'invoices' 
                  ? 'border-purple-500 text-purple-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Invoices
            </button>
            <button 
              onClick={() => handleTabChange('webhooks')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'webhooks' 
                  ? 'border-purple-500 text-purple-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Webhook Events
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'subscriptions' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Students
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(groupedSubscriptions).map(([parentId, parentData]) => (
                    <React.Fragment key={parentId}>
                      {parentData.subscriptions.map((subscription, index) => (
                        <tr key={subscription.id} className="hover:bg-gray-50">
                          {index === 0 && (
                            <td rowSpan={parentData.subscriptions.length} className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                              <div className="flex items-center">
                                <User className="h-5 w-5 text-gray-400 mr-3" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {parentData.parent.firstName} {parentData.parent.lastName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {parentData.parent.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {subscription.studentName || `${subscription.student?.user?.firstName || ''} ${subscription.student?.user?.lastName || ''}`.trim() || 'Unknown Student'}
                            </div>
                            {/* <div className="text-sm text-gray-500">
                              {subscription.student?.user?.email || 'N/A'}
                            </div> */}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusIcon(subscription.status)}
                              <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(subscription.status)}`}>
                                {subscription.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(subscription.amount, subscription.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {subscription.currentPeriodStart && subscription.currentPeriodEnd ? (
                              <div>
                                <div>{formatDate(subscription.currentPeriodStart)}</div>
                                <div className="text-xs text-gray-400">to {formatDate(subscription.currentPeriodEnd)}</div>
                              </div>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(subscription.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button 
                              onClick={() => handleViewDetails('subscription', subscription)}
                              className="flex items-center text-purple-600 hover:text-purple-900"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {invoice.stripeInvoiceId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.studentName || `${invoice.student?.user?.firstName || ''} ${invoice.student?.user?.lastName || ''}`.trim() || 'Unknown Student'}
                        </div>
                        {/* <div className="text-sm text-gray-500">
                          {invoice.student?.user?.email || 'N/A'}
                        </div> */}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(invoice.amountPaid, invoice.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.paidAt ? formatDate(invoice.paidAt) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => handleViewDetails('invoice', invoice)}
                          className="flex items-center text-purple-600 hover:text-purple-900"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'webhooks' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {webhookEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {event.stripeEventId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {event.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(event.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => handleViewDetails('webhook', event)}
                          className="flex items-center text-purple-600 hover:text-purple-900"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPayments;