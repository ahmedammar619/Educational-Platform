# Frontend Services

This directory contains all the service files that handle API communication with the backend. Each service is designed to match the corresponding backend module structure.

## Services Overview

### 1. **api.js** - Base API Configuration
- Centralized axios instance with interceptors
- Automatic token management
- Error handling and authentication redirects
- Base URL configuration

### 2. **authService.js** - Authentication Service
- User registration and login
- Profile management
- Password changes
- Token management
- Authentication state checking

### 3. **usersService.js** - User Management Service
- CRUD operations for users
- User search and filtering
- Role-based user operations
- User status management

### 4. **coursesService.js** - Course Management Service
- Course CRUD operations
- Course materials management
- Schedule and session management
- Course enrollment
- Attendance tracking
- Course search and filtering

### 5. **teachersService.js** - Teacher Management Service
- Teacher profile management
- Course assignments
- Student management
- Schedule and session access
- Teacher search and filtering

### 6. **studentsService.js** - Student Management Service
- Student profile management
- Course enrollment
- Assignment submissions
- Progress tracking
- Attendance records
- Student search and filtering

### 7. **parentsService.js** - Parent Management Service
- Parent profile management
- Child account linking
- Academic progress monitoring
- Communication with teachers
- Parent notifications

### 8. **adminService.js** - Administrative Service
- System-wide user management
- Course and class management
- System settings
- Reports and analytics
- Backup and maintenance
- Administrative operations

### 9. **dashboardService.js** - Dashboard Data Service
- Role-specific dashboard data
- Recent activities
- Notifications
- Calendar and events
- System status

## Usage Examples

### Importing Services

```javascript
// Import individual services
import { authService, coursesService, dashboardService } from '../services';

// Or import specific service classes
import { AuthService, CoursesService } from '../services';

// Or import the base API instance
import { api } from '../services';
```

### Authentication Example

```javascript
import { authService } from '../services';

// Login
try {
  const result = await authService.login({
    email: 'user@example.com',
    password: 'password123'
  });
  console.log('Login successful:', result);
} catch (error) {
  console.error('Login failed:', error);
}

// Check authentication status
if (authService.isAuthenticated()) {
  const user = authService.getCurrentUser();
  console.log('Current user:', user);
}
```

### Course Management Example

```javascript
import { coursesService } from '../services';

// Get all courses
try {
  const courses = await coursesService.getAllCourses();
  console.log('Available courses:', courses);
} catch (error) {
  console.error('Failed to fetch courses:', error);
}

// Enroll in a course
try {
  await coursesService.enrollInCourse(courseId);
  console.log('Successfully enrolled in course');
} catch (error) {
  console.error('Enrollment failed:', error);
}
```

### Admin Operations Example

```javascript
import { adminService } from '../services';

// Get dashboard statistics
try {
  const stats = await adminService.getDashboardStats();
  console.log('Dashboard stats:', stats);
} catch (error) {
  console.error('Failed to fetch stats:', error);
}

// Create a new user
try {
  const newUser = await adminService.createUser({
    email: 'newuser@example.com',
    password: 'password123',
    role: 'STUDENT'
  });
  console.log('User created:', newUser);
} catch (error) {
  console.error('User creation failed:', error);
}
```

## Error Handling

All services include comprehensive error handling:

```javascript
try {
  const data = await someService.someMethod();
  // Handle success
} catch (error) {
  // Error object contains:
  // - error.response?.data: Backend error response
  // - error.message: Generic error message
  // - error.response?.status: HTTP status code
  
  if (error.response?.status === 401) {
    // Handle unauthorized access
    authService.logout();
  } else if (error.response?.status === 404) {
    // Handle not found
    console.log('Resource not found');
  } else {
    // Handle other errors
    console.error('Operation failed:', error.response?.data || error.message);
  }
}
```

## Configuration

The base API configuration can be customized by setting environment variables:

```bash
# .env file
REACT_APP_API_URL=http://localhost:3000
```

## Authentication Flow

1. User logs in via `authService.login()`
2. Token is automatically stored in localStorage
3. All subsequent API calls include the token via interceptors
4. On 401 responses, user is automatically logged out and redirected
5. Token is automatically included in all service calls

## Best Practices

1. **Always use try-catch blocks** when calling service methods
2. **Handle errors appropriately** based on status codes
3. **Use the service methods** instead of direct API calls
4. **Check authentication status** before making protected calls
5. **Import services from the index file** for consistency
6. **Use role-specific services** when available (e.g., `teacherService` for teacher operations)

## Adding New Services

To add a new service:

1. Create a new service file following the existing pattern
2. Import the base `api` instance
3. Implement methods with proper error handling
4. Export the service class
5. Add exports to `index.js`
6. Update this README with documentation
