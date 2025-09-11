#!/bin/bash
# ========================================================================
# GameForge Backup Maintenance Script
# Weekly maintenance tasks for backup system
# ========================================================================

set -euo pipefail

# Configuration
BACKUP_DIR="/backup"
LOG_FILE="${BACKUP_DIR}/logs/maintenance_$(date +%Y%m%d_%H%M%S).log"

# Logging
exec 1> >(tee -a "${LOG_FILE}")
exec 2>&1

echo "========================================================================"
echo "GameForge Backup Maintenance Started: $(date)"
echo "========================================================================"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# ========================================================================
# Log Rotation
# ========================================================================
rotate_logs() {
    log "Starting log rotation..."
    
    # Rotate backup logs (keep last 30 days)
    find "${BACKUP_DIR}/logs" -name "backup_*.log" -mtime +30 -delete
    find "${BACKUP_DIR}/logs" -name "maintenance_*.log" -mtime +30 -delete
    
    # Compress logs older than 7 days
    find "${BACKUP_DIR}/logs" -name "*.log" -mtime +7 ! -name "*.gz" -exec gzip {} \;
    
    log "✓ Log rotation completed"
}

# ========================================================================
# Backup Verification
# ========================================================================
verify_backups() {
    log "Starting backup verification..."
    
    local verification_errors=0
    
    # Check recent PostgreSQL backups
    if [ -d "${BACKUP_DIR}/postgres" ]; then
        local recent_postgres=$(find "${BACKUP_DIR}/postgres" -name "*.sql.gz" -mtime -7 | wc -l)
        if [ "$recent_postgres" -gt 0 ]; then
            log "✓ Found $recent_postgres recent PostgreSQL backups"
            
            # Test integrity of most recent backup
            local latest_postgres=$(find "${BACKUP_DIR}/postgres" -name "*.sql.gz" -mtime -1 | head -1)
            if [ -n "$latest_postgres" ] && gunzip -t "$latest_postgres"; then
                log "✓ Latest PostgreSQL backup integrity verified"
            else
                log "✗ Latest PostgreSQL backup integrity check failed"
                ((verification_errors++))
            fi
        else
            log "✗ No recent PostgreSQL backups found"
            ((verification_errors++))
        fi
    fi
    
    # Check recent Redis backups
    if [ -d "${BACKUP_DIR}/redis" ]; then
        local recent_redis=$(find "${BACKUP_DIR}/redis" -name "*.rdb.gz" -mtime -7 | wc -l)
        if [ "$recent_redis" -gt 0 ]; then
            log "✓ Found $recent_redis recent Redis backups"
        else
            log "✗ No recent Redis backups found"
            ((verification_errors++))
        fi
    fi
    
    # Check S3 connectivity and recent uploads
    if aws s3 ls "s3://${S3_BUCKET:-gameforge-backups}/gameforge/" >/dev/null 2>&1; then
        log "✓ S3 connectivity verified"
        
        local recent_s3=$(aws s3 ls "s3://${S3_BUCKET:-gameforge-backups}/gameforge/" --recursive | \
            awk '$1 >= "'$(date -d '7 days ago' '+%Y-%m-%d')'"' | wc -l)
        
        if [ "$recent_s3" -gt 0 ]; then
            log "✓ Found $recent_s3 recent S3 backups"
        else
            log "✗ No recent S3 backups found"
            ((verification_errors++))
        fi
    else
        log "✗ S3 connectivity check failed"
        ((verification_errors++))
    fi
    
    if [ "$verification_errors" -eq 0 ]; then
        log "✓ All backup verification checks passed"
        return 0
    else
        log "✗ $verification_errors backup verification issues found"
        return 1
    fi
}

