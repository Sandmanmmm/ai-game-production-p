#!/usr/bin/env bash

# ========================================================================
# Git-secrets Setup Script for GameForge
# Configures git-secrets to prevent committing sensitive data
# ========================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[git-secrets]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[warning]${NC} $1"
}

error() {
    echo -e "${RED}[error]${NC} $1"
}

# Check if git-secrets is installed
check_git_secrets() {
    if ! command -v git-secrets &> /dev/null; then
        error "git-secrets is not installed!"
        echo ""
        echo "To install git-secrets:"
        echo "  macOS: brew install git-secrets"
        echo "  Linux: See https://github.com/awslabs/git-secrets#installing-git-secrets"
        echo "  Windows: Use Git Bash or WSL"
        echo ""
        return 1
    fi
    return 0
}

# Install git-secrets hooks
install_hooks() {
    log "Installing git-secrets hooks..."
    cd "$PROJECT_ROOT"
    
    if [ ! -d ".git" ]; then
        error "Not a git repository. Please run 'git init' first."
        return 1
    fi
    
    git secrets --install --force
    log "Git hooks installed successfully"
}

# Configure patterns
configure_patterns() {
    log "Configuring secret detection patterns..."
    cd "$PROJECT_ROOT"
    
    # AWS patterns (built-in)
    git secrets --register-aws
    
    # Custom patterns for GameForge
    git secrets --add 'password\s*[=:]\s*["\047][^"\047]{8,}["\047]'
    git secrets --add 'secret\s*[=:]\s*["\047][^"\047]{16,}["\047]'
    git secrets --add 'api_key\s*[=:]\s*["\047][^"\047]{16,}["\047]'
    git secrets --add 'private_key'
    git secrets --add '-----BEGIN.*PRIVATE KEY-----'
    
    # GitHub tokens
    git secrets --add 'github_pat_[a-zA-Z0-9]{22,255}'
    git secrets --add 'ghp_[a-zA-Z0-9]{36}'
    git secrets --add 'gho_[a-zA-Z0-9]{36}'
    git secrets --add 'ghu_[a-zA-Z0-9]{36}'
    git secrets --add 'ghs_[a-zA-Z0-9]{36}'
    git secrets --add 'ghr_[a-zA-Z0-9]{36}'
    
    # OpenAI API keys
    git secrets --add 'sk-[a-zA-Z0-9]{48}'
    
    # Slack tokens
    git secrets --add 'xoxb-[0-9]{11,13}-[0-9]{11,13}-[a-zA-Z0-9]{24}'
    git secrets --add 'xoxp-[0-9]{11,13}-[0-9]{11,13}-[a-zA-Z0-9]{24}'
    
    # Database URLs
    git secrets --add 'postgres://.*:.*@.*'
    git secrets --add 'mysql://.*:.*@.*'
    git secrets --add 'mongodb://.*:.*@.*'
    
    # JWT secrets (common weak patterns)
    git secrets --add '[jJ][wW][tT].*[sS][eE][cC][rR][eE][tT].*[=:].*["\047][^"\047]{16,}["\047]'
    
    # Redis URLs with passwords
    git secrets --add 'redis://.*:.*@.*'
    
    # Common environment variable patterns
    git secrets --add '[A-Z_]*SECRET[A-Z_]*\s*[=:]\s*["\047][^"\047]{8,}["\047]'
    git secrets --add '[A-Z_]*PASSWORD[A-Z_]*\s*[=:]\s*["\047][^"\047]{8,}["\047]'
    git secrets --add '[A-Z_]*TOKEN[A-Z_]*\s*[=:]\s*["\047][^"\047]{16,}["\047]'
    git secrets --add '[A-Z_]*KEY[A-Z_]*\s*[=:]\s*["\047][^"\047]{16,}["\047]'
    
    # AI service API keys
    git secrets --add 'HUGGINGFACE_API_TOKEN\s*[=:]\s*["\047][^"\047]{16,}["\047]'
    git secrets --add 'REPLICATE_API_TOKEN\s*[=:]\s*["\047][^"\047]{16,}["\047]'
    git secrets --add 'OPENAI_API_KEY\s*[=:]\s*["\047][^"\047]{16,}["\047]'
    
    log "Secret detection patterns configured"
}

