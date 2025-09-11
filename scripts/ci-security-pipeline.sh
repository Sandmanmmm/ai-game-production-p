#!/bin/bash
# GameForge CI/CD Security Pipeline
# =================================
# Integrate Phase 1 security checks into CI/CD pipeline

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CI_REPORTS_DIR="${PROJECT_ROOT}/ci-security-reports"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

echo -e "${BLUE}🔒 GameForge CI/CD Security Pipeline${NC}"
echo "==========================================="
echo "Project: ${PROJECT_ROOT}"
echo "Timestamp: ${TIMESTAMP}"
echo ""

# Create reports directory
mkdir -p "${CI_REPORTS_DIR}"

# Function to check exit code and report
check_result() {
    local step_name="$1"
    local exit_code="$2"
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $step_name"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}: $step_name"
        return 1
    fi
}

# Function to run with timeout
run_with_timeout() {
    local timeout_duration="$1"
    local command="$2"
    local description="$3"
    
    echo -e "${BLUE}🔍 $description${NC}"
    
    if timeout "$timeout_duration" bash -c "$command"; then
        return 0
    else
        echo -e "${RED}⏰ TIMEOUT${NC}: $description exceeded $timeout_duration"
        return 1
    fi
}

# Step 1: Environment Security Check
echo -e "${BLUE}📋 Step 1: Environment Security Validation${NC}"
env_security_passed=true

# Check for .env files in root (should not exist)
if [ -f "${PROJECT_ROOT}/.env" ]; then
    echo -e "${RED}❌ SECURITY RISK${NC}: .env file found in root directory"
    echo "   Action: Move to .env.example and add .env to .gitignore"
    env_security_passed=false
fi

# Check for docker.env files in root (should not exist)
if [ -f "${PROJECT_ROOT}/docker.env" ]; then
    echo -e "${RED}❌ SECURITY RISK${NC}: docker.env file found in root directory"
    echo "   Action: Move to docker.env.example and add to .gitignore"
    env_security_passed=false
fi

# Check for .env.example (should exist)
if [ ! -f "${PROJECT_ROOT}/.env.example" ]; then
    echo -e "${YELLOW}⚠️  WARNING${NC}: .env.example not found"
    echo "   Recommendation: Create .env.example as template"
fi

# Check gitignore
if grep -q "^\.env$" "${PROJECT_ROOT}/.gitignore" 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}: .env properly ignored in git"
else
    echo -e "${RED}❌ FAIL${NC}: .env not found in .gitignore"
    env_security_passed=false
fi

check_result "Environment Security" $([[ "$env_security_passed" == "true" ]] && echo 0 || echo 1)

# Step 2: Dependency Security Check
echo -e "${BLUE}📦 Step 2: Dependency Security Scan${NC}"

# Check for lock files
dependency_check_passed=true
if [ ! -f "${PROJECT_ROOT}/requirements.txt" ]; then
    echo -e "${RED}❌ FAIL${NC}: requirements.txt not found"
    dependency_check_passed=false
fi

if [ ! -f "${PROJECT_ROOT}/package-lock.json" ]; then
    echo -e "${YELLOW}⚠️  WARNING${NC}: package-lock.json not found in root"
fi

check_result "Dependency Lock Files" $([[ "$dependency_check_passed" == "true" ]] && echo 0 || echo 1)

# Step 3: Secrets Scanning
echo -e "${BLUE}🔍 Step 3: Advanced Secrets Scanning${NC}"

# Run Phase 1 preparation script
if [ -f "${PROJECT_ROOT}/scripts/phase1-prep.sh" ]; then
    run_with_timeout "300s" "${PROJECT_ROOT}/scripts/phase1-prep.sh --ci-mode" "Phase 1 Security Preparation"
    secrets_scan_result=$?
else
    echo -e "${YELLOW}⚠️  WARNING${NC}: phase1-prep.sh not found, running basic scan"
    
    # Basic pattern search
    secret_patterns=(
        "password.*=.*['\"][^'\"]{8,}['\"]"
        "secret.*=.*['\"][^'\"]{16,}['\"]"
        "token.*=.*['\"][^'\"]{20,}['\"]"
        "key.*=.*['\"][^'\"]{16,}['\"]"
        "api[_-]?key.*=.*['\"][^'\"]{16,}['\"]"
    )
    
    secrets_found=false
    for pattern in "${secret_patterns[@]}"; do
        if grep -r -i -E "$pattern" "${PROJECT_ROOT}" \
           --exclude-dir=.git \
           --exclude-dir=node_modules \
           --exclude-dir=.venv \
           --exclude-dir=venv \
           --exclude="*.log" \
           --exclude="*.example" > "${CI_REPORTS_DIR}/secrets-scan-${TIMESTAMP}.txt" 2>/dev/null; then
            secrets_found=true
        fi
    done
    
    if [ "$secrets_found" = true ]; then
        echo -e "${RED}❌ POTENTIAL SECRETS FOUND${NC}: Check ${CI_REPORTS_DIR}/secrets-scan-${TIMESTAMP}.txt"
        secrets_scan_result=1
    else
        echo -e "${GREEN}✅ PASS${NC}: No obvious secrets detected"
        secrets_scan_result=0
    fi
