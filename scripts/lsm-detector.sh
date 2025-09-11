#!/bin/bash
# LSM Detection and Analysis Script
# =================================
# Detects available Linux Security Modules and their capabilities

set -euo pipefail

SECURITY_STATUS_DIR="/shared/security"
LSM_STATUS_FILE="$SECURITY_STATUS_DIR/lsm-status.json"
SECURITYFS_MOUNT="/sys/kernel/security"

# Function to log with timestamp
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] LSM: $1"
}

# Function to detect LSMs
detect_lsms() {
    local lsm_list=""
    local lsm_details=""
    
    # Check if LSM interface is available
    if [ -f "$SECURITYFS_MOUNT/lsm" ]; then
        lsm_list=$(cat "$SECURITYFS_MOUNT/lsm" 2>/dev/null || echo "")
        log "✅ LSM interface available: $lsm_list"
    else
        log "❌ LSM interface not available"
        lsm_list=""
    fi
    
    # Analyze each LSM
    local lsm_analysis=""
    
    # Check for SELinux
    if echo "$lsm_list" | grep -q "selinux"; then
        local selinux_status="enabled"
        local selinux_mode=""
        local selinux_policy=""
        
        if [ -f /sys/fs/selinux/enforce ]; then
            local enforce_mode=$(cat /sys/fs/selinux/enforce 2>/dev/null || echo "unknown")
            case $enforce_mode in
                0) selinux_mode="permissive" ;;
                1) selinux_mode="enforcing" ;;
                *) selinux_mode="unknown" ;;
            esac
        fi
        
        if [ -f /sys/fs/selinux/policyvers ]; then
            selinux_policy=$(cat /sys/fs/selinux/policyvers 2>/dev/null || echo "unknown")
        fi
        
        lsm_analysis="$lsm_analysis
    \"selinux\": {
      \"status\": \"$selinux_status\",
      \"mode\": \"$selinux_mode\",
      \"policy_version\": \"$selinux_policy\",
      \"interface\": \"/sys/fs/selinux\"
    },"
        
        log "✅ SELinux detected: mode=$selinux_mode, policy=$selinux_policy"
    else
        lsm_analysis="$lsm_analysis
    \"selinux\": {
      \"status\": \"disabled\",
      \"mode\": \"none\",
      \"policy_version\": \"none\",
      \"interface\": \"not_available\"
    },"
        log "❌ SELinux not available"
    fi
    
    # Check for AppArmor
    if echo "$lsm_list" | grep -q "apparmor"; then
        local apparmor_status="enabled"
        local apparmor_profiles=""
        
        if [ -d /sys/kernel/security/apparmor ]; then
            apparmor_profiles=$(find /sys/kernel/security/apparmor/profiles -name "*" 2>/dev/null | wc -l || echo "0")
        fi
        
        lsm_analysis="$lsm_analysis
    \"apparmor\": {
      \"status\": \"$apparmor_status\",
      \"profiles_loaded\": $apparmor_profiles,
      \"interface\": \"/sys/kernel/security/apparmor\"
    },"
        
        log "✅ AppArmor detected: profiles=$apparmor_profiles"
    else
        lsm_analysis="$lsm_analysis
    \"apparmor\": {
      \"status\": \"disabled\",
      \"profiles_loaded\": 0,
      \"interface\": \"not_available\"
    },"
        log "❌ AppArmor not available"
    fi
    
    # Check for Capability LSM
    if echo "$lsm_list" | grep -q "capability"; then
        lsm_analysis="$lsm_analysis
    \"capability\": {
      \"status\": \"enabled\",
      \"interface\": \"built_in\"
    },"
        log "✅ Capability LSM detected"
    else
        lsm_analysis="$lsm_analysis
    \"capability\": {
      \"status\": \"disabled\",
      \"interface\": \"not_available\"
    },"
    fi
    
    # Check for Yama
    if echo "$lsm_list" | grep -q "yama"; then
        local yama_ptrace=""
        if [ -f /proc/sys/kernel/yama/ptrace_scope ]; then
            yama_ptrace=$(cat /proc/sys/kernel/yama/ptrace_scope 2>/dev/null || echo "unknown")
        fi
        
        lsm_analysis="$lsm_analysis
    \"yama\": {
      \"status\": \"enabled\",
      \"ptrace_scope\": \"$yama_ptrace\",
      \"interface\": \"/proc/sys/kernel/yama\"
    },"
        log "✅ Yama LSM detected: ptrace_scope=$yama_ptrace"
    else
        lsm_analysis="$lsm_analysis
    \"yama\": {
      \"status\": \"disabled\",
      \"ptrace_scope\": \"none\",
      \"interface\": \"not_available\"
    },"
    fi
    
    # Check for Landlock
    if echo "$lsm_list" | grep -q "landlock"; then
        lsm_analysis="$lsm_analysis
    \"landlock\": {
      \"status\": \"enabled\",
      \"interface\": \"syscall_based\"
    },"
        log "✅ Landlock LSM detected"
    else
        lsm_analysis="$lsm_analysis
    \"landlock\": {
      \"status\": \"disabled\",
      \"interface\": \"not_available\"
    },"
    fi
    
    # Check for SafeSetID
    if echo "$lsm_list" | grep -q "safesetid"; then
        lsm_analysis="$lsm_analysis
    \"safesetid\": {
      \"status\": \"enabled\",
      \"interface\": \"built_in\"
    },"
        log "✅ SafeSetID LSM detected"
    else
        lsm_analysis="$lsm_analysis
    \"safesetid\": {
      \"status\": \"disabled\",
      \"interface\": \"not_available\"
    },"
    fi
    
    # Remove trailing comma (only the very last one in the entire string)
    # Use printf to ensure we have the complete string, then use sed to remove the last comma
    lsm_analysis=$(printf "%s" "$lsm_analysis" | sed -z 's/,\s*$//')
    
    # Generate final LSM status report
    local lsm_report=$(cat <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "kernel_version": "$(uname -r)",
  "lsm_interface_available": $([ -f "$SECURITYFS_MOUNT/lsm" ] && echo "true" || echo "false"),
  "active_lsms": "$lsm_list",
  "lsm_count": $(echo "$lsm_list" | tr ',' '\n' | grep -v '^$' | wc -l),
  "lsm_details": {$lsm_analysis
  },
  "security_recommendations": [
    $([ ! -f "$SECURITYFS_MOUNT/lsm" ] && echo '    "Enable LSM interface by mounting securityfs",' || true)
    $(! echo "$lsm_list" | grep -q "selinux\|apparmor" && echo '    "Consider enabling MAC (SELinux or AppArmor) for mandatory access control",' || true)
    $(! echo "$lsm_list" | grep -q "yama" && echo '    "Enable Yama LSM for ptrace restrictions",' || true)
    $(! echo "$lsm_list" | grep -q "landlock" && echo '    "Enable Landlock LSM for fine-grained sandboxing",' || true)
  ]
}
EOF
)
    
    # Remove trailing commas from recommendations
    lsm_report=$(echo "$lsm_report" | sed 's/,\s*]/]/')
    
    echo "$lsm_report" > "$LSM_STATUS_FILE"
    
    log "📊 LSM analysis complete, report saved to $LSM_STATUS_FILE"
}

