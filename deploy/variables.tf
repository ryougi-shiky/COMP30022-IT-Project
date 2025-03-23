variable "do_token" {
  description = "DigitalOcean API Token"
  sensitive   = true
}

# variable "cloudflare_api_token" {
#   description = "Cloudflare API Token"
#   sensitive   = true
# }

# variable "domain_name" {
#   description = "Your domain name"
#   type        = string
# }

variable "ssh_public_key_path" {
  description = "Path to SSH public key"
  default     = "~/.ssh/terraform_id_rsa.pub"
}

variable "mongodb_uri" {
  description = "MongoDB Atlas Connection URI"
  sensitive   = true
}
