#!/bin/bash
# CI/CD Security Integration Script
# ================================
# Validates security readiness before deployment

set -euo pipefail

SECURITY_STATUS_DIR="/shared/security"
CI_STATUS_FILE="$SECURITY_STATUS_DIR/ci-security-status.json"

# Function to log with timestamp
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] CI-SECURITY: $1"
}

# Function to check security readiness
check_security_readiness() {
    local readiness_file="$SECURITY_STATUS_DIR/security-readiness.json"
    
    if [ -f "$readiness_file" ]; then
        local ready=$(jq -r '.ready' "$readiness_file" 2>/dev/null || echo "false")
        local score=$(jq -r '.score' "$readiness_file" 2>/dev/null || echo "0")
        local percentage=$(jq -r '.percentage' "$readiness_file" 2>/dev/null || echo "0")
        
        echo "ready:$ready,score:$score,percentage:$percentage"
    else
        echo "missing"
    fi
}

# Function to check LSM security
check_lsm_security() {
    local lsm_file="$SECURITY_STATUS_DIR/lsm-status.json"
    
    if [ -f "$lsm_file" ]; then
        local enabled_count=$(jq -r '.enabled_lsms | length' "$lsm_file" 2>/dev/null || echo "0")
        local security_score=$(jq -r '.security_assessment.overall_score' "$lsm_file" 2>/dev/null || echo "0")
        local has_mandatory=$(jq -r '.has_mandatory_access_control' "$lsm_file" 2>/dev/null || echo "false")
        
        echo "enabled:$enabled_count,score:$security_score,mac:$has_mandatory"
    else
        echo "missing"
    fi
}

# Function to check sysctl hardening
check_sysctl_hardening() {
    local sysctl_file="$SECURITY_STATUS_DIR/sysctl-status.json"
    
    if [ -f "$sysctl_file" ]; then
        local success_rate=$(jq -r '.hardening_summary.success_rate' "$sysctl_file" 2>/dev/null || echo "0")
        local security_level=$(jq -r '.security_level' "$sysctl_file" 2>/dev/null || echo "unknown")
        local applied_count=$(jq -r '.hardening_summary.successfully_applied' "$sysctl_file" 2>/dev/null || echo "0")
        
        echo "success_rate:$success_rate,level:$security_level,applied:$applied_count"
    else
        echo "missing"
    fi
}

# Function to check container security
check_container_security() {
    local security_score=0
    local max_score=10
    local issues=()
    
    # Check seccomp profiles
    if [ -d "/shared/security/seccomp" ]; then
        local profile_count=$(find /shared/security/seccomp -name "*.json" | wc -l)
        if [ "$profile_count" -ge 4 ]; then
            security_score=$((security_score + 3))
        elif [ "$profile_count" -ge 2 ]; then
            security_score=$((security_score + 2))
        elif [ "$profile_count" -ge 1 ]; then
            security_score=$((security_score + 1))
        else
            issues+=("No seccomp profiles found")
        fi
    else
        issues+=("Seccomp directory missing")
    fi
    
    # Check AppArmor profiles  
    if [ -d "/shared/security/apparmor" ]; then
        local apparmor_count=$(find /shared/security/apparmor -name "*.profile" | wc -l)
        if [ "$apparmor_count" -ge 2 ]; then
            security_score=$((security_score + 2))
        elif [ "$apparmor_count" -ge 1 ]; then
            security_score=$((security_score + 1))
        else
            issues+=("No AppArmor profiles found")
        fi
    else
        issues+=("AppArmor directory missing")
    fi
    
    # Check capability restrictions
    if [ -f "/shared/config/capability-restrictions.json" ]; then
        security_score=$((security_score + 2))
    else
        issues+=("Capability restrictions not configured")
    fi
    
    # Check network policies
    if [ -f "/shared/config/network-policies.yaml" ]; then
        security_score=$((security_score + 2))
    else
        issues+=("Network policies not configured")
    fi
    
    # Check read-only filesystem config
    if [ -f "/shared/config/readonly-filesystem.yaml" ]; then
        security_score=$((security_score + 1))
    else
        issues+=("Read-only filesystem not configured")
    fi
    
    echo "score:$security_score,max:$max_score,issues:$(IFS=,; echo "${issues[*]}")"
}

