#!/bin/bash
# GameForge Production Phase 4 - Secure Model Asset Management
# This script handles secure model fetching without baking weights into images

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔐 GameForge Phase 4 - Secure Model Asset Management${NC}"
echo "======================================================"

# Configuration from environment
MODEL_STORAGE_BACKEND=${MODEL_STORAGE_BACKEND:-"s3"}
VAULT_ADDR=${VAULT_ADDR:-"http://vault:8200"}
VAULT_NAMESPACE=${VAULT_NAMESPACE:-"gameforge"}
AWS_REGION=${AWS_REGION:-"us-east-1"}
MODEL_CACHE_DIR=${MODEL_CACHE_DIR:-"/tmp/models"}
SESSION_ID=$(uuidgen 2>/dev/null || date +%s)
SESSION_DIR="${MODEL_CACHE_DIR}/${SESSION_ID}"

# Create secure temporary directory
mkdir -p "${SESSION_DIR}"
chmod 700 "${SESSION_DIR}"

# Function to authenticate with Vault
authenticate_vault() {
    echo -e "${YELLOW}Authenticating with Vault...${NC}"
    
    # Try different authentication methods
    if [ -n "${VAULT_TOKEN:-}" ]; then
        # Token auth (development)
        export VAULT_TOKEN="${VAULT_TOKEN}"
        echo -e "${GREEN}✅ Using Vault token authentication${NC}"
    elif [ -n "${AWS_ROLE_ARN:-}" ]; then
        # AWS IAM auth (production)
        echo -e "${BLUE}Using AWS IAM authentication...${NC}"
        
        # Get AWS credentials from instance metadata or ECS task role
        AWS_CREDS=$(aws sts get-caller-identity)
        
        # Authenticate to Vault using AWS IAM
        VAULT_RESPONSE=$(curl -s -X POST \
            "${VAULT_ADDR}/v1/auth/aws/login" \
            -d "{
                \"role\": \"gameforge-model-fetcher\",
                \"iam_http_request_method\": \"POST\",
                \"iam_request_url\": \"sts:GetCallerIdentity\",
                \"iam_request_body\": \"${AWS_CREDS}\"
            }")
        
        export VAULT_TOKEN=$(echo "${VAULT_RESPONSE}" | jq -r '.auth.client_token')
        echo -e "${GREEN}✅ AWS IAM authentication successful${NC}"
    elif [ -n "${KUBERNETES_SERVICE_HOST:-}" ]; then
        # Kubernetes auth
        echo -e "${BLUE}Using Kubernetes authentication...${NC}"
        
        JWT=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
        VAULT_RESPONSE=$(curl -s -X POST \
            "${VAULT_ADDR}/v1/auth/kubernetes/login" \
            -d "{
                \"role\": \"gameforge-model-fetcher\",
                \"jwt\": \"${JWT}\"
            }")
        
        export VAULT_TOKEN=$(echo "${VAULT_RESPONSE}" | jq -r '.auth.client_token')
        echo -e "${GREEN}✅ Kubernetes authentication successful${NC}"
    else
        echo -e "${RED}❌ No valid authentication method available${NC}"
        exit 1
    fi
}

# Function to get model metadata and credentials from Vault
get_model_credentials() {
    local model_name="$1"
    
    echo -e "${YELLOW}Fetching model credentials for: ${model_name}${NC}"
    
    # Get model metadata from Vault
    MODEL_META=$(curl -s -H "X-Vault-Token: ${VAULT_TOKEN}" \
        "${VAULT_ADDR}/v1/${VAULT_NAMESPACE}/data/models/${model_name}")
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to fetch model metadata from Vault${NC}"
        exit 1
    fi
    
    # Extract S3 details and encryption key
    export MODEL_S3_BUCKET=$(echo "${MODEL_META}" | jq -r '.data.data.s3_bucket')
    export MODEL_S3_KEY=$(echo "${MODEL_META}" | jq -r '.data.data.s3_key')
    export MODEL_CHECKSUM=$(echo "${MODEL_META}" | jq -r '.data.data.checksum')
    export MODEL_ENCRYPTION_KEY=$(echo "${MODEL_META}" | jq -r '.data.data.encryption_key')
    export MODEL_SIZE=$(echo "${MODEL_META}" | jq -r '.data.data.size_bytes')
    
    # Get temporary AWS credentials for S3 access
    AWS_CREDS=$(curl -s -H "X-Vault-Token: ${VAULT_TOKEN}" \
        -X GET "${VAULT_ADDR}/v1/aws/creds/gameforge-model-reader")
    
    export AWS_ACCESS_KEY_ID=$(echo "${AWS_CREDS}" | jq -r '.data.access_key')
    export AWS_SECRET_ACCESS_KEY=$(echo "${AWS_CREDS}" | jq -r '.data.secret_key')
    export AWS_SESSION_TOKEN=$(echo "${AWS_CREDS}" | jq -r '.data.security_token // empty')
    
    echo -e "${GREEN}✅ Retrieved model credentials and metadata${NC}"
}

