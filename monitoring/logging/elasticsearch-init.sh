#!/bin/bash
# Elasticsearch Initialization Script for GameForge Production

set -e

echo "Waiting for Elasticsearch to be ready..."
until curl -s -u elastic:${ELASTIC_PASSWORD} http://elasticsearch:9200/_cluster/health; do
  echo "Waiting for Elasticsearch..."
  sleep 5
done

echo "Elasticsearch is ready. Setting up users and indexes..."

# Create logstash_system user password
curl -X POST "elasticsearch:9200/_security/user/logstash_system/_password" \
  -u elastic:${ELASTIC_PASSWORD} \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"${LOGSTASH_SYSTEM_PASSWORD}\"}"

# Create filebeat_system user password  
curl -X POST "elasticsearch:9200/_security/user/beats_system/_password" \
  -u elastic:${ELASTIC_PASSWORD} \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"${FILEBEAT_SYSTEM_PASSWORD}\"}"

# Create Index Templates
echo "Creating index templates..."

# GameForge Application Index Template
curl -X PUT "elasticsearch:9200/_index_template/gameforge-app" \
  -u elastic:${ELASTIC_PASSWORD} \
  -H "Content-Type: application/json" \
  -d '{
    "index_patterns": ["gameforge-app-*"],
    "priority": 100,
    "template": {
      "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 0,
        "index.lifecycle.name": "gameforge-logs-policy",
        "index.lifecycle.rollover_alias": "gameforge-app-logs"
      },
      "mappings": {
        "properties": {
          "@timestamp": {"type": "date"},
          "level": {"type": "keyword"},
          "logger": {"type": "keyword"},
          "message": {"type": "text"},
          "service": {"type": "keyword"},
          "environment": {"type": "keyword"},
          "http_method": {"type": "keyword"},
          "uri_path": {"type": "keyword"},
          "status_code": {"type": "integer"},
          "response_time": {"type": "float"},
          "user_id": {"type": "keyword"},
          "request_id": {"type": "keyword"}
        }
      }
    }
  }'

# Nginx Index Template
curl -X PUT "elasticsearch:9200/_index_template/gameforge-nginx" \
  -u elastic:${ELASTIC_PASSWORD} \
  -H "Content-Type: application/json" \
  -d '{
    "index_patterns": ["gameforge-nginx-*"],
    "priority": 100,
    "template": {
      "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 0,
        "index.lifecycle.name": "gameforge-logs-policy"
      },
      "mappings": {
        "properties": {
          "@timestamp": {"type": "date"},
          "client_ip": {"type": "ip"},
          "request": {"type": "text"},
          "response": {"type": "integer"},
          "bytes": {"type": "long"},
          "referrer": {"type": "keyword"},
          "user_agent": {"type": "text"},
          "response_time": {"type": "float"}
        }
      }
    }
  }'

# PostgreSQL Index Template
curl -X PUT "elasticsearch:9200/_index_template/gameforge-postgres" \
  -u elastic:${ELASTIC_PASSWORD} \
  -H "Content-Type: application/json" \
  -d '{
    "index_patterns": ["gameforge-postgres-*"],
    "priority": 100,
    "template": {
      "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 0,
        "index.lifecycle.name": "gameforge-logs-policy"
      },
      "mappings": {
        "properties": {
          "@timestamp": {"type": "date"},
          "level": {"type": "keyword"},
          "pid": {"type": "integer"},
          "message": {"type": "text"},
          "query": {"type": "text"},
          "duration": {"type": "float"}
        }
      }
    }
  }'

# Create ILM Policy for Log Retention
curl -X PUT "elasticsearch:9200/_ilm/policy/gameforge-logs-policy" \
  -u elastic:${ELASTIC_PASSWORD} \
  -H "Content-Type: application/json" \
  -d '{
    "policy": {
      "phases": {
        "hot": {
          "min_age": "0ms",
          "actions": {
            "rollover": {
              "max_size": "5GB",
              "max_age": "1d"
            },
            "set_priority": {
              "priority": 100
            }
          }
        },
        "warm": {
          "min_age": "7d",
          "actions": {
            "set_priority": {
              "priority": 50
            },
            "allocate": {
              "number_of_replicas": 0
            }
          }
        },
        "cold": {
          "min_age": "30d",
          "actions": {
            "set_priority": {
              "priority": 0
            }
          }
        },
        "delete": {
          "min_age": "90d",
          "actions": {
            "delete": {}
          }
        }
      }
    }
  }'

# Create initial indexes
curl -X PUT "elasticsearch:9200/gameforge-app-000001" \
  -u elastic:${ELASTIC_PASSWORD} \
  -H "Content-Type: application/json" \
  -d '{
    "aliases": {
      "gameforge-app-logs": {
        "is_write_index": true
      }
    }
  }'

echo "Elasticsearch setup completed successfully!"
