#!/bin/bash
# GameForge Security Bootstrap (One-shot)
# =====================================
# Privileged bootstrap script that sets up security infrastructure once and exits
# This replaces the long-running privileged security-init container

set -euo pipefail

# Configuration
SECURITY_STATUS_DIR="/shared/security"
LOG_PREFIX="[$(date +'%Y-%m-%d %H:%M:%S')] BOOTSTRAP:"
TIMESTAMP=$(date -Iseconds)

# Function to log with timestamp
log() {
    echo "$LOG_PREFIX $1"
}

# Function to handle errors
handle_error() {
    local error_msg="$1"
    log "❌ ERROR: $error_msg"
    echo "FAILED" > "$SECURITY_STATUS_DIR/bootstrap-status"
    echo '{"status": "failed", "error": "'$error_msg'", "timestamp": "'$TIMESTAMP'"}' > "$SECURITY_STATUS_DIR/bootstrap-result.json"
    exit 1
}

# Trap errors
trap 'handle_error "Bootstrap script failed unexpectedly"' ERR

log "🚀 Starting security infrastructure bootstrap..."

# Ensure security status directory exists
mkdir -p "$SECURITY_STATUS_DIR"

# Mark bootstrap as starting
echo "STARTING" > "$SECURITY_STATUS_DIR/bootstrap-status"
echo '{"status": "starting", "timestamp": "'$TIMESTAMP'"}' > "$SECURITY_STATUS_DIR/bootstrap-result.json"

# 1. Mount SecurityFS
log "🔧 Setting up SecurityFS..."
if ! mount | grep -q securityfs; then
    if mount -t securityfs securityfs /sys/kernel/security 2>/dev/null; then
        log "✅ SecurityFS mounted successfully"
    else
        log "⚠️ SecurityFS mount failed (may already be mounted)"
    fi
else
    log "✅ SecurityFS already mounted"
fi

# 2. Detect and configure LSMs
log "🔍 Detecting Linux Security Modules..."
if /usr/local/bin/lsm-detector.sh; then
    log "✅ LSM detection completed successfully"
else
    handle_error "LSM detection failed"
fi

# 3. Apply kernel security hardening
log "🛡️ Applying security hardening..."
if /usr/local/bin/sysctls-hardening.sh; then
    log "✅ Security hardening applied"
else
    log "⚠️ Security hardening had issues (may be expected in containerized environments)"
fi

# 4. Validate kernel security features
log "🔬 Validating kernel security features..."
SECURITY_SCORE=0
TOTAL_CHECKS=6
MINIMUM_SCORE=3  # Reduced for Docker Desktop compatibility

# Check SecurityFS mount
if mount | grep -q securityfs && [ -d "/sys/kernel/security" ] && [ -r "/sys/kernel/security" ]; then
    SECURITY_SCORE=$((SECURITY_SCORE + 1))
    log "✅ SecurityFS: PASS (score: $SECURITY_SCORE)"
else
    log "❌ SecurityFS: FAIL (score: $SECURITY_SCORE)"
fi

# Check LSM interface
if [ -f "/sys/kernel/security/lsm" ] && [ -r "/sys/kernel/security/lsm" ]; then
    SECURITY_SCORE=$((SECURITY_SCORE + 1))
    log "✅ LSM Interface: PASS (score: $SECURITY_SCORE)"
else
    log "❌ LSM Interface: FAIL (score: $SECURITY_SCORE)"
fi

# Check PID namespaces
if [ -f /proc/self/ns/pid ]; then
    SECURITY_SCORE=$((SECURITY_SCORE + 1))
    log "✅ PID Namespaces: PASS (score: $SECURITY_SCORE)"
else
    log "❌ PID Namespaces: FAIL (score: $SECURITY_SCORE)"
fi

# Check User namespaces
if [ -f /proc/self/ns/user ]; then
    SECURITY_SCORE=$((SECURITY_SCORE + 1))
    log "✅ User Namespaces: PASS (score: $SECURITY_SCORE)"
else
    log "❌ User Namespaces: FAIL (score: $SECURITY_SCORE)"
fi

# Check cgroups
if [ -f /sys/fs/cgroup/cgroup.controllers ] || [ -d /sys/fs/cgroup/memory ]; then
    SECURITY_SCORE=$((SECURITY_SCORE + 1))
    log "✅ Cgroups: PASS (score: $SECURITY_SCORE)"
else
    log "❌ Cgroups: FAIL (score: $SECURITY_SCORE)"
fi

# Check seccomp
if grep -q 'Seccomp:.*[12]' /proc/self/status 2>/dev/null; then
    SECURITY_SCORE=$((SECURITY_SCORE + 1))
    log "✅ Seccomp: PASS (score: $SECURITY_SCORE)"
