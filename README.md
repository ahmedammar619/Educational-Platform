# Educational Platform - Comprehensive EdTech Solution

A full-stack educational technology platform that enables seamless online learning with integrated payment processing, live streaming, and content management. Led as **Project Manager** with personal implementation of the complete **payment system** and core integrations.

## Overview

This platform serves as a comprehensive solution for educational institutions, featuring role-based access for parents, students, teachers, and administrators. The system handles enrollment management, live streaming sessions, automated payment processing, and real-time analytics—all without requiring direct Stripe dashboard interaction. 

### Key Highlights

- **Advanced Payment System**: Complete Stripe integration with subscription management, automated invoicing, webhook event tracking, and real-time payment analytics
- **Live Streaming**: Integrated Zoom API for live sessions with automatic recording management
- **Cloud Storage**: Cloudflare R2 integration for scalable media storage and delivery
- **Video Distribution**: YouTube API integration for automated video uploads and distribution
- **Real-time Updates**: WebSocket-based notifications and live updates
- **Multi-role Dashboard**: Specialized interfaces for parents, students, teachers, and administrators

---

## Tech Stack

### Backend
- **Framework**: NestJS 10.0.0
- **Language**: TypeScript 5.1.3
- **Database**: PostgreSQL with TypeORM 0.3.17
- **Authentication**: JWT with Passport.js
- **Real-time**: Socket.io 4.8.1
- **Security**: Helmet, bcryptjs

### Frontend
- **Framework**: React 18.2.0
- **Build Tool**: Vite 7.1.7
- **Styling**: Tailwind CSS 3.4.17
- **State Management**: React Hooks
- **Calendar**: FullCalendar 6.1.19
- **Icons**: Lucide React 0.400.0
- **Notifications**: React Hot Toast 2.6.0

### Payment & Billing
- **Payment Gateway**: Stripe 18.5.0
- **Frontend SDK**: @stripe/react-stripe-js 4.0.0
- **Features**: Subscriptions, one-time payments, automated invoicing, webhook handling

### Integrations
- **Live Streaming**: Zoom Web SDK 2.18.3
- **Cloud Storage**: AWS SDK for Cloudflare R2
- **Video Platform**: Google APIs (YouTube) 159.0.0
- **Email**: Nodemailer 7.0.6

### Development Tools
- **Containerization**: Docker & Docker Compose
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest 29.5.0
- **Linting**: ESLint with Prettier

---

## Features

### Payment System (Stripe Integration)
- **Subscription Management**: Recurring monthly subscriptions with automatic renewal
- **One-time Payments**: Support for single course purchases
- **Automated Invoicing**: Automatic invoice generation and syncing with Stripe
- **Webhook Event Handling**: Real-time processing of 8+ Stripe event types:
  - `checkout.session.completed`
  - `payment_intent.succeeded` / `payment_intent.payment_failed`
  - `invoice.paid` / `invoice.payment_failed`
  - `customer.subscription.created/updated/deleted`
- **Payment Analytics**: Real-time dashboard with revenue tracking and payment statistics
- **Secure Checkout**: PCI-compliant Stripe Checkout integration
- **Payment History**: Detailed transaction records with receipt URLs
- **Subscription Control**: Cancel, reactivate, and manage subscriptions without Stripe dashboard

### User Roles & Capabilities

#### Parents
- Enroll children in courses and manage subscriptions
- View payment history and invoices
- Track child's progress and attendance
- Receive notifications for upcoming sessions

#### Students
- Access enrolled courses and materials
- Join live Zoom sessions
- View assignments and submit work
- Track personal progress

#### Teachers
- Create and manage course content
- Schedule and conduct live sessions
- Upload materials and assignments
- Track student attendance
- Manage course enrollments

#### Administrators
- Full platform control and oversight
- Payment analytics and revenue tracking
- User management (approve/suspend accounts)
- Course and content moderation
- System-wide notifications
- Webhook event monitoring

### Live Streaming & Video
- **Zoom Integration**: OAuth-based authentication for secure meeting creation
- **Automatic Recording**: Sessions recorded and stored in Cloudflare R2
- **YouTube Upload**: Automatic unlisted video distribution post-session
- **Recording Management**: Webhook handling for recording availability
- **Session Scheduling**: Calendar-based session management

### Course Management
- Course creation with detailed descriptions
- Category-based organization
- Student enrollment with capacity limits
- Material uploads (PDFs, documents, videos)
- Assignment creation and submission tracking
- Attendance tracking

