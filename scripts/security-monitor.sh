#!/bin/bash
# GameForge Security Monitor (Unprivileged)
# ========================================
# Non-privileged monitoring script that checks security status from shared volume
# Runs in application containers or as a separate monitoring service

set -euo pipefail

# Configuration
SECURITY_STATUS_DIR="/shared/security"
MONITOR_DATA_DIR="/var/monitor"
LOG_PREFIX="[$(date +'%Y-%m-%d %H:%M:%S')] MONITOR:"
MONITORING_INTERVAL=${MONITORING_INTERVAL:-300}  # 5 minutes default

# Function to log with timestamp
log() {
    echo "$LOG_PREFIX $1"
}

# Function to check if bootstrap completed successfully
check_bootstrap_status() {
    local bootstrap_status_file="$SECURITY_STATUS_DIR/bootstrap-status"
    local bootstrap_result_file="$SECURITY_STATUS_DIR/bootstrap-result.json"
    
    if [ ! -f "$bootstrap_status_file" ]; then
        echo "bootstrap_missing"
        return
    fi
    
    local status=$(cat "$bootstrap_status_file" 2>/dev/null || echo "unknown")
    echo "$status"
}

# Function to get security readiness
check_security_readiness() {
    local ready_file="$SECURITY_STATUS_DIR/ready"
    local security_ready_file="$SECURITY_STATUS_DIR/security-ready.json"
    
    if [ ! -f "$ready_file" ]; then
        echo "not_ready"
        return
    fi
    
    local status=$(cat "$ready_file" 2>/dev/null || echo "unknown")
    echo "$status"
}

# Function to get health score
get_health_score() {
    local health_status_file="$SECURITY_STATUS_DIR/health-status.json"
    
    if [ ! -f "$health_status_file" ]; then
        echo "unknown"
        return
    fi
    
    local score=$(jq -r '.health_summary.overall_score // "unknown"' "$health_status_file" 2>/dev/null || echo "unknown")
    echo "$score"
}

