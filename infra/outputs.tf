output "vm_ip" {
  description = "The public IP address of the VM instance"
  value       = google_compute_address.static_ip.address
}

output "ssh_command" {
  description = "Command to SSH into the VM"
  value       = "ssh ubuntu@${google_compute_address.static_ip.address}"
}
