# Frontend-Backend Connection Guide

This document explains how to test the connection between the frontend services and the backend API.

## Prerequisites

1. **Backend Running**: Make sure your NestJS backend is running on `http://localhost:3000`
2. **Frontend Running**: Start the frontend development server with `npm run dev`

## Testing the Connection

### 1. Test Services Page

Navigate to `/test-services` in your browser or click the "Test Services" link in the header.

This page provides buttons to test individual services:
- **Test Auth Service**: Tests authentication status and current user
- **Test Courses Service**: Tests fetching courses from the backend
- **Test Dashboard Service**: Tests dashboard data retrieval
- **Run All Tests**: Executes all tests simultaneously

### 2. Authentication Flow

1. **Login**: Use the Sign In button to access the login form
2. **Registration**: Switch to registration mode to create a new account
3. **Real API Calls**: All authentication now uses the real backend instead of mock data

### 3. Service Integration

The following components have been updated to use real services:

- **LoginForm**: Now uses `authService.login()` and `authService.register()`
- **App.jsx**: Uses `authService` for token validation and authentication state
- **Layout**: Uses `authService.logout()` for proper logout handling
- **StudentDashboard**: Uses `dashboardService` and `coursesService` for real data

## Configuration

### API Base URL

The frontend is configured to connect to the backend at:
- **Development**: `http://localhost:3000` (default)
- **Custom**: Set `VITE_API_URL` environment variable in `.env.local` file

### Service Structure

```
src/services/
├── api.js              # Base axios configuration with interceptors
├── authService.js      # Authentication and user management
├── usersService.js     # User CRUD operations
├── coursesService.js   # Course and material management
├── teachersService.js  # Teacher-specific operations
├── studentsService.js  # Student-specific operations
├── parentsService.js   # Parent-specific operations
├── adminService.js     # Administrative operations
├── dashboardService.js # Dashboard data and statistics
└── index.js           # Central export file
```

## Error Handling

All services include comprehensive error handling:

- **Network Errors**: Automatic retry and user feedback
- **Authentication Errors**: Automatic logout on 401 responses
- **Validation Errors**: User-friendly error messages
- **Fallback Data**: Graceful degradation when services are unavailable

## Testing Checklist

- [ ] Backend is running on `http://localhost:3000`
- [ ] Frontend is running and accessible
- [ ] Navigate to `/test-services`
- [ ] Test each service individually
- [ ] Verify error handling works correctly
- [ ] Test authentication flow (login/register)
- [ ] Check that real data is being fetched

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend has proper CORS configuration
2. **Connection Refused**: Check if backend is running on correct port
3. **Authentication Failures**: Verify JWT configuration in backend
4. **Service Errors**: Check browser console for detailed error messages

### Debug Mode

Enable debug mode by setting `VITE_DEBUG=true` in `.env.local` to see detailed service calls and responses in the console.

## Next Steps

1. **Complete Service Integration**: Update remaining components to use services
2. **Error Boundaries**: Add React error boundaries for better error handling
3. **Loading States**: Implement proper loading states for all service calls
4. **Offline Support**: Add offline detection and caching
5. **Service Workers**: Implement service workers for better performance
