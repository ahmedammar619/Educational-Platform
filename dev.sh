#!/bin/bash

# Development helper script for Baraem Al-Nour Educational Platform

echo "🚀 Starting Baraem Al-Nour Development Environment..."

# Function to restart services
restart() {
    echo "🔄 Restarting services..."
    docker-compose down
    docker-compose up -d --build
    echo "✅ Services restarted!"
}

# Function to view logs
logs() {
    echo "📋 Viewing logs..."
    docker-compose logs -f
}

# Function to force rebuild
rebuild() {
    echo "🔨 Force rebuilding services..."
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    echo "✅ Services rebuilt!"
}

# Function to check status
status() {
    echo "📊 Service Status:"
    docker-compose ps
}

# Function to open browser
open() {
    echo "🌐 Opening application..."
    if command -v open &> /dev/null; then
        open http://localhost:3001
    elif command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3001
    else
        echo "Please open http://localhost:3001 in your browser"
    fi
}

# Main script logic
case "$1" in
    "restart")
        restart
        ;;
    "logs")
        logs
        ;;
    "rebuild")
        rebuild
        ;;
    "status")
        status
        ;;
    "open")
        open
        ;;
    *)
        echo "🎯 Baraem Al-Nour Development Helper"
        echo ""
        echo "Usage: ./dev.sh [command]"
        echo ""
        echo "Commands:"
        echo "  restart  - Restart all services"
        echo "  logs     - View service logs"
        echo "  rebuild  - Force rebuild all services"
        echo "  status   - Check service status"
        echo "  open     - Open application in browser"
        echo ""
        echo "🌐 Frontend: http://localhost:3001"
        echo "🔧 Backend:  http://localhost:3000"
        echo ""
        echo "💡 Hot reload is now enabled! Changes will update automatically."
        ;;
esac
