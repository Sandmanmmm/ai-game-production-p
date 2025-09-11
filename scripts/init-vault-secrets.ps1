# Initialize Vault with test secrets for rotation demo
Write-Host "🔐 Initializing Vault with test secrets..." -ForegroundColor Blue

# Set environment
$env:VAULT_ADDR = "http://localhost:8200"
$env:VAULT_TOKEN = "gameforge-vault-root-token-2025"

# Enable KV secrets engine
Write-Host "Enabling KV secrets engine..." -ForegroundColor Cyan
docker exec vault-dev vault secrets enable -path=gameforge kv-v2

# Create gameforge-app policy
Write-Host "Creating gameforge-app policy..." -ForegroundColor Cyan
$policy = @'
path "gameforge/data/models/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "gameforge/data/secrets/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "gameforge/data/workers/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "sys/health" {
  capabilities = ["read"]
}
'@
$policy | docker exec -i vault-dev vault policy write gameforge-app -

# Create initial model secrets
Write-Host "Creating initial model secrets..." -ForegroundColor Cyan
docker exec vault-dev vault kv put gameforge/models/huggingface token="hf_initial_test_token_12345" created_at="$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC')"
docker exec vault-dev vault kv put gameforge/models/openai api_key="sk-initial_openai_key_67890" created_at="$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC')"
docker exec vault-dev vault kv put gameforge/models/stability api_key="sk-initial_stability_key_abcde" created_at="$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC')"

# Create initial application secrets
Write-Host "Creating initial application secrets..." -ForegroundColor Cyan
docker exec vault-dev vault kv put gameforge/secrets/jwt secret="initial_jwt_secret_for_testing" created_at="$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC')"
docker exec vault-dev vault kv put gameforge/secrets/database password="initial_db_password_123" created_at="$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC')"

# Create initial worker tokens
Write-Host "Creating initial worker tokens..." -ForegroundColor Cyan
$workerToken1 = docker exec vault-dev vault token create -policy=gameforge-app -format=json | ConvertFrom-Json | Select-Object -ExpandProperty auth | Select-Object -ExpandProperty client_token
$workerToken2 = docker exec vault-dev vault token create -policy=gameforge-app -format=json | ConvertFrom-Json | Select-Object -ExpandProperty auth | Select-Object -ExpandProperty client_token

docker exec vault-dev vault kv put gameforge/workers/tokens worker_1="$workerToken1" worker_2="$workerToken2" created_at="$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC')"

Write-Host "✅ Vault initialization completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 Test secret retrieval:" -ForegroundColor Yellow
docker exec vault-dev vault kv get gameforge/models/huggingface
