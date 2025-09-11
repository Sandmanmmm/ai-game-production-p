#!/usr/bin/env python3
import json
import logging
import os
import time
import numpy as np
from datetime import datetime, timedelta
from elasticsearch import Elasticsearch
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class GameForgeMLProcessor:
    def __init__(self):
        self.es_host = os.getenv('ELASTICSEARCH_HOST', 'elasticsearch:9200')
        self.es_username = os.getenv('ELASTICSEARCH_USERNAME', 'elastic')
        self.es_password = os.getenv('ELASTICSEARCH_PASSWORD', '')
        self.model_path = os.getenv('ML_MODEL_PATH', '/app/models')
        self.processing_interval = int(os.getenv('PROCESSING_INTERVAL', 300))

        # Initialize Elasticsearch client
        self.es = Elasticsearch(
            [f"http://{self.es_host}"],
            basic_auth=(self.es_username, self.es_password),
            request_timeout=30
        )

        # Load or initialize ML models
        self.anomaly_model = self.load_or_create_anomaly_model()
        self.scaler = StandardScaler()

    def load_or_create_anomaly_model(self):
        """Load existing anomaly detection model or create new one"""
        model_file = f"{self.model_path}/anomaly_detection.joblib"

        try:
            if os.path.exists(model_file):
                logger.info("Loading existing anomaly detection model")
                return joblib.load(model_file)
            else:
                logger.info("Creating new anomaly detection model")
                return IsolationForest(
                    contamination=0.1,
                    random_state=42,
                    n_estimators=100
                )
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            return IsolationForest(contamination=0.1, random_state=42)

    def save_model(self):
        """Save trained model to disk"""
        try:
            os.makedirs(self.model_path, exist_ok=True)
            model_file = f"{self.model_path}/anomaly_detection.joblib"
            joblib.dump(self.anomaly_model, model_file)
            logger.info(f"Model saved to {model_file}")
        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")

    def fetch_training_data(self):
        """Fetch recent log data for model training"""
        try:
            # Query for last 24 hours of API request data
            query = {
                "query": {
                    "bool": {
                        "must": [
                            {"range": {"@timestamp": {"gte": "now-24h"}}},
                            {"exists": {"field": "response_time"}},
                            {"exists": {"field": "response_code"}},
                            {"term": {"log_type": "application"}}
                        ]
                    }
                },
                "size": 10000,
                "_source": ["response_time", "response_code", "endpoint", "@timestamp"]
            }

            response = self.es.search(
                index="gameforge-application-*",
                body=query
            )

            data = []
            for hit in response['hits']['hits']:
                source = hit['_source']
                data.append([
                    source.get('response_time', 0),
                    source.get('response_code', 200),
                    hash(source.get('endpoint', '')) % 1000  # Convert endpoint to numeric
                ])

            return np.array(data) if data else np.array([[0, 200, 0]])

        except Exception as e:
            logger.error(f"Error fetching training data: {str(e)}")
            return np.array([[0, 200, 0]])

    def train_anomaly_model(self):
        """Train anomaly detection model on recent data"""
        logger.info("Training anomaly detection model")

        try:
            # Fetch training data
            training_data = self.fetch_training_data()

            if len(training_data) < 10:
                logger.warning("Insufficient training data, skipping training")
                return

            # Scale features
            scaled_data = self.scaler.fit_transform(training_data)

            # Train model
            self.anomaly_model.fit(scaled_data)

            # Save model
            self.save_model()

            logger.info(f"Model trained on {len(training_data)} samples")

        except Exception as e:
            logger.error(f"Error training model: {str(e)}")

    def detect_anomalies(self):
        """Detect anomalies in recent log data"""
        logger.info("Detecting anomalies in recent logs")

        try:
            # Query for last hour of data
            query = {
                "query": {
                    "bool": {
                        "must": [
                            {"range": {"@timestamp": {"gte": "now-1h"}}},
                            {"exists": {"field": "response_time"}},
                            {"term": {"log_type": "application"}}
                        ]
                    }
                },
                "size": 1000,
                "_source": ["response_time", "response_code", "endpoint", "@timestamp", "_id"]
            }

            response = self.es.search(
                index="gameforge-application-*",
                body=query
            )

            anomalies_detected = 0

            for hit in response['hits']['hits']:
                source = hit['_source']

                # Prepare features
                features = np.array([[
                    source.get('response_time', 0),
                    source.get('response_code', 200),
                    hash(source.get('endpoint', '')) % 1000
                ]])

                # Scale features
                scaled_features = self.scaler.transform(features)

                # Predict anomaly
                anomaly_score = self.anomaly_model.decision_function(scaled_features)[0]
                is_anomaly = self.anomaly_model.predict(scaled_features)[0] == -1

                if is_anomaly:
                    anomalies_detected += 1

                    # Index anomaly to separate index
                    anomaly_doc = {
                        "original_id": hit['_id'],
                        "timestamp": source.get('@timestamp'),
                        "anomaly_score": float(anomaly_score),
                        "response_time": source.get('response_time'),
                        "response_code": source.get('response_code'),
                        "endpoint": source.get('endpoint'),
                        "anomaly_type": "response_time_anomaly",
                        "severity": "medium" if anomaly_score < -0.5 else "low",
                        "ml_model": "isolation_forest",
                        "detection_timestamp": datetime.utcnow().isoformat()
                    }

                    self.es.index(
                        index=f"gameforge-ml-anomalies-{datetime.now().strftime('%Y.%m.%d')}",
                        body=anomaly_doc
                    )

            logger.info(f"Detected {anomalies_detected} anomalies")

        except Exception as e:
            logger.error(f"Error detecting anomalies: {str(e)}")

    def generate_insights(self):
        """Generate insights from log data"""
        logger.info("Generating insights from log data")

        try:
            # Query for business insights
            insights = {
                "timestamp": datetime.utcnow().isoformat(),
                "period": "last_hour",
                "insights": []
            }

            # Average response time insight
            avg_response_query = {
                "query": {
                    "bool": {
                        "must": [
                            {"range": {"@timestamp": {"gte": "now-1h"}}},
                            {"exists": {"field": "response_time"}}
                        ]
                    }
                },
                "aggs": {
                    "avg_response_time": {"avg": {"field": "response_time"}}
                }
            }

            response = self.es.search(
                index="gameforge-application-*",
                body=avg_response_query,
                size=0
            )

            avg_response_time = response['aggregations']['avg_response_time']['value']
            if avg_response_time:
                insights["insights"].append({
                    "type": "performance",
                    "metric": "average_response_time",
                    "value": round(avg_response_time, 2),
                    "unit": "ms",
                    "status": "good" if avg_response_time < 500 else "warning" if avg_response_time < 1000 else "critical"
                })

            # Error rate insight
            error_rate_query = {
                "query": {
                    "bool": {
                        "must": [
                            {"range": {"@timestamp": {"gte": "now-1h"}}},
                            {"exists": {"field": "response_code"}}
                        ]
                    }
                },
                "aggs": {
                    "total_requests": {"value_count": {"field": "response_code"}},
                    "error_requests": {
                        "filter": {"range": {"response_code": {"gte": 400}}}
                    }
                }
            }

            response = self.es.search(
                index="gameforge-application-*",
                body=error_rate_query,
                size=0
            )

            total_requests = response['aggregations']['total_requests']['value']
            error_requests = response['aggregations']['error_requests']['doc_count']

            if total_requests > 0:
                error_rate = (error_requests / total_requests) * 100
                insights["insights"].append({
                    "type": "reliability",
                    "metric": "error_rate",
                    "value": round(error_rate, 2),
                    "unit": "percent",
                    "status": "good" if error_rate < 1 else "warning" if error_rate < 5 else "critical"
                })

            # Index insights
            self.es.index(
                index=f"gameforge-insights-{datetime.now().strftime('%Y.%m.%d')}",
                body=insights
            )

            logger.info(f"Generated {len(insights['insights'])} insights")

        except Exception as e:
            logger.error(f"Error generating insights: {str(e)}")

    def run(self):
        """Main processing loop"""
        logger.info("Starting GameForge ML Processor")

        while True:
            try:
                # Train model every 4 hours
                current_hour = datetime.now().hour
                if current_hour % 4 == 0:
                    self.train_anomaly_model()

                # Detect anomalies
                self.detect_anomalies()

                # Generate insights
                self.generate_insights()

                # Sleep until next processing cycle
                logger.info(f"Processing complete, sleeping for {self.processing_interval} seconds")
                time.sleep(self.processing_interval)

            except KeyboardInterrupt:
                logger.info("Shutting down ML processor")
                break
            except Exception as e:
                logger.error(f"Error in main processing loop: {str(e)}")
                time.sleep(60)  # Wait 1 minute before retrying

if __name__ == "__main__":
    processor = GameForgeMLProcessor()
    processor.run()
