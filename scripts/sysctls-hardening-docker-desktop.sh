#!/bin/bash
# Docker Desktop compatible security hardening script
# This version skips sysctl parameter hardening since they're not available in Docker Desktop/WSL2

script_name="SYSCTL-DOCKER-DESKTOP"

log() {
    echo "[$script_name] $1"
}

main() {
    log "🛡️ Starting Docker Desktop compatible security hardening..."
    
    # Detect Docker Desktop environment
    if grep -q "microsoft\|WSL" /proc/version 2>/dev/null || [ -n "${WSL_DISTRO_NAME:-}" ] || [ -n "${WSLENV:-}" ]; then
        log "🐳 Docker Desktop/WSL2 environment detected"
        log "⚠️ Kernel parameter hardening not available in containerized environment"
    else
        log "🖥️ Native Linux environment detected (this shouldn't happen in Docker Desktop)"
    fi
    
    # Generate minimal status report
    local output_dir="${1:-/shared/security}"
    local status_file="$output_dir/sysctl-status.json"
    
    # Ensure output directory exists
    mkdir -p "$output_dir"
    
    # Create minimal status report
    cat > "$status_file" << 'EOF'
{
  "timestamp": "'$(date -Iseconds)'",
  "environment": "docker-desktop",
  "sysctl_support": false,
  "total_parameters": 0,
  "successful_parameters": 0,
  "failed_parameters": 0,
  "success_rate": 0,
  "status": "skipped",
  "note": "Sysctl hardening skipped - not available in Docker Desktop/WSL2 environment",
  "available_security": [
    "Container capabilities restriction",
    "Seccomp profiles",
    "Read-only filesystems",
    "Non-root user execution",
    "Resource limits",
    "Network isolation"
  ],
  "parameters": {}
}
EOF
    
    log "✅ Docker Desktop security assessment complete"
    log "📊 Status report saved to $status_file"
    log "🔒 Security focus: Container-level hardening (capabilities, seccomp, isolation)"
    
    return 0
}

# Execute main function with all arguments
main "$@"
