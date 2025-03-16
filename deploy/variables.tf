variable "do_token" {
  description = "DigitalOcean API Token"
  sensitive   = true
}

variable "ssh_public_key_path" {
  description = "Path to SSH public key"
  default     = "~/.ssh/id_rsa.pub"
}

variable "mongodb_uri" {
  description = "MongoDB Atlas Connection URI"
  sensitive   = true
} 
