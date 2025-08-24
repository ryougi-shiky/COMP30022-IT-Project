variable "name" { type = string }
variable "project_id" { type = string }
variable "region" { type = string }
variable "cidr" { type = string }
variable "web_source_ranges" { type = list(string) default = ["0.0.0.0/0"] }
variable "ssh_source_ranges" { type = list(string) }
variable "web_tag" { type = string default = "web" }
