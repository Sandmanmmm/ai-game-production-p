#!/bin/bash
# GameForge Restore Script
# Restores PostgreSQL, Redis, and application data from backups

set -euo pipefail

# Configuration
BACKUP_DIR="/backups"
DB_HOST="postgres"
DB_NAME="gameforge_prod"
DB_USER="gameforge"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >&2
}

# Usage function
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -d DATE     Restore from specific date (YYYYMMDD_HHMMSS)"
    echo "  -l          List available backups"
    echo "  -p          Restore PostgreSQL only"
    echo "  -r          Restore Redis only"
    echo "  -a          Restore application data only"
    echo "  -h          Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 -l                    # List available backups"
    echo "  $0 -d 20240908_120000    # Restore from specific backup"
    echo "  $0 -p -d 20240908_120000 # Restore PostgreSQL only"
    exit 1
}

# List available backups
list_backups() {
    log "Available backups:"
    echo ""
    echo "PostgreSQL Backups:"
    find "${BACKUP_DIR}/postgres" -name "*.dump.gz" -type f 2>/dev/null | \
        sort -r | head -10 | while read backup; do
        filename=$(basename "$backup")
        size=$(du -h "$backup" | cut -f1)
        date=$(stat -c %y "$backup" | cut -d' ' -f1)
        echo "  $filename ($size, $date)"
    done
    
    echo ""
    echo "Redis Backups:"
    find "${BACKUP_DIR}/redis" -name "*.rdb.gz" -type f 2>/dev/null | \
        sort -r | head -10 | while read backup; do
        filename=$(basename "$backup")
        size=$(du -h "$backup" | cut -f1)
        date=$(stat -c %y "$backup" | cut -d' ' -f1)
        echo "  $filename ($size, $date)"
    done
    
    echo ""
    echo "Application Data Backups:"
    find "${BACKUP_DIR}/app-data" -name "*.tar.gz" -type f 2>/dev/null | \
        sort -r | head -10 | while read backup; do
        filename=$(basename "$backup")
        size=$(du -h "$backup" | cut -f1)
        date=$(stat -c %y "$backup" | cut -d' ' -f1)
        echo "  $filename ($size, $date)"
    done
}

# Restore PostgreSQL
restore_postgres() {
    local timestamp=$1
    local backup_file="${BACKUP_DIR}/postgres/gameforge_${timestamp}.dump.gz"
    
    if [ ! -f "$backup_file" ]; then
        log "ERROR: PostgreSQL backup file not found: $backup_file"
        return 1
    fi
    
    log "Restoring PostgreSQL from: $(basename $backup_file)"
    
    # Decompress backup
    local temp_file="/tmp/gameforge_restore_${timestamp}.dump"
    gunzip -c "$backup_file" > "$temp_file"
    
    # Stop application if running
    log "Stopping application connections..."
    
    # Drop existing database and recreate
    log "Recreating database..."
    psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};"
    psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c "CREATE DATABASE ${DB_NAME};"
    
    # Restore from backup
    log "Restoring database data..."
    pg_restore -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
        --verbose --clean --no-acl --no-owner "$temp_file"
    
    if [ $? -eq 0 ]; then
        log "✓ PostgreSQL restore completed successfully"
        rm -f "$temp_file"
        return 0
    else
        log "✗ PostgreSQL restore failed"
        rm -f "$temp_file"
        return 1
    fi
}

# Restore Redis
restore_redis() {
    local timestamp=$1
    local backup_file="${BACKUP_DIR}/redis/redis_${timestamp}.rdb.gz"
    
    if [ ! -f "$backup_file" ]; then
        log "ERROR: Redis backup file not found: $backup_file"
        return 1
    fi
    
    log "Restoring Redis from: $(basename $backup_file)"
    
    # Decompress backup
    local temp_file="/tmp/redis_restore_${timestamp}.rdb"
    gunzip -c "$backup_file" > "$temp_file"
    
    # Stop Redis (if accessible)
    log "Stopping Redis..."
    redis-cli -h redis BGSAVE 2>/dev/null || true
    redis-cli -h redis SHUTDOWN NOSAVE 2>/dev/null || true
    
    # Copy backup file to Redis data directory
    log "Copying backup to Redis data directory..."
    cp "$temp_file" "/data/dump.rdb"
    chown redis:redis "/data/dump.rdb" 2>/dev/null || true
    
    # Start Redis
    log "Starting Redis..."
    redis-server --daemonize yes --dir /data
    
    if [ $? -eq 0 ]; then
        log "✓ Redis restore completed successfully"
        rm -f "$temp_file"
        return 0
    else
        log "✗ Redis restore failed"
        rm -f "$temp_file"
        return 1
    fi
}

