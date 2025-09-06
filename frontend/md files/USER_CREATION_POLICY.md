# User Creation Policy

This document explains how different types of users are created in the Baraem Al-Nour Educational Platform.

## User Types & Creation Methods

### 1. **Parents** - Public Registration Only
- **Method**: Public registration form on the website
- **Access**: Anyone can access `/register` or click "Sign up as parent"
- **Requirements**: 
  - First name
  - Last name
  - Email address
  - Password
  - Phone number
- **Role**: Automatically set to `PARENT`
- **Notes**: 
  - Only user type that can self-register
  - Can link children accounts after creation
  - Access to parent dashboard and child monitoring

### 2. **Students** - Admin Creation Only
- **Method**: Admin user management panel
- **Access**: Administrators only
- **Requirements**:
  - First name
  - Last name
  - Email address
  - Password
  - Role (set to `STUDENT`)
  - Phone number
  - Date of birth (optional)
- **Notes**:
  - Cannot self-register
  - Must be created by administrators
  - Can be linked to parent accounts
  - Access to student dashboard and courses

### 3. **Teachers** - Admin Creation Only
- **Method**: Admin user management panel
- **Access**: Administrators only
- **Requirements**:
  - First name
  - Last name
  - Email address
  - Password
  - Role (set to `TEACHER`)
  - Phone number
  - Date of birth (optional)
- **Notes**:
  - Cannot self-register
  - Must be created by administrators
  - Can be assigned to courses
  - Access to teacher dashboard and class management

### 4. **Administrators** - Admin Creation Only
- **Method**: Admin user management panel
- **Access**: Existing administrators only
- **Requirements**:
  - First name
  - Last name
  - Email address
  - Password
  - Role (set to `ADMIN`)
  - Phone number
  - Date of birth (optional)
- **Notes**:
  - Cannot self-register
  - Must be created by existing administrators
  - Full system access
  - Can create all user types

## How to Create Users

### For Parents (Public)
1. Navigate to the homepage
2. Click "Sign In" then "Sign up as parent"
3. Fill out the registration form
4. Submit to create account
5. Automatically logged in after successful registration

### For Other Users (Admin Only)
1. **Login as Administrator**
   - Use admin credentials to access the system
   - Navigate to Admin Dashboard

2. **Access User Management**
   - Click on "User Management" in admin sidebar
   - Click "Add User" button

3. **Fill User Details**
   - Enter required information (first name, last name, email, password, phone)
   - **Select appropriate role** (Student, Teacher, Admin)
   - Add optional details (date of birth)
   - Submit to create user

4. **Alternative: Swagger API**
   - Access backend Swagger documentation
   - Use POST `/users` endpoint
   - Include role in request body

## Security & Access Control

### Registration Restrictions
- ✅ **Parents**: Can register publicly
- ❌ **Students**: Admin creation only
- ❌ **Teachers**: Admin creation only  
- ❌ **Administrators**: Admin creation only

### Role Assignment
- **Public Registration**: Always `PARENT`
- **Admin Creation**: Any role can be assigned
- **Role Changes**: Only administrators can modify user roles

### Password Requirements
- Minimum 6 characters
- Stored securely (hashed)
- Can be reset by administrators

## Best Practices

### For Administrators
1. **Verify Identity**: Confirm user identity before creating accounts
2. **Role Assignment**: Assign appropriate roles based on user needs
3. **Password Security**: Use strong passwords for sensitive accounts
4. **Account Linking**: Link students to parent accounts when appropriate

### For Parents
1. **Use Real Information**: Provide accurate contact details
2. **Secure Password**: Choose a strong, memorable password
3. **Account Linking**: Link children accounts after registration
4. **Contact Admin**: Reach out for student/teacher account creation

## Troubleshooting

### Common Issues
1. **"Role Required" Error**: Ensure role is selected when creating users
2. **Email Already Exists**: Check if user already has an account
3. **Password Too Short**: Ensure password meets minimum requirements
4. **Access Denied**: Verify you have admin privileges

### Getting Help
- **Technical Issues**: Contact system administrator
- **Account Creation**: Reach out to school administration
- **Role Changes**: Request through admin panel
- **Password Reset**: Use admin password reset function

## API Endpoints (Swagger)

### User Creation
- `POST /api/users` - Create new user (admin only)
- `POST /api/auth/register` - Parent registration (public)

### User Management
- `GET /api/users` - List all users (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)
- `PATCH /api/users/:id/role` - Change user role (admin only)

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
