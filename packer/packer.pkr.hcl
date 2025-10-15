packer {
  required_plugins {
    googlecompute = {
      version = ">= 1.1.0, < 2.0.0"
      source  = "github.com/hashicorp/googlecompute"
    }
  }
}

variable "project_id" {
  type        = string
  description = "The GCP project ID where the image will be created."
}

variable "zone" {
  type        = string
  description = "The GCP zone where the image will be created."
}

variable "image_name" {
  type        = string
  description = "The name of the image to be created."
}

variable "image_family" {
  type        = string
  description = "The image family to use for the new image."
}

variable "source_image_family" {
  type        = string
  description = "The source image family to use as the base for the new image."
}

variable "source_image_project_id" {
  type        = string
  description = "The project ID of the source image."
}

variable "machine_type" {
  type        = string
  description = "The machine type to use for the build instance."
}

variable "ssh_username" {
  type        = string
  description = "The SSH username to use for connecting to the build instance."
}

variable "disk_size" {
  type        = number
  description = "The size of the boot disk in GB."
}

variable "disk_type" {
  type        = string
  description = "The type of the boot disk."
}

variable "network" {
  type        = string
  description = "The network to attach the build instance to."
}

variable "subnetwork" {
  type        = string
  description = "The subnetwork to attach the build instance to."
}

source "googlecompute" "ubuntu" {
  project_id              = var.project_id
  source_image_family     = var.source_image_family
  source_image_project_id = [var.source_image_project_id]
  image_name              = var.image_name
  image_family            = var.image_family
  zone                    = var.zone
  machine_type            = var.machine_type
  ssh_username            = var.ssh_username
  disk_size               = var.disk_size
  disk_type               = var.disk_type
  network                 = var.network
  subnetwork              = var.subnetwork
}

build {
  name    = "coinbreakr-gcp-image"
  sources = ["source.googlecompute.ubuntu"]

  provisioner "file" {
    source      = "../dist/services.zip"
    destination = "/tmp/services.zip"
  }

  provisioner "shell" {
    inline = [
      "echo '📦 Extracting services.zip...'",
      "sudo apt-get update -y && sudo apt-get install -y unzip",
      "if [ ! -f /tmp/services.zip ]; then echo '❌ services.zip not found'; exit 1; fi",
      "sudo unzip /tmp/services.zip -d /tmp/services",
      "if [ ! -d /tmp/services ]; then echo '❌ Failed to extract services.zip'; exit 1; fi",
      "cd /tmp/services && sudo chmod +x scripts/setup.sh && sudo scripts/setup.sh"
    ]
  }

  # Harden builder/provisioning users: prevent interactive logins on the final image
  provisioner "shell" {
    inline = [
      "set -euxo pipefail",
      # Lock packer user if it exists
      "if id -u packer >/dev/null 2>&1; then sudo passwd -l packer; echo '✅ packer user locked with no-login shell'; fi"
    ]
  }
}
