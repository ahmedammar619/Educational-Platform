# Subscription Plan Setup - Simple Guide for Admin

## How the Payment System Works

### Money Flow (Where Payments Come From and Go To)

**From Parent → To Stripe → To Your Bank Account**

1. **Parent pays** using credit card on your website
2. **Stripe processes** the payment (they take a small fee: 2.9% + $0.30 per transaction)
3. **Money goes to your Stripe account**
4. **Stripe transfers to your bank account** (usually within 2-7 business days)

**Example**:
- Parent pays $100 for a course
- Stripe keeps $3.20 (fee)
- You receive $96.80 in your bank account

### Current Setup: Two Types of Plans

#### 1. **Recurring Plans (Subscriptions)**
- **How it works**: Parents pay monthly or yearly, automatically
- **Payment repeats**: Every month or every year until they cancel
- **Examples**:
  - Monthly Base Plan: $50/month
  - Yearly Base Plan: $480/year (saves $120 vs monthly)

**When to use**: For ongoing classes that run continuously (like base curriculum, regular tutoring)

#### 2. **One-Time Plans (Events/Courses)**
- **How it works**: Parents pay once for a specific event or course
- **Payment happens once**: No automatic renewal
- **Examples**:
  - Summer Quran Intensive: $50 (one-time)
  - Islamic Studies Workshop: $50 (one-time)

**When to use**: For temporary events, workshops, or fixed-duration courses

---

## How to Set Up a New Plan

### Step 1: Decide Plan Type
Ask yourself:
- **Is this ongoing?** → Use Recurring Plan
- **Is this a one-time event?** → Use One-Time Plan

### Step 2: Set Pricing
- **Monthly Recurring**: Good for regular classes ($50-200/month typical)
- **Yearly Recurring**: Offer discount vs monthly (e.g., 12 months for price of 10)
- **One-Time**: Price based on event duration and value

### Step 3: Add Plan Details
- **Name**: Clear and descriptive (e.g., "Monthly Quran Class")
- **Description**: What's included
- **Price**: In dollars (system converts to cents automatically)
- **Features**: List what students get

### Step 4: Set Enrollment Limits (Optional)
- **Max Students**: Cap enrollment (e.g., 30 students max)
- **Start/End Dates**: For events with specific dates
- **Leave blank**: For ongoing programs

---

## Current Setup: Is It Good Enough?

### ✅ **What's Working Well**
1. **Flexible Payment Options**: Monthly, yearly, or one-time
2. **Automatic Renewals**: Parents don't need to remember to pay each month
3. **Stripe Integration**: Secure, reliable payment processing
4. **Receipt Generation**: Automatic receipts for parents

### ⚠️ **What Could Be Better**

#### Problem 1: No 3-Month or 6-Month Options
**Current limitation**: Parents can only choose:
- Pay monthly (more expensive, 12 payments/year)
- Pay yearly (one big payment upfront)

**Better option would be**:
- 3-month plan: Pay quarterly (4 payments/year)
- 6-month plan: Pay semi-annually (2 payments/year)

**Why this helps**:
- Less commitment than yearly
- Fewer transactions than monthly
- Better cash flow planning for parents

#### Problem 2: Start/End Dates for Events Are Manual
**Current setup**: You manually set:
- Event start date: When workshop begins
- Event end date: When workshop ends

**The issue**: This doesn't automatically:
- Stop showing the event after it ends
- Remove students from "active" after completion
- Archive old events

**Better option would be**:
- Auto-archive events after end date
- Move students to "completed" status automatically

---

## Recommendations: Payment Structure Improvements

### 🎯 **Recommended: Add Quarterly Plans**

**Why add 3-month plans?**
1. **Lower barrier to entry**: $150 every 3 months vs $600/year
2. **Better retention**: Parents more likely to continue after 3 months
3. **Industry standard**: Many schools use quarterly billing

**How to implement**:
```
Example pricing structure:
- Monthly: $50/month ($600/year total)
- Quarterly: $140/3 months ($560/year - save $40)
- Yearly: $480/year (save $120)
```

### 📊 **Comparison: Payment Structures**

| Plan Type | Payment Frequency | Parent Pays | Your Revenue/Year | Parent Saves |
|-----------|------------------|-------------|-------------------|--------------|
| Monthly | 12x per year | $50 each time | $600 | $0 (baseline) |
| Quarterly | 4x per year | $140 each time | $560 | $40/year |
| Yearly | 1x per year | $480 one payment | $480 | $120/year |

**Best approach**: Offer all three, encourage yearly with biggest discount.

### 🔄 **For Events: Simplify Duration Management**

**Instead of manual start/end dates, use**:
1. **Duration-based**: "This course runs for 8 weeks"
2. **Auto-enrollment periods**: "Enrollment opens 2 weeks before start"
3. **Auto-completion**: Mark students complete after end date

**This means**:
- Less manual work for you
- Clearer for parents
- Automatic status updates

---

## What You Should Change Now

### Priority 1: Add Quarterly Billing Option ⭐⭐⭐
**What to do**:
1. Create new plan type: "3-Month Recurring"
2. Set billing interval to 3 months
3. Price it at slight discount vs monthly (e.g., $140 for 3 months vs $150)

**How this helps**:
- More parents can afford it (smaller chunks than yearly)
- More stable than monthly (fewer payment failures)
- Better cash flow predictability

### Priority 2: Auto-Archive Old Events ⭐⭐
**What to do**:
1. For events with end dates, automatically:
   - Hide from parent view after end date
   - Move to "Past Events" archive
   - Mark enrolled students as "Completed"

**How this helps**:
- Cleaner parent dashboard
- No confusion about past events
- Easier to track which students completed what

### Priority 3: Show Subscription End Info ⭐
**What to do**:
1. In Active Subscriptions tab, show:
   - "Valid until [date]" for one-time courses
   - "Cancels on [date]" if scheduled to cancel
   - "Auto-renews on [date]" for recurring

**How this helps**:
- Parents know exactly when their access ends
- No surprises when subscription stops
- Clear communication about renewals

---

## Quick Setup Checklist for New Plans

### For Ongoing Classes (Recurring)
- [ ] Choose billing: Monthly / Quarterly / Yearly
- [ ] Set price (offer discount for longer commitments)
- [ ] List features/benefits
- [ ] Set max students (if needed)
- [ ] Mark as "Base Plan" if it's core curriculum

### For Events/Workshops (One-Time)
- [ ] Set one-time price
- [ ] Add event dates (start and end)
- [ ] Set enrollment limit
- [ ] List what's included
- [ ] Mark as "Event" category

### After Creating Plan
- [ ] Test payment flow yourself
- [ ] Check receipt generation
- [ ] Verify Stripe dashboard shows payment
- [ ] Ensure students can access after payment

---

## Summary: Key Takeaways

### ✅ **Current System is Good For**:
- Secure payment processing (Stripe)
- Monthly and yearly subscriptions
- One-time event payments
- Automatic receipt generation

### 🔧 **Should Improve**:
1. **Add quarterly billing** (3-month and 6-month options)
2. **Auto-manage event lifecycles** (archive after end date)
3. **Show clear end dates** in parent dashboard
4. **Auto-update subscription status** when period ends

### 💡 **Next Steps**:
1. Add quarterly plan option (highest priority)
2. Implement auto-archiving for ended events
3. Update Active Subscriptions tab to show end dates
4. Consider semi-annual (6-month) option if quarterly works well

**Bottom line**: Your current setup is functional, but adding quarterly billing and better date management will make it significantly better for both parents and your admin team.
