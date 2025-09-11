#!/bin/bash
# GameForge Production Phase 4 - Enhanced Entrypoint with Model Security
# This script provides enhanced entrypoint functionality with comprehensive security validation

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}🚀 GameForge Phase 4 - Enhanced Production Entrypoint${NC}"
echo "==========================================================="

# Configuration
SECURITY_SCAN_ENABLED=${SECURITY_SCAN_ENABLED:-"true"}
MODEL_SECURITY_ENABLED=${MODEL_SECURITY_ENABLED:-"true"}
VAULT_HEALTH_CHECK_ENABLED=${VAULT_HEALTH_CHECK_ENABLED:-"true"}
PERFORMANCE_MONITORING_ENABLED=${PERFORMANCE_MONITORING_ENABLED:-"true"}
APP_DIR="/app"
MODELS_DIR="/app/models"
SCRIPTS_DIR="/app/scripts"

# Function to log with timestamp
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# Function to check system health
check_system_health() {
    log "${CYAN}🔍 Performing system health checks...${NC}"
    
    # Check available memory
    local available_memory=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    local total_memory=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    local memory_usage=$((100 - (available_memory * 100 / total_memory)))
    
    log "Memory usage: ${memory_usage}% (${available_memory}MB available)"
    
    if [ ${memory_usage} -gt 90 ]; then
        log "${RED}⚠️  High memory usage detected: ${memory_usage}%${NC}"
    fi
    
    # Check disk space
    local disk_usage=$(df /tmp | awk 'NR==2 {print $5}' | sed 's/%//')
    log "Disk usage (/tmp): ${disk_usage}%"
    
    if [ ${disk_usage} -gt 85 ]; then
        log "${RED}⚠️  High disk usage detected: ${disk_usage}%${NC}"
    fi
    
    # Check GPU availability
    if command -v nvidia-smi &> /dev/null; then
        local gpu_count=$(nvidia-smi --list-gpus | wc -l)
        log "GPU count: ${gpu_count}"
        
        # Check GPU memory
        nvidia-smi --query-gpu=index,name,memory.total,memory.used,utilization.gpu --format=csv,noheader,nounits | while read line; do
            log "GPU: ${line}"
        done
    else
        log "No GPU detected"
    fi
    
    log "${GREEN}✅ System health check completed${NC}"
}

# Function to validate Vault connectivity
check_vault_health() {
    if [ "${VAULT_HEALTH_CHECK_ENABLED}" != "true" ]; then
        log "${YELLOW}Vault health check disabled${NC}"
        return 0
    fi
    
    log "${CYAN}🔐 Checking Vault connectivity...${NC}"
    
    local vault_addr=${VAULT_ADDR:-"http://vault:8200"}
    local vault_status
    
    # Check Vault health endpoint
    if vault_status=$(curl -s -f "${vault_addr}/v1/sys/health" 2>/dev/null); then
        local vault_sealed=$(echo "${vault_status}" | jq -r '.sealed // "unknown"')
        local vault_version=$(echo "${vault_status}" | jq -r '.version // "unknown"')
        
        if [ "${vault_sealed}" = "false" ]; then
            log "${GREEN}✅ Vault is accessible and unsealed (version: ${vault_version})${NC}"
        else
            log "${RED}❌ Vault is sealed or inaccessible${NC}"
            return 1
        fi
    else
        log "${RED}❌ Cannot connect to Vault at ${vault_addr}${NC}"
        return 1
    fi
}

