# Migration Guide for Parent-Child Relationships

This guide explains how to run the new migration that sets up the proper parent-child relationship structure in the database.

## Overview

The new migration `1709123456792-UpdateParentChildRelationships` will:

1. **Set up proper foreign key constraints** for the `parent_children` table
2. **Add performance indexes** for parent and child lookups
3. **Enforce data integrity** with check constraints
4. **Prevent duplicate relationships** with unique constraints

## Prerequisites

- Database is running and accessible
- Previous migration `1709123456790-UpdateEntitiesToUUID` has been run
- Backend dependencies are installed (`npm install`)

## Running the Migration

### Option 1: Using npm scripts (Recommended)

```bash
# Build the project first
npm run build

# Run the migration
npm run migration:run
```

### Option 2: Using TypeORM CLI directly

```bash
# Build the project first
npm run build

# Run the migration using TypeORM CLI
npx typeorm migration:run -d src/data-source.ts
```

### Option 3: Using the compiled JavaScript

```bash
# Build the project first
npm run build

# Run the migration using compiled JS
npx typeorm migration:run -d dist/data-source.js
```

## What the Migration Does

### 1. Foreign Key Constraints
- `FK_parent_children_parent`: Links `parentId` to `users.id`
- `FK_parent_children_child`: Links `childId` to `users.id`
- Both use `ON DELETE CASCADE` for automatic cleanup

### 2. Performance Indexes
- `IDX_parent_children_parent`: Index on `parentId` for fast parent lookups
- `IDX_parent_children_child`: Index on `childId` for fast child lookups

### 3. Data Integrity Constraints
- **Student Birth Date**: Students must have a birth date
- **Parent/Teacher Phone**: Parents and teachers must have a phone number
- **Unique Email**: Each user must have a unique email address
- **Unique Relationships**: No duplicate parent-child relationships allowed

### 4. Data Type Enforcement
- `phone` column: `varchar(20)` for international phone numbers
- `birthDate` column: `date` type for proper date handling

## Verifying the Migration

After running the migration, you can verify it worked by:

### 1. Check Migration Status
```bash
# Check if migration was recorded
npx typeorm migration:show -d src/data-source.ts
```

### 2. Check Database Schema
```sql
-- Check foreign key constraints
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='parent_children';

-- Check indexes
SELECT 
    indexname, 
    tablename, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'parent_children';

-- Check constraints
SELECT 
    conname, 
    contype, 
    pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'parent_children'::regclass;
```

## Rolling Back (if needed)

If you need to rollback the migration:

```bash
# Revert the last migration
npm run migration:revert
```

**Note**: The rollback will remove all the constraints and indexes added by this migration. Use with caution in production.

## Troubleshooting

### Common Issues

1. **Migration Already Applied**
   ```
   Error: Migration "UpdateParentChildRelationships1709123456792" was already applied
   ```
   - This is normal if the migration was already run
   - Check migration status with `npm run migration:show`

2. **Foreign Key Constraint Violations**
   ```
   Error: insert or update on table "parent_children" violates foreign key constraint
   ```
   - Ensure all referenced users exist in the `users` table
   - Check that user IDs are valid UUIDs

3. **Check Constraint Violations**
   ```
   Error: new row for relation "users" violates check constraint
   ```
   - Ensure students have birth dates
   - Ensure parents/teachers have phone numbers

### Database Connection Issues

If you get connection errors:

1. Check your `.env` file has correct database credentials
2. Ensure the database is running
3. Verify network connectivity to the database

## Production Considerations

1. **Backup First**: Always backup your database before running migrations
2. **Test Environment**: Test migrations in a staging environment first
3. **Downtime**: This migration may require brief downtime for constraint creation
4. **Rollback Plan**: Have a rollback strategy ready

## Next Steps

After running the migration:

1. **Test the API endpoints** to ensure they work correctly
2. **Verify data integrity** by creating test parent-child relationships
3. **Monitor performance** to ensure indexes are working properly
4. **Update frontend** to use the new API structure

## Support

If you encounter issues:

1. Check the migration logs for detailed error messages
2. Verify database permissions and connectivity
3. Review the migration SQL statements for syntax errors
4. Check that all required tables exist before running the migration
