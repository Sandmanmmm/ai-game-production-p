#!/bin/bash
# GameForge Production Health Check Script
# Comprehensive health monitoring for all services

set -euo pipefail

COMPOSE_FILE="docker-compose.production-secure.yml"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Health check functions
check_service_status() {
    local service=$1
    local status=$(docker-compose -f "$COMPOSE_FILE" ps -q "$service" 2>/dev/null)

    if [[ -z "$status" ]]; then
        echo -e "${RED}❌ $service: Not running${NC}"
        return 1
    else
        local health=$(docker inspect --format='{{.State.Health.Status}}' $(docker-compose -f "$COMPOSE_FILE" ps -q "$service") 2>/dev/null || echo "unknown")
        if [[ "$health" == "healthy" ]] || [[ "$health" == "unknown" ]]; then
            echo -e "${GREEN}✅ $service: Running${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  $service: Running but unhealthy${NC}"
            return 1
        fi
    fi
}

check_api_health() {
    local url="http://localhost/health"
    if curl -sf "$url" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ API Health: OK${NC}"
        return 0
    else
        echo -e "${RED}❌ API Health: Failed${NC}"
        return 1
    fi
}

check_database() {
    if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U gameforge >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Database: Connected${NC}"
        return 0
    else
        echo -e "${RED}❌ Database: Connection failed${NC}"
        return 1
    fi
}

check_redis() {
    if docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; then
        echo -e "${GREEN}✅ Redis: Connected${NC}"
        return 0
    else
        echo -e "${RED}❌ Redis: Connection failed${NC}"
        return 1
    fi
}

# Main health check
main() {
    echo -e "${BLUE}🏥 GameForge Production Health Check${NC}"
    echo "====================================="
    echo ""

    local failed_checks=0

    # Service status checks
    echo "📋 Service Status:"
    services=("postgres" "redis" "gameforge-api" "gameforge-worker" "nginx" "prometheus" "grafana" "elasticsearch")

    for service in "${services[@]}"; do
        if ! check_service_status "$service"; then
            ((failed_checks++))
        fi
    done

    echo ""

    # Connectivity checks
    echo "🔗 Connectivity Checks:"
    if ! check_api_health; then ((failed_checks++)); fi
    if ! check_database; then ((failed_checks++)); fi
    if ! check_redis; then ((failed_checks++)); fi

    echo ""

    # Summary
    if [[ $failed_checks -eq 0 ]]; then
        echo -e "${GREEN}🎉 All health checks passed!${NC}"
        exit 0
    else
        echo -e "${RED}❌ $failed_checks health check(s) failed${NC}"
        exit 1
    fi
}

main "$@"
