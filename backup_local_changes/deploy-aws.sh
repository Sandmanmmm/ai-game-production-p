#!/bin/bash

# GameForge SDXL Service AWS Deployment Script
# Phase A: Infrastructure Setup

set -e

# Configuration
REGION="us-east-1"
BUCKET_NAME="gameforge-models"
ECR_REPO="gameforge/sdxl-worker"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting GameForge SDXL AWS Deployment - Phase A${NC}"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS CLI not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ AWS Account ID: ${AWS_ACCOUNT_ID}${NC}"

# Step 1: Create S3 Bucket for Model Storage
echo -e "${YELLOW}📦 Creating S3 bucket for model storage...${NC}"
if aws s3api head-bucket --bucket ${BUCKET_NAME} 2>/dev/null; then
    echo -e "${GREEN}✅ S3 bucket ${BUCKET_NAME} already exists${NC}"
else
    if [ "${REGION}" = "us-east-1" ]; then
        aws s3api create-bucket --bucket ${BUCKET_NAME} --region ${REGION}
    else
        aws s3api create-bucket --bucket ${BUCKET_NAME} --region ${REGION} --create-bucket-configuration LocationConstraint=${REGION}
    fi
    
    # Enable versioning
    aws s3api put-bucket-versioning --bucket ${BUCKET_NAME} --versioning-configuration Status=Enabled
    
    # Set bucket policy for secure access
    cat > /tmp/bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "GameForgeModelAccess",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::${AWS_ACCOUNT_ID}:root"
            },
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::${BUCKET_NAME}",
                "arn:aws:s3:::${BUCKET_NAME}/*"
            ]
        }
    ]
}
EOF
    
    aws s3api put-bucket-policy --bucket ${BUCKET_NAME} --policy file:///tmp/bucket-policy.json
    rm /tmp/bucket-policy.json
    
    echo -e "${GREEN}✅ S3 bucket ${BUCKET_NAME} created successfully${NC}"
fi

# Step 2: Create ECR Repository
echo -e "${YELLOW}🐳 Creating ECR repository...${NC}"
if aws ecr describe-repositories --repository-names ${ECR_REPO} --region ${REGION} > /dev/null 2>&1; then
    echo -e "${GREEN}✅ ECR repository ${ECR_REPO} already exists${NC}"
else
    aws ecr create-repository --repository-name ${ECR_REPO} --region ${REGION}
    echo -e "${GREEN}✅ ECR repository ${ECR_REPO} created successfully${NC}"
fi

# Step 3: Build and Push Docker Image
echo -e "${YELLOW}🔨 Building Docker image...${NC}"
docker build -t gameforge-sdxl:latest .

# Authenticate Docker to ECR
echo -e "${YELLOW}🔐 Authenticating Docker to ECR...${NC}"
aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com

# Tag and push image
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPO}:latest"
echo -e "${YELLOW}🏷️ Tagging image: ${ECR_URI}${NC}"
docker tag gameforge-sdxl:latest ${ECR_URI}

echo -e "${YELLOW}📤 Pushing image to ECR...${NC}"
docker push ${ECR_URI}

echo -e "${GREEN}✅ Docker image pushed successfully${NC}"
echo -e "${GREEN}📍 ECR Image URI: ${ECR_URI}${NC}"

# Step 4: Create IAM Role for ECS Task
echo -e "${YELLOW}👤 Creating IAM role for ECS task...${NC}"
ROLE_NAME="GameForgeSDXLTaskRole"

# Create trust policy
cat > /tmp/trust-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "ecs-tasks.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF

# Create execution role trust policy
cat > /tmp/execution-trust-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "ecs-tasks.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF

# Create task role if it doesn't exist
if ! aws iam get-role --role-name ${ROLE_NAME} > /dev/null 2>&1; then
    aws iam create-role --role-name ${ROLE_NAME} --assume-role-policy-document file:///tmp/trust-policy.json
    echo -e "${GREEN}✅ IAM role ${ROLE_NAME} created${NC}"
else
    echo -e "${GREEN}✅ IAM role ${ROLE_NAME} already exists${NC}"
fi

# Create execution role
EXECUTION_ROLE_NAME="GameForgeSDXLExecutionRole"
if ! aws iam get-role --role-name ${EXECUTION_ROLE_NAME} > /dev/null 2>&1; then
    aws iam create-role --role-name ${EXECUTION_ROLE_NAME} --assume-role-policy-document file:///tmp/execution-trust-policy.json
    aws iam attach-role-policy --role-name ${EXECUTION_ROLE_NAME} --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
    echo -e "${GREEN}✅ IAM execution role ${EXECUTION_ROLE_NAME} created${NC}"
else
    echo -e "${GREEN}✅ IAM execution role ${EXECUTION_ROLE_NAME} already exists${NC}"
fi

# Create custom policy for S3 and ECR access
POLICY_NAME="GameForgeSDXLPolicy"
cat > /tmp/sdxl-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::${BUCKET_NAME}",
                "arn:aws:s3:::${BUCKET_NAME}/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "*"
        }
    ]
}
EOF

# Create and attach policy
if ! aws iam get-policy --policy-arn arn:aws:iam::${AWS_ACCOUNT_ID}:policy/${POLICY_NAME} > /dev/null 2>&1; then
    aws iam create-policy --policy-name ${POLICY_NAME} --policy-document file:///tmp/sdxl-policy.json
    echo -e "${GREEN}✅ IAM policy ${POLICY_NAME} created${NC}"
else
    echo -e "${GREEN}✅ IAM policy ${POLICY_NAME} already exists${NC}"
fi

aws iam attach-role-policy --role-name ${ROLE_NAME} --policy-arn arn:aws:iam::${AWS_ACCOUNT_ID}:policy/${POLICY_NAME}

# Cleanup temp files
rm -f /tmp/trust-policy.json /tmp/execution-trust-policy.json /tmp/sdxl-policy.json

echo -e "${GREEN}🎉 Phase A deployment completed successfully!${NC}"
echo -e "${GREEN}📋 Summary:${NC}"
echo -e "  • S3 Bucket: ${BUCKET_NAME}"
echo -e "  • ECR Repository: ${ECR_REPO}"
echo -e "  • Docker Image: ${ECR_URI}"
echo -e "  • IAM Task Role: ${ROLE_NAME}"
echo -e "  • IAM Execution Role: ${EXECUTION_ROLE_NAME}"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo -e "  1. Upload SDXL model files to S3: s3://${BUCKET_NAME}/sdxl-base/"
echo -e "  2. Create ECS cluster and task definition"
echo -e "  3. Deploy service to ECS with GPU instances"
