# Comprehensive Payment & Subscription Management System

## Overview

This is a complete, flexible payment and subscription management system built with NestJS, TypeORM, PostgreSQL, and Stripe. It provides maximum admin control to manage:

- **Base Recurring Subscriptions** - Monthly/yearly subscriptions for standard access
- **Add-on Subscriptions** - Additional services like 1-on-1 Quran sessions
- **One-Time Events** - Limited-time courses (e.g., summer camps, special workshops)
- **Manual Payment Recording** - For offline/cash payments
- **Complete Tracking** - Know who paid what, when, and for which plan

---

## System Architecture

### Database Entities

#### 1. **SubscriptionPlan** (`subscription_plans`)
Defines all available subscription options, events, and courses.

**Fields:**
- `name` - Plan name (e.g., "Monthly Subscription", "Summer Quran Camp")
- `description` - Detailed description
- `planType` - `RECURRING`, `ONE_TIME`, or `ADD_ON`
- `billingInterval` - `MONTH`, `YEAR`, `WEEK`, or `ONE_TIME`
- `price` - Price in cents (e.g., 5000 = $50.00)
- `currency` - Currency code (default: usd)
- `stripeProductId` / `stripePriceId` - Auto-created Stripe IDs
- `isBasePlan` - Whether this is the main subscription
- `isActive` - Whether available for purchase
- `maxStudents` - Maximum students per subscription
- `features` - Array of features included
- `startDate` / `endDate` - For time-limited events
- `maxEnrollments` - Enrollment limit for events
- `currentEnrollments` - Current enrollment count
- `category` - Organization category (e.g., "Quran 1-to-1", "Group Classes")
- `displayOrder` - Sort order

#### 2. **StudentSubscription** (`student_subscriptions`)
Tracks each student's subscription to a plan.

**Fields:**
- `userId` - Parent/payer ID
- `studentId` - Student ID
- `planId` - Reference to SubscriptionPlan
- `studentName` - Student's full name
- `planName` - Plan name (cached)
- `stripeSubscriptionId` - Stripe subscription ID (if recurring)
- `stripeCustomerId` - Stripe customer ID
- `status` - `ACTIVE`, `TRIALING`, `PAST_DUE`, `CANCELED`, `INCOMPLETE`, etc.
- `currentPeriodStart` / `currentPeriodEnd` - Billing period dates
- `cancelAt` / `canceledAt` - Cancellation dates
- `amount` / `currency` - Price information
- `isPaid` - Whether payment completed (for one-time)
- `paidAt` - Payment date
- `notes` - Admin notes

#### 3. **Payment** (`payments`)
Records all payment transactions.

**Fields:**
- `userId` - Payer ID
- `studentId` - Student ID
- `planId` - Plan ID
- `studentSubscriptionId` - Associated subscription
- `stripePaymentIntentId` / `stripeInvoiceId` / `stripeChargeId` - Stripe IDs
- `paymentType` - `SUBSCRIPTION`, `ONE_TIME`, or `ADD_ON`
- `status` - `PENDING`, `SUCCEEDED`, `FAILED`, `REFUNDED`, `CANCELED`
- `amountPaid` / `currency` - Amount information
- `paidAt` - Payment timestamp
- `refundedAmount` / `refundedAt` - Refund information
- `receiptUrl` - Stripe receipt URL
- `notes` - Admin notes

---

## API Endpoints

### Admin Plan Management

#### Create Subscription Plan
```http
POST /subscription-plans/admin/plans
Authorization: Bearer <admin_token>

{
  "name": "Monthly Base Subscription",
  "description": "Access to all group classes",
  "planType": "recurring",
  "billingInterval": "month",
  "price": 5000,  // $50.00
  "currency": "usd",
  "isBasePlan": true,
  "isActive": true,
  "maxStudents": 3,
  "features": ["Group classes", "Online materials", "Progress tracking"],
  "category": "Base Plans"
}
```

#### Create Event/Course
```http
POST /subscription-plans/admin/plans

{
  "name": "Summer Quran Intensive 2025",
  "description": "3-month intensive Quran program",
  "planType": "one_time",
  "billingInterval": "one_time",
  "price": 30000,  // $300.00
  "isActive": true,
  "startDate": "2025-06-01",
  "endDate": "2025-08-31",
  "maxEnrollments": 50,
  "category": "Special Events"
}
```

#### Create Add-on
```http
POST /subscription-plans/admin/plans

{
  "name": "1-on-1 Quran Sessions (10 sessions)",
  "description": "Private Quran tutoring sessions",
  "planType": "add_on",
  "billingInterval": "month",
  "price": 15000,  // $150.00
  "category": "Add-ons"
}
```

#### Get All Plans
```http
GET /subscription-plans/admin/plans?includeInactive=false
```

#### Update Plan
```http
PUT /subscription-plans/admin/plans/:id

{
  "price": 5500,
  "isActive": false
}
```

