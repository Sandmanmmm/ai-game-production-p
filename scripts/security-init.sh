#!/bin/bash
# Security Initialization Script
# ==============================
# Mounts securityfs, detects LSMs, configures security, and validates readiness

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SECURITY_STATUS_DIR="/shared/security"
LSM_STATUS_FILE="$SECURITY_STATUS_DIR/lsm-status.json"
SECURITY_READINESS_FILE="$SECURITY_STATUS_DIR/security-ready"
SECURITYFS_MOUNT="/sys/kernel/security"

echo -e "${BLUE}🔒 GameForge Security Initialization${NC}"
echo "======================================"

# Ensure security status directory exists
mkdir -p "$SECURITY_STATUS_DIR"

# Function to log with timestamp
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Function to write status
write_status() {
    local component="$1"
    local status="$2"
    local message="$3"
    local details="${4:-}"
    
    local status_entry=$(cat <<EOF
{
  "component": "$component",
  "status": "$status",
  "message": "$message",
  "details": "$details",
  "timestamp": "$(date -Iseconds)"
}
EOF
)
    
    echo "$status_entry" >> "$SECURITY_STATUS_DIR/${component}-status.json"
}

# Step 1: Mount SecurityFS
log "🔧 Mounting SecurityFS..."
if mount -t securityfs securityfs "$SECURITYFS_MOUNT" 2>/dev/null; then
    log "✅ SecurityFS mounted successfully at $SECURITYFS_MOUNT"
    write_status "securityfs" "enabled" "SecurityFS mounted successfully" "$SECURITYFS_MOUNT"
else
    if [ -d "$SECURITYFS_MOUNT" ] && mountpoint -q "$SECURITYFS_MOUNT"; then
        log "✅ SecurityFS already mounted at $SECURITYFS_MOUNT"
        write_status "securityfs" "enabled" "SecurityFS already mounted" "$SECURITYFS_MOUNT"
    else
        log "❌ Failed to mount SecurityFS"
        write_status "securityfs" "disabled" "Failed to mount SecurityFS" "Check container privileges"
    fi
fi

# Step 2: Detect and Analyze LSMs
log "🔍 Detecting Linux Security Modules..."
/usr/local/bin/lsm-detector.sh

# Step 3: Configure Security Hardening
log "🛡️ Applying security hardening..."
# Detect Docker Desktop/WSL2 environment and use appropriate script
if grep -q "microsoft\|WSL" /proc/version 2>/dev/null || [ -n "${WSL_DISTRO_NAME:-}" ] || [ -n "${WSLENV:-}" ]; then
    log "🐳 Docker Desktop environment detected, using compatible security script"
    /usr/local/bin/sysctls-hardening-docker-desktop.sh
else
    log "🖥️ Native Linux environment detected, using full sysctl hardening"
    /usr/local/bin/sysctls-hardening.sh
fi

# Step 4: Validate Kernel Security Features
log "🔬 Validating kernel security features..."

# Check for namespace support
if [ -f /proc/self/ns/pid ]; then
    log "✅ PID namespaces supported"
    write_status "namespaces-pid" "enabled" "PID namespaces available"
else
    log "❌ PID namespaces not supported"
    write_status "namespaces-pid" "disabled" "PID namespaces not available"
fi

# Check for user namespaces
if [ -f /proc/self/ns/user ]; then
    log "✅ User namespaces supported"
    write_status "namespaces-user" "enabled" "User namespaces available"
else
    log "❌ User namespaces not supported"
    write_status "namespaces-user" "disabled" "User namespaces not available"
fi

# Check for cgroup v2
if [ -f /sys/fs/cgroup/cgroup.controllers ]; then
    log "✅ Cgroup v2 detected"
    write_status "cgroups" "v2" "Cgroup v2 available"
elif [ -d /sys/fs/cgroup/memory ]; then
    log "⚠️ Cgroup v1 detected"
    write_status "cgroups" "v1" "Cgroup v1 available"
else
    log "❌ No cgroup support detected"
    write_status "cgroups" "disabled" "No cgroup support"
fi

# Check for seccomp support
if grep -q 'Seccomp:.*[12]' /proc/self/status 2>/dev/null; then
    log "✅ Seccomp supported"
    write_status "seccomp" "enabled" "Seccomp filtering available"
else
    log "❌ Seccomp not supported"
    write_status "seccomp" "disabled" "Seccomp filtering not available"
fi

# Step 5: Generate Security Capabilities Report
log "📊 Generating security capabilities report..."

