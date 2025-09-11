#!/bin/bash
# ========================================================================
# GameForge Production Backup Script
# Automated backup of PostgreSQL, Redis, Elasticsearch, and assets to S3
# ========================================================================

set -euo pipefail

# Configuration
BACKUP_DIR="/backup"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-15}
S3_BUCKET=${S3_BUCKET:-gameforge-backups}
S3_REGION=${S3_REGION:-us-east-1}

# Logging
LOG_FILE="${BACKUP_DIR}/logs/backup_${TIMESTAMP}.log"
exec 1> >(tee -a "${LOG_FILE}")
exec 2>&1

echo "========================================================================"
echo "GameForge Production Backup Started: $(date)"
echo "========================================================================"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check if service is available
check_service() {
    local service=$1
    local port=$2
    local host=${3:-localhost}
    
    if nc -z "$host" "$port" 2>/dev/null; then
        log "✓ $service service is available at $host:$port"
        return 0
    else
        log "✗ $service service is not available at $host:$port"
        return 1
    fi
}

# Function to upload to S3 with retry logic
s3_upload() {
    local file=$1
    local s3_path=$2
    local attempts=3
    
    for i in $(seq 1 $attempts); do
        log "Attempting S3 upload (attempt $i/$attempts): $file -> s3://$S3_BUCKET/$s3_path"
        
        if aws s3 cp "$file" "s3://$S3_BUCKET/$s3_path" \
           --region "$S3_REGION" \
           --storage-class STANDARD_IA \
           --server-side-encryption AES256; then
            log "✓ Successfully uploaded to S3: $s3_path"
            return 0
        else
            log "✗ Upload attempt $i failed"
            if [ $i -lt $attempts ]; then
                sleep $((i * 10))
            fi
        fi
    done
    
    log "✗ Failed to upload after $attempts attempts: $file"
    return 1
}

# Function to cleanup old local backups
cleanup_local() {
    log "Cleaning up local backups older than $RETENTION_DAYS days..."
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR/logs" -name "*.log" -mtime +$RETENTION_DAYS -delete
}

# Function to cleanup old S3 backups
cleanup_s3() {
    log "Cleaning up S3 backups older than $RETENTION_DAYS days..."
    local cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)
    
    aws s3api list-objects-v2 \
        --bucket "$S3_BUCKET" \
        --prefix "gameforge/" \
        --query "Contents[?LastModified<='$cutoff_date'].Key" \
        --output text | \
    while read -r key; do
        if [ -n "$key" ]; then
            aws s3 rm "s3://$S3_BUCKET/$key"
            log "Deleted old S3 backup: $key"
        fi
    done
}

# Create backup directory structure
mkdir -p "$BACKUP_DIR"/{tmp,postgres,redis,elasticsearch,assets,logs}

# ========================================================================
# PostgreSQL Backup
# ========================================================================
backup_postgres() {
    log "Starting PostgreSQL backup..."
    
    if check_service "PostgreSQL" 5432 "postgres"; then
        local backup_file="$BACKUP_DIR/postgres/postgres_${TIMESTAMP}.sql"
        local compressed_file="${backup_file}.gz"
        
        # Create database backup
        PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
            -h postgres \
            -U gameforge \
            -d gameforge_prod \
            --no-password \
            --verbose \
            --format=custom \
            --compress=9 \
            --file="$backup_file"
        
        # Compress backup
        gzip "$backup_file"
        
        # Upload to S3
        s3_upload "$compressed_file" "gameforge/postgres/postgres_${TIMESTAMP}.sql.gz"
        
        # Verify backup integrity
        if gunzip -t "$compressed_file"; then
            log "✓ PostgreSQL backup verified successfully"
        else
            log "✗ PostgreSQL backup verification failed"
            return 1
        fi
        
        log "✓ PostgreSQL backup completed: $(du -h $compressed_file | cut -f1)"
    else
        log "✗ PostgreSQL backup skipped - service unavailable"
        return 1
    fi
}

# ========================================================================
# Redis Backup
# ========================================================================
backup_redis() {
    log "Starting Redis backup..."
    
    if check_service "Redis" 6379 "redis"; then
        local backup_file="$BACKUP_DIR/redis/redis_${TIMESTAMP}.rdb"
        local compressed_file="${backup_file}.gz"
        
        # Trigger Redis save
        redis-cli -h redis -p 6379 -a "$REDIS_PASSWORD" BGSAVE
        
        # Wait for save to complete
        while [ "$(redis-cli -h redis -p 6379 -a "$REDIS_PASSWORD" LASTSAVE)" = "$(redis-cli -h redis -p 6379 -a "$REDIS_PASSWORD" LASTSAVE)" ]; do
            sleep 1
        done
        
        # Copy RDB file
        cp /backup/redis/dump.rdb "$backup_file"
        
        # Compress backup
        gzip "$backup_file"
        
        # Upload to S3
        s3_upload "$compressed_file" "gameforge/redis/redis_${TIMESTAMP}.rdb.gz"
        
        log "✓ Redis backup completed: $(du -h $compressed_file | cut -f1)"
    else
        log "✗ Redis backup skipped - service unavailable"
        return 1
    fi
}

