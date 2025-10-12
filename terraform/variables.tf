variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "zone" {
  description = "GCP zone"
  type        = string
}

variable "instance_name" {
  description = "Name of the instance"
  type        = string
}

variable "image_family" {
  description = "Image family for the VM"
  type        = string
}

variable "machine_type" {
  description = "Machine type for the instance"
  type        = string
}

variable "ssh_user" {
  description = "Username for SSH access"
  type        = string
}

variable "ssh_public_key_path" {
  description = "Path to SSH public key file"
  type        = string
}