# Function to generate LSM compatibility matrix
generate_compatibility_matrix() {
    local compat_file="$SECURITY_STATUS_DIR/lsm-compatibility.json"
    
    local compatibility=$(cat <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "container_compatibility": {
    "docker": {
      "seccomp": "full_support",
      "apparmor": "profile_based",
      "selinux": "context_based",
      "capabilities": "drop_add_support",
      "user_namespaces": "configurable"
    },
    "podman": {
      "seccomp": "full_support",
      "apparmor": "profile_based", 
      "selinux": "context_based",
      "capabilities": "drop_add_support",
      "user_namespaces": "default_enabled"
    }
  },
  "gameforge_requirements": {
    "minimum_lsms": ["capability"],
    "recommended_lsms": ["capability", "yama", "landlock"],
    "optional_lsms": ["selinux", "apparmor"],
    "required_features": ["seccomp", "namespaces", "cgroups"]
  }
}
EOF
)
    
    echo "$compatibility" > "$compat_file"
    log "📋 Compatibility matrix saved to $compat_file"
}

# Main execution
log "🔍 Starting LSM detection and analysis..."

# Ensure security status directory exists
mkdir -p "$SECURITY_STATUS_DIR"

# Detect LSMs
detect_lsms

# Generate compatibility matrix
generate_compatibility_matrix

log "✅ LSM detection completed"
