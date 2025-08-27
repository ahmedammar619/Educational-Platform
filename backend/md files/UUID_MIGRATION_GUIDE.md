# 🚀 UUID Migration Guide

## Overview
This guide will help you migrate your database from integer IDs to UUIDs for the User entity and all related tables.

## ⚠️ Important Pre-Migration Steps

### 1. Backup Your Database
```bash
# PostgreSQL
pg_dump your_database > backup_before_uuid_migration.sql

# MySQL
mysqldump your_database > backup_before_uuid_migration.sql
```

### 2. Test in Development First
- Never run this migration on production without testing
- Use a copy of your production data in development
- Test all API endpoints after migration

## 🔄 Migration Execution

### Step 1: Install UUID Package (if not already installed)
```bash
npm install uuid
npm install @types/uuid --save-dev
```

### Step 2: Run the Migration
```bash
# Using TypeORM CLI
npm run migration:run

# Or manually run the SQL in your database client
```

### Step 3: Verify Migration
```sql
-- Check if users table now has UUID
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'id';

-- Should return: id | uuid
```

## 🧪 Testing After Migration

### 1. Test User Creation
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "password123",
    "role": "student"
  }'
```

### 2. Test User Retrieval
```bash
# The response should contain a UUID, not a number
curl http://localhost:3000/users
```

### 3. Test Related Operations
- Course creation with teacher UUID
- Student enrollment with UUID
- Attendance marking with UUID
- File uploads with UUID

## 🔍 Common Issues and Solutions

### Issue 1: Foreign Key Constraint Errors
```sql
-- If you get foreign key errors, check constraints
SELECT * FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY';
```

### Issue 2: Type Mismatch in Queries
```typescript
// Before (will cause errors)
const userId = parseInt(params.id);

// After (correct)
const userId = params.id;
```

### Issue 3: Frontend ID Comparisons
```javascript
// Before (will fail)
if (user.id === 123) { ... }

// After (correct)
if (user.id === "uuid-string") { ... }
```

## 📱 Frontend Updates Required

### 1. Remove parseInt() Calls
```javascript
// Search for and remove these patterns:
parseInt(params.id)
parseInt(formData.userId)
Number(userId)
```

### 2. Update ID Comparisons
```javascript
// Update any hardcoded ID comparisons
// They should now use string comparison
```

### 3. Update Form Submissions
```javascript
// Ensure forms send string IDs, not numbers
```

## ✅ Post-Migration Checklist

- [ ] Database migration completed successfully
- [ ] All API endpoints return UUIDs
- [ ] User creation works with UUIDs
- [ ] User retrieval works with UUIDs
- [ ] Course operations work with UUIDs
- [ ] Student enrollment works with UUIDs
- [ ] Attendance marking works with UUIDs
- [ ] File operations work with UUIDs
- [ ] Frontend displays UUIDs correctly
- [ ] No parseInt() errors in console
- [ ] All CRUD operations functional

## 🚨 Rollback Plan

If something goes wrong, you can restore from your backup:
```bash
# PostgreSQL
psql your_database < backup_before_uuid_migration.sql

# MySQL
mysql your_database < backup_before_uuid_migration.sql
```

## 📞 Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify all foreign key constraints are properly set
3. Ensure all TypeScript types are updated
4. Test with a minimal dataset first

## 🎯 Benefits After Migration

- **Security**: UUIDs are harder to guess
- **Scalability**: No conflicts when merging databases
- **Privacy**: No information leakage about user count
- **Distributed Systems**: Better for microservices

---

**Good luck with your migration! 🚀**