# Restore application data
restore_app_data() {
    local timestamp=$1
    local backup_file="${BACKUP_DIR}/app-data/gameforge_data_${timestamp}.tar.gz"
    
    if [ ! -f "$backup_file" ]; then
        log "ERROR: Application data backup file not found: $backup_file"
        return 1
    fi
    
    log "Restoring application data from: $(basename $backup_file)"
    
    # Create backup of current data
    log "Creating backup of current application data..."
    tar -czf "/tmp/app_data_backup_$(date +%Y%m%d_%H%M%S).tar.gz" \
        -C /app generated_assets logs cache models_cache 2>/dev/null || true
    
    # Restore from backup
    log "Extracting application data..."
    tar -xzf "$backup_file" -C /app
    
    if [ $? -eq 0 ]; then
        log "✓ Application data restore completed successfully"
        return 0
    else
        log "✗ Application data restore failed"
        return 1
    fi
}

# Parse command line options
RESTORE_DATE=""
RESTORE_POSTGRES=false
RESTORE_REDIS=false
RESTORE_APP_DATA=false
LIST_BACKUPS=false

while getopts "d:lprah" opt; do
    case $opt in
        d) RESTORE_DATE="$OPTARG" ;;
        l) LIST_BACKUPS=true ;;
        p) RESTORE_POSTGRES=true ;;
        r) RESTORE_REDIS=true ;;
        a) RESTORE_APP_DATA=true ;;
        h) usage ;;
        *) usage ;;
    esac
done

# List backups if requested
if [ "$LIST_BACKUPS" = true ]; then
    list_backups
    exit 0
fi

# Validate restore date
if [ -z "$RESTORE_DATE" ]; then
    log "ERROR: Restore date is required. Use -d option or -l to list available backups."
    usage
fi

# If no specific restore type is specified, restore everything
if [ "$RESTORE_POSTGRES" = false ] && [ "$RESTORE_REDIS" = false ] && [ "$RESTORE_APP_DATA" = false ]; then
    RESTORE_POSTGRES=true
    RESTORE_REDIS=true
    RESTORE_APP_DATA=true
fi

# Confirmation
log "=========================================="
log "GameForge Restore Operation"
log "=========================================="
log "Restore Date: $RESTORE_DATE"
log "PostgreSQL: $([ "$RESTORE_POSTGRES" = true ] && echo "✓ Yes" || echo "- Skip")"
log "Redis: $([ "$RESTORE_REDIS" = true ] && echo "✓ Yes" || echo "- Skip")"
log "App Data: $([ "$RESTORE_APP_DATA" = true ] && echo "✓ Yes" || echo "- Skip")"
log "=========================================="

read -p "Continue with restore? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "Restore cancelled by user"
    exit 0
fi

# Perform restore operations
RESTORE_SUCCESS=true

if [ "$RESTORE_POSTGRES" = true ]; then
    if ! restore_postgres "$RESTORE_DATE"; then
        RESTORE_SUCCESS=false
    fi
fi

if [ "$RESTORE_REDIS" = true ]; then
    if ! restore_redis "$RESTORE_DATE"; then
        RESTORE_SUCCESS=false
    fi
fi

if [ "$RESTORE_APP_DATA" = true ]; then
    if ! restore_app_data "$RESTORE_DATE"; then
        RESTORE_SUCCESS=false
    fi
fi

# Final status
log "=========================================="
if [ "$RESTORE_SUCCESS" = true ]; then
    log "✓ Restore operation completed successfully"
    log "Please restart the GameForge application to ensure all services are properly synchronized."
    exit 0
else
    log "✗ Restore operation completed with errors"
    log "Please check the logs above and manually verify the system state."
    exit 1
fi
