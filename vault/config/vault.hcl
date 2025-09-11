# Vault Configuration for GameForge
# Development mode configuration
backend "file" {
  path = "/vault/data"
}

listener "tcp" {
  address = "0.0.0.0:8200"
  tls_disable = true
}

ui = true
default_lease_ttl = "168h"
max_lease_ttl = "720h"
log_level = "INFO"
