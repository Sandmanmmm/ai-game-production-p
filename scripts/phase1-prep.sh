#!/usr/bin/env bash

# ========================================================================
# Phase 1: Repository & Build Preparation
# Pre-build hygiene automation script
# ========================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_DIR="$PROJECT_ROOT/phase1-reports"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Create output directory
mkdir -p "$OUTPUT_DIR"

# ========================================================================
# 1. Secrets Scanning
# ========================================================================
run_secrets_scan() {
    log "Running secrets scan..."
    
    local secrets_found=0
    local scan_report="$OUTPUT_DIR/secrets-scan-$TIMESTAMP.json"
    
    # Method 1: TruffleHog (if available)
    if command -v trufflehog &> /dev/null; then
        log "Running TruffleHog scan..."
        if trufflehog filesystem "$PROJECT_ROOT" --json > "$scan_report" 2>/dev/null; then
            secrets_found=$(jq length "$scan_report" 2>/dev/null || echo "0")
            if [ "$secrets_found" -gt 0 ]; then
                error "TruffleHog found $secrets_found potential secrets!"
                cat "$scan_report"
            else
                success "TruffleHog: No secrets detected"
            fi
        else
            warning "TruffleHog scan failed or not available"
        fi
    fi
    
    # Method 2: gitleaks (if available)
    if command -v gitleaks &> /dev/null; then
        log "Running gitleaks scan..."
        local gitleaks_report="$OUTPUT_DIR/gitleaks-$TIMESTAMP.json"
        if gitleaks detect --source="$PROJECT_ROOT" --report-format=json --report-path="$gitleaks_report" --no-git 2>/dev/null; then
            success "Gitleaks: No secrets detected"
        else
            local gitleaks_count=$(jq length "$gitleaks_report" 2>/dev/null || echo "unknown")
            error "Gitleaks found potential secrets! Report: $gitleaks_report"
            secrets_found=$((secrets_found + 1))
        fi
    fi
    
    # Method 3: git-secrets (if available and in git repo)
    if command -v git-secrets &> /dev/null && [ -d "$PROJECT_ROOT/.git" ]; then
        log "Running git-secrets scan..."
        cd "$PROJECT_ROOT"
        if git secrets --scan; then
            success "git-secrets: No secrets detected"
        else
            error "git-secrets found potential secrets!"
            secrets_found=$((secrets_found + 1))
        fi
    fi
    
    # Method 4: Basic pattern matching (fallback)
    log "Running basic pattern matching for secrets..."
    local pattern_report="$OUTPUT_DIR/pattern-secrets-$TIMESTAMP.txt"
    
    # Define sensitive patterns
    local patterns=(
        "password\s*[=:]\s*[\"'][^\"']{8,}[\"']"
        "secret\s*[=:]\s*[\"'][^\"']{16,}[\"']"
        "api_key\s*[=:]\s*[\"'][^\"']{16,}[\"']"
        "private_key"
        "-----BEGIN.*PRIVATE KEY-----"
        "github_pat_[a-zA-Z0-9]{22,255}"
        "ghp_[a-zA-Z0-9]{36}"
        "sk-[a-zA-Z0-9]{48}"
        "xoxb-[0-9]{11,13}-[0-9]{11,13}-[a-zA-Z0-9]{24}"
    )
    
    echo "# Pattern-based secrets scan - $TIMESTAMP" > "$pattern_report"
    echo "# Scanning directory: $PROJECT_ROOT" >> "$pattern_report"
    echo "" >> "$pattern_report"
    
    local pattern_found=0
    for pattern in "${patterns[@]}"; do
        log "Checking pattern: $pattern"
        if grep -r -n -E "$pattern" "$PROJECT_ROOT" \
            --exclude-dir=.git \
            --exclude-dir=node_modules \
            --exclude-dir=.venv \
            --exclude-dir=venv \
            --exclude-dir=env \
            --exclude-dir=__pycache__ \
            --exclude="*.log" \
            --exclude="*phase1-reports*" \
            --exclude="*.backup" >> "$pattern_report" 2>/dev/null; then
            pattern_found=1
        fi
    done
    
    if [ "$pattern_found" -eq 1 ]; then
        error "Pattern matching found potential secrets! Report: $pattern_report"
        secrets_found=$((secrets_found + 1))
    else
        success "Pattern matching: No obvious secrets detected"
        echo "No secrets found using pattern matching" >> "$pattern_report"
    fi
    
    # Summary
    if [ "$secrets_found" -eq 0 ]; then
        success "🔐 SECRETS SCAN PASSED: No secrets detected"
        return 0
    else
        error "🚨 SECRETS SCAN FAILED: Potential secrets found!"
        echo ""
        echo "REMEDIATION STEPS:"
        echo "1. Review reports in: $OUTPUT_DIR"
        echo "2. Remove or move secrets to HashiCorp Vault"
        echo "3. Rotate any leaked credentials"
        echo "4. Add patterns to .gitignore"
        echo "5. Configure git-secrets hooks"
        return 1
    fi
}