# Configure allowed patterns (whitelist)
configure_allowed_patterns() {
    log "Configuring allowed patterns (whitelist)..."
    cd "$PROJECT_ROOT"
    
    # Allow example/placeholder values
    git secrets --add --allowed 'password.*=.*"example"'
    git secrets --add --allowed 'password.*=.*"your_password_here"'
    git secrets --add --allowed 'secret.*=.*"your_secret_here"'
    git secrets --add --allowed 'api_key.*=.*"your_api_key_here"'
    git secrets --add --allowed 'token.*=.*"your_token_here"'
    
    # Allow common test/example values
    git secrets --add --allowed 'password.*=.*"test"'
    git secrets --add --allowed 'password.*=.*"demo"'
    git secrets --add --allowed 'jwt.*secret.*=.*"fallback"'
    git secrets --add --allowed 'session.*secret.*=.*"fallback"'
    
    # Allow documentation examples
    git secrets --add --allowed '# Example:'
    git secrets --add --allowed '# Set your'
    git secrets --add --allowed 'TODO:'
    git secrets --add --allowed 'FIXME:'
    
    # Allow specific placeholder patterns from .env.example files
    git secrets --add --allowed '\.env\.example'
    git secrets --add --allowed 'GITHUB_CLIENT_ID=your_github_client_id'
    git secrets --add --allowed 'GITHUB_CLIENT_SECRET=your_github_client_secret'
    
    log "Allowed patterns configured"
}

# Scan existing repository
scan_repository() {
    log "Scanning existing repository for secrets..."
    cd "$PROJECT_ROOT"
    
    if git secrets --scan; then
        log "✅ Repository scan completed - no secrets found"
        return 0
    else
        error "❌ Repository scan found potential secrets!"
        echo ""
        echo "Please review and fix the issues above before proceeding."
        echo "You can run 'git secrets --scan' again to re-check."
        return 1
    fi
}

# Scan commits
scan_commits() {
    log "Scanning commit history for secrets..."
    cd "$PROJECT_ROOT"
    
    if git secrets --scan-history; then
        log "✅ Commit history scan completed - no secrets found"
        return 0
    else
        warn "⚠️  Commit history scan found potential secrets!"
        echo ""
        echo "This means secrets may exist in your git history."
        echo "Consider using tools like BFG Repo-Cleaner to remove them:"
        echo "  https://rtyley.github.io/bfg-repo-cleaner/"
        return 1
    fi
}

