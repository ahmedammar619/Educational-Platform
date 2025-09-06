import { useState, useEffect } from 'react';
import { CreditCard, Calendar, Download, AlertCircle, CheckCircle, Clock, X, RotateCcw } from 'lucide-react';
import paymentService from '../../services/paymentService';
import studentsService from '../../services/studentsService';
import { showSuccessToast, showErrorToast, showWarningToast } from '../../utils/toast';



// Main Payments Component
const ParentPayments = ({ user }) => {
  const [children, setChildren] = useState([]);
  const [childrenStripeStatus, setChildrenStripeStatus] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [stripeConfig, setStripeConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState({});
  const [activeTab, setActiveTab] = useState('subscriptions');

  useEffect(() => {
    loadInitialData();
    
    // Check if returning from Stripe checkout
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    
    if (success === 'true' && sessionId) {
      handleStripeSuccess(sessionId);
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (canceled === 'true') {
      showWarningToast('Payment was canceled.');
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleStripeSuccess = async (sessionId) => {
    try {
      console.log('🎉 Processing Stripe success for session:', sessionId);
      showSuccessToast('Processing your payment...');
      
      const result = await paymentService.handleCheckoutSuccess(sessionId);
      
      if (result.success) {
        showSuccessToast('Payment successful! Your subscription is now active.');
        // Refresh the data to show updated status
        await loadInitialData();
      } else {
        showErrorToast('Payment processing failed. Please contact support.');
      }
    } catch (error) {
      console.error('❌ Error processing Stripe success:', error);
      showErrorToast('Error processing payment. Please refresh the page.');
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // First load children and config
      const [childrenData, invoicesData, configData] = await Promise.all([
        studentsService.getParentChildren(user.id),
        paymentService.getParentInvoices(),
        paymentService.getStripeConfig()
      ]);

      console.log('💳 Basic data loaded:', { childrenData, invoicesData, configData });

      setChildren(Array.isArray(childrenData) ? childrenData : []);
      setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
      setStripeConfig(configData || {});

      // Then load REAL Stripe status for each child
      if (Array.isArray(childrenData) && childrenData.length > 0) {
        await loadAllChildrenStripeStatus(childrenData);
      }
    } catch (error) {
      console.error('❌ Error loading payment data:', error);
      showErrorToast('Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const loadAllChildrenStripeStatus = async (childrenData) => {
    console.log('🔍 Loading Stripe status for all children...');
    
    const statusPromises = childrenData.map(async (child) => {
      try {
        console.log(`🔍 Checking Stripe status for ${child.firstName} ${child.lastName} (${child.id})`);
        const status = await paymentService.getStudentSubscriptionStatus(child.id);
        console.log(`✅ ${child.firstName}: hasSubscription=${status.hasSubscription}, status=${status.status}, active=${status.isActive}`);
        return { studentId: child.id, status };
      } catch (error) {
        console.error(`❌ Error loading status for ${child.firstName}:`, error);
        return { 
          studentId: child.id, 
          status: { 
            hasSubscription: false, 
            status: 'Inactive', 
            isActive: false, 
            canSubscribe: true, 
            canCancel: false 
          }
        };
      }
    });

    try {
      const statusResults = await Promise.all(statusPromises);
      const statusMap = {};
      statusResults.forEach(({ studentId, status }) => {
        statusMap[studentId] = status;
      });
      
      setChildrenStripeStatus(statusMap);
      console.log('📊 All children Stripe status loaded:', statusMap);
    } catch (error) {
      console.error('❌ Error loading children Stripe status:', error);
    }
  };

  const refreshStudentStripeStatus = async (studentId) => {
    try {
      setLoadingStatus(prev => ({ ...prev, [studentId]: true }));
      console.log(`🔄 Refreshing Stripe status for student ${studentId}`);
      
      const status = await paymentService.getStudentSubscriptionStatus(studentId);
      setChildrenStripeStatus(prev => ({ ...prev, [studentId]: status }));
      
      console.log(`✅ Refreshed status for student ${studentId}:`, status);
      
      if (status.hasSubscription) {
        showSuccessToast(`✅ ACTIVE subscription found in Stripe! Status: ${status.status}`);
      } else {
        showWarningToast('❌ No subscription found in Stripe for this student');
      }
    } catch (error) {
      console.error(`❌ Error refreshing status for student ${studentId}:`, error);
      showErrorToast('Failed to refresh status');
    } finally {
      setLoadingStatus(prev => ({ ...prev, [studentId]: false }));
    }
  };

  const handleSubscribe = async (student) => {
    if (!stripeConfig?.configured) {
      showErrorToast('Payment system is not configured');
      return;
    }

    // Show confirmation dialog
    const stripeStatus = childrenStripeStatus[student.id];
    const isResubscribe = stripeStatus?.status === 'canceled';
    const confirmMessage = isResubscribe 
      ? `Are you sure you want to resubscribe ${student.firstName} ${student.lastName}? This will start a new monthly subscription.`
      : `Are you sure you want to subscribe ${student.firstName} ${student.lastName}? This will start a monthly subscription.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    try {
      setLoading(true);
      await paymentService.createSubscription(student.id);
      // The payment service will redirect to Stripe, so we don't need to do anything else here
    } catch (error) {
      console.error('Subscription error:', error);
      showErrorToast('Failed to start subscription process');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (studentId) => {
    if (!confirm('Are you sure you want to cancel this subscription? It will remain active until the end of the current billing period.')) {
      return;
    }

    try {
      setLoadingStatus(prev => ({ ...prev, [studentId]: true }));
      await paymentService.cancelSubscription(studentId);
      showSuccessToast('Subscription will be canceled at the end of the billing period');
      
      // Refresh just this student's status
      await refreshStudentStripeStatus(studentId);
    } catch (error) {
      console.error('❌ Cancel subscription error:', error);
      showErrorToast(error.message || 'Failed to cancel subscription');
    } finally {
      setLoadingStatus(prev => ({ ...prev, [studentId]: false }));
    }
  };

  const handleReactivateSubscription = async (studentId) => {
    try {
      setLoadingStatus(prev => ({ ...prev, [studentId]: true }));
      await paymentService.reactivateSubscription(studentId);
      showSuccessToast('Subscription reactivated successfully');
      
      // Refresh just this student's status
      await refreshStudentStripeStatus(studentId);
    } catch (error) {
      console.error('❌ Reactivate subscription error:', error);
      showErrorToast(error.message || 'Failed to reactivate subscription');
    } finally {
      setLoadingStatus(prev => ({ ...prev, [studentId]: false }));
    }
  };


  const getStudentSubscription = (studentId) => {
    return subscriptions.find(sub => sub.studentId === studentId);
  };

  const getStudentInvoices = (studentId) => {
    return invoices.filter(invoice => invoice.studentId === studentId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!stripeConfig?.configured) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Payment System Unavailable</h3>
          <p className="text-gray-500">
            The payment system is currently not configured. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments & Subscriptions</h1>
        <p className="text-gray-600 mt-1">Manage your children's subscriptions and view payment history</p>
      </div>


      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'subscriptions', name: 'Subscriptions', icon: CreditCard },
            { id: 'invoices', name: 'Payment History', icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          {children.length === 0 ? (
            <div className="bg-white rounded-lg border p-6 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Children Found</h3>
              <p className="text-gray-500">
                Please add your children first to manage their subscriptions.
              </p>
            </div>
          ) : (
            children.map((student) => {
              const stripeStatus = childrenStripeStatus[student.id];
              const isLoadingThisStudent = loadingStatus[student.id];
              const statusBadge = paymentService.getSubscriptionStatusBadge(
                stripeStatus?.status || 'inactive'
              );

              return (
                <div key={student.id} className="bg-white rounded-lg border p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-medium">
                          {student.firstName[0]}{student.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.class}`}>
                            {isLoadingThisStudent ? (
                              <>
                                <Clock className="h-3 w-3 mr-1 animate-spin" />
                                Checking...
                              </>
                            ) : (
                              `${statusBadge.label}${stripeStatus?.hasSubscription ? ' (Stripe)' : ''}`
                            )}
                          </span>
                          
                          <button
                            onClick={() => refreshStudentStripeStatus(student.id)}
                            disabled={isLoadingThisStudent}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                          >
                            {isLoadingThisStudent ? 'Checking...' : 'Refresh Status'}
                          </button>
                          
                          {stripeStatus?.subscriptionDetails?.currentPeriodEnd && (
                            <span className="text-sm text-gray-500">
                              Next billing: {new Date(stripeStatus.subscriptionDetails.currentPeriodEnd).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Cancel button - show if user has active subscription in Stripe */}
                      {stripeStatus?.canCancel && (
                        <button
                          onClick={() => handleCancelSubscription(student.id)}
                          disabled={isLoadingThisStudent}
                          className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50"
                        >
                          <X className="h-4 w-4 mr-1 inline" />
                          Cancel
                        </button>
                      )}
                      
                      {/* Reactivate button - show if subscription is set to cancel but still active */}
                      {stripeStatus?.canReactivate && (
                        <button
                          onClick={() => handleReactivateSubscription(student.id)}
                          disabled={isLoadingThisStudent}
                          className="px-3 py-1 text-sm border border-green-300 text-green-700 rounded-md hover:bg-green-50 disabled:opacity-50"
                        >
                          <RotateCcw className="h-4 w-4 mr-1 inline" />
                          Reactivate
                        </button>
                      )}

                      {/* Subscribe/Resubscribe button - show if user can subscribe (no active subscription in Stripe) */}
                      {stripeStatus?.canSubscribe && (
                        <button
                          onClick={() => {
                            console.log('🔘 Subscribe/Resubscribe clicked for student:', student.id, 'Status:', stripeStatus);
                            handleSubscribe(student);
                          }}
                          disabled={isLoadingThisStudent}
                          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                        >
                          <CreditCard className="h-4 w-4 mr-2 inline" />
                          {stripeStatus?.status === 'canceled' ? 'Resubscribe' : 'Subscribe'}
                        </button>
                      )}


                    </div>
                  </div>

                  {stripeStatus?.hasSubscription && stripeStatus?.subscriptionDetails && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Amount:</span>
                          <span className="ml-2 font-medium">
                            {paymentService.formatCurrency(stripeStatus.subscriptionDetails.amount || 0, stripeStatus.subscriptionDetails.currency)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Status:</span>
                          <span className={`ml-2 font-medium ${stripeStatus.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                            {stripeStatus.status} {stripeStatus.isActive ? '(ACTIVE)' : ''}
                          </span>
                        </div>
                        {stripeStatus.subscriptionDetails.currentPeriodStart && (
                          <div>
                            <span className="text-gray-500">Period Start:</span>
                            <span className="ml-2 font-medium">
                              {new Date(stripeStatus.subscriptionDetails.currentPeriodStart).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {stripeStatus.subscriptionDetails.currentPeriodEnd && (
                          <div>
                            <span className="text-gray-500">Period End:</span>
                            <span className="ml-2 font-medium">
                              {new Date(stripeStatus.subscriptionDetails.currentPeriodEnd).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {stripeStatus.subscriptionDetails.cancelAt && (
                          <div>
                            <span className="text-gray-500">Will Cancel:</span>
                            <span className="ml-2 font-medium text-orange-600">
                              {new Date(stripeStatus.subscriptionDetails.cancelAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        <div className="col-span-2">
                          <span className="text-gray-500">Stripe ID:</span>
                          <span className="ml-2 font-mono text-xs text-blue-600">
                            {stripeStatus.subscriptionDetails.id}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-lg border">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment History</h3>
            
            {invoices.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment History</h3>
                <p className="text-gray-500">Your payment history will appear here once you make payments.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
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
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(invoice.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {invoice.student?.user?.firstName} {invoice.student?.user?.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {paymentService.formatCurrency(invoice.amountPaid, invoice.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            invoice.status === 'paid' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {invoice.status === 'paid' ? (
                              <><CheckCircle className="h-3 w-3 mr-1" /> Paid</>
                            ) : (
                              <><Clock className="h-3 w-3 mr-1" /> {invoice.status}</>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button className="text-purple-600 hover:text-purple-900">
                            <Download className="h-4 w-4" />
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
      )}
    </div>
  );
};

export default ParentPayments;