# Function to validate security files integrity
validate_security_files() {
    local validation_result="ok"
    local missing_files=()
    local invalid_files=()
    
    # Required files after bootstrap
    local required_files=(
        "bootstrap-status"
        "bootstrap-result.json"
        "ready"
        "security-ready.json"
        "lsm-status.json"
        "capabilities-report.json"
    )
    
    for file in "${required_files[@]}"; do
        local filepath="$SECURITY_STATUS_DIR/$file"
        if [ ! -f "$filepath" ]; then
            missing_files+=("$file")
            validation_result="missing_files"
        elif [[ "$file" == *.json ]] && ! python3 -m json.tool "$filepath" >/dev/null 2>&1; then
            invalid_files+=("$file")
            validation_result="invalid_json"
        fi
    done
    
    if [ ${#missing_files[@]} -gt 0 ] || [ ${#invalid_files[@]} -gt 0 ]; then
        log "⚠️ Security file validation issues:"
        [ ${#missing_files[@]} -gt 0 ] && log "  Missing files: ${missing_files[*]}"
        [ ${#invalid_files[@]} -gt 0 ] && log "  Invalid JSON files: ${invalid_files[*]}"
    fi
    
    echo "$validation_result"
}

# Function to generate monitoring report
generate_monitoring_report() {
    local timestamp=$(date -Iseconds)
    local bootstrap_status=$(check_bootstrap_status)
    local security_readiness=$(check_security_readiness)
    local health_score=$(get_health_score)
    local file_validation=$(validate_security_files)
    
    local overall_status="unknown"
    
    # Determine overall status
    if [ "$bootstrap_status" = "COMPLETE" ] && [ "$security_readiness" = "READY" ]; then
        if [ "$health_score" != "unknown" ] && [ "$health_score" -ge 80 ]; then
            overall_status="healthy"
        elif [ "$health_score" != "unknown" ] && [ "$health_score" -ge 60 ]; then
            overall_status="degraded"
        elif [ "$health_score" != "unknown" ] && [ "$health_score" -ge 40 ]; then
            overall_status="warning"
        else
            overall_status="critical"
        fi
    else
        overall_status="not_ready"
    fi
    
    # Generate monitoring report
    # Ensure monitor data directory exists with proper permissions
    mkdir -p "$MONITOR_DATA_DIR"
    # Ensure directory is writable by current user
    if [ ! -w "$MONITOR_DATA_DIR" ]; then
        log "❌ Monitor data directory not writable: $MONITOR_DATA_DIR"
        exit 1
    fi
    
    cat > "$MONITOR_DATA_DIR/monitoring-report.json" <<EOF
{
  "timestamp": "$timestamp",
  "monitoring_mode": "unprivileged",
  "overall_status": "$overall_status",
  "bootstrap": {
    "status": "$bootstrap_status",
    "completed": $([ "$bootstrap_status" = "COMPLETE" ] && echo "true" || echo "false")
  },
  "security_readiness": {
    "status": "$security_readiness",
    "ready": $([ "$security_readiness" = "READY" ] && echo "true" || echo "false")
  },
  "health_monitoring": {
    "score": $([ "$health_score" != "unknown" ] && echo "$health_score" || echo "null"),
    "status": "$([ "$health_score" != "unknown" ] && echo "available" || echo "unavailable")"
  },
  "file_validation": {
    "status": "$file_validation",
    "valid": $([ "$file_validation" = "ok" ] && echo "true" || echo "false")
  },
  "next_check": "$(date -d "+$MONITORING_INTERVAL seconds" -Iseconds)"
}
EOF
    
    echo "$overall_status"
}

# Function to run periodic monitoring
run_monitoring_loop() {
    log "🔄 Starting security monitoring loop (interval: ${MONITORING_INTERVAL}s)"
    
    while true; do
        local status=$(generate_monitoring_report)
        
        case "$status" in
            "healthy")
                log "✅ Security infrastructure healthy"
                ;;
            "degraded")
                log "⚠️ Security infrastructure degraded but functional"
                ;;
            "warning")
                log "🔶 Security infrastructure has warnings"
                ;;
            "critical")
                log "🚨 Critical security infrastructure issues"
                ;;
            "not_ready")
                log "❌ Security infrastructure not ready"
                ;;
            *)
                log "❓ Unknown security status: $status"
                ;;
        esac
        
        # Update monitoring timestamp
        echo "$(date +%s)" > "$MONITOR_DATA_DIR/last-monitor-check.timestamp"
        
        # Check for shutdown signal
        if [ -f "$MONITOR_DATA_DIR/monitor-shutdown" ]; then
            log "🛑 Shutdown signal received, stopping monitoring"
            rm -f "$MONITOR_DATA_DIR/monitor-shutdown"
            break
        fi
        
        sleep "$MONITORING_INTERVAL"
    done
}

# Function to run one-time check
run_single_check() {
    log "🔍 Performing single security check..."
    local status=$(generate_monitoring_report)
    
    log "📊 Security Status: $status"
    
    # Print key metrics
    local bootstrap_status=$(check_bootstrap_status)
    local security_readiness=$(check_security_readiness)
    local health_score=$(get_health_score)
    
    log "  Bootstrap: $bootstrap_status"
    log "  Readiness: $security_readiness"
    log "  Health Score: $health_score"
    
    # Exit with appropriate code
    case "$status" in
        "healthy") exit 0 ;;
        "degraded") exit 0 ;;
        "warning") exit 1 ;;
        "critical") exit 2 ;;
        *) exit 3 ;;
    esac
}

# Main execution
main() {
    log "🔍 Security monitoring started"
    
    # Ensure security status directory exists
    if [ ! -d "$SECURITY_STATUS_DIR" ]; then
        log "❌ Security status directory not found: $SECURITY_STATUS_DIR"
        log "❌ Bootstrap may not have completed successfully"
        exit 1
    fi
    
    # Check mode
    local mode="${1:-loop}"
    
    case "$mode" in
        "loop"|"monitor")
            run_monitoring_loop
            ;;
        "check"|"single")
            run_single_check
            ;;
        *)
            log "❌ Unknown mode: $mode"
            log "Usage: $0 [loop|monitor|check|single]"
            exit 1
            ;;
    esac
}

# Run main function with arguments
main "$@"