# ========================================================================
# 2. Dependency Version Locking
# ========================================================================
lock_dependencies() {
    log "Locking dependency versions..."
    
    local lock_success=0
    
    # Python dependencies
    if [ -f "$PROJECT_ROOT/requirements.in" ]; then
        log "Compiling Python requirements..."
        cd "$PROJECT_ROOT"
        
        if command -v pip-compile &> /dev/null; then
            # Use pip-tools for precise locking
            pip-compile requirements.in --output-file requirements.txt --verbose
            success "Python: requirements.txt generated from requirements.in"
        elif command -v pip &> /dev/null; then
            # Fallback: pip freeze (if virtual env is active)
            if [ -n "${VIRTUAL_ENV:-}" ] || [ -n "${CONDA_DEFAULT_ENV:-}" ]; then
                pip freeze > requirements.txt
                success "Python: requirements.txt generated using pip freeze"
            else
                warning "Python: No virtual environment detected, skipping pip freeze"
            fi
        else
            warning "Python: pip not available"
        fi
    else
        warning "Python: requirements.in not found"
    fi
    
    # Node.js dependencies (frontend)
    if [ -f "$PROJECT_ROOT/package.json" ] && [ ! -f "$PROJECT_ROOT/package-lock.json" ]; then
        log "Generating Node.js lock file..."
        cd "$PROJECT_ROOT"
        
        if command -v npm &> /dev/null; then
            npm install --package-lock-only
            success "Node.js: package-lock.json generated"
            lock_success=1
        else
            warning "Node.js: npm not available"
        fi
    elif [ -f "$PROJECT_ROOT/package-lock.json" ]; then
        success "Node.js: package-lock.json already exists"
        lock_success=1
    fi
    
    # Node.js dependencies (backend)
    if [ -f "$PROJECT_ROOT/backend/package.json" ] && [ ! -f "$PROJECT_ROOT/backend/package-lock.json" ]; then
        log "Generating backend Node.js lock file..."
        cd "$PROJECT_ROOT/backend"
        
        if command -v npm &> /dev/null; then
            npm install --package-lock-only
            success "Backend Node.js: package-lock.json generated"
            lock_success=1
        else
            warning "Backend Node.js: npm not available"
        fi
    elif [ -f "$PROJECT_ROOT/backend/package-lock.json" ]; then
        success "Backend Node.js: package-lock.json already exists"
        lock_success=1
    fi
    
    # Check for other dependency files
    local dep_files=("poetry.lock" "Pipfile.lock" "yarn.lock" "composer.lock")
    for dep_file in "${dep_files[@]}"; do
        if [ -f "$PROJECT_ROOT/$dep_file" ]; then
            success "Found dependency lock file: $dep_file"
            lock_success=1
        fi
    done
    
    if [ "$lock_success" -eq 1 ]; then
        success "📦 DEPENDENCY LOCKING PASSED: Dependencies are locked"
        return 0
    else
        warning "📦 DEPENDENCY LOCKING WARNING: Some dependencies may not be locked"
        return 0  # Warning, not error
    fi
}

