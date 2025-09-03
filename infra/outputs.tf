output "instance_ip" {
  description = "External IP address of the VM instance"
  value       = google_compute_address.static_ip.address
}

output "instance_name" {
  description = "Name of the VM instance"
  value       = google_compute_instance.app_server.name
}

output "instance_zone" {
  description = "Zone of the VM instance"
  value       = google_compute_instance.app_server.zone
}
