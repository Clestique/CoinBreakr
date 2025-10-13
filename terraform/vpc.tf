# VPC Network
resource "google_compute_network" "vpc_network" {
  name                    = "cheap-vpc"
  auto_create_subnetworks = true
}

# Allow SSH
resource "google_compute_firewall" "allow_ssh" {
  name    = "allow-ssh"
  network = google_compute_network.vpc_network.name

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["cheap-instance"]
}

# Allow Node app on port 3000
resource "google_compute_firewall" "allow_node_app" {
  name    = "allow-node-app"
  network = google_compute_network.vpc_network.name # Fixed to use existing VPC

  allow {
    protocol = "tcp"
    ports    = ["3000"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["cheap-instance"] # Must match the VM tag
}


# Get the latest Coinbreakr image
data "google_compute_image" "latest_coinbreakr" {
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
      image = data.google_compute_image.latest_coinbreakr.self_link
      size  = 10
      type  = "pd-balanced"
    }
  }

  network_interface {
    network = google_compute_network.vpc_network.id
    access_config {} # External IP
  }

  metadata = {
    ssh-keys = "${var.ssh_user}:${file(var.ssh_public_key_path)}"
  }

  tags = ["cheap-instance"] # Must match firewall target_tags
}