# ========================================================================
# 3. Reproducible Build Configuration
# ========================================================================
setup_reproducible_builds() {
    log "Configuring reproducible builds..."
    
    local build_success=0
    
    # Check Dockerfile for build args
    local dockerfiles=("Dockerfile" "Dockerfile.production" "Dockerfile.production.enhanced" "Dockerfile.frontend")
    
    for dockerfile in "${dockerfiles[@]}"; do
        if [ -f "$PROJECT_ROOT/$dockerfile" ]; then
            log "Checking $dockerfile for build reproducibility..."
            
            # Check for required build args
            local has_build_date=$(grep -c "ARG BUILD_DATE" "$PROJECT_ROOT/$dockerfile" || echo "0")
            local has_vcs_ref=$(grep -c "ARG VCS_REF" "$PROJECT_ROOT/$dockerfile" || echo "0")
            local has_version=$(grep -c "ARG BUILD_VERSION\|ARG VERSION" "$PROJECT_ROOT/$dockerfile" || echo "0")
            
            if [ "$has_build_date" -gt 0 ] && [ "$has_vcs_ref" -gt 0 ] && [ "$has_version" -gt 0 ]; then
                success "$dockerfile: Has reproducible build args"
                build_success=1
            else
                warning "$dockerfile: Missing some build args (BUILD_DATE: $has_build_date, VCS_REF: $has_vcs_ref, VERSION: $has_version)"
            fi
        fi
    done
    
    # Generate build metadata
    local build_info="$PROJECT_ROOT/build-info.json"
    log "Generating build metadata..."
    
    cat > "$build_info" << EOF
{
    "build_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "vcs_ref": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "vcs_branch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')",
    "build_version": "$(git describe --tags --always 2>/dev/null || echo 'v0.0.0-dev')",
    "build_user": "${USER:-unknown}",
    "build_host": "$(hostname)",
    "build_os": "$(uname -s)",
    "build_arch": "$(uname -m)",
    "git_dirty": $(if git diff-index --quiet HEAD -- 2>/dev/null; then echo "false"; else echo "true"; fi)
}
EOF
    
    success "Build metadata generated: $build_info"
    
    # Create build script with reproducible flags
    local build_script="$PROJECT_ROOT/scripts/build-reproducible.sh"
    mkdir -p "$PROJECT_ROOT/scripts"
    
    cat > "$build_script" << 'EOF'
#!/usr/bin/env bash
# Reproducible build script for GameForge

set -euo pipefail

# Build metadata
BUILD_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)
VCS_REF=$(git rev-parse HEAD 2>/dev/null || echo 'unknown')
BUILD_VERSION=$(git describe --tags --always 2>/dev/null || echo 'v0.0.0-dev')

# Build arguments
DOCKER_BUILDKIT=1
export DOCKER_BUILDKIT

# Frontend build
if [ -f "package.json" ]; then
    echo "Building frontend..."
    docker build \
        --build-arg BUILD_DATE="$BUILD_DATE" \
        --build-arg VCS_REF="$VCS_REF" \
        --build-arg BUILD_VERSION="$BUILD_VERSION" \
        --file Dockerfile.frontend \
        --tag gameforge-frontend:reproducible \
        .
fi

# Backend build
if [ -f "Dockerfile.production.enhanced" ]; then
    echo "Building backend..."
    docker build \
        --build-arg BUILD_DATE="$BUILD_DATE" \
        --build-arg VCS_REF="$VCS_REF" \
        --build-arg BUILD_VERSION="$BUILD_VERSION" \
        --build-arg VARIANT=cpu \
        --file Dockerfile.production.enhanced \
        --tag gameforge-backend:reproducible \
        .
fi

echo "✅ Reproducible build completed"
echo "BUILD_DATE: $BUILD_DATE"
echo "VCS_REF: $VCS_REF"
echo "BUILD_VERSION: $BUILD_VERSION"
EOF
    
    chmod +x "$build_script"
    success "Reproducible build script created: $build_script"
    
    success "🔄 REPRODUCIBLE BUILDS CONFIGURED"
    return 0
}

