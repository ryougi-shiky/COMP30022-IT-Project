# GCP Deployment Guide

## 🚀 Quick Start

### Prerequisites
- GCP Account with billing enabled
- Docker images pushed to Docker Hub:
  - `ryougishiky/forum-nginx` (Frontend)
  - `ryougishiky/forum-backend` (Backend) 
  - `ryougishiky/forum-mongodb` (Database)

### 1. Setup GCP CLI
```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Authenticate
gcloud auth login
gcloud auth application-default login

# Set project
gcloud config set project YOUR_PROJECT_ID
```

### 2. Configure Terraform
```bash
# Edit terraform.tfvars
cd terraform
vim terraform.tfvars
```

Replace `your-gcp-project-id` with your actual GCP project ID.

### 3. Deploy
```bash
./deploy-gcp.sh
```

## 📋 Architecture

- **Frontend**: React app served by Nginx (Public IP)
- **Backend**: Node.js API server (Internal IP)
- **Database**: MongoDB (Internal IP)

## 💰 Cost Estimate
- 3 x e2-small instances: ~$35/month
- Network egress: Variable

## 🔧 Troubleshooting

### Check instance logs:
```bash
gcloud compute ssh forum-frontend --zone=us-central1-a
sudo docker logs frontend
```

### Restart services:
```bash
sudo docker restart frontend
sudo docker restart backend
sudo docker restart mongodb
```

## 🧹 Cleanup
```bash
terraform destroy
````

# GCP Deployment Guide with Docker

## 🐳 Terraform Docker Environment

This deployment uses Terraform Docker image to ensure consistent environment across different machines.

### Prerequisites
- Docker installed and running
- GCP Account with billing enabled
- Docker images pushed to Docker Hub:
  - `ryougishiky/forum-nginx` (Frontend)
  - `ryougishiky/forum-backend` (Backend) 
  - `ryougishiky/forum-mongodb` (Database)

### 1. Setup GCP CLI
```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Authenticate (required for Docker containers to access GCP)
gcloud auth login
gcloud auth application-default login

# Set project
gcloud config set project YOUR_PROJECT_ID
```

### 2. Configure Terraform
```bash
# Edit terraform.tfvars
cd terraform
vim terraform.tfvars
```

Replace `your-gcp-project-id` with your actual GCP project ID.

### 3. Deploy Options

**Option A: Using the tf.sh tool (Recommended)**
```bash
./tf.sh deploy    # One-command deployment
# OR step by step:
./tf.sh plan      # Check plan
./tf.sh apply     # Apply if plan looks good
```

**Option B: Individual scripts**
```bash
./plan.sh         # Check plan for errors
./apply.sh        # Apply if plan is successful
# OR
./deploy.sh       # Runs plan then apply automatically
```

## 🛠️ tf.sh Tool Commands

The `tf.sh` script provides convenient shortcuts for common operations:

```bash
./tf.sh plan      # Run terraform plan
./tf.sh apply     # Apply terraform plan  
./tf.sh deploy    # Run plan then apply
./tf.sh destroy   # Destroy infrastructure
./tf.sh output    # Show deployment outputs
./tf.sh state     # Show terraform state
./tf.sh version   # Show terraform version
./tf.sh shell     # Open interactive terraform container
```

## 🐳 Docker Terraform Benefits

- **Consistent Environment**: Same Terraform version across all machines
- **No Local Installation**: No need to install Terraform locally
- **Isolated Dependencies**: Clean environment without conflicts
- **Version Control**: Easy to update Terraform version in one place
- **Colorized Output**: Enhanced readability with color-coded messages

## 📋 Architecture

- **Frontend**: React app served by Nginx (Public IP)
- **Backend**: Node.js API server (Internal IP)
- **Database**: MongoDB (Internal IP)

## 💰 Cost Estimate
- 3 x e2-small instances: ~$35/month
- Network egress: Variable

## 🔧 Troubleshooting

### Manual Terraform commands:
```bash
# Source the shared functions
source common.sh

# Run any terraform command
run_terraform version
run_terraform state list
run_terraform show
```

### Check instance logs:
```bash
gcloud compute ssh forum-frontend --zone=us-central1-a
sudo docker logs frontend
```

### Restart services:
```bash
sudo docker restart frontend
sudo docker restart backend
sudo docker restart mongodb
```

## 🧹 Cleanup
```bash
./tf.sh destroy
# OR
./destroy.sh
```

## 📦 Configuration Files

- `common.sh` - Shared configuration and functions
- `main.tf` - Terraform infrastructure definition
- `terraform.tfvars` - Variable values
- `scripts/` - Instance initialization scripts

## 🎨 Features

- **Color-coded output** for better readability
- **Shared functions** to eliminate code duplication
- **Pre-flight checks** for configuration and authentication
- **Safe error handling** with proper exit codes
- **Interactive confirmations** before destructive operations