### Real-time Notifications
- WebSocket-based live updates
- Payment confirmation notifications
- Session reminders
- Enrollment notifications
- System announcements

---

## Architecture

```
Educational-Platform/
├── backend/                # NestJS Backend API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── payments/       # Payment & subscription logic
│   │   │   ├── zoom/           # Zoom API integration
│   │   │   ├── youtube/        # YouTube API integration
│   │   │   ├── storage/        # Cloudflare R2 integration
│   │   │   ├── courses/        # Course management
│   │   │   ├── users/          # User management
│   │   │   └── notifications/  # WebSocket notifications
│   │   ├── common/
│   │   │   └── services/
│   │   │       └── stripe.service.ts  # Core Stripe service
│   │   └── entities/           # TypeORM entities
│   ├── Dockerfile
│   └── package.json
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── parent/         # Parent dashboard & payments
│   │   │   ├── student/        # Student portal
│   │   │   ├── teacher/        # Teacher interface
│   │   │   └── admin/          # Admin dashboard
│   │   ├── services/           # API services
│   │   └── components/         # Reusable components
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml      # Container orchestration
```

### Database Schema (20+ Tables)

**Core Entities**:
- `users` - User accounts with role-based access
- `students` - Student profiles linked to parent accounts
- `courses` - Course information and metadata
- `enrollments` - Student-course relationships

**Payment Entities**:
- `subscription_plans` - Available subscription tiers
- `student_subscriptions` - Active and historical subscriptions
- `payments` - Payment transaction records
- `invoices` - Stripe invoice synchronization
- `webhook_events` - Audit trail of Stripe webhooks

**Content Entities**:
- `zoom_meetings` - Scheduled sessions with recordings
- `materials` - Course materials and uploads
- `assignments` - Student assignments and submissions
- `attendance` - Session attendance tracking

---

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Docker & Docker Compose (optional)
- Stripe account with API keys
- Zoom account with JWT/OAuth credentials (optional)
- Google Cloud account with YouTube API enabled (optional)
- Cloudflare R2 bucket (optional)

### Environment Variables

Create `.env` files in both `backend/` and `frontend/` directories:

#### Backend `.env`
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=education_db