# Function to check security monitoring
check_security_monitoring() {
    local monitoring_score=0
    local max_score=5
    local issues=()
    
    # Check if security health monitoring is running
    if [ -f "$SECURITY_STATUS_DIR/health-status.json" ]; then
        local last_check=$(jq -r '.health_summary.last_check' "$SECURITY_STATUS_DIR/health-status.json" 2>/dev/null || echo "")
        if [ -n "$last_check" ]; then
            local check_timestamp=$(date -d "$last_check" +%s 2>/dev/null || echo "0")
            local current_timestamp=$(date +%s)
            local time_diff=$((current_timestamp - check_timestamp))
            
            if [ "$time_diff" -lt 600 ]; then  # Within 10 minutes
                monitoring_score=$((monitoring_score + 2))
            else
                issues+=("Security health check outdated")
            fi
        fi
    else
        issues+=("Security health monitoring not active")
    fi
    
    # Check if security initialization is running
    if [ -f "$SECURITY_STATUS_DIR/init-status.json" ]; then
        local init_status=$(jq -r '.status' "$SECURITY_STATUS_DIR/init-status.json" 2>/dev/null || echo "unknown")
        case "$init_status" in
            "monitoring") monitoring_score=$((monitoring_score + 2)) ;;
            "running") monitoring_score=$((monitoring_score + 1)) ;;
            *) issues+=("Security initialization not monitoring") ;;
        esac
    else
        issues+=("Security initialization status missing")
    fi
    
    # Check if LSM detection is current
    if [ -f "$SECURITY_STATUS_DIR/lsm-status.json" ]; then
        monitoring_score=$((monitoring_score + 1))
    else
        issues+=("LSM detection not performed")
    fi
    
    echo "score:$monitoring_score,max:$max_score,issues:$(IFS=,; echo "${issues[*]}")"
}

# Function to calculate overall security gate score
calculate_security_gate_score() {
    local total_score=0
    local max_total=100
    
    # Security Readiness (30 points)
    local readiness_status=$(check_security_readiness)
    if [[ "$readiness_status" != "missing" ]]; then
        local ready=$(echo "$readiness_status" | cut -d',' -f1 | cut -d':' -f2)
        local percentage=$(echo "$readiness_status" | cut -d',' -f3 | cut -d':' -f2)
        if [ "$ready" = "true" ]; then
            total_score=$((total_score + 30))
        else
            total_score=$((total_score + percentage * 30 / 100))
        fi
    fi
    
    # LSM Security (25 points)
    local lsm_status=$(check_lsm_security)
    if [[ "$lsm_status" != "missing" ]]; then
        local lsm_score=$(echo "$lsm_status" | cut -d',' -f2 | cut -d':' -f2)
        total_score=$((total_score + lsm_score * 25 / 6))  # Scale to 25 points
    fi
    
    # Sysctl Hardening (20 points)
    local sysctl_status=$(check_sysctl_hardening)
    if [[ "$sysctl_status" != "missing" ]]; then
        local success_rate=$(echo "$sysctl_status" | cut -d',' -f1 | cut -d':' -f2)
        total_score=$((total_score + success_rate * 20 / 100))
    fi
    
    # Container Security (15 points)
    local container_status=$(check_container_security)
    local container_score=$(echo "$container_status" | cut -d',' -f1 | cut -d':' -f2)
    local container_max=$(echo "$container_status" | cut -d',' -f2 | cut -d':' -f2)
    total_score=$((total_score + container_score * 15 / container_max))
    
    # Security Monitoring (10 points)
    local monitoring_status=$(check_security_monitoring)
    local monitoring_score=$(echo "$monitoring_status" | cut -d',' -f1 | cut -d':' -f2)
    local monitoring_max=$(echo "$monitoring_status" | cut -d',' -f2 | cut -d':' -f2)
    total_score=$((total_score + monitoring_score * 10 / monitoring_max))
    
    echo "$total_score"
}

