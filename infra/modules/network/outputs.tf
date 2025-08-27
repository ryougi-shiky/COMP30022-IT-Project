output "network_self_link" { value = google_compute_network.vpc.self_link }
output "subnet_self_link" { value = google_compute_subnetwork.subnet.self_link }
output "web_tag" { value = var.web_tag }

output "network_name" {
  description = "Name of the VPC network"
  value       = google_compute_network.vpc.name
}

output "subnet_name" {
  description = "Name of the subnet"
  value       = google_compute_subnetwork.subnet.name
}
