#!/bin/bash
# GameForge Enhanced Backup Script with S3 integration and monitoring

set -e

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="gameforge_backup_${DATE}.sql"
LOG_FILE="/backups/backup.log"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Health check
health_check() {
    log "Performing health check..."
    pg_isready -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB || error_exit "Database not ready"
}

# Create backup
create_backup() {
    log "Creating PostgreSQL backup..."

    # Full database backup
    pg_dump -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB \
        --verbose --clean --if-exists --create --format=custom \
        > "${BACKUP_DIR}/${BACKUP_FILE}" || error_exit "Backup creation failed"

    # Compress backup
    gzip "${BACKUP_DIR}/${BACKUP_FILE}"

    # Verify backup integrity
    gunzip -t "${BACKUP_DIR}/${BACKUP_FILE}.gz" || error_exit "Backup verification failed"

    log "Backup created successfully: ${BACKUP_FILE}.gz"
}

# Upload to S3
upload_to_s3() {
    if [ ! -z "$S3_BUCKET" ] && [ ! -z "$AWS_ACCESS_KEY_ID" ]; then
        log "Uploading backup to S3..."

        # Install AWS CLI if not present
        if ! command -v aws &> /dev/null; then
            apk add --no-cache aws-cli
        fi

        # Upload with encryption
        aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}.gz" \
            "s3://${S3_BUCKET}/backups/$(date +%Y/%m/%d)/" \
            --server-side-encryption AES256 \
            --storage-class STANDARD_IA || error_exit "S3 upload failed"

        log "Backup uploaded to S3 successfully"
    else
        log "S3 configuration not found, skipping upload"
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups..."

    # Local cleanup (keep last 7 days)
    find $BACKUP_DIR -name "gameforge_backup_*.sql.gz" -mtime +7 -delete

    # S3 cleanup (keep last 30 days) if configured
    if [ ! -z "$S3_BUCKET" ] && command -v aws &> /dev/null; then
        CUTOFF_DATE=$(date -d '30 days ago' +%Y-%m-%d)
        aws s3 ls "s3://${S3_BUCKET}/backups/" --recursive | \
            awk '$1 < "'$CUTOFF_DATE'" {print $4}' | \
            xargs -r -I {} aws s3 rm "s3://${S3_BUCKET}/{}"
    fi

    log "Cleanup completed"
}

# Send metrics to monitoring
send_metrics() {
    local status=$1
    local backup_size=$(stat -c%s "${BACKUP_DIR}/${BACKUP_FILE}.gz" 2>/dev/null || echo "0")

    # Send to Prometheus pushgateway if available
    if command -v curl &> /dev/null; then
        curl -X POST "http://prometheus-pushgateway:9091/metrics/job/backup" \
            --data-binary "backup_status{instance=\"gameforge\"} $status" \
            --data-binary "backup_size_bytes{instance=\"gameforge\"} $backup_size" \
            2>/dev/null || true
    fi
}

# Main execution
main() {
    log "Starting GameForge backup process..."

    # Check prerequisites
    health_check

    # Create backup
    create_backup

    # Upload to S3
    upload_to_s3

    # Cleanup old backups
    cleanup_old_backups

    # Send success metrics
    send_metrics 1

    log "Backup process completed successfully"
}

# Trap errors
trap 'send_metrics 0; error_exit "Backup process failed"' ERR

# Run main function
main