# ========================================================================
# System Health Check
# ========================================================================
health_check() {
    log "Starting system health check..."
    
    # Check disk space
    local disk_usage=$(df "${BACKUP_DIR}" | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -lt 80 ]; then
        log "✓ Disk usage: ${disk_usage}% (healthy)"
    elif [ "$disk_usage" -lt 90 ]; then
        log "⚠ Disk usage: ${disk_usage}% (warning)"
    else
        log "✗ Disk usage: ${disk_usage}% (critical)"
        return 1
    fi
    
    # Check memory usage
    local mem_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
    if [ "$mem_usage" -lt 80 ]; then
        log "✓ Memory usage: ${mem_usage}% (healthy)"
    else
        log "⚠ Memory usage: ${mem_usage}% (high)"
    fi
    
    # Check backup directory permissions
    if [ -w "${BACKUP_DIR}" ]; then
        log "✓ Backup directory writable"
    else
        log "✗ Backup directory not writable"
        return 1
    fi
    
    log "✓ System health check completed"
    return 0
}

# ========================================================================
# Generate Status Report
# ========================================================================
generate_report() {
    log "Generating backup status report..."
    
    local report_file="${BACKUP_DIR}/logs/weekly_report_$(date +%Y%m%d).txt"
    
    cat > "$report_file" << EOF
========================================================================
GameForge Backup System - Weekly Status Report
Generated: $(date)
========================================================================

BACKUP STATISTICS:
- PostgreSQL backups (last 7 days): $(find "${BACKUP_DIR}/postgres" -name "*.sql.gz" -mtime -7 2>/dev/null | wc -l)
- Redis backups (last 7 days): $(find "${BACKUP_DIR}/redis" -name "*.rdb.gz" -mtime -7 2>/dev/null | wc -l)
- Elasticsearch backups (last 7 days): $(find "${BACKUP_DIR}/elasticsearch" -name "*.tar.gz" -mtime -7 2>/dev/null | wc -l)
- Asset backups (last 7 days): $(find "${BACKUP_DIR}/assets" -name "*.tar.gz" -mtime -7 2>/dev/null | wc -l)

STORAGE USAGE:
- Local backup storage: $(du -sh "${BACKUP_DIR}" | cut -f1)
- PostgreSQL backups: $(du -sh "${BACKUP_DIR}/postgres" 2>/dev/null | cut -f1 || echo "0B")
- Redis backups: $(du -sh "${BACKUP_DIR}/redis" 2>/dev/null | cut -f1 || echo "0B")
- Elasticsearch backups: $(du -sh "${BACKUP_DIR}/elasticsearch" 2>/dev/null | cut -f1 || echo "0B")
- Asset backups: $(du -sh "${BACKUP_DIR}/assets" 2>/dev/null | cut -f1 || echo "0B")

SYSTEM HEALTH:
- Disk usage: $(df "${BACKUP_DIR}" | awk 'NR==2 {print $5}')
- Memory usage: $(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')
- Uptime: $(uptime | awk -F'up ' '{print $2}' | awk -F',' '{print $1}')

RECENT ACTIVITY:
$(tail -20 "${BACKUP_DIR}/logs/cron.log" 2>/dev/null || echo "No recent activity")

========================================================================
End of Report
========================================================================
EOF

    log "✓ Status report generated: $report_file"
    
    # Upload report to S3
    if aws s3 cp "$report_file" "s3://${S3_BUCKET:-gameforge-backups}/reports/" \
       --region "${S3_REGION:-us-east-1}" >/dev/null 2>&1; then
        log "✓ Status report uploaded to S3"
    else
        log "⚠ Failed to upload status report to S3"
    fi
}

# ========================================================================
# Main Maintenance Execution
# ========================================================================

MAINTENANCE_SUCCESS=true

# Execute maintenance tasks
if ! rotate_logs; then
    MAINTENANCE_SUCCESS=false
fi

if ! verify_backups; then
    MAINTENANCE_SUCCESS=false
fi

if ! health_check; then
    MAINTENANCE_SUCCESS=false
fi

generate_report

# Final status
if [ "$MAINTENANCE_SUCCESS" = true ]; then
    log "✓ All maintenance tasks completed successfully"
    exit 0
else
    log "✗ One or more maintenance tasks failed"
    exit 1
fi

echo "========================================================================"
echo "GameForge Backup Maintenance Completed: $(date)"
echo "========================================================================"
