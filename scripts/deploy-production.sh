#!/bin/bash
# GameForge Production Deployment Script
# Comprehensive production deployment with health checks and rollback

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="docker-compose.production-secure.yml"
ENV_FILE=".env.production.secure"
BACKUP_TAG="pre-deploy-$(date +%Y%m%d_%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

# Error handling
error_exit() {
    error "$1"
    exit 1
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error_exit "This script should not be run as root for security reasons"
    fi
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."

    # Check if docker is running
    if ! docker info >/dev/null 2>&1; then
        error_exit "Docker is not running"
    fi

    # Check if docker-compose is available
    if ! command -v docker-compose >/dev/null 2>&1; then
        error_exit "docker-compose is not installed"
    fi

    # Check if environment file exists
    if [[ ! -f "$ENV_FILE" ]]; then
        error_exit "Environment file $ENV_FILE not found"
    fi

    # Check if compose file exists
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        error_exit "Compose file $COMPOSE_FILE not found"
    fi

    # Check available disk space (require at least 10GB)
    AVAILABLE_SPACE=$(df . | awk 'NR==2 {print $4}')
    if [[ $AVAILABLE_SPACE -lt 10485760 ]]; then  # 10GB in KB
        error_exit "Insufficient disk space (required: 10GB, available: $((AVAILABLE_SPACE/1024/1024))GB)"
    fi

    # Check available memory (require at least 8GB)
    AVAILABLE_MEMORY=$(free -m | awk 'NR==2{print $7}')
    if [[ $AVAILABLE_MEMORY -lt 8192 ]]; then
        warning "Low available memory (${AVAILABLE_MEMORY}MB). Recommended: 8GB+"
    fi

    success "Pre-deployment checks passed"
}

# Create backup of current deployment
create_backup() {
    log "Creating backup of current deployment..."

    # Create backup directory
    mkdir -p backups

    # Backup current containers if running
    if docker-compose -f "$COMPOSE_FILE" ps -q | grep -q .; then
        log "Backing up current deployment state..."
        docker-compose -f "$COMPOSE_FILE" ps > "backups/containers_${BACKUP_TAG}.txt"

        # Export database
        if docker-compose -f "$COMPOSE_FILE" ps postgres | grep -q "Up"; then
            log "Creating database backup..."
            docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U gameforge gameforge_production > "backups/database_${BACKUP_TAG}.sql"
        fi
    fi

    success "Backup created with tag: $BACKUP_TAG"
}

# Deploy application
deploy_application() {
    log "Deploying GameForge production environment..."

    # Pull latest images
    log "Pulling latest Docker images..."
    docker-compose -f "$COMPOSE_FILE" pull

    # Build custom images
    log "Building custom images..."
    docker-compose -f "$COMPOSE_FILE" build --no-cache

    # Start services with dependency order
    log "Starting infrastructure services..."
    docker-compose -f "$COMPOSE_FILE" up -d postgres redis

    # Wait for database to be ready
    log "Waiting for database to be ready..."
    timeout 60s bash -c 'until docker-compose -f "'$COMPOSE_FILE'" exec -T postgres pg_isready -U gameforge; do sleep 2; done'

    # Run database migrations
    log "Running database migrations..."
    docker-compose -f "$COMPOSE_FILE" run --rm gameforge-api python manage.py migrate

    # Start application services
    log "Starting application services..."
    docker-compose -f "$COMPOSE_FILE" up -d gameforge-api gameforge-worker

    # Start monitoring services
    log "Starting monitoring services..."
    docker-compose -f "$COMPOSE_FILE" up -d prometheus grafana elasticsearch

    # Start nginx (frontend)
    log "Starting nginx..."
    docker-compose -f "$COMPOSE_FILE" up -d nginx

    success "Deployment completed"
}

# Health checks
run_health_checks() {
    log "Running health checks..."

    # Check if all services are running
    local failed_services=()
    local services=("postgres" "redis" "gameforge-api" "gameforge-worker" "nginx" "prometheus" "grafana" "elasticsearch")

    for service in "${services[@]}"; do
        if ! docker-compose -f "$COMPOSE_FILE" ps "$service" | grep -q "Up"; then
            failed_services+=("$service")
        fi
    done

    if [[ ${#failed_services[@]} -gt 0 ]]; then
        error "Failed services: ${failed_services[*]}"
        return 1
    fi

    # Check API health endpoint
    log "Checking API health endpoint..."
    timeout 30s bash -c 'until curl -sf http://localhost/health >/dev/null; do sleep 2; done' || {
        error "API health check failed"
        return 1
    }

    # Check database connectivity
    log "Checking database connectivity..."
    docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U gameforge || {
        error "Database connectivity check failed"
        return 1
    }

    # Check Redis connectivity
    log "Checking Redis connectivity..."
    docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping | grep -q PONG || {
        error "Redis connectivity check failed"
        return 1
    }

    success "All health checks passed"
}

# Rollback function
rollback_deployment() {
    error "Deployment failed. Initiating rollback..."

    # Stop current services
    docker-compose -f "$COMPOSE_FILE" down

    # Restore database if backup exists
    if [[ -f "backups/database_${BACKUP_TAG}.sql" ]]; then
        log "Restoring database from backup..."
        docker-compose -f "$COMPOSE_FILE" up -d postgres
        sleep 10
        docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U gameforge -d gameforge_production < "backups/database_${BACKUP_TAG}.sql"
    fi

    error "Rollback completed. Please check logs and try again."
}

# Show deployment status
show_status() {
    log "Deployment Status:"
    echo ""
    docker-compose -f "$COMPOSE_FILE" ps
    echo ""
    log "Service URLs:"
    echo "  • Application: https://localhost"
    echo "  • Grafana: http://localhost:3000 (admin/admin)"
    echo "  • Prometheus: http://localhost:9090"
    echo ""
    log "Logs: docker-compose -f $COMPOSE_FILE logs -f [service]"
}

# Main deployment function
main() {
    log "🚀 GameForge Production Deployment Starting..."
    echo "=============================================="

    check_root
    pre_deployment_checks
    create_backup

    # Deploy with error handling
    if deploy_application && run_health_checks; then
        success "🎉 Deployment completed successfully!"
        show_status
    else
        rollback_deployment
        exit 1
    fi
}

# Trap errors
trap 'error "Deployment failed unexpectedly"; rollback_deployment; exit 1' ERR

# Execute main function
main "$@"
