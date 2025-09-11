#!/bin/bash
# SSL/TLS Testing and Validation Script
# Comprehensive testing of SSL configuration and security

set -euo pipefail

DOMAIN="${1:-yourdomain.com}"
VERBOSE="${2:-false}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[TEST]${NC} $1"; }
pass() { echo -e "${GREEN}[PASS]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# Test counters
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNINGS=0

# Test function wrapper
run_test() {
    local test_name="$1"
    local test_command="$2"

    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    log "Running test: $test_name"

    if eval "$test_command" >/dev/null 2>&1; then
        pass "$test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        fail "$test_name"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Test SSL connection
test_ssl_connection() {
    local domain="$1"
    timeout 10 openssl s_client -connect "$domain:443" -servername "$domain" </dev/null 2>/dev/null | grep -q "Verify return code: 0"
}

# Test HTTP to HTTPS redirect
test_http_redirect() {
    local domain="$1"
    local response=$(curl -s -I "http://$domain" | head -n1)
    echo "$response" | grep -q "301\|302"
}

# Test security headers
test_security_headers() {
    local domain="$1"
    local headers=$(curl -s -I "https://$domain")

    echo "$headers" | grep -q "Strict-Transport-Security" && \
    echo "$headers" | grep -q "X-Frame-Options" && \
    echo "$headers" | grep -q "X-Content-Type-Options" && \
    echo "$headers" | grep -q "X-XSS-Protection"
}

# Test SSL certificate validity
test_certificate_validity() {
    local domain="$1"
    local cert_info=$(echo | openssl s_client -connect "$domain:443" -servername "$domain" 2>/dev/null | openssl x509 -noout -dates)

    local not_after=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
    local expiry_epoch=$(date -d "$not_after" +%s)
    local current_epoch=$(date +%s)
    local days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))

    [ $days_until_expiry -gt 7 ]
}

# Test SSL protocol support
test_ssl_protocols() {
    local domain="$1"

    # Test TLS 1.2
    timeout 5 openssl s_client -connect "$domain:443" -tls1_2 </dev/null >/dev/null 2>&1 && \
    # Test TLS 1.3 (if available)
    timeout 5 openssl s_client -connect "$domain:443" -tls1_3 </dev/null >/dev/null 2>&1
}

# Test cipher strength
test_cipher_strength() {
    local domain="$1"
    local cipher=$(echo | openssl s_client -connect "$domain:443" -servername "$domain" 2>/dev/null | grep "Cipher    :")

    # Check for strong ciphers (AES256 or ChaCha20)
    echo "$cipher" | grep -qE "(AES256|CHACHA20)"
}

# Test OCSP stapling
test_ocsp_stapling() {
    local domain="$1"
    echo | openssl s_client -connect "$domain:443" -servername "$domain" -status 2>/dev/null | grep -q "OCSP Response Status: successful"
}

# Test certificate transparency
test_certificate_transparency() {
    local domain="$1"
    echo | openssl s_client -connect "$domain:443" -servername "$domain" 2>/dev/null | \
    openssl x509 -noout -text | grep -q "CT Precertificate SCTs"
}

# Test perfect forward secrecy
test_perfect_forward_secrecy() {
    local domain="$1"
    local cipher=$(echo | openssl s_client -connect "$domain:443" -servername "$domain" 2>/dev/null | grep "Cipher    :")

    # Check for ECDHE or DHE key exchange
    echo "$cipher" | grep -qE "(ECDHE|DHE)"
}

# Test session resumption
test_session_resumption() {
    local domain="$1"

    # Get session ID from first connection
    local session_id=$(echo | openssl s_client -connect "$domain:443" -servername "$domain" 2>/dev/null | grep "Session-ID:" | cut -d: -f2 | tr -d ' ')

    [ -n "$session_id" ] && [ "$session_id" != "0000000000000000000000000000000000000000000000000000000000000000" ]
}

# Test subdomain coverage
test_subdomain_coverage() {
    local domain="$1"

    test_ssl_connection "www.$domain" && \
    test_ssl_connection "api.$domain"
}

# Test vulnerability scanning
test_ssl_vulnerabilities() {
    local domain="$1"

    # Test for common SSL vulnerabilities
    # This is a simplified check - in production you'd use tools like testssl.sh

    # Check if vulnerable protocols are disabled
    ! timeout 5 openssl s_client -connect "$domain:443" -ssl3 </dev/null >/dev/null 2>&1 && \
    ! timeout 5 openssl s_client -connect "$domain:443" -tls1 </dev/null >/dev/null 2>&1 && \
    ! timeout 5 openssl s_client -connect "$domain:443" -tls1_1 </dev/null >/dev/null 2>&1
}

