#!/bin/bash

# Database Restore Script for TalentHive Platform
# This script restores a MongoDB database from backup

set -e

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "Usage: ./restore-database.sh <backup_file.tar.gz>"
    echo "Available backups:"
    ls -lh /var/backups/talenthive/*.tar.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE=$1
TEMP_DIR="/tmp/restore_$(date +%s)"

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

echo "Starting database restore from: ${BACKUP_FILE}"

# Extract backup
mkdir -p ${TEMP_DIR}
tar -xzf ${BACKUP_FILE} -C ${TEMP_DIR}

# Get the backup directory name
BACKUP_DIR=$(ls ${TEMP_DIR})

# Copy backup to container
docker cp ${TEMP_DIR}/${BACKUP_DIR} talenthive-mongodb-prod:/tmp/

# Restore MongoDB backup
docker exec talenthive-mongodb-prod mongorestore \
    --username=${MONGO_ROOT_USERNAME} \
    --password=${MONGO_ROOT_PASSWORD} \
    --authenticationDatabase=admin \
    --db=${MONGO_DB_NAME} \
    --drop \
    /tmp/${BACKUP_DIR}/${MONGO_DB_NAME}

# Clean up
rm -rf ${TEMP_DIR}
docker exec talenthive-mongodb-prod rm -rf /tmp/${BACKUP_DIR}

echo "Database restore completed successfully"
