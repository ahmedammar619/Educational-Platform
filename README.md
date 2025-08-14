# Baraem Al-Noor Educational Platform (براعم النور)

A comprehensive Islamic Learning Management System (LMS) designed to nurture young hearts with Islamic knowledge through Quran memorization, Arabic language learning, and Islamic studies.

## 🌟 Current Features

### 🏠 Public Homepage
- **Clean Landing Page**: Welcoming introduction to Islamic educational services
- **No Authentication Required**: Public access to learn about the platform
- **Islamic-Themed Design**: Child-friendly colors and Islamic-inspired aesthetics
- **Responsive Layout**: Optimized for desktop, tablet, and mobile devices
- **SEO Optimized**: Proper meta tags and structured content

### 📚 Educational Programs Showcase
- **Quran Memorization**: Structured Hifz programs with proper Tajweed
- **Arabic Language Learning**: Interactive reading, writing, and comprehension
- **Islamic Studies**: Comprehensive Islamic education and moral values
- **Age-Appropriate Learning**: Programs for ages 4-16 with different levels

### 🎨 Design Features
- **Islamic Aesthetics**: Green, blue, and purple color scheme
- **Child-Friendly Interface**: Engaging animations and welcoming design
- **Accessibility Compliant**: Proper focus states and semantic HTML
- **Modern UI/UX**: Clean, professional appearance with smooth animations

## 🛠 Technology Stack

- **Frontend**: React 18 with Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: PostgreSQL (External)
- **Containerization**: Docker & Docker Compose
- **Styling**: Tailwind CSS with custom Islamic-themed components
- **SEO**: React Helmet for meta management

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Access to external PostgreSQL database

### Environment Configuration
The platform is pre-configured with:
- **Database**: baraem @ j2zr.your-database.de
- **Zoom Integration**: Account ID, Client ID, and Secret configured
- **Ports**: Frontend (3000), Backend (5001)

### Installation & Running

```bash
# 1. Clone the repository
git clone <repository-url>
cd baraem-al-noor-platform

# 2. Start the application with Docker
docker-compose up --build

# 3. Initialize the database (run once)
docker-compose exec backend ./scripts/init-db.sh

# 4. Access the application
# Homepage: http://localhost:3000
# Backend Health: http://localhost:5001/api/health
```

### Docker Management Commands
```bash
# Stop the application
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Rebuild containers
docker-compose up --build --force-recreate

# Database management
docker-compose exec backend node src/database/reset.js    # Reset DB
docker-compose exec backend node src/database/migrate.js  # Run migrations
docker-compose exec backend node src/database/seed.js     # Seed data
```

## 📁 Project Structure

```
baraem-al-noor/
├── backend/                    # Node.js API server
│   ├── src/
│   │   ├── database/          # Database scripts and schema
│   │   ├── routes/            # API route handlers
│   │   └── server.js          # Express server setup
│   ├── scripts/               # Utility scripts
│   └── Dockerfile             # Backend container config
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── Header.js      # Site header with navigation
│   │   │   ├── HeroSection.js # Main welcome section
│   │   │   ├── ServicesSection.js # Educational programs
│   │   │   ├── AboutSection.js    # Platform information
│   │   │   └── Footer.js      # Contact and links
│   │   ├── pages/
│   │   │   └── HomePage.js    # Main landing page
│   │   ├── App.js             # Main app component
│   │   ├── index.js           # React entry point
│   │   └── index.css          # Global styles and animations
│   ├── public/                # Static assets
│   └── Dockerfile             # Frontend container config
├── .kiro/specs/               # Development specifications
├── docker-compose.yml         # Multi-container orchestration
├── .env                       # Environment variables
├── .gitignore                 # Git ignore rules
└── README.md                  # This file
```

## 🗄️ Database Schema

### Core Tables (20+ tables)
- **users**: All user types with role-based access control
- **courses**: Course catalog and management
- **classes**: Class scheduling and Zoom integration
- **class_attendance**: Attendance tracking system
- **assignments**: Homework and assessment management
- **invoices & payments**: Financial transaction system
- **zoom_meetings**: Video conferencing integration
- **notifications**: Communication system
- **activity_logs**: Comprehensive audit trail
- **support_tickets**: Help desk system

### Demo Data Available
After database initialization, demo accounts are created:

| Role | Email | Password | Access Level |
|------|-------|----------|-------------|
| Admin | admin@baraemalNoor.com | password123 | Full system access |
| Teacher | teacher@baraemalNoor.com | password123 | Class management |
| Parent | parent@baraemalNoor.com | password123 | Child monitoring |
| Student | student1@baraemalNoor.com | password123 | Learning interface |
| Student | student2@baraemalNoor.com | password123 | Learning interface |

## 🔧 Development Status

### ✅ Completed Features
- **Docker Environment**: Full containerization with external DB connection
- **Database Schema**: Complete PostgreSQL schema with all required tables
- **Public Homepage**: Clean, Islamic-themed landing page
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Database Management**: Migration, seeding, and reset scripts
- **API Structure**: Express.js backend with organized route structure
- **Security Foundation**: Environment variables and secure configurations

### 🚧 Future Development
- **Authentication System**: JWT-based login for different user roles
- **Dashboard Interfaces**: Role-specific dashboards (Student, Teacher, Parent, Admin)
- **Zoom Integration**: Live virtual classroom functionality
- **File Upload System**: Course materials and assignment submissions
- **Payment Gateway**: Stripe integration for tuition payments
- **Real-time Features**: Live notifications and chat system
- **Advanced Analytics**: Performance tracking and reporting
- **Mobile App**: React Native companion app

## 🔐 Security & Configuration

### Environment Variables
```bash
# Database Configuration
DB_HOST=j2zr.your-database.de
DB_NAME=baraem
DB_USER=baraem
DB_PASSWORD=ccydwmbxszD2997s

# Zoom Integration
ZOOM_ACCOUNT_ID=T4MFWiR1S7CHvevyqBdyFw
ZOOM_CLIENT_ID=r2_A6klNQQOf_iE9y03wnw
ZOOM_CLIENT_SECRET=ao2ggpCamndBqKu2F071UUOLf8HQbZZ0

# Application Settings
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### Security Features
- SSL/TLS encryption for all communications
- Environment-based configuration management
- Docker container isolation
- Database connection security
- Input validation and sanitization
- CORS protection

## 🌐 Deployment

### Production Considerations
- Update environment variables for production
- Configure SSL certificates
- Set up database backups
- Implement monitoring and logging
- Configure CDN for static assets
- Set up CI/CD pipeline

### Scaling Options
- Horizontal scaling with load balancers
- Database read replicas
- Redis for session management
- File storage with AWS S3 or similar
- Container orchestration with Kubernetes

## 📞 Support & Contact

### Technical Support
- **Email**: info@baraemalNoor.com
- **Development**: Contact the development team
- **Documentation**: Check the `/docs` directory for detailed guides

### Educational Inquiries
- **Enrollment**: enrollment@baraemalNoor.com
- **Phone**: +1 (555) 123-4567
- **Address**: 123 Education Street, Learning City, LC 12345

## 📝 License

This project is proprietary software for Baraem Al-Noor Educational Platform. All rights reserved.

---

**Baraem Al-Noor (براعم النور)** - *Nurturing Young Hearts with Islamic Knowledge*