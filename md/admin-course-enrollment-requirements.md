# Admin Course Enrollment Management - Requirements

## Context: Educational Platform Payment & Subscription System

### Current System Overview
- **Payment System**: Stripe integration for recurring and one-time payments
- **Subscription Plans**: Two types
  - **Recurring Plans**: Monthly/yearly base subscriptions (e.g., $50/month, $480/year)
  - **One-Time Plans**: Events, courses, workshops (e.g., $50 for Summer Quran Intensive)
- **Database Structure**:
  - `subscription_plans` table: Contains all available plans
  - `student_subscriptions` table: Tracks what each student has subscribed to and paid for
  - `payments` table: Payment records
  - Students can have multiple subscriptions (base plan + events/courses)

### What We Need: Admin Course Enrollment Dashboard

## Required Features

### 1. **Payment-Based Course Enrollment Tab**
**Purpose**: Help admin assign students to courses based on what they've paid for

**Key Functionality**:
- Show all students who have paid for specific courses/events but haven't been enrolled yet
- Display student payment history with course/event names
- One-click enrollment: Assign paid students to their respective courses
- Track enrollment status (Paid but Not Enrolled, Enrolled, Completed)

**Data to Display**:
```
Student Name | Paid For | Amount | Payment Date | Enrollment Status | Action
-------------|----------|--------|--------------|-------------------|--------
Ahmed Gamal  | Summer Quran Intensive | $50 | 10/3/2025 | Not Enrolled | [Enroll Now]
Sara Ali     | Islamic Studies Workshop | $50 | 10/2/2025 | Enrolled | [View Details]
```

### 2. **Course Financial Summary**
**Purpose**: Show profits and financial overview per course

**Metrics to Display**:
- **Total Revenue per Course/Event**
- **Number of Students Enrolled** (vs Paid)
- **Average Revenue per Student**
- **Payment Status Breakdown**:
  - Fully Paid Students
  - Partially Paid Students
  - Overdue Payments
- **Date Range Filter**: Show revenue for specific periods

**Example View**:
```
Course: Summer Quran Intensive 2025
- Total Revenue: $2,500
- Total Students Enrolled: 50
- Average per Student: $50
- Payment Status:
  ✓ Fully Paid: 48 students
  ⚠️ Partially Paid: 1 student
  ❌ Overdue: 1 student
- Revenue Trend: [Chart showing daily/weekly/monthly]
```

### 3. **Missing/Overdue Payments Tracker**
**Purpose**: Alert admin about payment issues

**What to Track**:
- Students enrolled in courses but haven't paid
- Subscription renewals that failed
- Students with "incomplete" payment status
- Recurring subscriptions that are past_due

**Alert Types**:
```
🔴 Critical: Student enrolled but no payment received (>7 days)
🟡 Warning: Payment failed, retry scheduled
🟢 Resolved: Payment completed after reminder
```

### 4. **Enrollment Decision Support**
**Purpose**: Help admin make informed enrollment decisions

**Information Needed**:
- **Course Capacity**: Max students vs current enrollment
- **Payment Completion Rate**: % of students who completed payment
- **Revenue Projections**: Expected income based on pending enrollments
- **Student Eligibility**: Which students qualify for which courses based on:
  - Payment status
  - Previous course completion
  - Subscription tier

### 5. **Bulk Actions**
- Enroll multiple students to a course at once
- Send payment reminders to students with pending payments
- Export financial reports (CSV/PDF)
- Mark students as "payment verified" after manual confirmation

## Technical Implementation Notes

### Data Sources
1. **From `student_subscriptions` table**:
   - Student ID, Plan ID, Payment status, Amount, Dates
   - Filter by `isPaid = true` to find paid students
   - Join with `students` and `subscription_plans` tables

2. **From Stripe API**:
   - Payment receipts (charge.receipt_url)
   - Payment intent metadata (studentName, planName)
   - Subscription status for recurring payments

### API Endpoints Needed
```typescript
// Get students who paid for a specific course but not enrolled
GET /api/admin/course-enrollment/pending?courseId={id}

// Get financial summary for a course
GET /api/admin/course-enrollment/summary?courseId={id}&startDate=&endDate=

// Get missing/overdue payments
GET /api/admin/course-enrollment/missing-payments

// Enroll student to course
POST /api/admin/course-enrollment/enroll
Body: { studentId, courseId, subscriptionId }

// Bulk enroll
POST /api/admin/course-enrollment/bulk-enroll
Body: { studentIds: [], courseId }
```

### UI Components Needed
1. **Course Selection Dropdown**: Filter by course/event
2. **Payment Status Filter**: All / Paid / Unpaid / Overdue
3. **Date Range Picker**: Filter by payment date
4. **Enrollment Status Badge**: Visual indicators
5. **Quick Action Buttons**: Enroll, Send Reminder, View Receipt
6. **Financial Charts**: Revenue trends, payment distribution
7. **Export Options**: Download reports as PDF/CSV

## User Flow Example

### Admin Use Case 1: Enrolling Students After Event Payment
1. Admin opens "Course Enrollment" tab
2. Selects "Summer Quran Intensive 2025" from dropdown
3. System shows list of students who paid for this event
4. Admin sees: "15 students paid but not enrolled"
5. Admin clicks "Bulk Enroll All Paid Students"
6. System assigns all 15 students to the course
7. Confirmation: "15 students successfully enrolled"

### Admin Use Case 2: Checking Course Profitability
1. Admin opens "Financial Summary" tab
2. Selects course and date range
3. Views:
   - Total revenue: $5,000
   - Expected revenue (pending payments): $1,000
   - Payment completion rate: 85%
4. Identifies 3 students with failed payments
5. Clicks "Send Payment Reminder" for those students

### Admin Use Case 3: Managing Missing Payments
1. Admin opens "Missing Payments" tab
2. Sees alert: "5 students enrolled but payment incomplete"
3. Reviews each case:
   - Student A: Payment intent failed (card declined)
   - Student B: Enrolled manually but no payment record
   - Student C: Partial payment received
4. Takes action:
   - Sends payment link to Student A
   - Creates manual payment record for Student B
   - Follows up with Student C's parent

## Database Schema Additions Needed

### Option 1: Add enrollment tracking to existing tables
```sql
ALTER TABLE student_subscriptions
ADD COLUMN is_enrolled BOOLEAN DEFAULT false,
ADD COLUMN enrolled_at TIMESTAMP,
ADD COLUMN course_id UUID REFERENCES courses(id);
```

### Option 2: Create new enrollment tracking table
```sql
CREATE TABLE course_enrollments (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  course_id UUID REFERENCES courses(id),
  subscription_id UUID REFERENCES student_subscriptions(id),
  enrolled_at TIMESTAMP,
  enrollment_status VARCHAR(50), -- pending, enrolled, completed, dropped
  created_at TIMESTAMP
);
```

## Success Metrics
- **Time to Enroll**: Reduce time from payment to enrollment from days to minutes
- **Payment Collection**: Increase payment completion rate from 85% to 95%
- **Revenue Visibility**: Real-time financial tracking per course
- **Error Reduction**: Eliminate students enrolled without payment
- **Admin Efficiency**: Handle 100+ enrollments in under 5 minutes

## Priority Order
1. ⭐ **High Priority**: Payment-based enrollment list (shows who paid for what)
2. ⭐ **High Priority**: Missing payments tracker
3. **Medium Priority**: Course financial summary
4. **Low Priority**: Revenue trend charts and projections