CAPABILITIES_REPORT=$(cat <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "host": "$(hostname)",
  "kernel": "$(uname -r)",
  "security_features": {
    "securityfs_mounted": $([ -d "$SECURITYFS_MOUNT" ] && mountpoint -q "$SECURITYFS_MOUNT" && echo "true" || echo "false"),
    "lsm_available": $([ -f "$SECURITYFS_MOUNT/lsm" ] && echo "true" || echo "false"),
    "namespaces": {
      "pid": $([ -f /proc/self/ns/pid ] && echo "true" || echo "false"),
      "user": $([ -f /proc/self/ns/user ] && echo "true" || echo "false"),
      "net": $([ -f /proc/self/ns/net ] && echo "true" || echo "false"),
      "mnt": $([ -f /proc/self/ns/mnt ] && echo "true" || echo "false")
    },
    "cgroups": "$([ -f /sys/fs/cgroup/cgroup.controllers ] && echo "v2" || ([ -d /sys/fs/cgroup/memory ] && echo "v1" || echo "none"))",
    "seccomp": $(grep -q 'Seccomp:.*[12]' /proc/self/status 2>/dev/null && echo "true" || echo "false")
  }
}
EOF
)

echo "$CAPABILITIES_REPORT" > "$SECURITY_STATUS_DIR/capabilities-report.json"

# Step 6: Validate Security Readiness
log "✅ Validating security readiness..."

SECURITY_SCORE=0
TOTAL_CHECKS=6

log "🔍 Starting security component checks..."

# Check securityfs
log "🔍 Checking securityfs mount..."
securityfs_mounted=false
if [ -d "$SECURITYFS_MOUNT" ]; then
    log "🔍 SecurityFS directory exists, checking mount status..."
    # Use a more robust mount check that won't fail with set -e
    if mount | grep -q "securityfs.*$SECURITYFS_MOUNT" 2>/dev/null; then
        securityfs_mounted=true
        log "🔍 SecurityFS confirmed mounted via mount command"
    elif mountpoint -q "$SECURITYFS_MOUNT" 2>/dev/null || false; then
        securityfs_mounted=true
        log "🔍 SecurityFS confirmed mounted via mountpoint command"
    else
        log "🔍 SecurityFS directory exists but not mounted"
    fi
else
    log "🔍 SecurityFS directory does not exist"
fi

if [ "$securityfs_mounted" = true ]; then
    SECURITY_SCORE=$((SECURITY_SCORE + 1))
    log "🔍 SecurityFS check: PASS (score: $SECURITY_SCORE)"
else
    log "🔍 SecurityFS check: FAIL (score: $SECURITY_SCORE)"
fi

# Check LSM availability
log "🔍 Checking LSM interface..."
if [ -f "$SECURITYFS_MOUNT/lsm" ]; then
    SECURITY_SCORE=$((SECURITY_SCORE + 1))
    log "🔍 LSM check: PASS (score: $SECURITY_SCORE)"
else
    log "🔍 LSM check: FAIL (score: $SECURITY_SCORE)"
fi

# Check namespaces
log "🔍 Checking PID namespaces..."
if [ -f /proc/self/ns/pid ]; then
    SECURITY_SCORE=$((SECURITY_SCORE + 1))
    log "🔍 PID NS check: PASS (score: $SECURITY_SCORE)"
else
    log "🔍 PID NS check: FAIL (score: $SECURITY_SCORE)"
fi

log "🔍 Checking User namespaces..."
if [ -f /proc/self/ns/user ]; then
    SECURITY_SCORE=$((SECURITY_SCORE + 1))
    log "🔍 User NS check: PASS (score: $SECURITY_SCORE)"
else
    log "🔍 User NS check: FAIL (score: $SECURITY_SCORE)"
fi

# Check cgroups
log "🔍 Checking cgroups..."
if [ -f /sys/fs/cgroup/cgroup.controllers ] || [ -d /sys/fs/cgroup/memory ]; then
    SECURITY_SCORE=$((SECURITY_SCORE + 1))
    log "🔍 Cgroups check: PASS (score: $SECURITY_SCORE)"
else
    log "🔍 Cgroups check: FAIL (score: $SECURITY_SCORE)"
fi

# Check seccomp
log "🔍 Checking seccomp..."
if grep -q 'Seccomp:.*[12]' /proc/self/status 2>/dev/null; then
    SECURITY_SCORE=$((SECURITY_SCORE + 1))
    log "🔍 Seccomp check: PASS (score: $SECURITY_SCORE)"