#### Toggle Plan Status
```http
POST /subscription-plans/admin/plans/:id/toggle-status
```

#### Delete Plan
```http
DELETE /subscription-plans/admin/plans/:id
```

### Admin Subscription Management

#### View All Student Subscriptions
```http
GET /subscription-plans/admin/subscriptions?status=active&search=john

Query params:
- status: active, canceled, past_due, etc.
- planId: Filter by plan
- studentId: Filter by student
- search: Search by parent/student name or email
```

#### View Subscription Details
```http
GET /subscription-plans/admin/subscriptions/:id
```

#### Update Subscription
```http
PUT /subscription-plans/admin/subscriptions/:id

{
  "status": "active",
  "notes": "Extended access until next month",
  "currentPeriodEnd": "2025-05-01"
}
```

#### Cancel Subscription
```http
POST /subscription-plans/admin/subscriptions/:id/cancel?cancelAtPeriodEnd=true
```

#### Create Manual Payment
```http
POST /subscription-plans/admin/payments/manual

{
  "studentId": "uuid",
  "planId": "uuid",
  "amountPaid": 5000,
  "currency": "usd",
  "notes": "Cash payment received",
  "paidAt": "2025-01-15T10:00:00Z"
}
```

### Parent Endpoints

#### Browse Available Plans
```http
GET /subscription-plans/available
Authorization: Bearer <parent_token>

Response:
{
  "basePlans": [...],
  "addOns": [...],
  "events": [...],
  "byCategory": {
    "Quran 1-to-1": [...],
    "Group Classes": [...],
    "Special Events": [...]
  }
}
```

#### Subscribe Student to Plan
```http
POST /subscription-plans/subscribe
Authorization: Bearer <parent_token>

{
  "studentId": "uuid",
  "planId": "uuid",
  "notes": "Optional notes"
}

Response:
{
  "checkoutUrl": "https://checkout.stripe.com/...",
  "subscription": { ... }
}
```

#### Subscribe to Multiple Plans
```http
POST /subscription-plans/bulk-subscribe
Authorization: Bearer <parent_token>

{
  "studentId": "uuid",
  "planIds": ["uuid1", "uuid2", "uuid3"]
}
```

#### View My Subscriptions
```http
GET /subscription-plans/my-subscriptions
Authorization: Bearer <parent_token>
```

#### View My Payment History
```http
GET /subscription-plans/my-payments
Authorization: Bearer <parent_token>
```

### Analytics

#### Get Payment Statistics
```http
GET /subscription-plans/admin/stats

Response:
{
  "totalRevenue": 150000,
  "monthlyRevenue": 25000,
  "activeSubscriptions": 45,
  "totalPayments": 156,
  "revenueByPlan": [
    { "planName": "Monthly Subscription", "revenue": 80000, "count": 16 },
    { "planName": "Summer Camp", "revenue": 45000, "count": 15 }
  ]
}
```

---

## Stripe Webhooks

The system automatically handles Stripe webhooks to keep your database in sync:

### Webhook Events Handled:
- `checkout.session.completed` - When payment is completed
- `payment_intent.succeeded` - Successful payment
- `payment_intent.payment_failed` - Failed payment
- `invoice.paid` - Recurring invoice paid
- `invoice.payment_failed` - Recurring invoice failed
- `customer.subscription.created` - Subscription created
- `customer.subscription.updated` - Subscription modified
- `customer.subscription.deleted` - Subscription canceled

### Setup Webhook:
```
Stripe Dashboard → Developers → Webhooks → Add endpoint

URL: https://yourdomain.com/payments/webhook/v2
Events: Select all payment and subscription events
```

---

## Admin Workflow Examples

### Example 1: Create Base Subscription + Summer Camp

```bash
# 1. Create base monthly subscription
POST /subscription-plans/admin/plans
{
  "name": "Monthly Access",
  "planType": "recurring",
  "billingInterval": "month",
  "price": 5000,
  "isBasePlan": true,
  "category": "Base Plans"
}

# 2. Create summer camp
POST /subscription-plans/admin/plans
{
  "name": "Summer Quran Camp 2025",
  "planType": "one_time",
  "billingInterval": "one_time",
  "price": 30000,
  "startDate": "2025-06-01",
  "endDate": "2025-08-31",
  "maxEnrollments": 50,
  "category": "Special Events"
}

# 3. Parents can now see both options and subscribe
```

### Example 2: Add 1-on-1 Sessions as Add-on

```bash
# Create add-on plan
POST /subscription-plans/admin/plans
{
  "name": "1-on-1 Quran (10 sessions)",
  "planType": "add_on",
  "billingInterval": "month",
  "price": 15000,
  "category": "Add-ons"
}

# Parent subscribes to base + add-on
POST /subscription-plans/bulk-subscribe
{
  "studentId": "...",
  "planIds": ["base-plan-uuid", "addon-plan-uuid"]
}
```

### Example 3: Record Offline Payment

