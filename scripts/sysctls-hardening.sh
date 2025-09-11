#!/bin/bash
# Sysctls Security Hardening Script
# ==================================
# Applies kernel security hardening via sysctl parameters

set -euo pipefail

SECURITY_STATUS_DIR="/shared/security"
SYSCTL_STATUS_FILE="$SECURITY_STATUS_DIR/sysctl-status.json"

# Function to log with timestamp
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] SYSCTL: $1"
}

# Function to apply sysctl safely
apply_sysctl() {
    local param="$1"
    local value="$2"
    local description="$3"
    
    local current_value=""
    local status="failed"
    local message=""
    
    # Check if parameter exists
    if [ -f "/proc/sys/$param" ]; then
        current_value=$(cat "/proc/sys/$param" 2>/dev/null || echo "unreadable")
        
        # Try to set the value
        if echo "$value" > "/proc/sys/$param" 2>/dev/null; then
            status="applied"
            message="Successfully set $param = $value"
            log "✅ $description: $param = $value"
        else
            status="failed"
            message="Failed to set $param = $value (permission denied)"
            log "❌ $description: Failed to set $param = $value"
        fi
    else
        status="not_available"
        message="Parameter $param not available on this kernel"
        log "⚠️ $description: Parameter $param not available"
    fi
    
    # Record status
    local sysctl_entry=$(cat <<EOF
{
  "parameter": "$param",
  "description": "$description", 
  "target_value": "$value",
  "current_value": "$current_value",
  "status": "$status",
  "message": "$message",
  "timestamp": "$(date -Iseconds)"
}
EOF
)
    
    echo "$sysctl_entry" >> "$SECURITY_STATUS_DIR/sysctl-applications.jsonl"
}

log "🛡️ Starting kernel security hardening..."

# Ensure security status directory exists
mkdir -p "$SECURITY_STATUS_DIR"

# Clear previous sysctl applications log
> "$SECURITY_STATUS_DIR/sysctl-applications.jsonl"

# Network Security Hardening
log "🌐 Applying network security hardening..."

apply_sysctl "net.ipv4.ip_forward" "0" "Disable IP forwarding"
apply_sysctl "net.ipv4.conf.all.send_redirects" "0" "Disable ICMP redirects"
apply_sysctl "net.ipv4.conf.default.send_redirects" "0" "Disable ICMP redirects (default)"
apply_sysctl "net.ipv4.conf.all.accept_redirects" "0" "Disable ICMP redirect acceptance"
apply_sysctl "net.ipv4.conf.default.accept_redirects" "0" "Disable ICMP redirect acceptance (default)"
apply_sysctl "net.ipv4.conf.all.accept_source_route" "0" "Disable source routing"
apply_sysctl "net.ipv4.conf.default.accept_source_route" "0" "Disable source routing (default)"
apply_sysctl "net.ipv4.conf.all.log_martians" "1" "Log martian packets"
apply_sysctl "net.ipv4.conf.default.log_martians" "1" "Log martian packets (default)"
apply_sysctl "net.ipv4.icmp_echo_ignore_broadcasts" "1" "Ignore ICMP ping broadcasts"
apply_sysctl "net.ipv4.icmp_ignore_bogus_error_responses" "1" "Ignore bogus ICMP error responses"
apply_sysctl "net.ipv4.tcp_syncookies" "1" "Enable SYN cookies"
apply_sysctl "net.ipv4.conf.all.rp_filter" "1" "Enable reverse path filtering"
apply_sysctl "net.ipv4.conf.default.rp_filter" "1" "Enable reverse path filtering (default)"

# IPv6 Security (if available)
if [ -d /proc/sys/net/ipv6 ]; then
    log "🌐 Applying IPv6 security hardening..."
    apply_sysctl "net.ipv6.conf.all.accept_redirects" "0" "Disable IPv6 ICMP redirects"
    apply_sysctl "net.ipv6.conf.default.accept_redirects" "0" "Disable IPv6 ICMP redirects (default)"
    apply_sysctl "net.ipv6.conf.all.accept_source_route" "0" "Disable IPv6 source routing"
    apply_sysctl "net.ipv6.conf.default.accept_source_route" "0" "Disable IPv6 source routing (default)"
else
    log "⚠️ IPv6 not available, skipping IPv6 hardening"
fi

# Kernel Security Hardening
log "🔒 Applying kernel security hardening..."

apply_sysctl "kernel.dmesg_restrict" "1" "Restrict dmesg access"
apply_sysctl "kernel.kptr_restrict" "2" "Restrict kernel pointer access"
apply_sysctl "kernel.yama.ptrace_scope" "1" "Restrict ptrace scope"
apply_sysctl "kernel.kexec_load_disabled" "1" "Disable kexec"
apply_sysctl "kernel.unprivileged_bpf_disabled" "1" "Disable unprivileged BPF"
apply_sysctl "net.core.bpf_jit_harden" "2" "Harden BPF JIT compiler"

