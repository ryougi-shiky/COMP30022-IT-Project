output "external_ip" {
  description = "External IP address of the VM instance"
  value       = google_compute_address.static.address
}

output "internal_ip" {
  description = "Internal IP address of the VM instance"
  value       = google_compute_instance.vm.network_interface[0].network_ip
}

output "instance_name" {
  description = "Name of the VM instance"
  value       = google_compute_instance.vm.name
}

output "instance_id" {
  description = "ID of the VM instance"
  value       = google_compute_instance.vm.id
}
