variable "project_id" {
  description = "GCP project ID"
  type        = string
  default     = "coinbreakr"
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "GCP zone"
  type        = string
  default     = "us-central1-a"
}

variable "instance_name" {
  description = "Name of the instance"
  type        = string
}

variable "ssh_user" {
  description = "Username for SSH access"
  type        = string
  default     = "ubuntu"
}

variable "ssh_public_key_path" {
  description = "Path to SSH public key file"
  type        = string
  default     = "C:/Users/Rutuja/.ssh/gcp.pub"
}
