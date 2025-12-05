#!/bin/bash

# Development Setup Script for TalentHive Platform

echo "🚀 Setting up TalentHive development environment..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo " Starting MongoDB..."
    # Try to start MongoDB (adjust path as needed for your system)
    if command -v brew &> /dev/null; then
        brew services start mongodb-community
    elif command -v systemctl &> /dev/null; then
        sudo systemctl start mongod
    else
        echo "  Please start MongoDB manually"
    fi
else
    echo " MongoDB is already running"
fi

# Check if Redis is running
if ! pgrep -x "redis-server" > /dev/null; then
    echo " Starting Redis..."
    if command -v brew &> /dev/null; then
        brew services start redis
    elif command -v systemctl &> /dev/null; then
        sudo systemctl start redis
    else
        echo "  Please start Redis manually"
    fi
else
    echo " Redis is already running"
fi

echo " Development environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm run seed' in the server directory to populate the database"
echo "2. Run 'npm run dev' in the server directory to start the backend"
echo "3. Run 'npm run dev' in the client directory to start the frontend"