#!/bin/bash
# Security Health Check Script
# ===========================
# Monitors and validates security infrastructure health

set -euo pipefail

SECURITY_STATUS_DIR="/shared/security"
HEALTH_STATUS_FILE="$SECURITY_STATUS_DIR/health-status.json"
HEALTH_LOG_FILE="$SECURITY_STATUS_DIR/health-check.log"

# Function to log with timestamp
log() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] HEALTH: $1"
    echo "$message"
    echo "$message" >> "$HEALTH_LOG_FILE"
}

# Function to check file existence and readability
check_file() {
    local file="$1"
    local description="$2"
    
    if [ -f "$file" ] && [ -r "$file" ]; then
        echo "ok"
    else
        echo "fail"
    fi
}

# Function to check JSON file validity
check_json_file() {
    local file="$1"
    
    if [ -f "$file" ] && [ -r "$file" ]; then
        if python3 -m json.tool "$file" >/dev/null 2>&1; then
            echo "ok"
        else
            echo "invalid_json"
        fi
    else
        echo "missing"
    fi
}

# Function to check service health via status files
check_service_status() {
    local service="$1"
    local status_file="$SECURITY_STATUS_DIR/${service}-status.json"
    
    if [ -f "$status_file" ]; then
        local status=$(jq -r '.status // "unknown"' "$status_file" 2>/dev/null || echo "unknown")
        echo "$status"
    else
        echo "missing"
    fi
}

# Function to check LSM status
check_lsm_status() {
    if [ -f "$SECURITY_STATUS_DIR/lsm-status.json" ]; then
        local enabled_lsms=$(jq -r '.lsm_count // 0' "$SECURITY_STATUS_DIR/lsm-status.json" 2>/dev/null || echo "0")
        local security_score="$enabled_lsms"  # Use LSM count as score (max 6)
        echo "enabled_count:$enabled_lsms,score:$security_score"
    else
        echo "missing"
    fi
}

# Function to check sysctl hardening status
check_sysctl_status() {
    if [ -f "$SECURITY_STATUS_DIR/sysctl-status.json" ]; then
        local success_rate=$(jq -r '.success_rate // 0' "$SECURITY_STATUS_DIR/sysctl-status.json" 2>/dev/null || echo "0")
        local security_level=$(jq -r '.status // "unknown"' "$SECURITY_STATUS_DIR/sysctl-status.json" 2>/dev/null || echo "unknown")
        echo "success_rate:$success_rate,level:$security_level"
    else
        echo "missing"
    fi
}

# Function to check SecurityFS mount
check_securityfs() {
    if mount | grep -q "securityfs"; then
        if [ -d "/sys/kernel/security" ] && [ -r "/sys/kernel/security" ]; then
            echo "mounted_readable"
        else
            echo "mounted_unreadable"
        fi
    else
        echo "not_mounted"
    fi
}

