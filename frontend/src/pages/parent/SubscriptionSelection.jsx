import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Check,
  Calendar,
  Users,
  Tag,
  DollarSign,
  Clock,
  Star,
  ArrowRight,
  ShoppingCart,
  X,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import paymentService from '../../services/paymentService';
import parentsService from '../../services/parentsService';
import { showErrorToast, showSuccessToast } from '../../utils/toast';

const SubscriptionSelection = ({ user }) => {
  const [plans, setPlans] = useState({ basePlans: [], events: [], byCategory: {} });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedPlans, setSelectedPlans] = useState([]);
  const [mySubscriptions, setMySubscriptions] = useState([]);
  const [myPayments, setMyPayments] = useState([]);
  const [activeTab, setActiveTab] = useState('browse');

  useEffect(() => {
    loadData();
    handleCheckoutReturn();
  }, []);

  const handleCheckoutReturn = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');

    if (sessionId && success === 'true') {
      try {
        await paymentService.handleCheckoutSuccess(sessionId);
        showSuccessToast('Payment successful! Subscription activated.');
        // Clear URL params
        window.history.replaceState({}, '', '/parent/subscriptions');
        // Reload data to show new subscription
        setTimeout(() => loadData(), 1000);
      } catch (error) {
        showErrorToast(error.message || 'Failed to process payment');
      }
    } else if (canceled === 'true') {
      showErrorToast('Payment was canceled');
      window.history.replaceState({}, '', '/parent/subscriptions');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, studentsResponse, subscriptionsData, paymentsData] = await Promise.all([
        paymentService.getAvailablePlans(),
        parentsService.getMyChildren(user.id),
        paymentService.getMySubscriptions(),
        paymentService.getMyPayments()
      ]);

      // Handle students data - backend returns { children: [...] }
      const studentsData = studentsResponse?.children || studentsResponse || [];

      console.log('Loaded subscriptions from API:', subscriptionsData);

      setPlans(plansData);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setMySubscriptions(Array.isArray(subscriptionsData) ? subscriptionsData : []);
      setMyPayments(Array.isArray(paymentsData) ? paymentsData : []);
    } catch (error) {
      showErrorToast('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (planId) => {
    // Only allow selecting one plan at a time
    if (selectedPlans.includes(planId)) {
      setSelectedPlans([]);
    } else {
      setSelectedPlans([planId]);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedStudent) {
      showErrorToast('⚠️ Please select a student first');
      // Scroll to student selector
      document.getElementById('student-selector')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (selectedPlans.length === 0) {
      showErrorToast('Please select a plan');
      return;
    }

    // Check if student is already subscribed to the selected plan
    const selectedPlanId = selectedPlans[0];
    const isAlreadySubscribed = mySubscriptions.some(
      sub => sub.planId === selectedPlanId && sub.studentId === selectedStudent &&
      (sub.status === 'active' || sub.status === 'trialing')
    );

    if (isAlreadySubscribed) {
      showErrorToast('This student is already subscribed to this plan');
      return;
    }

    try {
      setSubscribing(true);
      // Single plan subscription - redirects automatically in service
      await paymentService.subscribeStudentToPlan(selectedStudent, selectedPlanId);
    } catch (error) {
      console.error('Subscribe error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to subscribe';
      showErrorToast(errorMsg);
      setSubscribing(false);
    }
  };

  const renderPlanCard = (plan) => {
    const isSelected = selectedPlans.includes(plan.id);
    // Check if THIS STUDENT has an ACTIVE subscription to this plan (not incomplete)
    const isSubscribedByStudent = selectedStudent && mySubscriptions.some(
      sub => sub.planId === plan.id && sub.studentId === selectedStudent &&
      (sub.status === 'active' || sub.status === 'trialing')
    );

    return (
      <div
        key={plan.id}
        className={`relative bg-white rounded-lg shadow-lg p-6 transition-all ${
          isSubscribedByStudent ? 'opacity-60 cursor-not-allowed border-2 border-green-200' :
          isSelected ? 'ring-4 ring-purple-500 cursor-pointer' :
          'hover:shadow-xl cursor-pointer'
        }`}
        onClick={() => !isSubscribedByStudent && handleSelectPlan(plan.id)}
      >
        {isSelected && !isSubscribedByStudent && (
          <div className="absolute top-4 right-4 bg-purple-600 rounded-full p-1 shadow-lg">
            <Check className="w-5 h-5 text-white" />
          </div>
        )}

        {isSubscribedByStudent && (
          <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
            ✓ Subscribed
          </div>
        )}

        <div className="mb-4">
          {plan.category && (
            <span className="text-sm text-blue-600 font-semibold">{plan.category}</span>
          )}
          <h3 className="text-xl font-bold text-gray-900 mt-2">{plan.name}</h3>
          <p className="text-gray-600 mt-2 text-sm">{plan.description}</p>
        </div>

        <div className="mb-4">
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-blue-600">
              ${(plan.price / 100).toFixed(2)}
            </span>
            {plan.planType === 'recurring' && plan.billingInterval !== 'one_time' && (
              <span className="text-gray-600 ml-2">/{plan.billingInterval}</span>
            )}
          </div>
        </div>

        {plan.features && plan.features.length > 0 && (
          <div className="space-y-2 mb-4">
            {plan.features.slice(0, 4).map((feature, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        )}

        {plan.maxEnrollments && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Users className="w-4 h-4" />
            {plan.currentEnrollments || 0} / {plan.maxEnrollments} spots filled
          </div>
        )}

        {(plan.startDate && plan.endDate) && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Calendar className="w-4 h-4" />
            {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}
          </div>
        )}

        <div className="pt-4 border-t">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            plan.planType === 'recurring' ? 'bg-blue-100 text-blue-800' :
            'bg-green-100 text-green-800'
          }`}>
            {plan.planType === 'recurring' ? 'Recurring Payment' : 'One-Time Payment'}
          </span>
        </div>
      </div>
    );
  };

  const handleCancelSubscription = async (subscriptionId) => {
    // Find the subscription to get more info
    const subscription = mySubscriptions.find(s => s.id === subscriptionId);
    console.log('Attempting to cancel subscription:', subscription);

    if (!window.confirm('Are you sure you want to cancel this subscription? It will remain active until the end of the current billing period.')) {
      return;
    }

    try {
      await paymentService.cancelMySubscription(subscriptionId);
      showSuccessToast('Subscription canceled successfully');
      loadData();
    } catch (error) {
      console.error('Cancel error:', error);
      showErrorToast(error.response?.data?.message || 'Failed to cancel subscription');
    }
  };

  const handleReactivateSubscription = async (subscriptionId) => {
    try {
      const result = await paymentService.reactivateMySubscription(subscriptionId);
      // If no checkout URL, subscription was reactivated without payment
      if (!result.checkoutUrl) {
        showSuccessToast('Subscription reactivated successfully!');
        // Reload data to show updated subscription
        await loadData();
      }
      // Otherwise, service will redirect to Stripe checkout
    } catch (error) {
      showErrorToast(error.response?.data?.message || 'Failed to reactivate subscription');
    }
  };

  const renderMySubscriptions = () => {
    // Filter out incomplete subscriptions - don't show them at all
    const activeSubscriptions = mySubscriptions.filter(sub => sub.status !== 'incomplete');

    return (
      <div className="space-y-4">
        {activeSubscriptions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No subscriptions</h3>
            <p className="text-gray-600">Subscribe to a plan to get started</p>
          </div>
        ) : (
          activeSubscriptions.map(sub => (
          <div key={sub.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{sub.planName}</h3>
                <p className="text-sm text-gray-600">{sub.studentName}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                sub.status === 'active' ? 'bg-green-100 text-green-800' :
                sub.status === 'trialing' ? 'bg-blue-100 text-blue-800' :
                sub.status === 'past_due' ? 'bg-red-100 text-red-800' :
                sub.status === 'canceled' ? 'bg-gray-100 text-gray-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {sub.status === 'active' ? 'Active' :
                 sub.status === 'trialing' ? 'Trial' :
                 sub.status === 'past_due' ? 'Past Due' :
                 sub.status === 'canceled' ? 'Canceled' :
                 sub.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold ml-2">${(sub.amount / 100).toFixed(2)}</span>
              </div>
              {sub.currentPeriodEnd && (
                <div>
                  <span className="text-gray-600">
                    {sub.status === 'canceled' ? 'Available until:' :
                     sub.cancelAtPeriodEnd ? 'Cancels on:' :
                     sub.plan?.planType === 'one_time' ? 'Valid until:' :
                     'Renews:'}
                  </span>
                  <span className="font-semibold ml-2">
                    {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
              )}
              {/* Show duration for one-time plans with end dates */}
              {sub.plan?.planType === 'one_time' && sub.plan?.endDate && (
                <div className="col-span-2">
                  <span className="text-gray-600">Course Duration:</span>
                  <span className="font-semibold ml-2">
                    {sub.plan.startDate ? new Date(sub.plan.startDate).toLocaleDateString() : 'TBD'} - {new Date(sub.plan.endDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {(() => {
              // Check if subscription has ended
              const hasEnded = sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) < new Date();
              const isOneTime = sub.plan?.planType === 'one_time';

              // Don't show any actions if subscription has ended or is one-time
              if (hasEnded || isOneTime) {
                if (hasEnded) {
                  return (
                    <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm">
                      ✓ Subscription period completed
                    </div>
                  );
                }
                return null;
              }

              // Only show cancel/reactivate for active recurring subscriptions
              return (
                <div className="flex flex-col gap-2">
                  {sub.status === 'canceled' ? (
                    <button
                      onClick={() => handleReactivateSubscription(sub.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Resubscribe
                    </button>
                  ) : sub.cancelAtPeriodEnd ? (
                    <div className="px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg text-orange-800 text-sm">
                      {sub.currentPeriodEnd
                        ? `⚠️ Subscription will cancel on ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`
                        : '⚠️ Subscription scheduled for cancellation'}
                    </div>
                ) : (sub.status === 'active' || sub.status === 'trialing') ? (
                  <button
                    onClick={() => handleCancelSubscription(sub.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel Subscription
                  </button>
                ) : null}
              </div>
            );
            })()}
          </div>
        ))
        )}
      </div>
    );
  };

  const renderPaymentHistory = () => (
    <div className="space-y-4">
      {myPayments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No payment history</h3>
          <p className="text-gray-600">Your payment records will appear here</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {myPayments.map(payment => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.paidAt
                      ? new Date(payment.paidAt).toLocaleDateString()
                      : new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    ${((payment.amountPaid || payment.amount || 0) / 100).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      payment.status === 'succeeded' ? 'bg-green-100 text-green-800' :
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {payment.status === 'succeeded' ? 'Paid' :
                       payment.status === 'pending' ? 'Pending' :
                       payment.status === 'failed' ? 'Failed' :
                       payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {payment.receiptUrl ? (
                      <a
                        href={payment.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Receipt
                      </a>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const allPlans = [...plans.basePlans, ...plans.events];
  const totalSelected = selectedPlans.reduce((sum, planId) => {
    const plan = allPlans.find(p => p.id === planId);
    return sum + (plan ? Number(plan.price) : 0);
  }, 0);

  // Count only active subscriptions (exclude incomplete)
  const activeSubscriptionsCount = mySubscriptions.filter(sub => sub.status !== 'incomplete').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Subscriptions & Payments</h1>
        <p className="text-gray-600 mt-2">Manage your children's subscriptions and view payment history</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('browse')}
          className={`pb-4 px-2 font-semibold ${
            activeTab === 'browse'
              ? 'border-b-2 border-purple-600 text-purple-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Browse Plans
        </button>
        <button
          onClick={() => setActiveTab('my-subscriptions')}
          className={`pb-4 px-2 font-semibold ${
            activeTab === 'my-subscriptions'
              ? 'border-b-2 border-purple-600 text-purple-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Active Subscriptions ({activeSubscriptionsCount})
        </button>
        <button
          onClick={() => setActiveTab('payment-history')}
          className={`pb-4 px-2 font-semibold ${
            activeTab === 'payment-history'
              ? 'border-b-2 border-purple-600 text-purple-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Payment History ({myPayments.length})
        </button>
      </div>

      {activeTab === 'browse' ? (
        <>
          {/* Student Selector */}
          <div id="student-selector" className="relative mb-8">
            <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-2xl shadow-2xl p-8 border border-purple-400">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 shadow-lg">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <label className="text-2xl font-bold text-white block">
                      Select Your Student
                    </label>
                    <p className="text-purple-100 text-sm mt-1">
                      Choose which student to enroll in a plan
                    </p>
                  </div>
                </div>
                {!selectedStudent && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-yellow-900 rounded-xl font-bold animate-bounce shadow-lg">
                    <AlertCircle className="w-5 h-5" />
                    <span>Required</span>
                  </div>
                )}
              </div>

              <div className="relative">
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className={`w-full px-6 py-4 border-3 rounded-xl focus:ring-4 focus:ring-white/50 bg-white text-gray-900 font-semibold text-lg shadow-xl transition-all appearance-none cursor-pointer ${
                    !selectedStudent
                      ? 'border-yellow-300 ring-2 ring-yellow-300/50'
                      : 'border-green-400 ring-2 ring-green-400/50'
                  }`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 1rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '3rem'
                  }}
                >
                  <option value="" className="text-gray-500">👤 Choose a student...</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id} className="text-gray-900 py-2">
                      {student.firstName} {student.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {selectedStudent ? (
                <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Currently Selected:</p>
                    <p className="text-lg font-bold text-gray-900">
                      {students.find(s => s.id === selectedStudent)?.firstName} {students.find(s => s.id === selectedStudent)?.lastName}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex items-start gap-3 px-4 py-3 bg-yellow-50/90 backdrop-blur-sm rounded-xl border-2 border-yellow-200">
                  <ArrowRight className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-900 font-medium">
                    Please select a student from the dropdown above to continue with your subscription
                  </p>
                </div>
              )}
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-2 -right-2 w-24 h-24 bg-yellow-400 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
            <div className="absolute -bottom-2 -left-2 w-32 h-32 bg-indigo-400 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
          </div>

          {/* Base Plans */}
          {plans.basePlans.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Base Plans</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.basePlans.map(renderPlanCard)}
              </div>
            </div>
          )}

          {/* Events */}
          {plans.events.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Events & Courses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.events.map(renderPlanCard)}
              </div>
            </div>
          )}

          {/* Checkout Bar */}
          {selectedPlans.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">1 plan selected</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${(totalSelected / 100).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {!selectedStudent && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">
                        Please select a student above
                      </span>
                    </div>
                  )}
                  <button
                    onClick={handleSubscribe}
                    disabled={!selectedStudent || subscribing}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-semibold shadow-lg transition-all min-w-[200px] justify-center"
                  >
                    {subscribing ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        Subscribe Now
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : activeTab === 'my-subscriptions' ? (
        renderMySubscriptions()
      ) : (
        renderPaymentHistory()
      )}
    </div>
  );
};

export default SubscriptionSelection;
