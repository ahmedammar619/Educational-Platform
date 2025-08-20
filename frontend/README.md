# Frontend - Educational Platform

This is the frontend application for the Educational Platform that works completely independently without requiring a backend server.

## Features

- **Standalone Operation**: No backend connection required
- **Mock Data**: Comprehensive mock data for all user roles (Admin, Teacher, Student, Parent)
- **Responsive Design**: Built with React, Tailwind CSS, and modern UI components
- **Role-Based Access**: Different dashboards and features for each user role

## Demo Accounts

The application includes demo accounts for testing different user roles:

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

## Mock Data

The application uses comprehensive mock data located in `src/data/mockData.js`:

- **Users**: Teachers, students, parents, and admins
- **Classes**: Course information with schedules and enrollments
- **Calendar Events**: Class schedules and events
- **Analytics**: Dashboard statistics and charts
- **Messages**: Communication between users

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
2. Add mock data if needed to `mockData.js`
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

- All data is stored locally in the browser's localStorage
- No persistent database connection
- Perfect for demos, prototypes, and offline-first applications
- Can be easily connected to a backend API in the future by updating the data fetching functions
