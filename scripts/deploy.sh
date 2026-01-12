#!/bin/bash

# Deployment Script for TalentHive Platform
# This script handles the deployment process to production

set -e

echo "Starting TalentHive deployment..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "Error: .env.production file not found"
    echo "Please create .env.production from .env.production.example"
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

# Pull latest code
echo "Pulling latest code from repository..."
git pull origin main

# Pull latest Docker images
echo "Pulling latest Docker images..."
docker-compose -f docker-compose.prod.yml pull

# Stop existing containers
echo "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Start new containers
echo "Starting new containers..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 30

# Health check
echo "Performing health checks..."
if curl -f http://localhost:5000/api/health; then
    echo "Backend health check passed"
else
    echo "Backend health check failed"
    exit 1
fi

if curl -f http://localhost/health; then
    echo "Frontend health check passed"
else
    echo "Frontend health check failed"
    exit 1
fi

# Clean up old images
echo "Cleaning up old Docker images..."
docker image prune -f

echo "Deployment completed successfully!"
echo "Application is now running at ${CLIENT_URL}"
