#!/usr/bin/env python3
import json
import logging
import os
import requests
from datetime import datetime
from flask import Flask, request, jsonify
from typing import Dict, List, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/app/logs/webhook.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

class GameForgeWebhookHandler:
    def __init__(self):
        self.gameforge_api_url = os.getenv('GAMEFORGE_API_URL', 'http://gameforge-api:8000')
        self.slack_webhook_url = os.getenv('SLACK_WEBHOOK_URL', '')

    def process_alert(self, alert_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process incoming alert and take appropriate actions"""

        try:
            alerts = alert_data.get('alerts', [])

            for alert in alerts:
                alert_name = alert.get('labels', {}).get('alertname', 'Unknown')
                severity = alert.get('labels', {}).get('severity', 'info')
                status = alert.get('status', 'unknown')

                logger.info(f"Processing alert: {alert_name}, severity: {severity}, status: {status}")

                # Route alert based on type
                if 'GPU' in alert_name:
                    self.handle_gpu_alert(alert)
                elif 'gameforge' in alert_name.lower():
                    self.handle_gameforge_alert(alert)
                elif severity == 'critical':
                    self.handle_critical_alert(alert)

            return {"status": "success", "processed": len(alerts)}

        except Exception as e:
            logger.error(f"Error processing alert: {str(e)}")
            return {"status": "error", "message": str(e)}

    def handle_gpu_alert(self, alert: Dict[str, Any]):
        """Handle GPU-specific alerts"""
        gpu_id = alert.get('labels', {}).get('gpu', 'unknown')
        temperature = alert.get('annotations', {}).get('value', 'unknown')

        # Auto-scaling action for GPU overheating
        if 'Critical' in alert.get('labels', {}).get('alertname', ''):
            logger.warning(f"Critical GPU alert for GPU {gpu_id}")
            self.trigger_gpu_protection(gpu_id, temperature)

    def handle_gameforge_alert(self, alert: Dict[str, Any]):
        """Handle GameForge service alerts"""
        service = alert.get('labels', {}).get('service', 'unknown')

        # Auto-restart service if down
        if 'Down' in alert.get('labels', {}).get('alertname', ''):
            logger.warning(f"GameForge service {service} is down")
            self.trigger_service_restart(service)

    def handle_critical_alert(self, alert: Dict[str, Any]):
        """Handle critical alerts with immediate escalation"""
        alert_name = alert.get('labels', {}).get('alertname', 'Unknown')

        # Send to emergency contacts
        self.send_emergency_notification(alert)

        # Log to security audit trail
        self.log_security_event(alert)

    def trigger_gpu_protection(self, gpu_id: str, temperature: str):
        """Trigger GPU protection mechanisms"""
        try:
            # Reduce GPU workload
            response = requests.post(
                f"{self.gameforge_api_url}/api/v1/gpu/{gpu_id}/reduce-load",
                json={"reason": "overheating", "temperature": temperature},
                timeout=30
            )
            logger.info(f"GPU protection triggered for {gpu_id}: {response.status_code}")
        except Exception as e:
            logger.error(f"Failed to trigger GPU protection: {str(e)}")

    def trigger_service_restart(self, service: str):
        """Trigger service restart"""
        try:
            response = requests.post(
                f"{self.gameforge_api_url}/api/v1/services/{service}/restart",
                json={"reason": "health_check_failed"},
                timeout=30
            )
            logger.info(f"Service restart triggered for {service}: {response.status_code}")
        except Exception as e:
            logger.error(f"Failed to trigger service restart: {str(e)}")

    def send_emergency_notification(self, alert: Dict[str, Any]):
        """Send emergency notification via multiple channels"""
        if self.slack_webhook_url:
            try:
                slack_payload = {
                    "text": f"🚨 CRITICAL ALERT: {alert.get('annotations', {}).get('summary', 'Unknown')}",
                    "channel": "#gameforge-emergency",
                    "username": "GameForge AlertBot"
                }
                requests.post(self.slack_webhook_url, json=slack_payload, timeout=30)
            except Exception as e:
                logger.error(f"Failed to send Slack notification: {str(e)}")

    def log_security_event(self, alert: Dict[str, Any]):
        """Log security event to audit trail"""
        security_event = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": "critical_alert",
            "alert_name": alert.get('labels', {}).get('alertname', 'Unknown'),
            "severity": alert.get('labels', {}).get('severity', 'unknown'),
            "source": alert.get('labels', {}).get('instance', 'unknown'),
            "details": alert.get('annotations', {})
        }

        try:
            # Send to audit logging system
            response = requests.post(
                f"{self.gameforge_api_url}/api/v1/audit/security-event",
                json=security_event,
                timeout=30
            )
            logger.info(f"Security event logged: {response.status_code}")
        except Exception as e:
            logger.error(f"Failed to log security event: {str(e)}")

# Initialize handler
webhook_handler = GameForgeWebhookHandler()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "timestamp": datetime.utcnow().isoformat()})

@app.route('/alerts', methods=['POST'])
def handle_alerts():
    try:
        alert_data = request.json
        logger.info(f"Received alert webhook: {len(alert_data.get('alerts', []))} alerts")

        result = webhook_handler.process_alert(alert_data)
        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Error handling alert webhook: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/gpu-critical', methods=['POST'])
def handle_gpu_critical():
    try:
        alert_data = request.json
        logger.warning("Received critical GPU alert")

        # Immediate GPU protection actions
        for alert in alert_data.get('alerts', []):
            gpu_id = alert.get('labels', {}).get('gpu', 'unknown')
            webhook_handler.trigger_gpu_protection(gpu_id, alert.get('annotations', {}).get('value', 'unknown'))

        return jsonify({"status": "success", "action": "gpu_protection_triggered"}), 200

    except Exception as e:
        logger.error(f"Error handling critical GPU alert: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('WEBHOOK_PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)