else
    log "🔍 Seccomp check: FAIL (score: $SECURITY_SCORE)"
fi

SECURITY_PERCENTAGE=$((SECURITY_SCORE * 100 / TOTAL_CHECKS))

log "📈 Security Score: $SECURITY_SCORE/$TOTAL_CHECKS ($SECURITY_PERCENTAGE%)"

# Determine minimum score based on environment
if grep -q "microsoft\|WSL" /proc/version 2>/dev/null || [ -n "${WSL_DISTRO_NAME:-}" ] || [ -n "${WSLENV:-}" ]; then
    MINIMUM_SCORE=3  # Docker Desktop/WSL2: relaxed requirements
    log "🐳 Docker Desktop environment: minimum security score = $MINIMUM_SCORE"
else
    MINIMUM_SCORE=4  # Native Linux: standard requirements
    log "🖥️ Native Linux environment: minimum security score = $MINIMUM_SCORE"
fi

# Generate final readiness status
READY=$([ $SECURITY_SCORE -ge $MINIMUM_SCORE ] && echo "true" || echo "false")
TIMESTAMP=$(date -Iseconds)

# Simple JSON generation without complex HEREDOC
cat > "$SECURITY_READINESS_FILE" << EOF
{
  "ready": $READY,
  "score": $SECURITY_SCORE,
  "total": $TOTAL_CHECKS,
  "percentage": $SECURITY_PERCENTAGE,
  "minimum_required": $MINIMUM_SCORE,
  "timestamp": "$TIMESTAMP",
  "issues": []
}
EOF



if [ $SECURITY_SCORE -ge $MINIMUM_SCORE ]; then
    log "🎉 Security initialization completed successfully!"
    log "✅ Security readiness: READY"
    
    # Write a simple ready marker for quick checks
    echo "READY" > "$SECURITY_STATUS_DIR/ready"
    echo "$(date -Iseconds)" > "$SECURITY_STATUS_DIR/ready-timestamp"
    
    # Create initial init-status.json for health check
    echo '{"status": "initializing", "timestamp": "'$(date -Iseconds)'", "uptime": "'$SECONDS's"}' > "$SECURITY_STATUS_DIR/init-status.json"
    
    # Execute additional security components
    log "🔧 Security infrastructure ready and monitoring..."
    
    # Perform initial security health check
    log "🏥 Performing initial security health check..."
    /usr/local/bin/health-check.sh || log "⚠️ Security health check completed with warnings"
    
    # Keep container running to maintain mounts
    log "🔄 Maintaining security infrastructure..."
    
    # Monitor and refresh security status every 300 seconds (5 minutes)
    while true; do
        sleep 300
        
        # Comprehensive security monitoring cycle
        log "🔄 Performing periodic security maintenance..."
        
        # Refresh LSM status
        /usr/local/bin/lsm-detector.sh > /dev/null 2>&1 || log "⚠️ LSM detection failed"
        
        # Run comprehensive health check
        if /usr/local/bin/health-check.sh >/dev/null 2>&1; then
            log "✅ Security health check passed"
        else
            exit_code=$?
            case $exit_code in
                1) log "⚠️ Security health check - warnings detected" ;;
                2) log "🚨 Security health check - critical issues detected" ;;
                *) log "❓ Security health check - unknown status" ;;
            esac
        fi
        
        # Update readiness timestamp
        echo "$(date -Iseconds)" > "$SECURITY_STATUS_DIR/ready-timestamp"
        
        # Update security init status
        echo '{"status": "monitoring", "last_check": "'$(date -Iseconds)'", "uptime": "'$SECONDS's"}' > "$SECURITY_STATUS_DIR/init-status.json"
        
        # Check if we should exit (for graceful shutdown)
        if [ -f "$SECURITY_STATUS_DIR/shutdown" ]; then
            log "🛑 Shutdown requested, cleaning up..."
            rm -f "$SECURITY_STATUS_DIR/ready"
            rm -f "$SECURITY_STATUS_DIR/shutdown"
            exit 0
        fi
    done
else
    log "❌ Security initialization failed!"
    log "❌ Security readiness: NOT READY (Score: $SECURITY_SCORE/$TOTAL_CHECKS, minimum: $MINIMUM_SCORE)"
    log "🔍 Check the security status files for details"
    
    echo "NOT_READY" > "$SECURITY_STATUS_DIR/ready"
    exit 1
fi