# Function to perform security validation
perform_security_scan() {
    if [ "${SECURITY_SCAN_ENABLED}" != "true" ]; then
        log "${YELLOW}Security scan disabled${NC}"
        return 0
    fi
    
    log "${CYAN}🛡️  Performing security validation...${NC}"
    
    # Check for unauthorized files in application directory
    log "Scanning for unauthorized files..."
    
    # Scan for potential security risks
    local suspicious_files=0
    
    # Check for executable files that shouldn't be there
    while IFS= read -r -d '' file; do
        if [[ "${file}" =~ \.(sh|exe|bat|cmd|ps1)$ ]]; then
            if [[ ! "${file}" =~ ^/app/(scripts|bin)/ ]]; then
                log "${RED}⚠️  Suspicious executable: ${file}${NC}"
                ((suspicious_files++))
            fi
        fi
    done < <(find "${APP_DIR}" -type f -executable -print0 2>/dev/null)
    
    # Check for world-writable files
    while IFS= read -r -d '' file; do
        log "${RED}⚠️  World-writable file: ${file}${NC}"
        ((suspicious_files++))
    done < <(find "${APP_DIR}" -type f -perm -002 -print0 2>/dev/null)
    
    # Check for setuid/setgid files
    while IFS= read -r -d '' file; do
        log "${RED}⚠️  Setuid/setgid file: ${file}${NC}"
        ((suspicious_files++))
    done < <(find "${APP_DIR}" -type f \( -perm -4000 -o -perm -2000 \) -print0 2>/dev/null)
    
    if [ ${suspicious_files} -eq 0 ]; then
        log "${GREEN}✅ No security issues detected${NC}"
    else
        log "${RED}❌ Security scan found ${suspicious_files} issues${NC}"
        if [ "${STRICT_SECURITY:-false}" = "true" ]; then
            return 1
        fi
    fi
}

# Function to validate model security
validate_model_security() {
    if [ "${MODEL_SECURITY_ENABLED}" != "true" ]; then
        log "${YELLOW}Model security validation disabled${NC}"
        return 0
    fi
    
    log "${CYAN}🔍 Validating model security...${NC}"
    
    # Ensure no model files are baked into the image
    local baked_models=0
    
    # Common model file extensions
    local model_extensions=("*.safetensors" "*.bin" "*.pt" "*.pth" "*.ckpt" "*.pkl" "*.h5" "*.onnx")
    
    for ext in "${model_extensions[@]}"; do
        while IFS= read -r -d '' file; do
            # Skip the session directory
            if [[ "${file}" =~ ^/tmp/models/ ]]; then
                continue
            fi
            
            log "${RED}❌ Baked model detected: ${file}${NC}"
            ((baked_models++))
        done < <(find "${APP_DIR}" -name "${ext}" -type f -print0 2>/dev/null)
    done
    
    if [ ${baked_models} -eq 0 ]; then
        log "${GREEN}✅ No baked models found - secure runtime fetching enforced${NC}"
    else
        log "${RED}❌ Found ${baked_models} baked model files${NC}"
        if [ "${STRICT_MODEL_SECURITY:-true}" = "true" ]; then
            return 1
        fi
    fi
    
    # Check model directory permissions
    if [ -d "${MODELS_DIR}" ]; then
        local models_perm=$(stat -c "%a" "${MODELS_DIR}")
        if [ "${models_perm}" != "755" ] && [ "${models_perm}" != "700" ]; then
            log "${RED}⚠️  Insecure models directory permissions: ${models_perm}${NC}"
        else
            log "${GREEN}✅ Models directory permissions secure: ${models_perm}${NC}"
        fi
    fi
}

# Function to setup monitoring
setup_monitoring() {
    if [ "${PERFORMANCE_MONITORING_ENABLED}" != "true" ]; then
        log "${YELLOW}Performance monitoring disabled${NC}"
        return 0
    fi
    
    log "${CYAN}📊 Setting up performance monitoring...${NC}"
    
    # Create monitoring directory
    mkdir -p /tmp/monitoring
    
    # Start resource monitoring in background
    {
        while true; do
            local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
            local memory_usage=$(free -m | awk 'NR==2{printf "%.0f", $3}')
            local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
            
            echo "${timestamp},${memory_usage},${cpu_usage}" >> /tmp/monitoring/resources.csv
            
            # GPU monitoring if available
            if command -v nvidia-smi &> /dev/null; then
                local gpu_memory=$(nvidia-smi --query-gpu=memory.used --format=csv,noheader,nounits | head -1)
                local gpu_util=$(nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits | head -1)
                echo "${timestamp},${gpu_memory},${gpu_util}" >> /tmp/monitoring/gpu.csv
            fi
            
            sleep 30
        done
    } &
    
    # Store monitoring PID
    echo $! > /tmp/monitoring/monitor.pid
    
    log "${GREEN}✅ Performance monitoring started${NC}"
}

