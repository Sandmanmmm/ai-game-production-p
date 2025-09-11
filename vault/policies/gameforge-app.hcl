# GameForge Model Access Policy
path "gameforge/models/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "gameforge/secrets/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "sys/health" {
  capabilities = ["read"]
}

path "sys/capabilities-self" {
  capabilities = ["update"]
}
