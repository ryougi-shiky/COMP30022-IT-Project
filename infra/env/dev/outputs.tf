output "vm_external_ip" {
  description = "External IP address of the VM instance"
  value       = module.vm.external_ip
}

output "vm_internal_ip" {
  description = "Internal IP address of the VM instance"
  value       = module.vm.internal_ip
}

output "vm_name" {
  description = "Name of the VM instance"
  value       = module.vm.instance_name
}

output "network_name" {
  description = "Name of the VPC network"
  value       = module.network.network_name
}

output "subnet_name" {
  description = "Name of the subnet"
  value       = module.network.subnet_name
}
