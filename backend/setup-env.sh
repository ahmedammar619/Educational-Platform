#!/bin/bash

# ========================================
# Environment Setup Script for Unix/Linux/Mac
# ========================================

echo "🚀 Setting up Educational Platform Backend Environment..."

# Check if .env file already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists. Backing up to .env.backup"
    cp .env .env.backup
fi

# Copy the template to .env
if [ -f "env.local" ]; then
    cp env.local .env
    echo "✅ Environment file created successfully!"
    echo "📝 Please review .env file and update values as needed"
else
    echo "❌ env.local template not found!"
    echo "Please create env.local first or manually create .env file"
    exit 1
fi

echo ""
echo "🔧 Next steps:"
echo "1. Review and update .env file with your database credentials"
echo "2. Ensure PostgreSQL is running"
echo "3. Create database: education_dev_db"
echo "4. Run: npm run start:dev"
echo ""
echo "📚 See ENVIRONMENT_SETUP.md for detailed configuration guide"
