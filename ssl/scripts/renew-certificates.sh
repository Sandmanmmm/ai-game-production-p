#!/bin/bash
# Let's Encrypt Certificate Renewal Script for GameForge
# Handles automatic certificate renewal with zero downtime

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOMAIN="${DOMAIN:-yourdomain.com}"
EMAIL="${CERTBOT_EMAIL:-admin@yourdomain.com}"
WEBROOT="/var/www/certbot"
COMPOSE_FILE="docker-compose.production-secure.yml"
SSL_COMPOSE_FILE="docker-compose.ssl.yml"

# Logging
LOG_FILE="/var/log/cert-renewal.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log() {
    echo -e "${BLUE}[$TIMESTAMP]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[$TIMESTAMP] ✅ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$TIMESTAMP] ⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$TIMESTAMP] ❌ $1${NC}" | tee -a "$LOG_FILE"
}

# Send notification
send_notification() {
    local message="$1"
    local level="${2:-info}"

    # Slack notification
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        local emoji="ℹ️"
        case $level in
            "success") emoji="✅" ;;
            "warning") emoji="⚠️" ;;
            "error") emoji="❌" ;;
        esac

        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\": \"$emoji GameForge SSL: $message\"}" \
            "$SLACK_WEBHOOK_URL" 2>/dev/null || true
    fi

    # Log to monitoring
    if command -v curl >/dev/null 2>&1; then
        curl -X POST --data-binary @- \
            "http://prometheus-pushgateway:9091/metrics/job/cert-renewal" <<EOF 2>/dev/null || true
cert_renewal_status{domain="$DOMAIN"} $([ "$level" = "success" ] && echo "1" || echo "0")
cert_renewal_timestamp{domain="$DOMAIN"} $(date +%s)
EOF
    fi
}

# Check certificate expiry
check_certificate_expiry() {
    local cert_file="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"

    if [ ! -f "$cert_file" ]; then
        warning "Certificate file not found: $cert_file"
        return 1
    fi

    local expiry_date=$(openssl x509 -enddate -noout -in "$cert_file" | cut -d= -f2)
    local expiry_epoch=$(date -d "$expiry_date" +%s)
    local current_epoch=$(date +%s)
    local days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))

    log "Certificate expires in $days_until_expiry days"

    # Renew if less than 30 days
    if [ $days_until_expiry -lt 30 ]; then
        log "Certificate needs renewal (expires in $days_until_expiry days)"
        return 0
    else
        log "Certificate is still valid for $days_until_expiry days"
        return 1
    fi
}

# Initial certificate generation
generate_initial_certificate() {
    log "Generating initial Let's Encrypt certificate for $DOMAIN..."

    # Ensure webroot exists
    mkdir -p "$WEBROOT"

    # Generate certificate with multiple domains
    docker run --rm -v /etc/letsencrypt:/etc/letsencrypt \
        -v "$WEBROOT:/var/www/certbot" \
        certbot/certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --expand \
        -d "$DOMAIN" \
        -d "www.$DOMAIN" \
        -d "api.$DOMAIN" || {
        error "Failed to generate initial certificate"
        send_notification "Failed to generate initial certificate for $DOMAIN" "error"
        return 1
    }

    success "Initial certificate generated successfully"
    send_notification "Initial certificate generated for $DOMAIN" "success"
}

# Renew certificate
renew_certificate() {
    log "Renewing certificate for $DOMAIN..."

    # Backup current certificate
    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "/backup/fullchain_$(date +%Y%m%d_%H%M%S).pem"
        cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "/backup/privkey_$(date +%Y%m%d_%H%M%S).pem"
        log "Certificate backed up"
    fi

    # Attempt renewal
    docker run --rm -v /etc/letsencrypt:/etc/letsencrypt \
        -v "$WEBROOT:/var/www/certbot" \
        certbot/certbot renew \
        --webroot-path=/var/www/certbot \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email || {
        error "Certificate renewal failed"
        send_notification "Certificate renewal failed for $DOMAIN" "error"
        return 1
    }

    success "Certificate renewed successfully"
    send_notification "Certificate renewed for $DOMAIN" "success"
}

# Reload nginx configuration
reload_nginx() {
    log "Reloading nginx configuration..."

    # Test nginx configuration first
    if docker-compose -f "$COMPOSE_FILE" exec nginx nginx -t 2>/dev/null; then
        docker-compose -f "$COMPOSE_FILE" exec nginx nginx -s reload
        success "Nginx configuration reloaded"
    else
        error "Nginx configuration test failed"
        send_notification "Nginx configuration reload failed" "error"
        return 1
    fi
}

# Generate DH parameters if not exist
generate_dhparam() {
    local dhparam_file="/etc/nginx/ssl/dhparam.pem"

    if [ ! -f "$dhparam_file" ]; then
        log "Generating DH parameters (this may take a while)..."

        docker run --rm -v /etc/nginx/ssl:/ssl \
            alpine/openssl dhparam -out /ssl/dhparam.pem 2048

        success "DH parameters generated"
    else
        log "DH parameters already exist"
    fi
}

# Main function
main() {
    log "Starting certificate renewal process for $DOMAIN"

    # Generate DH parameters if needed
    generate_dhparam

    # Check if initial certificate exists
    if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        log "No existing certificate found, generating initial certificate..."
        generate_initial_certificate
    else
        # Check if renewal is needed
        if check_certificate_expiry; then
            renew_certificate
            reload_nginx
        else
            log "Certificate renewal not needed"
        fi
    fi

    # Cleanup old backups (keep 30 days)
    find /backup -name "*.pem" -mtime +30 -delete 2>/dev/null || true

    success "Certificate renewal process completed"
}

# Error handling
trap 'error "Certificate renewal process failed unexpectedly"' ERR

# Run main function
main "$@"
