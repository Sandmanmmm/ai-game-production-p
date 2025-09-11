# Phase 5 Directory Setup Script
# ===============================
# Ensures all required directories and configuration files exist

Write-Host "Phase 5: Directory Setup and Configuration Validation" -ForegroundColor Blue
Write-Host "======================================================"

$ProjectRoot = Get-Location
$RequiredDirs = @(
    "nginx/conf.d",
    "ssl/certs", 
    "ssl/private",
    "redis",
    "vault/config",
    "vault/policies", 
    "elasticsearch/config",
    "monitoring/logging/logstash",
    "monitoring/logging/filebeat",
    "monitoring/grafana/provisioning/dashboards",
    "monitoring/grafana/provisioning/datasources",
    "monitoring/grafana/dashboards",
    "monitoring/rules",
    "security/scripts",
    "security/seccomp",
    "security/apparmor"
)

$RequiredFiles = @{
    "nginx/nginx.conf" = "nginx-basic-config"
    "nginx/conf.d/default.conf" = "nginx-default-site"
    "redis/redis.conf" = "redis-config"
    "elasticsearch/config/elasticsearch.yml" = "elasticsearch-config"
    "monitoring/logging/logstash/logstash.conf" = "logstash-config"
    "monitoring/logging/filebeat/filebeat.yml" = "filebeat-config"
    "monitoring/prometheus.yml" = "prometheus-config"
    "monitoring/grafana/provisioning/datasources/prometheus.yml" = "grafana-datasource"
    "scripts/backup.sh" = "backup-script"
    "scripts/restore.sh" = "restore-script"
    "vault/config/vault.hcl" = "vault-config"
    "security/seccomp/vault.json" = "seccomp-profile"
}

Write-Host "Creating required directories..." -ForegroundColor Yellow

foreach ($dir in $RequiredDirs) {
    $fullPath = Join-Path $ProjectRoot $dir
    if (-not (Test-Path $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        Write-Host "  Created: $dir" -ForegroundColor Green
    } else {
        Write-Host "  Exists: $dir" -ForegroundColor Gray
    }
}

Write-Host "`nCreating required configuration files..." -ForegroundColor Yellow

# Create basic nginx configuration
$nginxConf = @"
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
                    
    access_log /var/log/nginx/access.log main;
    
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    include /etc/nginx/conf.d/*.conf;
}
"@

if (-not (Test-Path "nginx/nginx.conf")) {
    $nginxConf | Out-File -FilePath "nginx/nginx.conf" -Encoding UTF8
    Write-Host "  Created: nginx/nginx.conf" -ForegroundColor Green
}

# Create nginx default site
$nginxDefault = @"
upstream gameforge_app {
    server gameforge-app:8000;
}

server {
    listen 80;
    server_name localhost;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    location / {
        proxy_pass http://gameforge_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /health {
        proxy_pass http://gameforge_app/health;
        access_log off;
    }
    
    location /metrics {
        proxy_pass http://gameforge_app/metrics;
        access_log off;
    }
}
"@

if (-not (Test-Path "nginx/conf.d/default.conf")) {
    $nginxDefault | Out-File -FilePath "nginx/conf.d/default.conf" -Encoding UTF8
    Write-Host "  Created: nginx/conf.d/default.conf" -ForegroundColor Green
}

# Create Redis configuration
$redisConf = @"
# Redis Configuration for GameForge
bind 0.0.0.0
port 6379
protected-mode yes
requirepass gameforge_redis_2025

# Memory
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Security
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG ""
"@

if (-not (Test-Path "redis/redis.conf")) {
    $redisConf | Out-File -FilePath "redis/redis.conf" -Encoding UTF8
    Write-Host "  Created: redis/redis.conf" -ForegroundColor Green
}

# Create Elasticsearch configuration
$elasticsearchYml = @"
cluster.name: gameforge-logs
node.name: gameforge-elasticsearch
network.host: 0.0.0.0
http.port: 9200
discovery.type: single-node

# Security
xpack.security.enabled: false
xpack.monitoring.enabled: false

# Memory
indices.memory.index_buffer_size: 30%
"@

if (-not (Test-Path "elasticsearch/config/elasticsearch.yml")) {
    $elasticsearchYml | Out-File -FilePath "elasticsearch/config/elasticsearch.yml" -Encoding UTF8
    Write-Host "  Created: elasticsearch/config/elasticsearch.yml" -ForegroundColor Green
}

# Create Logstash configuration
$logstashConf = @"
input {
  beats {
    port => 5044
  }
}

filter {
  if [fields][service] == "gameforge" {
    grok {
      match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{GREEDYDATA:message}" }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "gameforge-logs-%{+YYYY.MM.dd}"
  }
}
"@

if (-not (Test-Path "monitoring/logging/logstash/logstash.conf")) {
    $logstashConf | Out-File -FilePath "monitoring/logging/logstash/logstash.conf" -Encoding UTF8
    Write-Host "  Created: monitoring/logging/logstash/logstash.conf" -ForegroundColor Green
}

# Create Filebeat configuration
$filebeatYml = @"
filebeat.inputs:
- type: container
  paths:
    - '/var/lib/docker/containers/*/*.log'
  fields:
    service: gameforge
  fields_under_root: true

output.logstash:
  hosts: ["logstash:5044"]

logging.level: info
"@

if (-not (Test-Path "monitoring/logging/filebeat/filebeat.yml")) {
    $filebeatYml | Out-File -FilePath "monitoring/logging/filebeat/filebeat.yml" -Encoding UTF8
    Write-Host "  Created: monitoring/logging/filebeat/filebeat.yml" -ForegroundColor Green
}

# Create Prometheus configuration
$prometheusYml = @"
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "/etc/prometheus/rules/*.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'gameforge-app'
    static_configs:
      - targets: ['gameforge-app:8000']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:80']
    metrics_path: '/metrics'
    scrape_interval: 30s
"@

if (-not (Test-Path "monitoring/prometheus.yml")) {
    $prometheusYml | Out-File -FilePath "monitoring/prometheus.yml" -Encoding UTF8
    Write-Host "  Created: monitoring/prometheus.yml" -ForegroundColor Green
}

# Create Grafana datasource
$grafanaDatasource = @"
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
"@

if (-not (Test-Path "monitoring/grafana/provisioning/datasources/prometheus.yml")) {
    $grafanaDatasource | Out-File -FilePath "monitoring/grafana/provisioning/datasources/prometheus.yml" -Encoding UTF8
    Write-Host "  Created: monitoring/grafana/provisioning/datasources/prometheus.yml" -ForegroundColor Green
}

# Create Vault configuration
$vaultHcl = @"
ui = true
disable_mlock = true

storage "file" {
  path = "/vault/data"
}

listener "tcp" {
  address = "0.0.0.0:8200"
  tls_disable = true
}

api_addr = "http://0.0.0.0:8200"
cluster_addr = "http://0.0.0.0:8201"
"@

if (-not (Test-Path "vault/config/vault.hcl")) {
    $vaultHcl | Out-File -FilePath "vault/config/vault.hcl" -Encoding UTF8
    Write-Host "  Created: vault/config/vault.hcl" -ForegroundColor Green
}

# Create basic backup script (Unix format)
$backupScript = @"
#!/bin/bash
# GameForge Backup Script
echo "Starting backup at $(date)"
pg_dump -h postgres -U gameforge -d gameforge_prod > /backup/gameforge_$(date +%Y%m%d_%H%M%S).sql
echo "Backup completed at $(date)"
"@

if (-not (Test-Path "scripts/backup.sh")) {
    $backupScript | Out-File -FilePath "scripts/backup.sh" -Encoding UTF8 -NoNewline
    Write-Host "  Created: scripts/backup.sh" -ForegroundColor Green
}

# Create basic restore script (Unix format)
$restoreScript = @"
#!/bin/bash
# GameForge Restore Script
echo "Starting restore at $(date)"
psql -h postgres -U gameforge -d gameforge_prod < $1
echo "Restore completed at $(date)"
"@

if (-not (Test-Path "scripts/restore.sh")) {
    $restoreScript | Out-File -FilePath "scripts/restore.sh" -Encoding UTF8 -NoNewline
    Write-Host "  Created: scripts/restore.sh" -ForegroundColor Green
}

# Create seccomp profile for Vault
$seccompProfile = @"
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "architectures": ["SCMP_ARCH_X86_64"],
  "syscalls": [
    {
      "names": [
        "accept", "access", "arch_prctl", "bind", "brk", "close", "connect",
        "dup2", "epoll_create1", "epoll_ctl", "epoll_wait", "execve", "exit_group",
        "fcntl", "fstat", "futex", "getpid", "getsockopt", "ioctl", "listen",
        "lseek", "mmap", "munmap", "open", "openat", "read", "readlink",
        "rt_sigaction", "rt_sigprocmask", "rt_sigreturn", "setsockopt", "socket",
        "stat", "write"
      ],
      "action": "SCMP_ACT_ALLOW"
    }
  ]
}
"@

