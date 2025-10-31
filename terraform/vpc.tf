# VPC Network
resource "google_compute_network" "vpc_network" {
  name                    = "${var.environment}-coinbreakr-vpc"
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
}

# Public Subnets
resource "google_compute_subnetwork" "public_subnets" {
  count         = 3
  name          = "${var.environment}-public-subnet-${count.index + 1}"
  ip_cidr_range = var.public_subnet_cidrs[count.index]
  region        = var.region
  network       = google_compute_network.vpc_network.id
}

# Private Subnets
resource "google_compute_subnetwork" "private_subnets" {
  count         = 3
  name          = "${var.environment}-private-subnet-${count.index + 1}"
  ip_cidr_range = var.private_subnet_cidrs[count.index]
  region        = var.region
  network       = google_compute_network.vpc_network.id
}

# Internet Gateway (Router for external access)
resource "google_compute_router" "router" {
  name    = "${var.environment}-router"
  region  = var.region
  network = google_compute_network.vpc_network.id
}

# Firewall Rules for SSH, HTTP, HTTPS, and port 3000
resource "google_compute_firewall" "allow_ssh" {
  name    = "${var.environment}-allow-ssh"
  network = google_compute_network.vpc_network.name

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["coinbreakr-vm"]
}

resource "google_compute_firewall" "allow_http" {
  name    = "${var.environment}-allow-http"
  network = google_compute_network.vpc_network.name

  allow {
    protocol = "tcp"
    ports    = ["80"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["coinbreakr-vm"]
}

resource "google_compute_firewall" "allow_https" {
  name    = "${var.environment}-allow-https"
  network = google_compute_network.vpc_network.name

  allow {
    protocol = "tcp"
    ports    = ["443"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["coinbreakr-vm"]
}

resource "google_compute_firewall" "allow_app_port" {
  name    = "${var.environment}-allow-app-port"
  network = google_compute_network.vpc_network.name

  allow {
    protocol = "tcp"
    ports    = ["3000"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["coinbreakr-vm"]
}

# Get the latest Coinbreakr image
data "google_compute_image" "latest_coinbreakr" {
  family  = var.image_family
  project = var.project_id
}

# VM Instance in public subnet
resource "google_compute_instance" "vm_instance" {
  name         = var.instance_name
  machine_type = var.machine_type
  zone         = var.zones[0]

  boot_disk {
    initialize_params {
      image = data.google_compute_image.latest_coinbreakr.self_link
      size  = 20
      type  = "pd-balanced"
    }
  }

  network_interface {
    subnetwork = google_compute_subnetwork.public_subnets[0].id
    access_config {
      # Ephemeral external IP
    }
  }

  tags = ["coinbreakr-vm"]

  metadata = {
    environment = var.environment
  }

  service_account {
    scopes = ["cloud-platform"]
  }
}

# Outputs
output "vpc_network_name" {
  description = "Name of the VPC network"
  value       = google_compute_network.vpc_network.name
}

output "public_subnet_names" {
  description = "Names of the public subnets"
  value       = google_compute_subnetwork.public_subnets[*].name
}

output "private_subnet_names" {
  description = "Names of the private subnets"
  value       = google_compute_subnetwork.private_subnets[*].name
}

output "instance_name" {
  description = "Name of the created instance"
  value       = google_compute_instance.vm_instance.name
}

output "instance_external_ip" {
  description = "External IP address of the instance"
  value       = google_compute_instance.vm_instance.network_interface[0].access_config[0].nat_ip
}

output "instance_internal_ip" {
  description = "Internal IP address of the instance"
  value       = google_compute_instance.vm_instance.network_interface[0].network_ip
}
