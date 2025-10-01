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
  RefreshCw
} from 'lucide-react';
import paymentService from '../../services/paymentService';
import parentsService from '../../services/parentsService';
import { showErrorToast, showSuccessToast } from '../../utils/toast';

const SubscriptionSelection = ({ user }) => {
  const [plans, setPlans] = useState({ basePlans: [], addOns: [], events: [], byCategory: {} });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
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
      showErrorToast('Please select a student');
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
      // Single plan subscription - redirects automatically in service
      await paymentService.subscribeStudentToPlan(selectedStudent, selectedPlanId);
    } catch (error) {
      console.error('Subscribe error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to subscribe';
      showErrorToast(errorMsg);
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
            {plan.billingInterval !== 'one_time' && (
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
            plan.planType === 'one_time' ? 'bg-green-100 text-green-800' :
            'bg-purple-100 text-purple-800'
          }`}>
            {plan.planType === 'recurring' ? 'Recurring' :
             plan.planType === 'one_time' ? 'One-Time' : 'Add-On'}
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
                     'Renews:'}
                  </span>
                  <span className="font-semibold ml-2">
                    {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Only show cancel/reactivate for recurring subscriptions (not one-time payments) */}
            {sub.plan && sub.plan.planType !== 'one_time' && (
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
            )}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.studentName || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.planName || 'N/A'}
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

  const allPlans = [...plans.basePlans, ...plans.addOns, ...plans.events];
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
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl shadow-md p-6 mb-6 border border-purple-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-purple-600 rounded-full p-2">
                <Users className="w-5 h-5 text-white" />
              </div>
              <label className="text-lg font-semibold text-gray-900">
                Select Student
              </label>
            </div>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 font-medium shadow-sm transition-all hover:border-purple-300"
            >
              <option value="" className="text-gray-500">👤 Choose a student...</option>
              {students.map(student => (
                <option key={student.id} value={student.id} className="text-gray-900">
                  {student.firstName} {student.lastName}
                </option>
              ))}
            </select>
            {selectedStudent && (
              <p className="mt-3 text-sm text-purple-700 font-medium">
                ✓ Selected: {students.find(s => s.id === selectedStudent)?.firstName} {students.find(s => s.id === selectedStudent)?.lastName}
              </p>
            )}
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

          {/* Add-Ons */}
          {plans.addOns.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Add-Ons</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.addOns.map(renderPlanCard)}
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
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">1 plan selected</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${(totalSelected / 100).toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={handleSubscribe}
                  disabled={!selectedStudent}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Subscribe Now
                  <ArrowRight className="w-5 h-5" />
                </button>
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
