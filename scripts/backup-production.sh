#!/bin/bash
# GameForge Production Backup Script
# Automated database backup with S3 integration and monitoring

set -euo pipefail

# Configuration
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE_ONLY=$(date +%Y%m%d)
BACKUP_FILE="gameforge_production_backup_${TIMESTAMP}.sql"
LOG_FILE="${BACKUP_DIR}/backup_${DATE_ONLY}.log"

# Notification settings
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-15}"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    send_notification "❌ GameForge Backup Failed: $1"
    exit 1
}

# Send notification to Slack
send_notification() {
    local message="$1"
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\": \"$message\"}" \
            "$SLACK_WEBHOOK_URL" 2>/dev/null || true
    fi
}

# Health check
health_check() {
    log "Performing database health check..."

    # Check PostgreSQL connectivity
    pg_isready -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" || \
        error_exit "Database not accessible"

    # Check disk space (require at least 5GB free)
    AVAILABLE_SPACE=$(df "$BACKUP_DIR" | awk 'NR==2 {print $4}')
    if [ "$AVAILABLE_SPACE" -lt 5242880 ]; then  # 5GB in KB
        error_exit "Insufficient disk space for backup"
    fi

    log "Health check passed"
}

# Create database backup
create_backup() {
    log "Creating PostgreSQL backup..."

    # Set password for pg_dump
    export PGPASSWORD="$POSTGRES_PASSWORD"

    # Create backup with custom format for better compression and features
    pg_dump -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
        --format=custom \
        --verbose \
        --no-password \
        --compress=9 \
        --file="${BACKUP_DIR}/${BACKUP_FILE}" || \
        error_exit "Database backup creation failed"

    unset PGPASSWORD

    # Verify backup integrity
    pg_restore --list "${BACKUP_DIR}/${BACKUP_FILE}" >/dev/null || \
        error_exit "Backup integrity verification failed"

    BACKUP_SIZE=$(stat -c%s "${BACKUP_DIR}/${BACKUP_FILE}" 2>/dev/null || echo "0")
    BACKUP_SIZE_MB=$((BACKUP_SIZE / 1024 / 1024))

    log "Backup created successfully: ${BACKUP_FILE} (${BACKUP_SIZE_MB}MB)"
}

# Upload backup to S3
upload_to_s3() {
    if [ -z "${S3_BUCKET:-}" ]; then
        log "S3 bucket not configured, skipping upload"
        return 0
    fi

    log "Uploading backup to S3..."

    # Install AWS CLI if not present
    if ! command -v aws >/dev/null 2>&1; then
        log "Installing AWS CLI..."
        apk add --no-cache aws-cli
    fi

    # Upload with server-side encryption
    aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" \
        "s3://${S3_BUCKET}/backups/$(date +%Y/%m/%d)/${BACKUP_FILE}" \
        --server-side-encryption AES256 \
        --storage-class STANDARD_IA \
        --metadata "Environment=production,Service=gameforge,BackupType=database" || \
        error_exit "S3 upload failed"

    log "Backup uploaded to S3 successfully"
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups..."

    # Local cleanup
    find "$BACKUP_DIR" -name "gameforge_production_backup_*.sql" \
        -mtime +"$BACKUP_RETENTION_DAYS" -delete

    # S3 cleanup if configured
    if [ -n "${S3_BUCKET:-}" ] && command -v aws >/dev/null 2>&1; then
        CUTOFF_DATE=$(date -d "${BACKUP_RETENTION_DAYS} days ago" +%Y-%m-%d 2>/dev/null || \
                     date -v-${BACKUP_RETENTION_DAYS}d +%Y-%m-%d 2>/dev/null || \
                     echo "1970-01-01")

        aws s3 ls "s3://${S3_BUCKET}/backups/" --recursive | \
            awk "\$1 < \"$CUTOFF_DATE\" {print \$4}" | \
            while read -r file; do
                if [ -n "$file" ]; then
                    aws s3 rm "s3://${S3_BUCKET}/$file"
                    log "Deleted old S3 backup: $file"
                fi
            done
    fi

    log "Cleanup completed"
}

# Send metrics to monitoring
send_metrics() {
    local status=$1
    local backup_size=${2:-0}

    # Send to Prometheus pushgateway if available
    if command -v curl >/dev/null 2>&1; then
        {
            echo "backup_status{job=\"gameforge-backup\",instance=\"production\"} $status"
            echo "backup_size_bytes{job=\"gameforge-backup\",instance=\"production\"} $backup_size"
            echo "backup_duration_seconds{job=\"gameforge-backup\",instance=\"production\"} $(($(date +%s) - START_TIME))"
        } | curl -X POST --data-binary @- \
            "http://prometheus-pushgateway:9091/metrics/job/gameforge-backup" 2>/dev/null || true
    fi
}

# Main execution
main() {
    START_TIME=$(date +%s)
    log "Starting GameForge production backup process..."

    # Validate environment
    [ -n "${POSTGRES_HOST:-}" ] || error_exit "POSTGRES_HOST not set"
    [ -n "${POSTGRES_USER:-}" ] || error_exit "POSTGRES_USER not set"
    [ -n "${POSTGRES_PASSWORD:-}" ] || error_exit "POSTGRES_PASSWORD not set"
    [ -n "${POSTGRES_DB:-}" ] || error_exit "POSTGRES_DB not set"

    # Execute backup process
    health_check
    create_backup
    upload_to_s3
    cleanup_old_backups

    # Send success metrics
    BACKUP_SIZE=$(stat -c%s "${BACKUP_DIR}/${BACKUP_FILE}" 2>/dev/null || echo "0")
    send_metrics 1 "$BACKUP_SIZE"

    # Send success notification
    BACKUP_SIZE_MB=$((BACKUP_SIZE / 1024 / 1024))
    send_notification "✅ GameForge Backup Completed: ${BACKUP_FILE} (${BACKUP_SIZE_MB}MB)"

    log "Backup process completed successfully"
}

# Trap errors and send failure metrics
trap 'send_metrics 0; error_exit "Backup process failed unexpectedly"' ERR

# Run main function
main "$@"
