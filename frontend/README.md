# Frontend - Educational Platform

This is the frontend application for the Educational Platform that connects to the NestJS backend API.

## Features

- **Backend Integration**: Connects to NestJS backend API
- **Real Data**: Fetches data from backend services
- **Responsive Design**: Built with React, Tailwind CSS, and modern UI components
- **Role-Based Access**: Different dashboards and features for each user role
- **Restricted Registration**: Only parents can register publicly; other users created by admins

## User Registration Policy

**Important**: This platform has a restricted registration policy for security and administrative control:

- **Parents**: Can register publicly through the website registration form
- **Students, Teachers, Admins**: Must be created by administrators only through the admin panel

For detailed information about user creation methods, see [USER_CREATION_POLICY.md](./USER_CREATION_POLICY.md)

## Development Testing Accounts

For development and testing purposes, you can use these accounts:

### Admin
- **Email**: admin@education.com
- **Password**: password123

### Teacher
- **Email**: jane.teacher@education.com
- **Password**: password123

### Student
- **Email**: john.student@education.com
- **Password**: password123

### Parent
- **Email**: mary.parent@education.com
- **Password**: password123

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

### Building for Production

1. Build the application:
   ```bash
   npm run build
   ```

2. Preview the production build:
   ```bash
   npm run preview
   ```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── data/               # Mock data and helper functions
├── pages/              # Page components for each user role
├── routers/            # Application routing
└── App.jsx            # Main application component
```

## Backend Services

The application connects to backend services located in `src/services/`:

- **Auth Service**: User authentication and registration
- **Admin Service**: Administrative operations
- **User Service**: User management
- **Course Service**: Course and class management
- **Dashboard Service**: Analytics and reporting

## Features by Role

### Admin Dashboard
- User management
- Class management
- Analytics and reporting
- System overview

### Teacher Dashboard
- Class management
- Student progress tracking
- Schedule management
- Communication tools

### Student Dashboard
- Enrolled classes
- Progress tracking
- Schedule view
- Course materials

### Parent Dashboard
- Children's progress
- Communication with teachers
- Schedule monitoring
- Payment tracking

## Technologies Used

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Lucide React** - Icon library
- **Date-fns** - Date manipulation utilities

## Development

### Adding New Features

1. Create new components in the appropriate directory
2. Add backend services if needed in `src/services/`
3. Update routing in `AppRouter.jsx`
4. Test with different user roles

### Styling

The application uses Tailwind CSS for styling. Custom styles can be added in `src/App.css` or by extending the Tailwind configuration.

## Deployment

The frontend can be deployed to any static hosting service:

- **Netlify**: Drag and drop the `dist` folder
- **Vercel**: Connect your repository
- **GitHub Pages**: Use the `gh-pages` package
- **AWS S3**: Upload the `dist` folder to an S3 bucket

## Notes

- Data is fetched from the NestJS backend API
- JWT authentication is used for secure API access
- Perfect for development and testing with real backend integration
- Backend server must be running on `http://localhost:3000` for full functionality
