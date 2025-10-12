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
  default     = "my-gcp-project"
}

variable "zone" {
  type        = string
  description = "The GCP zone where the image will be created."
  default     = "us-central1-a"
}

variable "image_name" {
  type        = string
  description = "The name of the image to be created."
  default     = "coinbreakr-image"
}

variable "source_image_family" {
  type        = string
  description = "The source image family to use as the base for the new image."
  default     = "ubuntu-2204-lts"
}

variable "source_image_project_id" {
  type        = string
  description = "The project ID of the source image."
  default     = "my-gcp-project"
}

variable "machine_type" {
  type        = string
  description = "The machine type to use for the build instance."
  default     = "e2-medium"
}

variable "ssh_username" {
  type        = string
  description = "The SSH username to use for connecting to the build instance."
  default     = "packer"
}

variable "disk_size" {
  type        = number
  description = "The size of the boot disk in GB."
  default     = 10
}

variable "disk_type" {
  type        = string
  description = "The type of the boot disk."
  default     = "pd-standard"
}

variable "network" {
  type        = string
  description = "The network to attach the build instance to."
  default     = "default"
}

variable "subnetwork" {
  type        = string
  description = "The subnetwork to attach the build instance to."
  default     = "default"
}

source "googlecompute" "ubuntu" {
  project_id              = var.project_id
  source_image_family     = var.source_image_family
  source_image_project_id = [var.source_image_project_id]
  image_name              = var.image_name
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
    source      = "./services.zip"
    destination = "/tmp/services.zip"
  }

  provisioner "shell" {
    inline = [
      "echo '📦 Extracting services.zip...'",
      "sudo apt-get update -y && sudo apt-get install -y unzip",
      "sudo unzip /tmp/services.zip -d /tmp/services",
      "cd /tmp/services && sudo chmod +x scripts/setup.sh && sudo scripts/setup.sh"
    ]
  }
}
