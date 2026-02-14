#!/bin/bash

# deploy.sh - Deploys the application to the VM via SSH

set -e

echo "🚀 Starting Deployment..."

# 1. Get VM IP from Terraform
VM_IP=$(terraform -chdir=infra output -raw vm_ip)
SSH_USER="ubuntu"
REPO_PATH="~/live-calling"

if [ -z "$VM_IP" ]; then
  echo "❌ Error: Could not retrieve VM IP from Terraform outputs."
  exit 1
fi

echo "📍 Target VM: $VM_IP"

# 2. Perform SSH Deployment
# We assume the SSH key is already configured in the environment (e.g., via GitHub Actions)
ssh -o StrictHostKeyChecking=no "$SSH_USER@$VM_IP" << EOF
  set -e
  
  # Clone or update the repository
  if [ ! -d "$REPO_PATH" ]; then
    echo "📥 Cloning repository..."
    git clone https://github.com/pappukrs/Realtime-vedio-call.git "$REPO_PATH"
  fi

  cd "$REPO_PATH"
  echo "📥 Pulling latest changes..."
  git pull origin main

  echo "🐳 Starting Docker Compose..."
  docker-compose up -d --build

  echo "🧹 Cleaning up old Docker resources..."
  docker system prune -f

  echo "🏥 Performing Health Checks..."
  # Wait a bit for services to start
  sleep 10
  
  # Check UI (Next.js)
  if curl -s --head http://localhost:3000 | grep "200 OK" > /dev/null; then
    echo "✅ UI is healthy"
  else
    echo "❌ UI Health Check Failed"
    exit 1
  fi

  # Check API Gateway
  if curl -s http://localhost:4000/health | grep "OK" > /dev/null; then
    echo "✅ API Gateway is healthy"
  else
    echo "⚠️ API Gateway Health Check Failed (or /health endpoint missing)"
  fi
EOF

echo "✨ Deployment Completed Successfully!"
