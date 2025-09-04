# COMP30022 GCP Infrastructure

这个 Terraform 配置用于在 Google Cloud Platform 上部署一个简单的 VM 实例。

## 部署的资源

- **VM 实例**: Ubuntu 22.04 LTS, e2-medium
- **静态外部 IP**: 用于稳定的访问地址
- **防火墙规则**: 允许 SSH (22) 和应用端口 (3000)
- **自动部署的应用**: 简单的 Express.js 应用运行在端口 3000

## 本地开发使用

### 1. 安装和认证 gcloud CLI

```bash
# 安装 gcloud CLI (如果还没有安装)
# macOS:
brew install google-cloud-sdk

# 登录并设置认证
gcloud auth login
gcloud auth application-default login

# 设置默认项目
gcloud config set project aniani-staging
```

### 2. 部署基础设施

```bash
# 初始化 Terraform
cd infra
../auto/run-terraform init

# 查看部署计划
../auto/run-terraform plan

# 应用配置
../auto/run-terraform apply

# 查看输出信息
../auto/run-terraform output
```

### 3. 访问应用

部署完成后，你可以通过以下方式访问：

```bash
# 获取 VM 的外部 IP
terraform output vm_external_ip

# 访问应用
curl http://[VM_IP]:3000

# SSH 连接到 VM
gcloud compute ssh comp30022-vm --zone=us-central1-a
```

## GitHub Actions CI/CD

这个配置已经集成了 GitHub Actions，当你推送代码到任何分支时会自动部署。

### 需要的 GitHub Secrets

- `GCP_PROJECT_ID_STAGING`
- `GCP_PROJECT_NUMBER_STAGING`
- `GCP_WORKLOAD_IDENTITY_PROVIDER_POOL_ID`
- `GCP_WORKLOAD_IDENTITY_PROVIDER_POOL_PROVIDER_ID`
- `GCP_TERRAFORM_SERVICE_ACCOUNT_STAGING`

## 文件结构

```
infra/
├── main.tf           # 主要的资源定义
├── variables.tf      # 变量定义
├── outputs.tf        # 输出定义
├── terraform.tfvars  # 变量值
└── README.md         # 这个文件
```

## 故障排除

### 认证问题

如果遇到认证错误，请确保：

1. 已正确安装和配置 gcloud CLI
2. 已运行 `gcloud auth application-default login`
3. 项目 ID 在 `terraform.tfvars` 中设置正确

### 权限问题

确保你的 GCP 账户有以下权限：
- Compute Admin
- Security Admin (用于防火墙规则)
- Service Account User

## 清理资源

```bash
# 删除所有创建的资源
cd infra
../auto/run-terraform destroy
```
