import { useState, useEffect } from 'react';
import { CreditCard, Calendar, Download, AlertCircle, CheckCircle, Clock, X, RotateCcw } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import paymentService from '../../services/paymentService';
import studentsService from '../../services/studentsService';
import { showSuccessToast, showErrorToast, showWarningToast } from '../../utils/toast';

// Stripe Elements styles
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

// Payment Form Component
const PaymentForm = ({ student, stripeConfig, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);
    setError(null);

    if (!stripe || !elements) {
      setError('Stripe has not loaded properly');
      setProcessing(false);
      return;
    }

    try {
      // Create subscription
      const { subscription, clientSecret } = await paymentService.createSubscription(student.id);

      if (!clientSecret) {
        throw new Error('Failed to create payment intent');
      }

      // Confirm payment
      const { error: paymentError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: `${student.user.firstName} ${student.user.lastName}`,
            email: student.parent?.email || student.user.email,
          },
        },
      });

      if (paymentError) {
        setError(paymentError.message);
      } else {
        showSuccessToast(`Successfully subscribed ${student.user.firstName} to monthly plan!`);
        onSuccess();
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'An error occurred during payment');
      showErrorToast('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Subscribe {student.user.firstName} {student.user.lastName}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Monthly subscription: {paymentService.formatCurrency(stripeConfig.priceInfo?.amount || 5000)}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Information
          </label>
          <div className="border rounded-md p-3 bg-white">
            <CardElement options={cardElementOptions} />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={!stripe || processing}
            className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Subscribe Now
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

// Main Payments Component
const ParentPayments = ({ user }) => {
  const [children, setChildren] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [stripeConfig, setStripeConfig] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('subscriptions');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [childrenData, subscriptionsData, invoicesData, configData] = await Promise.all([
        studentsService.getParentChildren(user.id),
        paymentService.getParentSubscriptions(),
        paymentService.getParentInvoices(),
        paymentService.getStripeConfig()
      ]);

      console.log('💳 Payment data loaded:', { childrenData, subscriptionsData, invoicesData, configData });

      setChildren(Array.isArray(childrenData) ? childrenData : []);
      setSubscriptions(Array.isArray(subscriptionsData) ? subscriptionsData : []);
      setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
      setStripeConfig(configData || {});

      // Initialize Stripe if configured
      if (configData.configured && configData.publishableKey) {
        const stripe = await loadStripe(configData.publishableKey);
        setStripePromise(stripe);
      }

    } catch (error) {
      console.error('Error loading payment data:', error);
      showErrorToast('Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (student) => {
    if (!stripeConfig?.configured) {
      showErrorToast('Payment system is not configured');
      return;
    }
    setSelectedStudent(student);
    setShowPaymentForm(true);
  };

  const handleCancelSubscription = async (studentId) => {
    if (!confirm('Are you sure you want to cancel this subscription? It will remain active until the end of the current billing period.')) {
      return;
    }

    try {
      await paymentService.cancelSubscription(studentId);
      showSuccessToast('Subscription will be canceled at the end of the billing period');
      loadInitialData(); // Refresh data
    } catch (error) {
      showErrorToast('Failed to cancel subscription');
    }
  };

  const handleReactivateSubscription = async (studentId) => {
    try {
      await paymentService.reactivateSubscription(studentId);
      showSuccessToast('Subscription reactivated successfully');
      loadInitialData(); // Refresh data
    } catch (error) {
      showErrorToast('Failed to reactivate subscription');
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setSelectedStudent(null);
    loadInitialData(); // Refresh data
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

      {/* Payment Form Modal */}
      {showPaymentForm && selectedStudent && stripePromise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <Elements stripe={stripePromise}>
              <PaymentForm
                student={selectedStudent}
                stripeConfig={stripeConfig}
                onSuccess={handlePaymentSuccess}
                onCancel={() => {
                  setShowPaymentForm(false);
                  setSelectedStudent(null);
                }}
              />
            </Elements>
          </div>
        </div>
      )}

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
              const subscription = getStudentSubscription(student.id);
              const statusBadge = paymentService.getSubscriptionStatusBadge(
                subscription?.status || student.subscriptionStatus || 'inactive'
              );

              return (
                <div key={student.id} className="bg-white rounded-lg border p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-medium">
                          {student.user.firstName[0]}{student.user.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {student.user.firstName} {student.user.lastName}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.class}`}>
                            {statusBadge.label}
                          </span>
                          {subscription?.currentPeriodEnd && (
                            <span className="text-sm text-gray-500">
                              Next billing: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {subscription?.status === 'active' && (
                        <button
                          onClick={() => handleCancelSubscription(student.id)}
                          className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded-md hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-1 inline" />
                          Cancel
                        </button>
                      )}
                      
                      {subscription?.cancelAt && (
                        <button
                          onClick={() => handleReactivateSubscription(student.id)}
                          className="px-3 py-1 text-sm border border-green-300 text-green-700 rounded-md hover:bg-green-50"
                        >
                          <RotateCcw className="h-4 w-4 mr-1 inline" />
                          Reactivate
                        </button>
                      )}

                      {(!subscription || subscription.status === 'canceled' || subscription.status === 'inactive') && (
                        <button
                          onClick={() => handleSubscribe(student)}
                          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                        >
                          <CreditCard className="h-4 w-4 mr-2 inline" />
                          Subscribe
                        </button>
                      )}
                    </div>
                  </div>

                  {subscription && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Amount:</span>
                          <span className="ml-2 font-medium">
                            {paymentService.formatCurrency(subscription.amount, subscription.currency)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Started:</span>
                          <span className="ml-2 font-medium">
                            {new Date(subscription.createdAt).toLocaleDateString()}
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
