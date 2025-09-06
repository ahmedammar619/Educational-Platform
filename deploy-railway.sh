#!/bin/bash

# Railway Deployment Script for Baraem Al-Nour

echo "🚀 Deploying to Railway..."

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Build frontend for production
echo "🔨 Building frontend for production..."
cd frontend
npm run build
cd ..

echo "✅ Frontend built successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Commit your changes:"
echo "   git add ."
echo "   git commit -m 'Fix API endpoints for Railway'"
echo "   git push"
echo ""
echo "2. Railway will automatically deploy the changes"
echo "3. Check your Railway dashboard for deployment status"
echo ""
echo "🌐 Your app will be available at:"
echo "   Frontend: https://baraemalnour.org"
echo "   Backend:  https://api.baraemalnour.org"
echo ""
echo "🔧 API endpoints are now correctly configured with /api prefix"