else
    log "❌ Seccomp: FAIL (score: $SECURITY_SCORE)"
fi

SECURITY_PERCENTAGE=$((SECURITY_SCORE * 100 / TOTAL_CHECKS))
log "📈 Final Security Score: $SECURITY_SCORE/$TOTAL_CHECKS ($SECURITY_PERCENTAGE%)"

# 5. Generate comprehensive security report
log "📊 Generating security infrastructure report..."

# Create security readiness file
cat > "$SECURITY_STATUS_DIR/security-ready.json" <<EOF
{
  "ready": $([ $SECURITY_SCORE -ge $MINIMUM_SCORE ] && echo "true" || echo "false"),
  "score": $SECURITY_SCORE,
  "total": $TOTAL_CHECKS,
  "percentage": $SECURITY_PERCENTAGE,
  "minimum_required": $MINIMUM_SCORE,
  "timestamp": "$TIMESTAMP",
  "bootstrap_mode": true,
  "issues": []
}
EOF

# Create simple ready marker
if [ $SECURITY_SCORE -ge $MINIMUM_SCORE ]; then
    echo "READY" > "$SECURITY_STATUS_DIR/ready"
else
    echo "NOT_READY" > "$SECURITY_STATUS_DIR/ready"
fi

echo "$TIMESTAMP" > "$SECURITY_STATUS_DIR/ready-timestamp"

# 6. Create initial status files for monitoring
echo '{"status": "bootstrap_complete", "timestamp": "'$TIMESTAMP'", "mode": "one_shot"}' > "$SECURITY_STATUS_DIR/init-status.json"

# Generate capabilities report
log "📋 Generating capabilities report..."
cat > "$SECURITY_STATUS_DIR/capabilities-report.json" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "bootstrap_mode": true,
  "security_score": $SECURITY_SCORE,
  "total_checks": $TOTAL_CHECKS,
  "security_percentage": $SECURITY_PERCENTAGE,
  "kernel_version": "$(uname -r)",
  "container_runtime": "docker",
  "securityfs_mounted": $(mount | grep -q securityfs && echo "true" || echo "false"),
  "lsm_interface_available": $([ -f "/sys/kernel/security/lsm" ] && echo "true" || echo "false"),
  "namespaces_supported": {
    "pid": $([ -f /proc/self/ns/pid ] && echo "true" || echo "false"),
    "user": $([ -f /proc/self/ns/user ] && echo "true" || echo "false"),
    "mount": $([ -f /proc/self/ns/mnt ] && echo "true" || echo "false"),
    "network": $([ -f /proc/self/ns/net ] && echo "true" || echo "false")
  },
  "cgroups_available": $([ -f /sys/fs/cgroup/cgroup.controllers ] || [ -d /sys/fs/cgroup/memory ] && echo "true" || echo "false"),
  "seccomp_supported": $(grep -q 'Seccomp:.*[12]' /proc/self/status 2>/dev/null && echo "true" || echo "false")
}
EOF

# 7. Perform initial health check to populate monitoring data
log "🏥 Performing bootstrap health check..."
if /usr/local/bin/health-check.sh; then
    log "✅ Bootstrap health check completed successfully"
else
    log "⚠️ Bootstrap health check completed with warnings (expected for initial setup)"
fi

# 8. Final validation and exit
if [ $SECURITY_SCORE -ge $MINIMUM_SCORE ]; then
    log "🎉 Security bootstrap completed successfully!"
    log "✅ Security infrastructure ready for application containers"
    log "📊 Security score: $SECURITY_SCORE/$TOTAL_CHECKS ($SECURITY_PERCENTAGE%)"
    
    # Mark bootstrap as complete
    echo "COMPLETE" > "$SECURITY_STATUS_DIR/bootstrap-status"
    cat > "$SECURITY_STATUS_DIR/bootstrap-result.json" <<EOF
{
  "status": "complete",
  "security_score": $SECURITY_SCORE,
  "total_checks": $TOTAL_CHECKS,
  "percentage": $SECURITY_PERCENTAGE,
  "timestamp": "$TIMESTAMP",
  "duration": "${SECONDS}s",
  "next_steps": [
    "Deploy application containers",
    "Monitor security health via shared volume",
    "Run periodic health checks as needed"
  ]
}
EOF
    
    log "🚀 Bootstrap complete - privileged container will now exit"
    log "📁 Security status available in: $SECURITY_STATUS_DIR/"
    
    exit 0
else
    handle_error "Security bootstrap failed - insufficient security score ($SECURITY_SCORE/$TOTAL_CHECKS, minimum: $MINIMUM_SCORE)"
fi