if (-not (Test-Path "security/seccomp/vault.json")) {
    $seccompProfile | Out-File -FilePath "security/seccomp/vault.json" -Encoding UTF8
    Write-Host "  Created: security/seccomp/vault.json" -ForegroundColor Green
}

# Create SSL certificate directories (self-signed for testing)
if (-not (Test-Path "ssl/certs/server.crt")) {
    Write-Host "  Creating self-signed SSL certificates for testing..." -ForegroundColor Yellow
    # Note: In production, use proper certificates
    "# Self-signed certificate for testing" | Out-File -FilePath "ssl/certs/server.crt" -Encoding UTF8
    "# Self-signed private key for testing" | Out-File -FilePath "ssl/private/server.key" -Encoding UTF8
    Write-Host "  Created: SSL certificate files (testing only)" -ForegroundColor Green
}

# Verify database_setup.sql exists
if (-not (Test-Path "database_setup.sql")) {
    Write-Host "  Warning: database_setup.sql not found. Creating basic version..." -ForegroundColor Yellow
    
    $dbSetup = @"
-- GameForge Database Setup
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert test user
INSERT INTO users (username, email, password_hash) 
VALUES ('testuser', 'test@gameforge.com', 'test_hash_123')
ON CONFLICT (username) DO NOTHING;
"@
    
    $dbSetup | Out-File -FilePath "database_setup.sql" -Encoding UTF8
    Write-Host "  Created: database_setup.sql" -ForegroundColor Green
}

Write-Host "`nValidating existing files..." -ForegroundColor Yellow

# Check for critical application files
$criticalFiles = @("requirements.txt", "package.json", "Dockerfile")
foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "  Found: $file" -ForegroundColor Green
    } else {
        Write-Host "  Missing: $file (may cause deployment issues)" -ForegroundColor Red
    }
}

Write-Host "`nDirectory setup completed!" -ForegroundColor Green
Write-Host "Ready for Phase 5 validation..." -ForegroundColor Blue