# Memory Protection
log "🧠 Applying memory protection hardening..."

apply_sysctl "vm.mmap_rnd_bits" "32" "Increase ASLR entropy"
apply_sysctl "vm.mmap_rnd_compat_bits" "16" "Increase ASLR entropy (compat)"
apply_sysctl "vm.unprivileged_userfaultfd" "0" "Disable unprivileged userfaultfd"

# Process Security
log "⚙️ Applying process security hardening..."

apply_sysctl "fs.protected_hardlinks" "1" "Enable hardlink protection"
apply_sysctl "fs.protected_symlinks" "1" "Enable symlink protection"
apply_sysctl "fs.protected_fifos" "2" "Enable FIFO protection"
apply_sysctl "fs.protected_regular" "2" "Enable regular file protection"
apply_sysctl "fs.suid_dumpable" "0" "Disable core dumps for SUID processes"

# Container-specific hardening
log "📦 Applying container-specific hardening..."

apply_sysctl "user.max_user_namespaces" "10000" "Limit user namespaces"
apply_sysctl "user.max_pid_namespaces" "10000" "Limit PID namespaces"
apply_sysctl "user.max_net_namespaces" "10000" "Limit network namespaces"

# Performance and DoS Protection
log "🚀 Applying performance and DoS protection..."

apply_sysctl "net.ipv4.tcp_max_syn_backlog" "4096" "Increase SYN backlog"
apply_sysctl "net.core.somaxconn" "4096" "Increase connection queue"
apply_sysctl "net.core.netdev_max_backlog" "5000" "Increase netdev backlog"
apply_sysctl "net.ipv4.tcp_fin_timeout" "30" "Reduce FIN timeout"
apply_sysctl "net.ipv4.tcp_keepalive_time" "1800" "Adjust keepalive time"

# Generate summary report
log "📊 Generating sysctl status report..."

# Count applications
TOTAL_ATTEMPTS=$(wc -l < "$SECURITY_STATUS_DIR/sysctl-applications.jsonl")
SUCCESSFUL_APPLICATIONS=$(grep '"status": "applied"' "$SECURITY_STATUS_DIR/sysctl-applications.jsonl" | wc -l)
FAILED_APPLICATIONS=$(grep '"status": "failed"' "$SECURITY_STATUS_DIR/sysctl-applications.jsonl" | wc -l)
UNAVAILABLE_PARAMETERS=$(grep '"status": "not_available"' "$SECURITY_STATUS_DIR/sysctl-applications.jsonl" | wc -l)

# Generate final status report
SYSCTL_REPORT=$(cat <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "kernel_version": "$(uname -r)",
  "hardening_summary": {
    "total_parameters": $TOTAL_ATTEMPTS,
    "successfully_applied": $SUCCESSFUL_APPLICATIONS,
    "failed_to_apply": $FAILED_APPLICATIONS,
    "not_available": $UNAVAILABLE_PARAMETERS,
    "success_rate": $((SUCCESSFUL_APPLICATIONS * 100 / TOTAL_ATTEMPTS))
  },
  "categories_applied": [
    "network_security",
    "kernel_security", 
    "memory_protection",
    "process_security",
    "container_specific",
    "performance_dos_protection"
  ],
  "security_level": "$([ $SUCCESSFUL_APPLICATIONS -ge $((TOTAL_ATTEMPTS * 75 / 100)) ] && echo "high" || echo "medium")",
  "recommendations": [
    $([ $FAILED_APPLICATIONS -gt 0 ] && echo '    "Review failed sysctl applications and container privileges",' || true)
    $([ $UNAVAILABLE_PARAMETERS -gt 5 ] && echo '    "Consider upgrading kernel for additional security features",' || true)
  ]
}
EOF
)

# Remove trailing commas
SYSCTL_REPORT=$(echo "$SYSCTL_REPORT" | sed 's/,\s*]/]/')

echo "$SYSCTL_REPORT" > "$SYSCTL_STATUS_FILE"

log "📋 Sysctl status report saved to $SYSCTL_STATUS_FILE"
log "✅ Kernel security hardening completed"
log "📊 Applied: $SUCCESSFUL_APPLICATIONS/$TOTAL_ATTEMPTS parameters ($(($SUCCESSFUL_APPLICATIONS * 100 / $TOTAL_ATTEMPTS))% success rate)"

# Exit with appropriate code based on success rate
if [ $SUCCESSFUL_APPLICATIONS -ge $((TOTAL_ATTEMPTS * 25 / 100)) ]; then
    log "🎉 Hardening successful (≥25% parameters applied for Docker Desktop environment)"
    exit 0
else
    log "⚠️ Hardening partially successful (<25% parameters applied)"
    exit 1
fi
