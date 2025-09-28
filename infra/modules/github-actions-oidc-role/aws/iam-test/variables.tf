variable "aws_account_id" {
  description = "AWS Account ID where the role will be created"
  type        = string
}

variable "github_owner" {
  description = "GitHub organization or username"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
}

variable "github_branch" {
  description = "GitHub branch that can assume this role"
  type        = string
  default     = "deploy-app-staging"
}

variable "role_name" {
  description = "Name of the IAM role for GitHub Actions"
  type        = string
  default     = "GitHubActionsTerraformRole"
}
