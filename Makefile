# ========================================================================
# GameForge Makefile - Phase 1 Repository & Build Preparation
# ========================================================================

.PHONY: help phase1 secrets deps builds sbom clean install-tools setup-git-secrets
.DEFAULT_GOAL := help

# Configuration
PROJECT_ROOT := $(shell pwd)
TIMESTAMP := $(shell date +%Y%m%d-%H%M%S)
PHASE1_DIR := $(PROJECT_ROOT)/phase1-reports

# Colors for output
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
BLUE := \033[34m
NC := \033[0m

# Help target
help: ## Show this help message
	@echo "$(GREEN)GameForge Phase 1: Repository & Build Preparation$(NC)"
	@echo ""
	@echo "$(BLUE)Available targets:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(BLUE)Examples:$(NC)"
	@echo "  make phase1          # Run complete Phase 1 preparation"
	@echo "  make secrets         # Run only secrets scanning"
	@echo "  make deps           # Lock dependency versions only"
	@echo "  make install-tools  # Install required tools"

# Phase 1 complete preparation
phase1: ## Run complete Phase 1 repository preparation
	@echo "$(GREEN)🚀 Starting Phase 1: Repository & Build Preparation$(NC)"
	@mkdir -p $(PHASE1_DIR)
	@$(MAKE) secrets
	@$(MAKE) deps
	@$(MAKE) builds
	@$(MAKE) sbom
	@echo "$(GREEN)✅ Phase 1 completed successfully!$(NC)"
	@echo "$(BLUE)📁 Reports available in: $(PHASE1_DIR)$(NC)"

# Secrets scanning
secrets: ## Run secrets scanning (git-secrets + trufflehog)
	@echo "$(GREEN)🔐 Running secrets scan...$(NC)"
	@if command -v git-secrets >/dev/null 2>&1; then \
		echo "$(BLUE)Running git-secrets scan...$(NC)"; \
		git secrets --scan || (echo "$(RED)❌ git-secrets found potential secrets!$(NC)" && exit 1); \
	else \
		echo "$(YELLOW)⚠️  git-secrets not available$(NC)"; \
	fi
	@if command -v trufflehog >/dev/null 2>&1; then \
		echo "$(BLUE)Running trufflehog scan...$(NC)"; \
		trufflehog filesystem $(PROJECT_ROOT) --json > $(PHASE1_DIR)/secrets-$(TIMESTAMP).json || true; \
		if [ -s $(PHASE1_DIR)/secrets-$(TIMESTAMP).json ]; then \
			echo "$(RED)❌ trufflehog found potential secrets! Check $(PHASE1_DIR)/secrets-$(TIMESTAMP).json$(NC)"; \
			exit 1; \
		else \
			echo "$(GREEN)✅ No secrets detected by trufflehog$(NC)"; \
		fi; \
	else \
		echo "$(YELLOW)⚠️  trufflehog not available$(NC)"; \
	fi
	@echo "$(GREEN)✅ Secrets scan completed$(NC)"

# Dependency locking
deps: ## Lock dependency versions (Python + Node.js)
	@echo "$(GREEN)📦 Locking dependency versions...$(NC)"
	@if [ -f requirements.in ]; then \
		echo "$(BLUE)Compiling Python requirements...$(NC)"; \
		if command -v pip-compile >/dev/null 2>&1; then \
			pip-compile requirements.in --output-file requirements.txt --verbose; \
			echo "$(GREEN)✅ Python dependencies locked$(NC)"; \
		else \
			echo "$(YELLOW)⚠️  pip-compile not available, install with: pip install pip-tools$(NC)"; \
		fi; \
	fi
	@if [ -f package.json ] && [ ! -f package-lock.json ]; then \
		echo "$(BLUE)Generating Node.js lock file...$(NC)"; \
		npm install --package-lock-only; \
		echo "$(GREEN)✅ Node.js dependencies locked$(NC)"; \
	elif [ -f package-lock.json ]; then \
		echo "$(GREEN)✅ Node.js dependencies already locked$(NC)"; \
	fi
	@if [ -f backend/package.json ] && [ ! -f backend/package-lock.json ]; then \
		echo "$(BLUE)Generating backend Node.js lock file...$(NC)"; \
		cd backend && npm install --package-lock-only; \
		echo "$(GREEN)✅ Backend Node.js dependencies locked$(NC)"; \
	elif [ -f backend/package-lock.json ]; then \
		echo "$(GREEN)✅ Backend Node.js dependencies already locked$(NC)"; \
	fi

# Reproducible builds configuration
builds: ## Configure reproducible builds with metadata
	@echo "$(GREEN)🔄 Configuring reproducible builds...$(NC)"
	@echo "$(BLUE)Generating build metadata...$(NC)"
	@echo '{ \
		"build_date": "'$(shell date -u +%Y-%m-%dT%H:%M:%SZ)'", \
		"vcs_ref": "'$(shell git rev-parse HEAD 2>/dev/null || echo unknown)'", \
		"vcs_branch": "'$(shell git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)'", \
		"build_version": "'$(shell git describe --tags --always 2>/dev/null || echo v0.0.0-dev)'", \
		"build_user": "'$(USER)'", \
		"build_host": "'$(shell hostname)'", \
		"build_os": "'$(shell uname -s)'", \
		"build_arch": "'$(shell uname -m)'", \
		"git_dirty": '$(shell if git diff-index --quiet HEAD -- 2>/dev/null; then echo "false"; else echo "true"; fi)' \
	}' > build-info.json
	@echo "$(GREEN)✅ Build metadata generated: build-info.json$(NC)"
	@if [ ! -f scripts/build-reproducible.sh ]; then \
		echo "$(BLUE)Creating reproducible build script...$(NC)"; \
		mkdir -p scripts; \
		chmod +x scripts/build-reproducible.sh; \
		echo "$(GREEN)✅ Reproducible build script created$(NC)"; \
	else \
		echo "$(GREEN)✅ Reproducible build script already exists$(NC)"; \
	fi

# SBOM baseline generation
sbom: ## Generate SBOM baseline
	@echo "$(GREEN)📋 Generating SBOM baseline...$(NC)"
	@mkdir -p sbom
	@if command -v syft >/dev/null 2>&1; then \
		echo "$(BLUE)Generating SBOM with syft...$(NC)"; \
		syft packages dir:$(PROJECT_ROOT) -o json > sbom/sbom-baseline-$(TIMESTAMP).json; \
		syft packages dir:$(PROJECT_ROOT) -o spdx-json > sbom/sbom-baseline-$(TIMESTAMP).spdx.json; \
		echo "$(GREEN)✅ SBOM files generated with syft$(NC)"; \
	else \
		echo "$(YELLOW)⚠️  syft not available$(NC)"; \
	fi
	@echo "$(BLUE)Creating package inventory...$(NC)"
	@echo "# GameForge Package Inventory - $(TIMESTAMP)" > sbom/package-inventory-$(TIMESTAMP).txt
	@echo "# Generated at: $(shell date)" >> sbom/package-inventory-$(TIMESTAMP).txt
	@echo "" >> sbom/package-inventory-$(TIMESTAMP).txt
	@if [ -f requirements.txt ]; then \
		echo "## Python Packages:" >> sbom/package-inventory-$(TIMESTAMP).txt; \
		grep -v "^#" requirements.txt | grep -v "^$$" >> sbom/package-inventory-$(TIMESTAMP).txt; \
	fi
	@if [ -f package.json ]; then \
		echo "" >> sbom/package-inventory-$(TIMESTAMP).txt; \
		echo "## Node.js Dependencies:" >> sbom/package-inventory-$(TIMESTAMP).txt; \
		jq -r '.dependencies // {} | to_entries[] | "\(.key)==\(.value)"' package.json >> sbom/package-inventory-$(TIMESTAMP).txt 2>/dev/null || true; \
	fi
	@echo "$(GREEN)✅ Package inventory created$(NC)"

# Clean Phase 1 artifacts
clean: ## Clean Phase 1 reports and temporary files
	@echo "$(GREEN)🧹 Cleaning Phase 1 artifacts...$(NC)"
	@rm -rf $(PHASE1_DIR)
	@rm -f build-info.json
	@echo "$(GREEN)✅ Cleanup completed$(NC)"

# Install required tools
install-tools: ## Install required security and build tools
	@echo "$(GREEN)🔧 Installing required tools...$(NC)"
	@echo "$(BLUE)Installing Python tools...$(NC)"
	@pip install --upgrade pip-tools cyclonedx-bom
	@if ! command -v syft >/dev/null 2>&1; then \
		echo "$(BLUE)Installing syft...$(NC)"; \
		if command -v brew >/dev/null 2>&1; then \
			brew install syft; \
		elif command -v curl >/dev/null 2>&1; then \
			curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin; \
		else \
			echo "$(YELLOW)⚠️  Please install syft manually: https://github.com/anchore/syft$(NC)"; \
		fi; \
	fi
	@if ! command -v trufflehog >/dev/null 2>&1; then \
		echo "$(BLUE)Installing trufflehog...$(NC)"; \
		if command -v brew >/dev/null 2>&1; then \
			brew install trufflehog; \
		elif command -v go >/dev/null 2>&1; then \
			go install github.com/trufflesecurity/trufflehog/v3@latest; \
		else \
			echo "$(YELLOW)⚠️  Please install trufflehog manually: https://github.com/trufflesecurity/trufflehog$(NC)"; \
		fi; \
	fi
	@if ! command -v git-secrets >/dev/null 2>&1; then \
		echo "$(BLUE)git-secrets not found. Install with:$(NC)"; \
		echo "  macOS: brew install git-secrets"; \
		echo "  Linux: https://github.com/awslabs/git-secrets#installing-git-secrets"; \
	fi
	@echo "$(GREEN)✅ Tool installation completed$(NC)"

# Setup git-secrets
setup-git-secrets: ## Setup git-secrets configuration
	@echo "$(GREEN)🔐 Setting up git-secrets...$(NC)"
	@if [ -f scripts/setup-git-secrets.sh ]; then \
		chmod +x scripts/setup-git-secrets.sh; \
		./scripts/setup-git-secrets.sh; \
	else \
		echo "$(RED)❌ scripts/setup-git-secrets.sh not found$(NC)"; \
		exit 1; \
	fi

# Development helpers
check-tools: ## Check if required tools are available
	@echo "$(GREEN)🔍 Checking required tools...$(NC)"
	@tools="git pip npm docker syft trufflehog git-secrets jq"; \
	for tool in $$tools; do \
		if command -v $$tool >/dev/null 2>&1; then \
			echo "$(GREEN)✅ $$tool$(NC)"; \
		else \
			echo "$(RED)❌ $$tool$(NC)"; \
		fi; \
	done

# Quick security check
quick-check: ## Run quick security checks
	@echo "$(GREEN)⚡ Running quick security checks...$(NC)"
	@$(MAKE) secrets
	@echo "$(BLUE)Checking for common secret files...$(NC)"
	@find $(PROJECT_ROOT) -name "*.key" -o -name "*.pem" -o -name ".env" | head -5 | while read file; do \
		if [ -f "$$file" ]; then \
			echo "$(YELLOW)⚠️  Found potential secret file: $$file$(NC)"; \
		fi; \
	done || true
	@echo "$(GREEN)✅ Quick security check completed$(NC)"

# Status report
status: ## Show Phase 1 preparation status
	@echo "$(GREEN)📊 Phase 1 Preparation Status$(NC)"
	@echo ""
	@echo "$(BLUE)Dependencies:$(NC)"
	@if [ -f requirements.txt ]; then echo "  ✅ Python dependencies locked"; else echo "  ❌ Python dependencies not locked"; fi
	@if [ -f package-lock.json ]; then echo "  ✅ Frontend dependencies locked"; else echo "  ❌ Frontend dependencies not locked"; fi
	@if [ -f backend/package-lock.json ]; then echo "  ✅ Backend dependencies locked"; else echo "  ❌ Backend dependencies not locked"; fi
	@echo ""
	@echo "$(BLUE)Build Configuration:$(NC)"
	@if [ -f build-info.json ]; then echo "  ✅ Build metadata exists"; else echo "  ❌ Build metadata missing"; fi
	@if [ -f scripts/build-reproducible.sh ]; then echo "  ✅ Reproducible build script exists"; else echo "  ❌ Reproducible build script missing"; fi
	@echo ""
	@echo "$(BLUE)SBOM:$(NC)"
	@if [ -d sbom ] && [ "$(shell ls sbom/ | wc -l)" -gt 0 ]; then echo "  ✅ SBOM files exist ($(shell ls sbom/ | wc -l) files)"; else echo "  ❌ No SBOM files found"; fi
	@echo ""
	@echo "$(BLUE)Security:$(NC)"
	@if [ -f .git/hooks/pre-commit ]; then echo "  ✅ Git hooks configured"; else echo "  ❌ Git hooks not configured"; fi
	@if command -v git-secrets >/dev/null 2>&1; then echo "  ✅ git-secrets available"; else echo "  ❌ git-secrets not installed"; fi