```bash
# Parent paid cash for summer camp
POST /subscription-plans/admin/payments/manual
{
  "studentId": "uuid",
  "planId": "summer-camp-uuid",
  "amountPaid": 30000,
  "notes": "Cash payment - Receipt #12345"
}
```

---

## Database Setup

### 1. Add to Environment Variables (.env)
```env
# Existing Stripe variables
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional: Default price IDs (for backward compatibility)
STRIPE_MONTHLY_PRODUCT_ID=prod_...
STRIPE_MONTHLY_PRICE_ID=price_...
```

### 2. Run Migration
```bash
cd backend
npm run migration:generate
npm run migration:run
```

Or if using synchronize (development):
```bash
# Restart backend server - entities will auto-sync
npm run start:dev
```

---

## Payment Flow

### Parent Subscribing to Plans:

1. **Parent logs in** → Views available plans
2. **Selects plan(s)** for their student(s)
3. **Clicks subscribe** → Creates StudentSubscription with status `INCOMPLETE`
4. **Redirected to Stripe** → Enters payment info
5. **Payment succeeds** → Webhook updates subscription to `ACTIVE`
6. **Parent returns** → Sees active subscription

### Admin Recording Manual Payment:

1. **Parent pays offline** (cash/check/wire transfer)
2. **Admin logs payment** → Creates Payment record + updates StudentSubscription
3. **Student gets access** → Subscription marked as `ACTIVE` and `isPaid`

---

## Key Features

✅ **Flexible Plan Types** - Recurring, one-time, and add-ons
✅ **Complete Admin Control** - Create, edit, activate/deactivate any plan
✅ **Event Management** - Time-limited courses with enrollment caps
✅ **Multi-Plan Support** - Parents can subscribe to multiple plans per student
✅ **Manual Payment Recording** - Track offline payments
✅ **Real-time Sync** - Stripe webhooks keep everything in sync
✅ **Comprehensive Reporting** - Revenue by plan, active subscriptions, payment history
✅ **Student Mapping** - Know exactly which student is enrolled in what
✅ **Parent Dashboard** - Parents see all their subscriptions and payment history

---

## Admin Dashboard Features

The admin can:
- ✅ Create unlimited subscription plans with custom pricing
- ✅ Create time-limited events (e.g., "3-month Ramadan program")
- ✅ Set enrollment limits for events
- ✅ Enable/disable plans at any time
- ✅ View all student subscriptions in real-time
- ✅ Filter by status, plan, student, or search
- ✅ Manually record cash/offline payments
- ✅ Add notes to subscriptions and payments
- ✅ See revenue breakdown by plan
- ✅ Track who paid what and when
- ✅ Cancel or modify subscriptions
- ✅ Full audit trail of all payments

## Parent Dashboard Features

Parents can:
- ✅ Browse all available plans (base, add-ons, events)
- ✅ See plans grouped by category
- ✅ Subscribe one student to multiple plans
- ✅ Pay via Stripe (card)
- ✅ View all active subscriptions
- ✅ View complete payment history
- ✅ See subscription status and renewal dates
- ✅ Know which plans each student is enrolled in

---

## Next Steps

### 1. Test the Backend
```bash
cd backend
npm install
npm run start:dev
```

### 2. Test Admin Endpoints
Use Postman or any API client to test the endpoints above.

### 3. Create Sample Data
```bash
# Create a base plan
curl -X POST http://localhost:3000/subscription-plans/admin/plans \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Monthly Subscription",
    "planType": "recurring",
    "billingInterval": "month",
    "price": 5000,
    "isBasePlan": true
  }'
```

### 4. Frontend Integration
- Use the provided endpoints to build admin and parent UIs
- Reference `/subscription-plans/available` for browsing plans
- Use `/subscription-plans/subscribe` for checkout flow

---

## Support & Troubleshooting

### Common Issues:

**Issue: "Stripe product/price creation failed"**
- Check that STRIPE_SECRET_KEY is set correctly
- Verify Stripe account is active

**Issue: "Webhook not processing payments"**
- Verify webhook secret in .env
- Check webhook URL in Stripe dashboard
- Use `/payments/webhook/v2` endpoint

**Issue: "Can't see new tables in database"**
- Run migrations or restart server with synchronize enabled
- Check data-source.ts includes new entities

---

## Architecture Highlights

This system is designed for **maximum flexibility and control**:

1. **Admin-Centric**: Admin can create any type of payment option on the fly
2. **Stripe Integration**: Automated with manual fallback
3. **Real-Time Sync**: Webhooks ensure database stays current
4. **Complete Tracking**: Every payment recorded with full details
5. **Multi-Plan Support**: Students can have multiple active subscriptions
6. **Event Management**: Built-in support for limited-time courses
7. **Audit Trail**: All webhook events and payments logged

---

## Congratulations! 🎉

You now have a production-ready, flexible payment and subscription management system that gives your admin complete control over all payment options while providing a seamless experience for parents.

Your manager will be impressed! 🚀