# Application
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Stripe (Required for Payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRODUCT_ID=prod_...
STRIPE_MONTHLY_PRICE_ID=price_...

# Cloudflare R2 (Optional)
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://your-bucket.r2.dev

# Zoom API (Optional)
ZOOM_ACCOUNT_ID=your_zoom_account_id
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret

# YouTube API (Optional)
YOUTUBE_API_KEY=your_youtube_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@yourplatform.com
```

#### Frontend `.env`
```env
VITE_API_URL=http://localhost:3000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Installation Steps

#### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd Educational-Platform

# Configure environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The application will be available at:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- API Documentation: http://localhost:3000/api/docs

#### Option 2: Manual Installation

**Backend Setup**:
```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run migration:run

# Seed database (optional)
npm run seed

# Start development server
npm run start:dev
```

**Frontend Setup**:
```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

---

## Usage

### Setting Up Stripe Integration

1. **Create Stripe Account**: Sign up at [stripe.com](https://stripe.com)

2. **Get API Keys**:
   - Navigate to Developers → API Keys
   - Copy Secret Key and Publishable Key to `.env`

3. **Create Product & Price**:
   ```bash
   # Use Stripe Dashboard or CLI
   stripe products create --name "Monthly Subscription"
   stripe prices create --product=<PRODUCT_ID> --unit-amount=2000 --currency=usd --recurring[interval]=month
   ```

4. **Configure Webhooks**:
   - Go to Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/payments/webhook`
   - Select events: All payment-related events
   - Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

5. **Test Locally with Stripe CLI**:
   ```bash
   stripe listen --forward-to localhost:3000/api/payments/webhook
   ```

### Running Database Migrations

```bash
cd backend

# Generate new migration after entity changes
npm run migration:generate

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

### API Documentation

Once the backend is running, access interactive API documentation:
- **Swagger UI**: http://localhost:3000/api/docs

Key API Endpoints:
- `POST /api/auth/login` - User authentication
- `POST /api/payments/create-checkout` - Create Stripe checkout session
- `POST /api/payments/webhook` - Stripe webhook handler
- `GET /api/payments/subscriptions` - List user subscriptions
- `GET /api/courses` - List available courses
- `POST /api/zoom/create-meeting` - Create Zoom session

---

## Payment System Architecture

### Payment Flow

```
1. Parent selects subscription plan
   ↓
2. Frontend creates checkout session via API
   ↓
3. User redirected to Stripe Checkout
   ↓
4. User completes payment
   ↓
5. Stripe sends webhook to backend
   ↓
6. Webhook handler processes event:
   - Updates subscription status
   - Creates payment record
   - Activates student enrollment
   - Generates invoice
   ↓
7. User redirected back to platform with success
   ↓
8. Frontend displays confirmation & updates UI
```

### Webhook Event Processing

The system handles these Stripe events automatically:

- **checkout.session.completed**: Activates subscription and creates payment record
- **payment_intent.succeeded**: Confirms successful payment
- **payment_intent.payment_failed**: Marks payment as failed
- **invoice.paid**: Records recurring payment
- **invoice.payment_failed**: Updates subscription to past_due
- **customer.subscription.updated**: Syncs subscription status and billing dates
- **customer.subscription.deleted**: Marks subscription as canceled

### Payment Security

- PCI-compliant Stripe Checkout (no card data touches your server)
- Webhook signature verification for all events
- JWT-based API authentication
- CORS protection with whitelisted origins
- Rate limiting on payment endpoints
- Secure environment variable management

---

## Development

### Scripts

**Backend**:
```bash
npm run start:dev      # Development mode with hot reload
npm run build          # Production build
npm run start:prod     # Run production build
npm run test           # Run tests
npm run migration:generate  # Generate migration
```

**Frontend**:
```bash
npm run dev            # Development server
npm run build          # Production build
npm run preview        # Preview production build
npm run lint           # Run ESLint
```

**Docker**:
```bash
npm run docker:up      # Start containers
npm run docker:down    # Stop containers
npm run docker:logs    # View logs
```

### Testing

```bash
# Backend unit tests
cd backend
npm run test

# Backend e2e tests
npm run test:e2e

# Frontend tests
cd frontend
npm run test
```

---

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Update `JWT_SECRET` with strong random value
- [ ] Use production Stripe API keys
- [ ] Configure production webhook endpoints
- [ ] Set up SSL/TLS certificates
- [ ] Configure CORS for production domain
- [ ] Set up database backups
- [ ] Enable database SSL connections
- [ ] Configure email service (SMTP)
- [ ] Set up monitoring and logging
- [ ] Configure Cloudflare R2 with CDN
- [ ] Set up environment-specific configurations

### Docker Production Deployment

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production containers
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## Monitoring & Maintenance

### Webhook Event Monitoring

All Stripe webhook events are logged in the `webhook_events` table for audit purposes. Administrators can view these events in the admin dashboard.

### Payment Analytics

The admin dashboard provides real-time analytics:
- Total revenue (daily, monthly, yearly)
- Active subscriptions count
- Payment success/failure rates
- Subscription churn analysis
- Top-performing courses

### Database Maintenance

```bash
# Backup database
pg_dump -U postgres education_db > backup.sql

# Restore database
psql -U postgres education_db < backup.sql
```

---

## Troubleshooting

### Common Issues

**Payment webhook not received**:
- Verify webhook endpoint is publicly accessible
- Check webhook secret matches Stripe dashboard
- Review Stripe Dashboard → Developers → Webhooks for failed attempts

**Zoom meetings not creating**:
- Verify Zoom OAuth credentials are correct
- Ensure Zoom account has meeting creation permissions
- Check Zoom API rate limits

**File uploads failing**:
- Verify Cloudflare R2 credentials and bucket access
- Check bucket CORS configuration
- Ensure bucket has sufficient storage

**Authentication errors**:
- Verify JWT_SECRET is set correctly
- Check token expiration settings
- Review CORS configuration

---

## Contributing

This project was developed as a comprehensive EdTech solution. For questions or collaboration opportunities, please reach out.

---

## License

MIT License - See LICENSE file for details

---

## Acknowledgments

- **Stripe** - Payment processing and subscription management
- **Zoom** - Video conferencing and live streaming
- **Cloudflare** - R2 cloud storage
- **Google** - YouTube API for video distribution
- **NestJS** - Backend framework
- **React** - Frontend framework

---

## Contact & Support

For technical support or business inquiries, please contact the development team.

**Project Status**: Production-Ready ✅

**Current Branch**: stripe (Payment System Implementation)

---

*Built with TypeScript, NestJS, React, PostgreSQL, Stripe, Zoom, and Cloudflare R2*
