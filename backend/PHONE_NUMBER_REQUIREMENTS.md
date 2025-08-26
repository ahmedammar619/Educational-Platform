# Phone Number Requirements

## Overview
This document explains the phone number requirements for different user types and creation methods in the Educational Platform.

## Phone Number Requirements by User Type

### 1. Students
- **Public Signup**: ✅ **REQUIRED**
- **Parent Creation**: ❌ **NOT REQUIRED** (set to null)
- **Admin Creation**: ✅ **REQUIRED**
- **Database**: 
  - Public signup: Stored in `users.phone` field
  - Parent creation: Stored in `students.phone` field (null)
- **Validation**: Must be a valid phone number format when required

### 2. Parents
- **Public Signup**: ✅ **REQUIRED**
- **Admin Creation**: ✅ **REQUIRED**
- **Database**: Stored in `users.phone` field
- **Validation**: Must be a valid phone number format

### 3. Teachers
- **Public Signup**: ❌ **NOT AVAILABLE** (admin only)
- **Admin Creation**: ✅ **REQUIRED**
- **Database**: Stored in `users.phone` field
- **Validation**: Must be a valid phone number format

### 4. Administrators
- **Public Signup**: ❌ **NOT AVAILABLE** (admin only)
- **Admin Creation**: ✅ **REQUIRED**
- **Database**: Stored in `users.phone` field
- **Validation**: Must be a valid phone number format

## Creation Methods and Phone Requirements

### Public Signup (Frontend)
```
Student Registration:
- firstName, lastName, email, password, birthDate, phone ✅

Parent Registration:
- firstName, lastName, email, password, phone ✅
```

### Parent Portal (Child Account Creation)
```
Student Creation by Parent:
- firstName, lastName, email, password, birthDate
- phone: NOT REQUIRED (set to null in database)
```

### Admin Panel
```
All User Types:
- firstName, lastName, email, password, phone ✅
- Additional fields based on role (birthDate for students)
```

## Database Schema

### Users Table
- **phone**: VARCHAR(20), nullable
- Used for: Teachers, Students (public signup), Admins

### Students Table
- **phone**: VARCHAR(20), nullable
- Used for: Students created by parents
- Set to null when parent creates account

### Parents Table
- **phone**: VARCHAR(20), nullable
- Used for: Parent accounts

## Implementation Details

### Frontend Changes
- Phone number field shows for both students and parents during public signup
- Phone number field is required for both roles
- Clear messaging about phone number requirements

### Backend Changes
- **Auth Service**: Validates phone number for both students and parents during public registration
- **Students Service**: Handles optional phone field when parents create accounts
- **DTOs**: Updated to reflect phone number requirements
- **Database**: Added phone field to students table

### Validation Rules
```typescript
// Public registration (students and parents)
phone: required, must be valid phone format

// Parent-created students
phone: optional, can be null

// Admin-created users
phone: required, must be valid phone format
```

## API Endpoints

### Public Registration
```
POST /auth/register
- Students: phone required
- Parents: phone required
```

### Parent Child Creation
```
POST /parents/:id/create-child-account
- Students: phone not required (set to null)
```

### Admin User Creation
```
POST /users
- All roles: phone required
```

## Testing Scenarios

### 1. Student Public Signup
- ✅ With valid phone number and birth date
- ❌ Without phone number (should fail)
- ❌ Without birth date (should fail)

### 2. Parent Public Signup
- ✅ With valid phone number
- ❌ Without phone number (should fail)

### 3. Parent Creates Student
- ✅ Without phone number (should succeed, phone set to null)
- ✅ With phone number (should succeed, phone stored)

### 4. Admin Creates User
- ✅ All roles with valid phone numbers
- ❌ Any role without phone number (should fail)

## Security Considerations

### Phone Number Validation
- Uses `@IsPhoneNumber()` decorator for format validation
- Prevents invalid phone number formats
- Ensures data integrity

### Required vs Optional
- Clear distinction between public signup and admin/parent creation
- Prevents bypassing phone number requirements
- Maintains user accountability for public registrations

## Future Enhancements

### Phone Verification
- SMS verification for phone numbers
- Two-factor authentication using phone
- Phone number change verification

### International Support
- Country code validation
- Format validation by region
- International phone number support

## Summary

The phone number requirements are designed to:
1. **Ensure Accountability**: Public signups require phone numbers for verification
2. **Maintain Flexibility**: Parent-created accounts don't require phone numbers
3. **Preserve Security**: Admin-created accounts maintain phone number requirements
4. **Provide Clarity**: Clear validation rules for different creation methods

This approach balances security needs with user experience, ensuring that publicly created accounts have proper contact information while allowing parents to create accounts for their children without unnecessary barriers.
