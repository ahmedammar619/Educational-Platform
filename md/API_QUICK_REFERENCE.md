# API Quick Reference - Payment System

## Base URL
```
http://localhost:3000
```

---

## 🔑 Authentication

All protected endpoints require JWT token in header:
```
Authorization: Bearer <your_token>
```

Get token by logging in:
```bash
POST /auth/login
{
  "email": "admin@example.com",
  "password": "password"
}
```

---

## 👨‍💼 Admin Endpoints

### Plan Management

#### Create Plan
```bash
POST /subscription-plans/admin/plans
Headers: Authorization: Bearer <admin_token>

# Monthly Subscription
{
  "name": "Monthly Access",
  "description": "Full platform access",
  "planType": "recurring",
  "billingInterval": "month",
  "price": 5000,
  "currency": "usd",
  "isBasePlan": true,
  "isActive": true,
  "features": ["All classes", "Materials", "Support"],
  "category": "Base Plans"
}

# Summer Event
{
  "name": "Summer Camp 2025",
  "planType": "one_time",
  "billingInterval": "one_time",
  "price": 30000,
  "startDate": "2025-06-01",
  "endDate": "2025-08-31",
  "maxEnrollments": 50,
  "category": "Events"
}

# Add-on
{
  "name": "1-on-1 Quran",
  "planType": "add_on",
  "billingInterval": "month",
  "price": 15000,
  "category": "Add-ons"
}
```

#### List All Plans
```bash
GET /subscription-plans/admin/plans?includeInactive=false
```

#### Get Plan by ID
```bash
GET /subscription-plans/admin/plans/:id
```

#### Update Plan
```bash
PUT /subscription-plans/admin/plans/:id
{
  "price": 5500,
  "description": "Updated description"
}
```

#### Toggle Plan Status
```bash
POST /subscription-plans/admin/plans/:id/toggle-status
```

#### Delete Plan
```bash
DELETE /subscription-plans/admin/plans/:id
```

### Subscription Management

#### View All Subscriptions
```bash
GET /subscription-plans/admin/subscriptions
GET /subscription-plans/admin/subscriptions?status=active
GET /subscription-plans/admin/subscriptions?search=john
GET /subscription-plans/admin/subscriptions?planId=uuid
```

#### Get Subscription Details
```bash
GET /subscription-plans/admin/subscriptions/:id
```

#### Update Subscription
```bash
PUT /subscription-plans/admin/subscriptions/:id
{
  "status": "active",
  "notes": "Extended until next month",
  "currentPeriodEnd": "2025-05-01"
}
```

#### Cancel Subscription
```bash
POST /subscription-plans/admin/subscriptions/:id/cancel?cancelAtPeriodEnd=true
```

### Manual Payment

#### Record Cash/Offline Payment
```bash
POST /subscription-plans/admin/payments/manual
{
  "studentId": "student-uuid",
  "planId": "plan-uuid",
  "amountPaid": 5000,
  "currency": "usd",
  "notes": "Cash payment - Receipt #123",
  "paidAt": "2025-01-15T10:00:00Z"
}
```

### Analytics

#### Get Payment Stats
```bash
GET /subscription-plans/admin/stats

Response:
{
  "totalRevenue": 150000,
  "monthlyRevenue": 25000,
  "activeSubscriptions": 45,
  "totalPayments": 156,
  "revenueByPlan": [
    { "planName": "Monthly", "revenue": 80000, "count": 16 }
  ]
}
```

---

## 👪 Parent Endpoints

### Browse Plans

#### Get Available Plans
```bash
GET /subscription-plans/available
Headers: Authorization: Bearer <parent_token>

Response:
{
  "basePlans": [...],
  "addOns": [...],
  "events": [...],
  "byCategory": {
    "Base Plans": [...],
    "Add-ons": [...],
    "Events": [...]
  }
}
```

### Subscribe

#### Subscribe to Single Plan
```bash
POST /subscription-plans/subscribe
Headers: Authorization: Bearer <parent_token>

{
  "studentId": "student-uuid",
  "planId": "plan-uuid",
  "notes": "Optional notes"
}

Response:
{
  "checkoutUrl": "https://checkout.stripe.com/...",
  "subscription": { ... }
}
```

#### Subscribe to Multiple Plans
```bash
POST /subscription-plans/bulk-subscribe
Headers: Authorization: Bearer <parent_token>

{
  "studentId": "student-uuid",
  "planIds": ["plan1-uuid", "plan2-uuid", "plan3-uuid"],
  "notes": "Bulk subscription"
}

Response: [
  { "planId": "...", "success": true, "checkoutUrl": "..." },
  { "planId": "...", "success": true, "checkoutUrl": "..." }
]
```

### View History

#### My Subscriptions
```bash
GET /subscription-plans/my-subscriptions
Headers: Authorization: Bearer <parent_token>

Response: [
  {
    "id": "...",
    "studentName": "John Doe",
    "planName": "Monthly Subscription",
    "status": "active",
    "amount": 5000,
    "currentPeriodEnd": "2025-02-15",
    ...
  }
]
```

