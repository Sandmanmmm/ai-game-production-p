#!/bin/bash
# Monitor Health Check Script
# ==========================
# Simple health check for the monitoring container

SECURITY_DIR="/shared/security"

# Check if monitoring is active and healthy
if [ -f "$SECURITY_DIR/monitor-health.json" ]; then
    health_score=$(jq -r '.monitor_status.overall_score // 0' "$SECURITY_DIR/monitor-health.json" 2>/dev/null || echo "0")
    if [ "$health_score" -ge 40 ]; then
        exit 0  # Healthy
    fi
fi

exit 1  # Unhealthy