# Create .gitignore entries for common secret files
update_gitignore() {
    log "Updating .gitignore with secret file patterns..."
    cd "$PROJECT_ROOT"
    
    local gitignore=".gitignore"
    local patterns=(
        "# Secrets and credentials"
        "*.key"
        "*.pem"
        "*.p12"
        "*.crt"
        "*.cer"
        "*.pfx"
        ".env"
        ".env.*"
        "!.env.example"
        "!.env.template"
        "*_api_key*"
        "*_secret*"
        "*token*"
        "!*token*.py"
        "!*token*.js"
        "!*token*.ts"
        "*.backup"
        "*.dump"
        ".vault-token"
        "secrets/"
        "credentials/"
        "auth/"
        "certs/"
        "private/"
        "*.credentials"
        "service-account*.json"
        "google-credentials*.json"
        "aws-credentials*"
        ".aws/credentials"
        ".ssh/id_*"
        ".ssh/*_rsa"
        ".ssh/*_ed25519"
    )
    
    # Check if patterns already exist
    local new_patterns=()
    for pattern in "${patterns[@]}"; do
        if ! grep -Fxq "$pattern" "$gitignore" 2>/dev/null; then
            new_patterns+=("$pattern")
        fi
    done
    
    if [ ${#new_patterns[@]} -gt 0 ]; then
        echo "" >> "$gitignore"
        printf '%s\n' "${new_patterns[@]}" >> "$gitignore"
        log "Added ${#new_patterns[@]} new patterns to .gitignore"
    else
        log ".gitignore already contains secret file patterns"
    fi
}

# Create pre-commit hook template
create_precommit_hook() {
    log "Creating pre-commit hook template..."
    
    local hooks_dir="$PROJECT_ROOT/.git/hooks"
    local precommit_hook="$hooks_dir/pre-commit"
    
    if [ -f "$precommit_hook" ] && ! grep -q "git-secrets" "$precommit_hook"; then
        # Backup existing hook
        cp "$precommit_hook" "$precommit_hook.backup"
        log "Backed up existing pre-commit hook"
    fi
    
    # Create comprehensive pre-commit hook
    cat > "$precommit_hook" << 'EOF'
#!/usr/bin/env bash
# GameForge pre-commit hook with git-secrets integration

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}[pre-commit]${NC} Running security checks..."

# 1. Run git-secrets
if command -v git-secrets &> /dev/null; then
    echo -e "${GREEN}[pre-commit]${NC} Checking for secrets..."
    if ! git secrets --pre_commit_hook -- "$@"; then
        echo -e "${RED}[pre-commit]${NC} ❌ Secrets detected! Commit blocked."
        echo ""
        echo "To override (not recommended): git commit --no-verify"
        echo "To fix: Remove secrets and use environment variables or vault"
        exit 1
    fi
    echo -e "${GREEN}[pre-commit]${NC} ✅ No secrets detected"
else
    echo -e "${YELLOW}[pre-commit]${NC} ⚠️  git-secrets not installed, skipping secret scan"
fi

# 2. Check for common secret file patterns
echo -e "${GREEN}[pre-commit]${NC} Checking for secret files..."
SECRET_FILES=$(git diff --cached --name-only | grep -E '\.(key|pem|p12|crt|cer|pfx)$|\.env$|credentials|secret' || true)
if [ -n "$SECRET_FILES" ]; then
    echo -e "${RED}[pre-commit]${NC} ❌ Potential secret files detected:"
    echo "$SECRET_FILES"
    echo ""
    echo "Add these files to .gitignore if they contain secrets"
    exit 1
fi

# 3. Check for hardcoded localhost URLs in production files
echo -e "${GREEN}[pre-commit]${NC} Checking for hardcoded localhost URLs..."
LOCALHOST_FILES=$(git diff --cached --name-only | xargs grep -l "localhost\|127\.0\.0\.1" 2>/dev/null | grep -v "test\|spec\|mock\|example" || true)
if [ -n "$LOCALHOST_FILES" ]; then
    echo -e "${YELLOW}[pre-commit]${NC} ⚠️  Hardcoded localhost URLs found in:"
    echo "$LOCALHOST_FILES"
    echo "Consider using environment variables for URLs"
fi

echo -e "${GREEN}[pre-commit]${NC} ✅ Security checks passed"
EOF
    
    chmod +x "$precommit_hook"
    log "Pre-commit hook created with git-secrets integration"
}

# Main function
main() {
    log "🔐 Setting up git-secrets for GameForge..."
    
    if ! check_git_secrets; then
        exit 1
    fi
    
    local success=0
    local steps=6
    
    if install_hooks; then
        ((success++))
    fi
    
    if configure_patterns; then
        ((success++))
    fi
    
    if configure_allowed_patterns; then
        ((success++))
    fi
    
    if update_gitignore; then
        ((success++))
    fi
    
    if create_precommit_hook; then
        ((success++))
    fi
    
    # Final scan (optional - don't fail setup if repo has existing secrets)
    if scan_repository; then
        ((success++))
    else
        warn "Repository contains potential secrets - please review and fix"
    fi
    
    echo ""
    log "🎉 Git-secrets setup completed: $success/$steps steps successful"
    echo ""
    echo "Configuration summary:"
    echo "✅ Git hooks installed and configured"
    echo "✅ Secret detection patterns added"
    echo "✅ Allowed patterns configured"
    echo "✅ .gitignore updated with secret file patterns"
    echo "✅ Enhanced pre-commit hook created"
    echo ""
    echo "Usage:"
    echo "  git secrets --scan          # Scan working directory"
    echo "  git secrets --scan-history  # Scan commit history"
    echo "  git secrets --list          # List configured patterns"
    echo ""
    echo "The pre-commit hook will automatically check for secrets on each commit."
    
    if [ "$success" -lt "$steps" ]; then
        warn "Some steps had issues - review the output above"
        exit 1
    fi
}

# Run main function
main "$@"
