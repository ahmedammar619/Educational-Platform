#!/bin/bash

echo "🔄 Initializing Baraem Al-Noor Database..."

# Wait for the application to be ready
sleep 5

echo "📊 Running database migration..."
node src/database/migrate.js

echo "🌱 Seeding database with initial data..."
node src/database/seed.js

echo "✅ Database initialization completed!"
echo "🚀 Demo accounts available:"
echo "   - Admin: admin@baraemalNoor.com / password123"
echo "   - Teacher: teacher@baraemalNoor.com / password123"
echo "   - Parent: parent@baraemalNoor.com / password123"
echo "   - Students: student1@baraemalNoor.com, student2@baraemalNoor.com / password123"