# Performance test
test_ssl_performance() {
    local domain="$1"

    # Measure SSL handshake time
    local handshake_time=$(curl -w "%{time_connect}" -o /dev/null -s "https://$domain")

    # Consider it a pass if handshake takes less than 2 seconds
    awk "BEGIN {exit ($handshake_time < 2.0) ? 0 : 1}"
}

# Generate detailed report
generate_detailed_report() {
    local domain="$1"

    echo ""
    echo "🔍 DETAILED SSL/TLS ANALYSIS FOR $domain"
    echo "=" * 50

    # Certificate information
    echo ""
    echo "📜 Certificate Information:"
    echo | openssl s_client -connect "$domain:443" -servername "$domain" 2>/dev/null | \
    openssl x509 -noout -text | grep -A1 -E "(Subject:|Issuer:|Not Before:|Not After :)"

    # Cipher information
    echo ""
    echo "🔐 Cipher Information:"
    echo | openssl s_client -connect "$domain:443" -servername "$domain" 2>/dev/null | \
    grep -E "(SSL-Session:|Cipher|Protocol)"

    # Certificate chain
    echo ""
    echo "🔗 Certificate Chain:"
    echo | openssl s_client -connect "$domain:443" -servername "$domain" -showcerts 2>/dev/null | \
    grep -c "BEGIN CERTIFICATE" | awk '{print "Certificates in chain: " $1}'

    # Security score estimation
    local security_score=0
    test_ssl_connection "$domain" && security_score=$((security_score + 20))
    test_security_headers "$domain" && security_score=$((security_score + 20))
    test_ssl_protocols "$domain" && security_score=$((security_score + 15))
    test_cipher_strength "$domain" && security_score=$((security_score + 15))
    test_perfect_forward_secrecy "$domain" && security_score=$((security_score + 15))
    test_ocsp_stapling "$domain" && security_score=$((security_score + 10))
    test_ssl_vulnerabilities "$domain" && security_score=$((security_score + 5))

    echo ""
    echo "📊 Estimated Security Score: $security_score/100"

    if [ $security_score -ge 90 ]; then
        echo "🏆 Grade: A+"
    elif [ $security_score -ge 80 ]; then
        echo "🥇 Grade: A"
    elif [ $security_score -ge 70 ]; then
        echo "🥈 Grade: B"
    elif [ $security_score -ge 60 ]; then
        echo "🥉 Grade: C"
    else
        echo "❌ Grade: F"
    fi
}

# Main test suite
main() {
    echo "🔒 SSL/TLS SECURITY TEST SUITE"
    echo "Domain: $DOMAIN"
    echo "=" * 40
    echo ""

    # Core functionality tests
    run_test "SSL Connection" "test_ssl_connection $DOMAIN"
    run_test "HTTP to HTTPS Redirect" "test_http_redirect $DOMAIN"
    run_test "Certificate Validity" "test_certificate_validity $DOMAIN"
    run_test "Security Headers" "test_security_headers $DOMAIN"

    # Protocol and cipher tests
    run_test "SSL Protocol Support" "test_ssl_protocols $DOMAIN"
    run_test "Cipher Strength" "test_cipher_strength $DOMAIN"
    run_test "Perfect Forward Secrecy" "test_perfect_forward_secrecy $DOMAIN"

    # Advanced security tests
    run_test "OCSP Stapling" "test_ocsp_stapling $DOMAIN"
    run_test "Session Resumption" "test_session_resumption $DOMAIN"
    run_test "Subdomain Coverage" "test_subdomain_coverage $DOMAIN"
    run_test "Vulnerability Check" "test_ssl_vulnerabilities $DOMAIN"

    # Performance tests
    run_test "SSL Performance" "test_ssl_performance $DOMAIN"

    # Generate summary
    echo ""
    echo "📊 TEST SUMMARY"
    echo "=" * 20
    echo "Total Tests: $TESTS_TOTAL"
    echo "Passed: $TESTS_PASSED"
    echo "Failed: $TESTS_FAILED"
    echo "Warnings: $TESTS_WARNINGS"
    echo ""

    local success_rate=$((TESTS_PASSED * 100 / TESTS_TOTAL))
    echo "Success Rate: $success_rate%"

    if [ $success_rate -ge 90 ]; then
        pass "Excellent SSL/TLS configuration! 🏆"
    elif [ $success_rate -ge 80 ]; then
        pass "Good SSL/TLS configuration! 👍"
    elif [ $success_rate -ge 70 ]; then
        warn "SSL/TLS configuration needs improvement 🔧"
    else
        fail "SSL/TLS configuration has serious issues! ⚠️"
    fi

    # Generate detailed report if verbose
    if [ "$VERBOSE" = "true" ]; then
        generate_detailed_report "$DOMAIN"
    fi

    # Exit with appropriate code
    if [ $TESTS_FAILED -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Show usage if no domain provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <domain> [verbose]"
    echo "Example: $0 myapp.com true"
    exit 1
fi

# Run main function
main "$@"