# Function to check seccomp profiles
check_seccomp_profiles() {
    local profiles_dir="/shared/security/seccomp"
    local profile_count=0
    local valid_count=0
    
    if [ -d "$profiles_dir" ]; then
        for profile in "$profiles_dir"/*.json; do
            if [ -f "$profile" ]; then
                profile_count=$((profile_count + 1))
                if python3 -m json.tool "$profile" >/dev/null 2>&1; then
                    valid_count=$((valid_count + 1))
                fi
            fi
        done
    fi
    
    echo "total:$profile_count,valid:$valid_count"
}

# Function to calculate overall health score
calculate_health_score() {
    local score=0
    local max_score=100
    
    # LSM Status (20 points)
    local lsm_status=$(check_lsm_status)
    if [[ "$lsm_status" != "missing" ]]; then
        local lsm_score=$(echo "$lsm_status" | cut -d',' -f2 | cut -d':' -f2)
        # Ensure lsm_score is numeric and not null
        if [[ "$lsm_score" =~ ^[0-9]+$ ]]; then
            score=$((score + lsm_score * 20 / 6))  # Scale to 20 points
        fi
    fi
    
    # Sysctl Status (20 points)  
    local sysctl_status=$(check_sysctl_status)
    if [[ "$sysctl_status" != "missing" ]]; then
        local success_rate=$(echo "$sysctl_status" | cut -d',' -f1 | cut -d':' -f2)
        # Ensure success_rate is numeric and not null
        if [[ "$success_rate" =~ ^[0-9]+$ ]]; then
            score=$((score + success_rate * 20 / 100))
        fi
    fi
    
    # SecurityFS Mount (15 points)
    local securityfs_status=$(check_securityfs)
    case "$securityfs_status" in
        "mounted_readable") score=$((score + 15)) ;;
        "mounted_unreadable") score=$((score + 10)) ;;
        *) ;;
    esac
    
    # Seccomp Profiles (15 points)
    local seccomp_status=$(check_seccomp_profiles)
    local total_profiles=$(echo "$seccomp_status" | cut -d',' -f1 | cut -d':' -f2)
    local valid_profiles=$(echo "$seccomp_status" | cut -d',' -f2 | cut -d':' -f2)
    if [ "$total_profiles" -gt 0 ]; then
        score=$((score + valid_profiles * 15 / total_profiles))
    fi
    
    # Security Initialization (10 points)
    if [ -f "$SECURITY_STATUS_DIR/init-status.json" ]; then
        local init_status=$(jq -r '.status' "$SECURITY_STATUS_DIR/init-status.json" 2>/dev/null || echo "unknown")
        case "$init_status" in
            "completed") score=$((score + 10)) ;;
            "running") score=$((score + 5)) ;;
            *) ;;
        esac
    fi
    
    # Configuration Files (10 points)
    local config_score=0
    [ -f "/shared/config/security-config.yaml" ] && config_score=$((config_score + 3))
    [ -f "/shared/config/lsm-config.json" ] && config_score=$((config_score + 3))
    [ -f "/shared/config/hardening-config.json" ] && config_score=$((config_score + 4))
    score=$((score + config_score))
    
    # Monitoring Health (10 points)
    if pgrep -f "security-init.sh" >/dev/null 2>&1; then
        score=$((score + 10))
    elif [ -f "$SECURITY_STATUS_DIR/last-check.timestamp" ]; then
        local last_check=$(cat "$SECURITY_STATUS_DIR/last-check.timestamp" 2>/dev/null || echo "0")
        local current_time=$(date +%s)
        local time_diff=$((current_time - last_check))
        if [ "$time_diff" -lt 300 ]; then  # Last check within 5 minutes
            score=$((score + 8))
        elif [ "$time_diff" -lt 600 ]; then  # Last check within 10 minutes  
            score=$((score + 5))
        fi
    fi
    
    echo "$score"
}

# Function to determine health status
get_health_status() {
    local score="$1"
    
    if [ "$score" -ge 80 ]; then
        echo "healthy"
    elif [ "$score" -ge 60 ]; then
        echo "degraded"
    elif [ "$score" -ge 40 ]; then
        echo "warning"
    else
        echo "critical"
    fi
}

log "🏥 Starting security health check..."

# Ensure security status directory exists
mkdir -p "$SECURITY_STATUS_DIR"

# Record health check timestamp
date +%s > "$SECURITY_STATUS_DIR/last-check.timestamp"

# Perform health checks
log "🔍 Checking security components..."

# LSM Status
LSM_STATUS=$(check_lsm_status)
log "LSM Status: $LSM_STATUS"

# Sysctl Status
SYSCTL_STATUS=$(check_sysctl_status)
log "Sysctl Status: $SYSCTL_STATUS"

# SecurityFS Status
SECURITYFS_STATUS=$(check_securityfs)
log "SecurityFS Status: $SECURITYFS_STATUS"

# Seccomp Profiles Status
SECCOMP_STATUS=$(check_seccomp_profiles)
log "Seccomp Status: $SECCOMP_STATUS"

# Security Initialization Status
INIT_STATUS=$(check_service_status "init")
log "Init Status: $INIT_STATUS"

# Configuration Files Check
SECURITY_CONFIG_STATUS=$(check_file "/shared/config/security-config.yaml" "Security Config")
LSM_CONFIG_STATUS=$(check_json_file "/shared/config/lsm-config.json")
HARDENING_CONFIG_STATUS=$(check_json_file "/shared/config/hardening-config.json")

log "Configuration Status: security=$SECURITY_CONFIG_STATUS, lsm=$LSM_CONFIG_STATUS, hardening=$HARDENING_CONFIG_STATUS"

# Calculate overall health score
HEALTH_SCORE=$(calculate_health_score)
HEALTH_STATUS=$(get_health_status "$HEALTH_SCORE")

log "📊 Health Score: $HEALTH_SCORE/100 ($HEALTH_STATUS)"

# Generate recommendations
RECOMMENDATIONS=()

case "$LSM_STATUS" in
    "missing") RECOMMENDATIONS+=("\"Initialize LSM detection and configuration\"") ;;
    *enabled_count:0*) RECOMMENDATIONS+=("\"Enable at least one Linux Security Module\"") ;;
esac

case "$SYSCTL_STATUS" in
    "missing") RECOMMENDATIONS+=("\"Apply kernel security hardening via sysctls\"") ;;
    *success_rate:[0-4][0-9]*) RECOMMENDATIONS+=("\"Improve sysctl hardening success rate (currently <50%)\"") ;;
esac

case "$SECURITYFS_STATUS" in
    "not_mounted") RECOMMENDATIONS+=("\"Mount SecurityFS for LSM interface access\"") ;;
    "mounted_unreadable") RECOMMENDATIONS+=("\"Fix SecurityFS permissions for security monitoring\"") ;;
esac

case "$SECCOMP_STATUS" in
    "total:0"*) RECOMMENDATIONS+=("\"Create seccomp profiles for container security\"") ;;
    *"valid:0") RECOMMENDATIONS+=("\"Fix invalid seccomp profile configurations\"") ;;
esac

case "$INIT_STATUS" in
    "missing"|"failed") RECOMMENDATIONS+=("\"Fix security initialization service\"") ;;
esac

if [ "$SECURITY_CONFIG_STATUS" = "fail" ]; then
    RECOMMENDATIONS+=("\"Create security configuration file\"")
fi

if [ "$HEALTH_SCORE" -lt 60 ]; then
    RECOMMENDATIONS+=("\"Critical: Overall security health below acceptable threshold\"")
fi

# Convert recommendations array to JSON
RECOMMENDATIONS_JSON=""
if [ ${#RECOMMENDATIONS[@]} -gt 0 ]; then
    RECOMMENDATIONS_JSON=$(printf "%s," "${RECOMMENDATIONS[@]}" | sed 's/,$//')
fi

# Generate health status report
HEALTH_REPORT=$(cat <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "health_summary": {
    "overall_score": $HEALTH_SCORE,
    "status": "$HEALTH_STATUS",
    "last_check": "$(date -Iseconds)"
  },
  "component_status": {
    "lsm": {
      "status": "$LSM_STATUS",
      "details": $([ "$LSM_STATUS" != "missing" ] && cat "$SECURITY_STATUS_DIR/lsm-status.json" 2>/dev/null || echo '{}')
    },
    "sysctl": {
      "status": "$SYSCTL_STATUS", 
      "details": $([ "$SYSCTL_STATUS" != "missing" ] && cat "$SECURITY_STATUS_DIR/sysctl-status.json" 2>/dev/null || echo '{}')
    },
    "securityfs": {
      "status": "$SECURITYFS_STATUS"
    },
    "seccomp": {
      "status": "$SECCOMP_STATUS"
    },
    "initialization": {
      "status": "$INIT_STATUS"
    },
    "configuration": {
      "security_config": "$SECURITY_CONFIG_STATUS",
      "lsm_config": "$LSM_CONFIG_STATUS", 
      "hardening_config": "$HARDENING_CONFIG_STATUS"
    }
  },
  "recommendations": [$RECOMMENDATIONS_JSON],
  "next_check": "$(date -d '+5 minutes' -Iseconds)"
}
EOF
)

echo "$HEALTH_REPORT" > "$HEALTH_STATUS_FILE"

log "📋 Health status report saved to $HEALTH_STATUS_FILE"

# Determine exit code based on health status
case "$HEALTH_STATUS" in
    "healthy") 
        log "✅ Security infrastructure is healthy"
        exit 0
        ;;
    "degraded")
        log "⚠️ Security infrastructure is degraded but functional"
        exit 0
        ;;
    "warning")
        log "🔶 Security infrastructure has warnings - attention required"
        exit 1
        ;;
    "critical")
        log "🚨 Critical security infrastructure issues detected"
        exit 2
        ;;
    *)
        log "❓ Unknown health status"
        exit 3
        ;;
esac
