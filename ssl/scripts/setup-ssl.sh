#!/bin/bash
# GameForge SSL/TLS Setup Script
# Complete SSL/TLS setup with Let's Encrypt for production

set -euo pipefail

# Configuration
DOMAIN="${1:-yourdomain.com}"
EMAIL="${2:-admin@yourdomain.com}"
STAGING="${3:-false}"  # Set to true for testing

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}[$(date '+%H:%M:%S')] ✅ $1${NC}"; }
warning() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️  $1${NC}"; }
error() { echo -e "${RED}[$(date '+%H:%M:%S')] ❌ $1${NC}"; }

error_exit() {
    error "$1"
    exit 1
}

# Validate domain
validate_domain() {
    if [[ ! "$DOMAIN" =~ ^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$ ]]; then
        error_exit "Invalid domain format: $DOMAIN"
    fi

    log "Validating domain: $DOMAIN"

    # Check if domain resolves to this server
    DOMAIN_IP=$(dig +short "$DOMAIN" | tail -n1)
    SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip)

    if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
        warning "Domain $DOMAIN does not resolve to this server IP ($SERVER_IP)"
        warning "Current domain IP: $DOMAIN_IP"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        success "Domain validation passed"
    fi
}

# Setup SSL directories and permissions
setup_ssl_directories() {
    log "Setting up SSL directories..."

    directories=(
        "/etc/letsencrypt"
        "/var/www/certbot" 
        "/etc/nginx/ssl"
        "/backup"
        "/var/log"
    )

    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
        log "Created directory: $dir"
    done

    # Set proper permissions
    chmod 755 /etc/letsencrypt
    chmod 755 /var/www/certbot
    chmod 700 /etc/nginx/ssl
    chmod 700 /backup

    success "SSL directories setup complete"
}

# Generate initial nginx configuration for ACME challenge
setup_initial_nginx() {
    log "Setting up initial nginx configuration for ACME challenge..."

    cat > /etc/nginx/conf.d/default.conf << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN api.$DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files \$uri \$uri/ =404;
    }

    location / {
        return 200 'SSL setup in progress...';
        add_header Content-Type text/plain;
    }
}
EOF

    success "Initial nginx configuration created"
}

# Request Let's Encrypt certificate
request_certificate() {
    log "Requesting Let's Encrypt certificate for $DOMAIN..."

    local staging_flag=""
    if [ "$STAGING" = "true" ]; then
        staging_flag="--staging"
        warning "Using Let's Encrypt staging environment"
    fi

    # Request certificate
    docker run --rm \
        -v /etc/letsencrypt:/etc/letsencrypt \
        -v /var/www/certbot:/var/www/certbot \
        certbot/certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        $staging_flag \
        --expand \
        -d "$DOMAIN" \
        -d "www.$DOMAIN" \
        -d "api.$DOMAIN" || {
        error_exit "Failed to obtain SSL certificate"
    }

    success "SSL certificate obtained successfully"
}

# Generate DH parameters
generate_dhparams() {
    log "Generating DH parameters (this may take a few minutes)..."

    if [ ! -f "/etc/nginx/ssl/dhparam.pem" ]; then
        openssl dhparam -out /etc/nginx/ssl/dhparam.pem 2048
        success "DH parameters generated"
    else
        log "DH parameters already exist"
    fi
}

# Setup SSL nginx configuration
setup_ssl_nginx() {
    log "Setting up SSL nginx configuration..."

    # Copy the SSL nginx configuration
    cp nginx/nginx.ssl.conf /etc/nginx/nginx.conf

    # Replace domain placeholders
    sed -i "s/\${DOMAIN}/$DOMAIN/g" /etc/nginx/nginx.conf

    # Test nginx configuration
    nginx -t || error_exit "Nginx configuration test failed"

    success "SSL nginx configuration setup complete"
}

# Setup automatic renewal
setup_automatic_renewal() {
    log "Setting up automatic certificate renewal..."

    # Make renewal script executable
    chmod +x ssl/scripts/renew-certificates.sh
    chmod +x ssl/scripts/health-check-certs.sh

    # Create systemd timer for renewal (if systemd is available)
    if command -v systemctl >/dev/null 2>&1; then
        cat > /etc/systemd/system/certbot-renewal.service << EOF
[Unit]
Description=Certbot Renewal
After=network.target

[Service]
Type=oneshot
ExecStart=/scripts/renew-certificates.sh
User=root
Environment=DOMAIN=$DOMAIN
Environment=CERTBOT_EMAIL=$EMAIL
EOF

        cat > /etc/systemd/system/certbot-renewal.timer << EOF
[Unit]
Description=Run certbot twice daily
Requires=certbot-renewal.service

[Timer]
OnCalendar=*-*-* 00,12:00:00
RandomizedDelaySec=3600
Persistent=true

[Install]
WantedBy=timers.target
EOF

        systemctl daemon-reload
        systemctl enable certbot-renewal.timer
        systemctl start certbot-renewal.timer

        success "Systemd timer setup complete"
    else
        log "Systemd not available, using Docker-based renewal"
    fi
}

# Update docker-compose environment
update_environment() {
    log "Updating environment configuration..."

    # Update .env.production with domain and email
    if [ -f ".env.production" ]; then
        sed -i "s/DOMAIN=.*/DOMAIN=$DOMAIN/" .env.production
        sed -i "s/CERTBOT_EMAIL=.*/CERTBOT_EMAIL=$EMAIL/" .env.production
    else
        warning ".env.production not found, creating basic configuration"
        cat > .env.production << EOF
DOMAIN=$DOMAIN
CERTBOT_EMAIL=$EMAIL
ENABLE_SSL=true
EOF
    fi

    success "Environment configuration updated"
}

# Final verification
verify_ssl_setup() {
    log "Verifying SSL setup..."

    # Check certificate files
    cert_files=(
        "/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
        "/etc/letsencrypt/live/$DOMAIN/privkey.pem" 
        "/etc/letsencrypt/live/$DOMAIN/chain.pem"
    )

    for cert_file in "${cert_files[@]}"; do
        if [ -f "$cert_file" ]; then
            log "✓ Found: $cert_file"
        else
            error "✗ Missing: $cert_file"
        fi
    done

    # Test certificate validity
    if openssl x509 -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" -text -noout >/dev/null 2>&1; then
        success "Certificate validation passed"
    else
        error "Certificate validation failed"
    fi

    success "SSL setup verification complete"
}

# Main setup function
main() {
    log "🔒 GameForge SSL/TLS Setup Starting..."
    echo "Domain: $DOMAIN"
    echo "Email: $EMAIL"
    echo "Staging: $STAGING"
    echo "=========================="

    validate_domain
    setup_ssl_directories
    setup_initial_nginx
    generate_dhparams
    request_certificate
    setup_ssl_nginx
    setup_automatic_renewal
    update_environment
    verify_ssl_setup

    success "🎉 SSL/TLS setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Start your services: docker-compose -f docker-compose.production-secure.yml -f docker-compose.ssl.yml up -d"
    echo "2. Test HTTPS: curl -I https://$DOMAIN"
    echo "3. Check certificate: openssl s_client -connect $DOMAIN:443 -servername $DOMAIN"
    echo ""
    echo "Your GameForge application is now secured with Let's Encrypt SSL/TLS! 🔒"
}

# Show usage if no arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 <domain> [email] [staging]"
    echo "Example: $0 myapp.com admin@myapp.com false"
    exit 1
fi

# Run main function
main "$@"
