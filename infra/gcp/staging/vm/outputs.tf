output "vm_external_ip" {
  description = "VM external IP address"
  value       = google_compute_address.vm_ip.address
}

output "vm_name" {
  description = "VM instance name"
  value       = google_compute_instance.vm.name
}

output "app_url" {
  description = "App Access URL"
  value       = "http://${google_compute_address.vm_ip.address}:3000"
}

output "ssh_command" {
  description = "SSH connection command"
  value       = "gcloud compute ssh ${google_compute_instance.vm.name} --zone=${var.zone}"
}