# Function to setup signal handlers
setup_signal_handlers() {
    log "${CYAN}⚙️  Setting up signal handlers...${NC}"
    
    # Graceful shutdown handler
    shutdown_handler() {
        log "${YELLOW}Received shutdown signal, cleaning up...${NC}"
        
        # Stop monitoring
        if [ -f /tmp/monitoring/monitor.pid ]; then
            local monitor_pid=$(cat /tmp/monitoring/monitor.pid)
            kill "${monitor_pid}" 2>/dev/null || true
            rm -f /tmp/monitoring/monitor.pid
        fi
        
        # Clean up model sessions
        if [ -n "${GAMEFORGE_MODEL_SESSION:-}" ]; then
            log "Cleaning up model session: ${GAMEFORGE_MODEL_SESSION}"
            rm -rf "/tmp/models/${GAMEFORGE_MODEL_SESSION}" 2>/dev/null || true
        fi
        
        # Clear GPU memory
        if command -v nvidia-smi &> /dev/null; then
            nvidia-smi --gpu-reset 2>/dev/null || true
        fi
        
        log "${GREEN}✅ Cleanup completed${NC}"
        exit 0
    }
    
    # Set up signal traps
    trap shutdown_handler SIGTERM SIGINT SIGQUIT
    
    log "${GREEN}✅ Signal handlers configured${NC}"
}

# Function to validate environment
validate_environment() {
    log "${CYAN}🔧 Validating environment configuration...${NC}"
    
    # Check required environment variables
    local required_vars=("GAMEFORGE_ENV")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("${var}")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log "${RED}❌ Missing required environment variables: ${missing_vars[*]}${NC}"
        return 1
    fi
    
    # Log environment info
    log "Environment: ${GAMEFORGE_ENV:-development}"
    log "Debug mode: ${DEBUG:-false}"
    log "Model security: ${MODEL_SECURITY_ENABLED}"
    log "Vault health check: ${VAULT_HEALTH_CHECK_ENABLED}"
    
    log "${GREEN}✅ Environment validation completed${NC}"
}

# Function to prepare application
prepare_application() {
    log "${CYAN}📦 Preparing application...${NC}"
    
    # Change to application directory
    cd "${APP_DIR}"
    
    # Ensure proper permissions
    chown -R app:app "${APP_DIR}" 2>/dev/null || true
    
    # Create necessary directories
    mkdir -p "${MODELS_DIR}" /tmp/monitoring /tmp/models
    chmod 755 "${MODELS_DIR}"
    chmod 1777 /tmp/models  # Sticky bit for multi-user scenarios
    
    # Set restrictive umask
    umask 077
    
    log "${GREEN}✅ Application prepared${NC}"
}

# Main execution function
main() {
    log "${BLUE}Starting GameForge Phase 4 Enhanced Entrypoint...${NC}"
    
    # Setup signal handlers first
    setup_signal_handlers
    
    # Validate environment
    validate_environment
    
    # System health checks
    check_system_health
    
    # Vault connectivity check
    check_vault_health
    
    # Security validation
    perform_security_scan
    
    # Model security validation
    validate_model_security
    
    # Prepare application
    prepare_application
    
    # Setup monitoring
    setup_monitoring
    
    log "${GREEN}✅ All validation checks passed${NC}"
    log "${BLUE}🚀 Starting secure model management and application...${NC}"
    
    # Execute model manager with application
    if [ -f "${SCRIPTS_DIR}/model-manager.sh" ]; then
        exec "${SCRIPTS_DIR}/model-manager.sh" "$@"
    else
        log "${RED}❌ Model manager script not found${NC}"
        exit 1
    fi
}

# Execute main function with all arguments
main "$@"
