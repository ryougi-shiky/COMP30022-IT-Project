# COMP30022 GCP Infrastructure

This terraform configuration will deploy the app to a GCP VM instance.

## Resources Created

- **VM instance**: Ubuntu 22.04 LTS, e2-small
- **Static External IP**: For accessing from the internet
- **Firewall RUle**: Allow SSH (22) and app (3000) ports
- **App**: Express.js app running on port 3000

## Deploy from local machine

### 1. Install and authorise gcloud CLI

macOS:
```bash
# Install gcloud CLI
brew install google-cloud-sdk

gcloud auth login
gcloud auth application-default login

gcloud config set project <project-id>
```

### 2. Deploy infrastructure

```bash
cd infra
../auto/run-terraform init
../auto/run-terraform plan
../auto/run-terraform apply
```

### 3. Access the app

After deployment, you can access the app using the VM's external IP.

```bash
# Get VM external IP
terraform output vm_external_ip
```

## Deploy from GitHub Actions CI/CD

This deployment is integrated with GitHub workflow. You only need to set up these secrets in your GitHub repository.

### Required GitHub Secrets

- `GCP_PROJECT_ID_STAGING`
- `GCP_PROJECT_NUMBER_STAGING`
- `GCP_WORKLOAD_IDENTITY_PROVIDER_POOL_ID`
- `GCP_WORKLOAD_IDENTITY_PROVIDER_POOL_PROVIDER_ID`
- `GCP_TERRAFORM_SERVICE_ACCOUNT_STAGING`

## Delete Resources

```bash
# 删除所有创建的资源
cd infra
../auto/run-terraform destroy
```
