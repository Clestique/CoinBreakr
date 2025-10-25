variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "zones" {
  description = "List of GCP zones for subnets"
  type        = list(string)
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
  description = "Path to SSH public key file (optional for automated deployment)"
  type        = string
}

variable "environment" {
  description = "Environment name (staging/production)"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
}
