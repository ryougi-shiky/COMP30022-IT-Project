output "vm_external_ip" {
  description = "VM 的外部 IP 地址"
  value       = google_compute_address.vm_ip.address
}

output "vm_name" {
  description = "VM 实例名称"
  value       = google_compute_instance.vm.name
}

output "app_url" {
  description = "应用访问地址"
  value       = "http://${google_compute_address.vm_ip.address}:3000"
}

output "ssh_command" {
  description = "SSH 连接命令"
  value       = "gcloud compute ssh ${google_compute_instance.vm.name} --zone=${var.zone}"
}