# Function to determine gate status
get_gate_status() {
    local score="$1"
    local required_score="${SECURITY_GATE_THRESHOLD:-75}"
    
    if [ "$score" -ge "$required_score" ]; then
        echo "PASS"
    else
        echo "FAIL"
    fi
}

log "🚪 Starting CI/CD security gate validation..."

# Ensure security status directory exists
mkdir -p "$SECURITY_STATUS_DIR"

# Wait for security initialization to complete (max 2 minutes)
local timeout=120
local elapsed=0
while [ $elapsed -lt $timeout ]; do
    if [ -f "$SECURITY_STATUS_DIR/ready" ]; then
        local ready_status=$(cat "$SECURITY_STATUS_DIR/ready")
        if [ "$ready_status" = "READY" ]; then
            log "✅ Security initialization detected as ready"
            break
        fi
    fi
    
    log "⏳ Waiting for security initialization... ($elapsed/$timeout seconds)"
    sleep 5
    elapsed=$((elapsed + 5))
done

if [ $elapsed -ge $timeout ]; then
    log "⚠️ Security initialization timeout - proceeding with available data"
fi

# Perform security gate checks
log "🔍 Performing security gate validation..."

# Check individual components
READINESS_STATUS=$(check_security_readiness)
LSM_STATUS=$(check_lsm_security)
SYSCTL_STATUS=$(check_sysctl_hardening)
CONTAINER_STATUS=$(check_container_security)
MONITORING_STATUS=$(check_security_monitoring)

log "Security Readiness: $READINESS_STATUS"
log "LSM Status: $LSM_STATUS"
log "Sysctl Status: $SYSCTL_STATUS"
log "Container Security: $CONTAINER_STATUS"
log "Security Monitoring: $MONITORING_STATUS"

# Calculate overall security gate score
SECURITY_GATE_SCORE=$(calculate_security_gate_score)
GATE_STATUS=$(get_gate_status "$SECURITY_GATE_SCORE")
REQUIRED_THRESHOLD="${SECURITY_GATE_THRESHOLD:-75}"

log "📊 Security Gate Score: $SECURITY_GATE_SCORE/100 (Required: $REQUIRED_THRESHOLD)"
log "🚪 Security Gate Status: $GATE_STATUS"

# Generate CI security status report
CI_SECURITY_REPORT=$(cat <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "security_gate": {
    "status": "$GATE_STATUS",
    "score": $SECURITY_GATE_SCORE,
    "required_threshold": $REQUIRED_THRESHOLD,
    "evaluation_time": "$(date -Iseconds)"
  },
  "component_evaluation": {
    "security_readiness": "$READINESS_STATUS",
    "lsm_security": "$LSM_STATUS", 
    "sysctl_hardening": "$SYSCTL_STATUS",
    "container_security": "$CONTAINER_STATUS",
    "security_monitoring": "$MONITORING_STATUS"
  },
  "deployment_recommendation": {
    "action": "$([ "$GATE_STATUS" = "PASS" ] && echo "PROCEED" || echo "BLOCK")",
    "reason": "$([ "$GATE_STATUS" = "PASS" ] && echo "Security requirements met" || echo "Security requirements not met - score $SECURITY_GATE_SCORE < $REQUIRED_THRESHOLD")",
    "next_steps": $([ "$GATE_STATUS" = "PASS" ] && echo '["Deploy with current security configuration"]' || echo '["Review security configuration", "Fix failing components", "Re-run security gate"]')
  },
  "environment": {
    "ci_system": "${CI_SYSTEM:-unknown}",
    "build_id": "${BUILD_ID:-unknown}",
    "branch": "${BRANCH_NAME:-unknown}",
    "commit": "${COMMIT_SHA:-unknown}"
  }
}
EOF
)

echo "$CI_SECURITY_REPORT" > "$CI_STATUS_FILE"

log "📋 CI security status report saved to $CI_STATUS_FILE"

# Exit with appropriate code for CI/CD system
if [ "$GATE_STATUS" = "PASS" ]; then
    log "✅ Security gate PASSED - deployment approved"
    exit 0
else
    log "❌ Security gate FAILED - deployment blocked"
    log "🔍 Review security configuration and re-run validation"
    exit 1
fi