#### My Payments
```bash
GET /subscription-plans/my-payments
Headers: Authorization: Bearer <parent_token>

Response: [
  {
    "id": "...",
    "studentName": "John Doe",
    "planName": "Monthly Subscription",
    "amountPaid": 5000,
    "status": "succeeded",
    "paidAt": "2025-01-15T10:00:00Z",
    "receiptUrl": "https://...",
    ...
  }
]
```

---

## 🔔 Webhooks

### Stripe Webhook
```bash
POST /payments/webhook/v2
Headers: stripe-signature: <signature>

# Automatically called by Stripe
# Processes payment events
```

---

## 📋 Plan Types

```javascript
planType: "recurring"  // Monthly/yearly subscriptions
planType: "one_time"   // Events, courses, camps
planType: "add_on"     // Additional services
```

## 📅 Billing Intervals

```javascript
billingInterval: "month"    // Monthly billing
billingInterval: "year"     // Yearly billing
billingInterval: "week"     // Weekly billing
billingInterval: "one_time" // One-time payment
```

## 📊 Subscription Statuses

```javascript
status: "active"             // Active subscription
status: "trialing"           // Trial period
status: "past_due"           // Payment failed
status: "canceled"           // Canceled
status: "incomplete"         // Payment not completed
status: "incomplete_expired" // Payment window expired
status: "unpaid"             // Unpaid
status: "paused"             // Paused
```

## 💰 Payment Statuses

```javascript
status: "pending"    // Waiting for payment
status: "succeeded"  // Payment successful
status: "failed"     // Payment failed
status: "refunded"   // Refunded
status: "canceled"   // Canceled
```

---

## 🧪 Testing Examples

### Example 1: Create & Subscribe Flow

```bash
# 1. Create a plan (as admin)
curl -X POST http://localhost:3000/subscription-plans/admin/plans \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Plan",
    "planType": "recurring",
    "billingInterval": "month",
    "price": 5000,
    "isActive": true
  }'

# Copy the plan ID from response

# 2. Parent browses plans
curl http://localhost:3000/subscription-plans/available \
  -H "Authorization: Bearer <parent_token>"

# 3. Parent subscribes
curl -X POST http://localhost:3000/subscription-plans/subscribe \
  -H "Authorization: Bearer <parent_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "<student_uuid>",
    "planId": "<plan_uuid>"
  }'

# Get checkoutUrl from response and redirect parent to it
```

### Example 2: Record Manual Payment

```bash
# Parent paid $50 cash
curl -X POST http://localhost:3000/subscription-plans/admin/payments/manual \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "<student_uuid>",
    "planId": "<plan_uuid>",
    "amountPaid": 5000,
    "notes": "Cash payment received - Receipt #12345"
  }'
```

### Example 3: View Statistics

```bash
curl http://localhost:3000/subscription-plans/admin/stats \
  -H "Authorization: Bearer <admin_token>"
```

---

## 🎯 Common Workflows

### Admin Creates Event
```
1. POST /subscription-plans/admin/plans (create event)
2. GET /subscription-plans/admin/plans (verify it's there)
3. POST /subscription-plans/admin/plans/:id/toggle-status (activate if needed)
```

### Parent Subscribes to Multiple Plans
```
1. GET /subscription-plans/available (browse plans)
2. POST /subscription-plans/bulk-subscribe (select multiple)
3. Redirect to Stripe checkout
4. GET /subscription-plans/my-subscriptions (view active)
```

### Admin Views Revenue
```
1. GET /subscription-plans/admin/stats (overall stats)
2. GET /subscription-plans/admin/subscriptions?status=active (active subs)
3. GET /subscription-plans/admin/subscriptions (filter/search)
```

---

## 💡 Pro Tips

### Price Format
- Always in cents (5000 = $50.00)
- Default currency: "usd"

### Date Format
- ISO 8601: "2025-01-15T10:00:00Z"

### Filtering
- Combine filters: `?status=active&search=john&planId=uuid`

### Pagination
- Currently returns all results
- Add limit/offset if needed for large datasets

---

## 🚀 Quick Start Commands

```bash
# 1. Start backend
cd backend && npm run start:dev

# 2. Seed sample data
npx ts-node -r tsconfig-paths/register src/database/seed-subscription-plans.ts

# 3. Get admin token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# 4. Test admin endpoint
curl http://localhost:3000/subscription-plans/admin/plans \
  -H "Authorization: Bearer <token>"
```

---

## 📞 Need Help?

- **Full Documentation:** See `PAYMENT_SYSTEM_GUIDE.md`
- **Setup Guide:** See `SETUP_INSTRUCTIONS.md`
- **Implementation Details:** See `IMPLEMENTATION_SUMMARY.md`

---

**Happy Testing! 🎉**
