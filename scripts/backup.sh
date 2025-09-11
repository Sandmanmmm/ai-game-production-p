#!/bin/bash
# GameForge Automated Backup Script
# Performs comprehensive backup of PostgreSQL, Redis, and application data

set -euo pipefail

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups"
DB_HOST="postgres"
DB_NAME="gameforge_prod"
DB_USER="gameforge"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >&2
}

# Create backup directory
mkdir -p "${BACKUP_DIR}/postgres" "${BACKUP_DIR}/redis" "${BACKUP_DIR}/app-data"

# PostgreSQL Backup
log "Starting PostgreSQL backup..."
pg_dump -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" \
    --verbose --format=custom --no-password \
    --file="${BACKUP_DIR}/postgres/gameforge_${TIMESTAMP}.dump"

if [ $? -eq 0 ]; then
    log "PostgreSQL backup completed successfully"
    gzip "${BACKUP_DIR}/postgres/gameforge_${TIMESTAMP}.dump"
else
    log "ERROR: PostgreSQL backup failed"
    exit 1
fi

# Redis Backup (if accessible)
log "Starting Redis backup..."
if command -v redis-cli &> /dev/null; then
    redis-cli -h redis --rdb "${BACKUP_DIR}/redis/redis_${TIMESTAMP}.rdb"
    if [ $? -eq 0 ]; then
        log "Redis backup completed successfully"
        gzip "${BACKUP_DIR}/redis/redis_${TIMESTAMP}.rdb"
    else
        log "WARNING: Redis backup failed"
    fi
else
    log "WARNING: redis-cli not available, skipping Redis backup"
fi

# Application Data Backup
log "Starting application data backup..."
tar -czf "${BACKUP_DIR}/app-data/gameforge_data_${TIMESTAMP}.tar.gz" \
    -C /app generated_assets logs cache models_cache 2>/dev/null || {
    log "WARNING: Some application data directories may not exist"
}

# Upload to S3 (if configured)
if [ -n "${S3_BUCKET:-}" ] && [ -n "${AWS_ACCESS_KEY_ID:-}" ]; then
    log "Uploading backups to S3..."
    
    # Install AWS CLI if not present
    if ! command -v aws &> /dev/null; then
        log "Installing AWS CLI..."
        apk add --no-cache aws-cli
    fi
    
    # Upload all backup files
    aws s3 sync "${BACKUP_DIR}/" "s3://${S3_BUCKET}/gameforge-backups/$(date +%Y/%m/%d)/" \
        --exclude "*" --include "*.gz" --include "*.dump.gz" --include "*.rdb.gz"
    
    if [ $? -eq 0 ]; then
        log "S3 upload completed successfully"
    else
        log "ERROR: S3 upload failed"
        exit 1
    fi
else
    log "S3 configuration not found, skipping cloud backup"
fi

# Cleanup old backups
log "Cleaning up old backups (older than ${RETENTION_DAYS} days)..."
find "${BACKUP_DIR}" -type f -name "*.gz" -mtime +${RETENTION_DAYS} -delete
find "${BACKUP_DIR}" -type f -name "*.dump" -mtime +${RETENTION_DAYS} -delete
find "${BACKUP_DIR}" -type f -name "*.rdb" -mtime +${RETENTION_DAYS} -delete

log "Backup process completed successfully"

# Backup verification
log "Verifying backup integrity..."
POSTGRES_BACKUP=$(find "${BACKUP_DIR}/postgres" -name "*${TIMESTAMP}*" -type f | head -1)
if [ -f "${POSTGRES_BACKUP}" ]; then
    log "✓ PostgreSQL backup verified: $(basename ${POSTGRES_BACKUP})"
else
    log "✗ PostgreSQL backup verification failed"
    exit 1
fi

REDIS_BACKUP=$(find "${BACKUP_DIR}/redis" -name "*${TIMESTAMP}*" -type f | head -1)
if [ -f "${REDIS_BACKUP}" ]; then
    log "✓ Redis backup verified: $(basename ${REDIS_BACKUP})"
else
    log "⚠ Redis backup not found"
fi

APP_BACKUP=$(find "${BACKUP_DIR}/app-data" -name "*${TIMESTAMP}*" -type f | head -1)
if [ -f "${APP_BACKUP}" ]; then
    log "✓ Application data backup verified: $(basename ${APP_BACKUP})"
else
    log "⚠ Application data backup not found"
fi

log "Backup verification completed"
log "=========================================="
log "Backup Summary:"
log "Timestamp: ${TIMESTAMP}"
log "PostgreSQL: $([ -f "${POSTGRES_BACKUP}" ] && echo "✓ Success" || echo "✗ Failed")"
log "Redis: $([ -f "${REDIS_BACKUP}" ] && echo "✓ Success" || echo "⚠ Warning")"
log "App Data: $([ -f "${APP_BACKUP}" ] && echo "✓ Success" || echo "⚠ Warning")"
log "S3 Upload: $([ -n "${S3_BUCKET:-}" ] && echo "✓ Enabled" || echo "- Disabled")"
log "=========================================="