# Function to download and decrypt model
download_model() {
    local model_name="$1"
    local target_path="${SESSION_DIR}/${model_name}"
    
    echo -e "${YELLOW}Downloading model: ${model_name}${NC}"
    echo -e "  Size: $(numfmt --to=iec ${MODEL_SIZE} 2>/dev/null || echo ${MODEL_SIZE} bytes)"
    echo -e "  Target: ${target_path}"
    
    # Create checksum file
    echo "${MODEL_CHECKSUM}  ${target_path}" > "${SESSION_DIR}/checksum.txt"
    
    # Download encrypted model from S3
    if [ "${MODEL_STORAGE_BACKEND}" = "s3" ]; then
        # Generate presigned URL for secure download
        PRESIGNED_URL=$(aws s3 presign \
            "s3://${MODEL_S3_BUCKET}/${MODEL_S3_KEY}" \
            --expires-in 300 \
            --region "${AWS_REGION}")
        
        # Download with progress
        curl -L --progress-bar \
            -H "x-amz-server-side-encryption-customer-algorithm: AES256" \
            -H "x-amz-server-side-encryption-customer-key: ${MODEL_ENCRYPTION_KEY}" \
            -o "${target_path}.enc" \
            "${PRESIGNED_URL}"
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ Failed to download model from S3${NC}"
            exit 1
        fi
        
        # Decrypt model
        echo -e "${YELLOW}Decrypting model...${NC}"
        openssl enc -aes-256-cbc \
            -d \
            -in "${target_path}.enc" \
            -out "${target_path}" \
            -pass "pass:${MODEL_ENCRYPTION_KEY}" \
            -pbkdf2
        
        # Remove encrypted file
        shred -vfz "${target_path}.enc" 2>/dev/null || rm -f "${target_path}.enc"
        
    elif [ "${MODEL_STORAGE_BACKEND}" = "azure" ]; then
        # Azure Blob Storage implementation
        echo -e "${BLUE}Downloading from Azure Blob Storage...${NC}"
        # Implementation for Azure
    elif [ "${MODEL_STORAGE_BACKEND}" = "gcs" ]; then
        # Google Cloud Storage implementation
        echo -e "${BLUE}Downloading from Google Cloud Storage...${NC}"
        # Implementation for GCS
    fi
    
    # Verify checksum
    echo -e "${YELLOW}Verifying model integrity...${NC}"
    if sha256sum -c "${SESSION_DIR}/checksum.txt" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Model checksum verified${NC}"
    else
        echo -e "${RED}❌ Model checksum verification failed!${NC}"
        shred -vfz "${target_path}" 2>/dev/null || rm -f "${target_path}"
        exit 1
    fi
    
    # Set restrictive permissions
    chmod 600 "${target_path}"
    
    echo -e "${GREEN}✅ Model downloaded and verified: ${model_name}${NC}"
}

# Function to setup model symlinks
setup_model_links() {
    local model_name="$1"
    local model_path="${SESSION_DIR}/${model_name}"
    local link_path="/app/models/${model_name}"
    
    # Create models directory if it doesn't exist
    mkdir -p /app/models
    
    # Create symlink to session model
    ln -sf "${model_path}" "${link_path}"
    
    echo -e "${GREEN}✅ Model linked: ${link_path} -> ${model_path}${NC}"
}

# Function to cleanup old model sessions
cleanup_old_sessions() {
    echo -e "${YELLOW}Cleaning up old model sessions...${NC}"
    
    # Find and remove sessions older than 1 hour
    find "${MODEL_CACHE_DIR}" -maxdepth 1 -type d -mmin +60 -exec rm -rf {} \; 2>/dev/null || true
    
    # Clear memory cache if needed
    if [ -f /proc/sys/vm/drop_caches ]; then
        echo 1 > /proc/sys/vm/drop_caches 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Function to monitor model usage
monitor_model_memory() {
    local model_path="$1"
    
    if [ -f "${model_path}" ]; then
        local size=$(stat -c%s "${model_path}")
        local size_human=$(numfmt --to=iec ${size})
        
        echo -e "${BLUE}Model memory usage:${NC}"
        echo -e "  File size: ${size_human}"
        echo -e "  Loaded in: ${SESSION_DIR}"
        
        # Check if model is loaded in GPU memory
        if command -v nvidia-smi &> /dev/null; then
            echo -e "  GPU memory: $(nvidia-smi --query-gpu=memory.used --format=csv,noheader,nounits) MiB"
        fi
    fi
}

# Main execution
main() {
    echo -e "${BLUE}Starting secure model asset management...${NC}"
    
    # Cleanup old sessions first
    cleanup_old_sessions
    
    # Authenticate with Vault
    authenticate_vault
    
    # Get list of required models
    REQUIRED_MODELS=${REQUIRED_MODELS:-"model.safetensors"}
    
    # Process each model
    for model in ${REQUIRED_MODELS}; do
        echo -e "\n${BLUE}Processing model: ${model}${NC}"
        
        # Get credentials and metadata
        get_model_credentials "${model}"
        
        # Download and decrypt
        download_model "${model}"
        
        # Setup symlinks
        setup_model_links "${model}"
        
        # Monitor memory
        monitor_model_memory "${SESSION_DIR}/${model}"
    done
    
    echo -e "\n${GREEN}✅ All models loaded successfully${NC}"
    echo -e "Session ID: ${SESSION_ID}"
    echo -e "Models directory: ${SESSION_DIR}"
    
    # Export for application use
    export GAMEFORGE_MODEL_SESSION="${SESSION_ID}"
    export GAMEFORGE_MODEL_DIR="${SESSION_DIR}"
    
    # Execute the main application
    echo -e "\n${BLUE}Starting GameForge application...${NC}"
    exec "$@"
}

# Trap to cleanup on exit
trap 'echo -e "${YELLOW}Cleaning up model session...${NC}"; rm -rf "${SESSION_DIR}"' EXIT

# Run main function with all arguments
main "$@"
