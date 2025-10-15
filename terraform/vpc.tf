# VPC Network
data "google_compute_network" "vpc_network" {
  name = "coinbreakr-network"
}

data "google_compute_firewall" "allow_ssh" {
  name = "allow-ssh"
}

data "google_compute_firewall" "allow_node_app" {
  name = "allow-node-app"
}

# Get the latest Coinbreakr image
data "google_compute_image" "latest_coinbreakr_staging" {
  family  = var.image_family
  project = var.project_id
}

# VM Instance
resource "google_compute_instance" "vm_instance" {
  name         = var.instance_name
  machine_type = var.machine_type
  zone         = var.zone

  boot_disk {
    initialize_params {
      image = data.google_compute_image.latest_coinbreakr_staging.self_link
      size  = 10
      type  = "pd-balanced"
    }
  }

  network_interface {
    network = data.google_compute_network.vpc_network.id
    access_config {}
  }

  tags = ["coinbreakr-network"]
}

# Outputs
output "instance_name" {
  description = "Name of the created instance"
  value       = google_compute_instance.vm_instance.name
}

output "instance_external_ip" {
  description = "External IP address of the instance"
  value       = google_compute_instance.vm_instance.network_interface[0].access_config[0].nat_ip
}