fi

check_result "Secrets Scanning" $secrets_scan_result

# Step 4: Build Security Configuration
echo -e "${BLUE}🏗️  Step 4: Build Security Configuration${NC}"

build_security_passed=true

# Check for Dockerfile with security practices
if [ -f "${PROJECT_ROOT}/Dockerfile" ]; then
    # Check for multi-stage builds
    if grep -q "^FROM.*AS" "${PROJECT_ROOT}/Dockerfile"; then
        echo -e "${GREEN}✅ PASS${NC}: Multi-stage Dockerfile detected"
    else
        echo -e "${YELLOW}⚠️  WARNING${NC}: Consider multi-stage builds for security"
    fi
    
    # Check for non-root user
    if grep -q "^USER" "${PROJECT_ROOT}/Dockerfile"; then
        echo -e "${GREEN}✅ PASS${NC}: Non-root user configuration found"
    else
        echo -e "${YELLOW}⚠️  WARNING${NC}: Consider running as non-root user"
    fi
    
    # Check for build args (reproducible builds)
    if grep -q "^ARG" "${PROJECT_ROOT}/Dockerfile"; then
        echo -e "${GREEN}✅ PASS${NC}: Build arguments found (reproducible builds)"
    else
        echo -e "${YELLOW}⚠️  WARNING${NC}: Consider adding build arguments for reproducibility"
    fi
else
    echo -e "${RED}❌ FAIL${NC}: Dockerfile not found"
    build_security_passed=false
fi

check_result "Build Security Configuration" $([[ "$build_security_passed" == "true" ]] && echo 0 || echo 1)

# Step 5: Generate SBOM (Software Bill of Materials)
echo -e "${BLUE}📋 Step 5: SBOM Generation${NC}"

sbom_result=0
mkdir -p "${PROJECT_ROOT}/sbom"

# Try syft if available
if command -v syft > /dev/null 2>&1; then
    echo "🔍 Generating SBOM with syft..."
    syft "${PROJECT_ROOT}" -o json > "${PROJECT_ROOT}/sbom/sbom-${TIMESTAMP}.json" || sbom_result=1
    syft "${PROJECT_ROOT}" -o spdx-json > "${PROJECT_ROOT}/sbom/sbom-spdx-${TIMESTAMP}.json" || sbom_result=1
else
    echo "📝 Generating basic inventory (syft not available)..."
    {
        echo "# GameForge SBOM - Basic Inventory"
        echo "# Generated: $(date)"
        echo "# Timestamp: ${TIMESTAMP}"
        echo ""
        echo "## Project Structure"
        echo "Root: ${PROJECT_ROOT}"
        echo "Files: $(find "${PROJECT_ROOT}" -type f | wc -l)"
        echo "Python files: $(find "${PROJECT_ROOT}" -name "*.py" | wc -l)"
        echo "JS/TS files: $(find "${PROJECT_ROOT}" -name "*.js" -o -name "*.ts" | wc -l)"
        echo ""
        echo "## Dependencies"
        if [ -f "${PROJECT_ROOT}/requirements.txt" ]; then
            echo "### Python Dependencies"
            cat "${PROJECT_ROOT}/requirements.txt"
        fi
        if [ -f "${PROJECT_ROOT}/package.json" ]; then
            echo "### Node.js Dependencies"
            if command -v jq > /dev/null 2>&1; then
                jq '.dependencies // {}, .devDependencies // {}' "${PROJECT_ROOT}/package.json"
            else
                grep -A 50 '"dependencies"' "${PROJECT_ROOT}/package.json" | head -50
            fi
        fi
    } > "${PROJECT_ROOT}/sbom/basic-inventory-${TIMESTAMP}.txt"
fi

check_result "SBOM Generation" $sbom_result

# Final Report
echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}🏁 CI/CD Security Pipeline Results${NC}"
echo -e "${BLUE}=========================================${NC}"

# Calculate overall result
overall_result=0
if [ "$env_security_passed" != "true" ]; then overall_result=1; fi
if [ $secrets_scan_result -ne 0 ]; then overall_result=1; fi
if [ "$dependency_check_passed" != "true" ]; then overall_result=1; fi
if [ "$build_security_passed" != "true" ]; then overall_result=1; fi
if [ $sbom_result -ne 0 ]; then overall_result=1; fi

if [ $overall_result -eq 0 ]; then
    echo -e "${GREEN}🎉 SECURITY PIPELINE PASSED${NC}"
    echo "✅ All security checks completed successfully"
else
    echo -e "${RED}⚠️  SECURITY PIPELINE WARNINGS${NC}"
    echo "❌ Some security checks failed or have warnings"
    echo "📋 Review the output above and address issues before deployment"
fi

echo ""
echo "📁 Reports saved to: ${CI_REPORTS_DIR}"
echo "📊 SBOM files saved to: ${PROJECT_ROOT}/sbom/"
echo "🕐 Completed at: $(date)"

exit $overall_result