# ========================================================================
# 4. SBOM Baseline Generation
# ========================================================================
generate_sbom_baseline() {
    log "Generating SBOM baseline..."
    
    local sbom_dir="$PROJECT_ROOT/sbom"
    mkdir -p "$sbom_dir"
    
    local sbom_success=0
    
    # Method 1: Syft (preferred)
    if command -v syft &> /dev/null; then
        log "Generating SBOM with Syft..."
        
        local syft_output="$sbom_dir/sbom-baseline-$TIMESTAMP.json"
        if syft packages dir:"$PROJECT_ROOT" -o json > "$syft_output"; then
            success "Syft SBOM generated: $syft_output"
            
            # Also generate SPDX format
            local spdx_output="$sbom_dir/sbom-baseline-$TIMESTAMP.spdx.json"
            syft packages dir:"$PROJECT_ROOT" -o spdx-json > "$spdx_output"
            success "SPDX SBOM generated: $spdx_output"
            
            sbom_success=1
        else
            error "Syft SBOM generation failed"
        fi
    else
        warning "Syft not available, using fallback methods"
    fi
    
    # Method 2: Create basic inventory
    log "Creating basic package inventory..."
    local inventory="$sbom_dir/package-inventory-$TIMESTAMP.txt"
    
    cat > "$inventory" << EOF
# GameForge Package Inventory - $TIMESTAMP
# Generated at: $(date)
# Project root: $PROJECT_ROOT

## Python Packages (from requirements.txt)
EOF
    
    if [ -f "$PROJECT_ROOT/requirements.txt" ]; then
        echo "### Requirements.txt packages:" >> "$inventory"
        grep -v "^#" "$PROJECT_ROOT/requirements.txt" | grep -v "^$" >> "$inventory" 2>/dev/null || true
    fi
    
    cat >> "$inventory" << EOF

## Node.js Packages (from package.json)
EOF
    
    if [ -f "$PROJECT_ROOT/package.json" ] && command -v jq &> /dev/null; then
        echo "### Frontend dependencies:" >> "$inventory"
        jq -r '.dependencies // {} | to_entries[] | "\(.key)==\(.value)"' "$PROJECT_ROOT/package.json" >> "$inventory" 2>/dev/null || true
        echo "### Frontend devDependencies:" >> "$inventory"
        jq -r '.devDependencies // {} | to_entries[] | "\(.key)==\(.value)"' "$PROJECT_ROOT/package.json" >> "$inventory" 2>/dev/null || true
    fi
    
    if [ -f "$PROJECT_ROOT/backend/package.json" ] && command -v jq &> /dev/null; then
        echo "### Backend dependencies:" >> "$inventory"
        jq -r '.dependencies // {} | to_entries[] | "\(.key)==\(.value)"' "$PROJECT_ROOT/backend/package.json" >> "$inventory" 2>/dev/null || true
    fi
    
    cat >> "$inventory" << EOF

## System Information
OS: $(uname -s)
Architecture: $(uname -m)
Kernel: $(uname -r)
Build Date: $(date)

## File Counts
Total files: $(find "$PROJECT_ROOT" -type f | wc -l)
Python files: $(find "$PROJECT_ROOT" -name "*.py" | wc -l)
JavaScript/TypeScript files: $(find "$PROJECT_ROOT" -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" | wc -l)
Configuration files: $(find "$PROJECT_ROOT" -name "*.json" -o -name "*.yaml" -o -name "*.yml" -o -name "*.toml" | wc -l)
EOF
    
    success "Package inventory created: $inventory"
    sbom_success=1
    
    # Method 3: Docker image SBOM (if Docker available)
    if command -v docker &> /dev/null && [ -f "$PROJECT_ROOT/Dockerfile.production.enhanced" ]; then
        log "Attempting to generate Docker image SBOM..."
        
        # Build a test image for SBOM generation
        local test_image="gameforge-sbom-test:$TIMESTAMP"
        if docker build -f "$PROJECT_ROOT/Dockerfile.production.enhanced" --build-arg VARIANT=cpu -t "$test_image" "$PROJECT_ROOT" >/dev/null 2>&1; then
            # Generate SBOM from image
            if command -v syft &> /dev/null; then
                local docker_sbom="$sbom_dir/sbom-docker-$TIMESTAMP.json"
                syft "$test_image" -o json > "$docker_sbom"
                success "Docker image SBOM generated: $docker_sbom"
            fi
            
            # Clean up test image
            docker rmi "$test_image" >/dev/null 2>&1 || true
        else
            warning "Could not build test image for SBOM generation"
        fi
    fi
    
    if [ "$sbom_success" -eq 1 ]; then
        success "📋 SBOM BASELINE GENERATED"
        
        # Generate summary
        local summary="$sbom_dir/sbom-summary-$TIMESTAMP.md"
        cat > "$summary" << EOF
# SBOM Baseline Summary

**Generated:** $(date)  
**Project:** GameForge AI Game Production  
**Location:** $PROJECT_ROOT  

## Files Generated

$(ls -la "$sbom_dir"/*$TIMESTAMP* | awk '{print "- " $9 " (" $5 " bytes)"}')

## Package Counts

EOF
        
        if [ -f "$PROJECT_ROOT/requirements.txt" ]; then
            local py_count=$(grep -c -v "^#\|^$" "$PROJECT_ROOT/requirements.txt" 2>/dev/null || echo "0")
            echo "- Python packages: $py_count" >> "$summary"
        fi
        
        if [ -f "$PROJECT_ROOT/package.json" ] && command -v jq &> /dev/null; then
            local node_deps=$(jq '.dependencies // {} | length' "$PROJECT_ROOT/package.json" 2>/dev/null || echo "0")
            local node_dev_deps=$(jq '.devDependencies // {} | length' "$PROJECT_ROOT/package.json" 2>/dev/null || echo "0")
            echo "- Node.js dependencies: $node_deps" >> "$summary"
            echo "- Node.js devDependencies: $node_dev_deps" >> "$summary"
        fi
        
        echo "" >> "$summary"
        echo "## Next Steps" >> "$summary"
        echo "1. Store these SBOM files in version control" >> "$summary"
        echo "2. Compare future SBOMs against this baseline" >> "$summary"
        echo "3. Monitor for new vulnerabilities in these packages" >> "$summary"
        echo "4. Set up automated SBOM generation in CI/CD" >> "$summary"
        
        success "SBOM summary created: $summary"
        return 0
    else
        error "📋 SBOM BASELINE GENERATION FAILED"
        return 1
    fi
}

# ========================================================================
# 5. Main Execution
# ========================================================================
main() {
    log "🚀 Starting Phase 1: Repository & Build Preparation"
    log "Project root: $PROJECT_ROOT"
    log "Output directory: $OUTPUT_DIR"
    
    local overall_success=0
    local step_count=0
    local failed_steps=()
    
    # Step 1: Secrets scan
    step_count=$((step_count + 1))
    if run_secrets_scan; then
        overall_success=$((overall_success + 1))
    else
        failed_steps+=("Secrets Scan")
    fi
    
    # Step 2: Lock dependencies
    step_count=$((step_count + 1))
    if lock_dependencies; then
        overall_success=$((overall_success + 1))
    else
        failed_steps+=("Dependency Locking")
    fi
    
    # Step 3: Reproducible builds
    step_count=$((step_count + 1))
    if setup_reproducible_builds; then
        overall_success=$((overall_success + 1))
    else
        failed_steps+=("Reproducible Builds")
    fi
    
    # Step 4: SBOM baseline
    step_count=$((step_count + 1))
    if generate_sbom_baseline; then
        overall_success=$((overall_success + 1))
    else
        failed_steps+=("SBOM Baseline")
    fi
    
    # Final report
    echo ""
    echo "========================================================================="
    log "Phase 1 Completion Report"
    echo "========================================================================="
    
    success "Steps completed: $overall_success/$step_count"
    
    if [ ${#failed_steps[@]} -eq 0 ]; then
        echo ""
        success "🎉 PHASE 1 COMPLETE: Repository is ready for secure build!"
        echo ""
        echo "✅ Secrets scanning: PASSED"
        echo "✅ Dependency locking: PASSED"
        echo "✅ Reproducible builds: CONFIGURED"
        echo "✅ SBOM baseline: GENERATED"
        echo ""
        echo "📁 Reports available in: $OUTPUT_DIR"
        echo "🔨 Use scripts/build-reproducible.sh for builds"
        echo ""
        return 0
    else
        echo ""
        error "❌ PHASE 1 INCOMPLETE: Some steps failed"
        echo ""
        echo "Failed steps:"
        for step in "${failed_steps[@]}"; do
            echo "  ❌ $step"
        done
        echo ""
        echo "📁 Check reports in: $OUTPUT_DIR"
        echo "📖 Review error messages above for remediation steps"
        echo ""
        return 1
    fi
}

# Run main function
main "$@"