# ========================================================================
# Elasticsearch Backup
# ========================================================================
backup_elasticsearch() {
    log "Starting Elasticsearch backup..."
    
    if check_service "Elasticsearch" 9200 "elasticsearch"; then
        local backup_file="$BACKUP_DIR/elasticsearch/elasticsearch_${TIMESTAMP}.tar.gz"
        
        # Create Elasticsearch snapshot (if snapshot repository is configured)
        if curl -s -u "elastic:$ELASTIC_PASSWORD" \
           "http://elasticsearch:9200/_snapshot/gameforge-backups" >/dev/null 2>&1; then
            
            # Create snapshot
            curl -X PUT -u "elastic:$ELASTIC_PASSWORD" \
                "http://elasticsearch:9200/_snapshot/gameforge-backups/snapshot_${TIMESTAMP}" \
                -H 'Content-Type: application/json' \
                -d '{
                    "indices": "*",
                    "ignore_unavailable": true,
                    "include_global_state": true,
                    "metadata": {
                        "taken_by": "gameforge-backup",
                        "taken_because": "scheduled backup"
                    }
                }'
            
            # Wait for snapshot completion
            while true; do
                status=$(curl -s -u "elastic:$ELASTIC_PASSWORD" \
                    "http://elasticsearch:9200/_snapshot/gameforge-backups/snapshot_${TIMESTAMP}" | \
                    jq -r '.snapshots[0].state')
                
                if [ "$status" = "SUCCESS" ]; then
                    log "✓ Elasticsearch snapshot completed successfully"
                    break
                elif [ "$status" = "FAILED" ]; then
                    log "✗ Elasticsearch snapshot failed"
                    return 1
                else
                    log "Waiting for Elasticsearch snapshot to complete (status: $status)..."
                    sleep 10
                fi
            done
        else
            # Fallback: backup data directory
            log "Snapshot repository not configured, backing up data directory..."
            tar -czf "$backup_file" -C /backup/elasticsearch .
            
            # Upload to S3
            s3_upload "$backup_file" "gameforge/elasticsearch/elasticsearch_${TIMESTAMP}.tar.gz"
            
            log "✓ Elasticsearch data backup completed: $(du -h $backup_file | cut -f1)"
        fi
    else
        log "✗ Elasticsearch backup skipped - service unavailable"
        return 1
    fi
}

# ========================================================================
# Assets Backup
# ========================================================================
backup_assets() {
    log "Starting assets backup..."
    
    local backup_file="$BACKUP_DIR/assets/assets_${TIMESTAMP}.tar.gz"
    
    if [ -d "/backup/assets" ] && [ "$(ls -A /backup/assets)" ]; then
        # Create compressed archive of assets
        tar -czf "$backup_file" -C /backup/assets .
        
        # Upload to S3
        s3_upload "$backup_file" "gameforge/assets/assets_${TIMESTAMP}.tar.gz"
        
        log "✓ Assets backup completed: $(du -h $backup_file | cut -f1)"
    else
        log "No assets found to backup"
    fi
}

# ========================================================================
# Main Backup Execution
# ========================================================================

# Check AWS credentials
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    log "✗ AWS credentials not configured or invalid"
    exit 1
fi

log "AWS credentials verified, proceeding with backup..."

# Initialize backup status
BACKUP_SUCCESS=true

# Execute backups
if ! backup_postgres; then
    BACKUP_SUCCESS=false
fi

if ! backup_redis; then
    BACKUP_SUCCESS=false
fi

if ! backup_elasticsearch; then
    BACKUP_SUCCESS=false
fi

if ! backup_assets; then
    BACKUP_SUCCESS=false
fi

# Cleanup operations
cleanup_local
cleanup_s3

# Final status
if [ "$BACKUP_SUCCESS" = true ]; then
    log "✓ All backups completed successfully"
    echo "SUCCESS" > "$BACKUP_DIR/logs/last_backup.log"
    echo "$(date)" >> "$BACKUP_DIR/logs/last_backup.log"
    exit 0
else
    log "✗ One or more backups failed"
    echo "FAILED" > "$BACKUP_DIR/logs/last_backup.log"
    echo "$(date)" >> "$BACKUP_DIR/logs/last_backup.log"
    exit 1
fi

echo "========================================================================"
echo "GameForge Production Backup Completed: $(date)"
echo "========================================================================"
