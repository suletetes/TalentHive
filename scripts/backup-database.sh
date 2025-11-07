#!/bin/bash

# Database Backup Script for TalentHive Platform
# This script creates a backup of the MongoDB database

set -e

# Configuration
BACKUP_DIR="/var/backups/talenthive"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="talenthive_backup_${TIMESTAMP}"
RETENTION_DAYS=30

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

echo "Starting database backup: ${BACKUP_NAME}"

# Create MongoDB backup
docker exec talenthive-mongodb-prod mongodump \
    --username=${MONGO_ROOT_USERNAME} \
    --password=${MONGO_ROOT_PASSWORD} \
    --authenticationDatabase=admin \
    --db=${MONGO_DB_NAME} \
    --out=/tmp/${BACKUP_NAME}

# Copy backup from container to host
docker cp talenthive-mongodb-prod:/tmp/${BACKUP_NAME} ${BACKUP_DIR}/

# Compress backup
cd ${BACKUP_DIR}
tar -czf ${BACKUP_NAME}.tar.gz ${BACKUP_NAME}
rm -rf ${BACKUP_NAME}

# Clean up old backups (older than RETENTION_DAYS)
find ${BACKUP_DIR} -name "talenthive_backup_*.tar.gz" -mtime +${RETENTION_DAYS} -delete

echo "Backup completed successfully: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"

# Optional: Upload to cloud storage (S3, Google Cloud Storage, etc.)
# aws s3 cp ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz s3://your-backup-bucket/

echo "Backup process finished"
