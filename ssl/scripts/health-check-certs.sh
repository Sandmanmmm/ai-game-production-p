#!/bin/bash
# Certificate Health Check Script
# Monitors SSL certificate status and sends alerts

set -euo pipefail

DOMAIN="${DOMAIN:-yourdomain.com}"
CRITICAL_DAYS=7
WARNING_DAYS=30

# Check certificate status
check_certificate() {
    local cert_file="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"

    if [ ! -f "$cert_file" ]; then
        echo "CRITICAL: Certificate file not found"
        exit 2
    fi

    local expiry_date=$(openssl x509 -enddate -noout -in "$cert_file" | cut -d= -f2)
    local expiry_epoch=$(date -d "$expiry_date" +%s)
    local current_epoch=$(date +%s)
    local days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))

    if [ $days_until_expiry -lt $CRITICAL_DAYS ]; then
        echo "CRITICAL: Certificate expires in $days_until_expiry days"
        exit 2
    elif [ $days_until_expiry -lt $WARNING_DAYS ]; then
        echo "WARNING: Certificate expires in $days_until_expiry days"
        exit 1
    else
        echo "OK: Certificate valid for $days_until_expiry days"
        exit 0
    fi
}

# Check SSL connection
check_ssl_connection() {
    if timeout 10 openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" </dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
        echo "OK: SSL connection successful"
        return 0
    else
        echo "CRITICAL: SSL connection failed"
        return 1
    fi
}

# Main health check
main() {
    echo "Checking certificate for $DOMAIN..."
    check_certificate
    check_ssl_connection
}

main "$@"
