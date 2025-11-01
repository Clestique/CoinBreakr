# Infrastructure as Code (Terraform)

A comprehensive Terraform configuration for deploying application infrastructure on Google Cloud Platform (GCP) with multi-environment support.

## 🏗️ Overview

This Terraform configuration provisions a complete cloud infrastructure for your application, including:

- **Virtual Private Cloud (VPC)** with public and private subnets
- **Global HTTP(S) Load Balancer** with SSL termination and auto-scaling
- **Managed Instance Groups** with auto-healing and health checks
- **Managed SSL Certificates** for automatic HTTPS security
- **DNS management** with Cloud DNS for domain routing
- **Advanced firewall rules** for secure network access
- **Multi-environment support** (main/production and staging)

## ✨ Infrastructure Components

### 🌐 Network Architecture
- **VPC Network**: Isolated virtual network with regional routing
- **Public Subnets**: 3 subnets across different zones for high availability
- **Private Subnets**: 3 private subnets for internal resources
- **Internet Gateway**: Router for external internet access
- **Firewall Rules**: Secure access control for SSH, HTTP, HTTPS, and application ports

### 🖥️ Compute Resources
- **Managed Instance Groups**: Auto-scaling groups with 2-10 instances (main) or 1-5 instances (staging)
- **Instance Templates**: Consistent VM configuration with custom images
- **Auto Scaling**: CPU-based scaling with 70% utilization threshold
- **Health Checks**: HTTP health checks on `/v1/healthz` endpoint
- **Auto Healing**: Automatic replacement of unhealthy instances
- **Machine Types**: Configurable instance sizes (default: e2-medium)
- **Persistent Disks**: 20GB balanced persistent disks for storage

### ⚖️ Load Balancer & SSL
- **Global HTTP(S) Load Balancer**: High-performance load balancing
- **SSL Termination**: Automatic SSL/TLS encryption at load balancer
- **Managed SSL Certificates**: Google-managed certificates for your domains
- **HTTP to HTTPS Redirect**: Automatic security redirect
- **Backend Services**: Health-checked backend pools
- **URL Mapping**: Flexible request routing

### 🌍 DNS Management
- **Managed DNS Zone**: Cloud DNS zone for splitlyr.clestiq.com
- **Environment-specific Records**: 
  - Production: `api.splitlyr.clestiq.com` → Load Balancer IP
  - Staging: `staging.splitlyr.clestiq.com` → Load Balancer IP
- **Load Balancer Integration**: DNS records point to global load balancer IP
- **SSL Certificate Validation**: Automatic domain validation for SSL certificates

### 🔒 Security Features
- **Network Segmentation**: Separate public and private subnets
- **Load Balancer Security**: Only load balancer can reach backend instances
- **SSL/TLS Encryption**: End-to-end encryption with managed certificates
- **Firewall Rules**: Restrictive access control with load balancer source ranges
- **Service Accounts**: Proper IAM roles and permissions
- **Environment Isolation**: Separate resources per environment
- **Health Check Security**: Secure health check endpoints

## 📁 Project Structure

```
terraform/
├── provider.tf              # GCP provider configuration and API enablement
├── versions.tf              # Terraform and provider version constraints
├── variables.tf             # Input variable definitions
├── vpc.tf                   # VPC, subnets, firewall rules
├── load_balancer.tf         # Load balancer, auto scaling, SSL certificates
├── dns.tf                   # DNS zone and record management
├── terraform.main.tfvars    # Production environment variables
├── terraform.staging.tfvars # Staging environment variables
├── .terraform.lock.hcl      # Provider version lock file
├── terraform.tfstate        # Terraform state file (managed)
└── README.md                # This documentation
```

## 🚀 Quick Start

### Prerequisites
- **Terraform**: v1.0+ installed
- **Google Cloud SDK**: `gcloud` CLI configured
- **GCP Project**: Active project with billing enabled
- **Authentication**: Service account key or `gcloud auth application-default login`
- **Required APIs**: Compute Engine API, DNS API (automatically enabled)

### Initial Setup

1. **Clone and navigate to terraform directory:**
   ```bash
   cd terraform
   ```

2. **Configure variables:**
   ```bash
   # Copy example files and customize with your values
   cp terraform.main.tfvars terraform.main.tfvars.example
   cp terraform.staging.tfvars terraform.staging.tfvars.example
   
   # Edit with your specific configuration
   vim terraform.main.tfvars
   vim terraform.staging.tfvars
   ```

3. **Initialize Terraform:**
   ```bash
   terraform init
   ```

4. **Validate configuration:**
   ```bash
   terraform validate
   ```

5. **Review planned changes:**
   ```bash
   # For production environment
   terraform plan -var-file="terraform.main.tfvars"
   
   # For staging environment
   terraform plan -var-file="terraform.staging.tfvars"
   ```

### Deployment

#### Production Environment
```bash
# Deploy to production
terraform apply -var-file="terraform.main.tfvars"

# Verify deployment
terraform output -json
```

#### Staging Environment
```bash
# Deploy to staging
terraform apply -var-file="terraform.staging.tfvars"

# Check staging resources
terraform output instance_external_ip
```

## ⚙️ Configuration

### Environment Variables

#### Production (`terraform.main.tfvars`)
```hcl
# GCP Configuration
project_id = var.project_id
region     = var.region
zones      = var.zones

# Environment
environment = "main"

# VM Configuration
instance_name = "${var.environment}-${var.project_name}-vm"
image_family  = "${var.project_name}-production-family"
machine_type  = var.machine_type

# Network Configuration
vpc_cidr = var.vpc_cidr
public_subnet_cidrs = var.public_subnet_cidrs
private_subnet_cidrs = var.private_subnet_cidrs

# Domain Configuration
domain_name = var.domain_name
app_port    = var.app_port
```

#### Staging (`terraform.staging.tfvars`)
```hcl
# Similar configuration with staging-specific values
environment = "staging"
instance_name = "${var.environment}-${var.project_name}-vm"
image_family  = "${var.project_name}-staging-family"
```

### Variable Definitions

| Variable | Type | Description | Example Value |
|----------|------|-------------|---------------|
| `project_id` | string | GCP project ID | `"my-project-123"` |
| `region` | string | GCP region for resources | `"us-central1"` |
| `zones` | list(string) | Availability zones for subnets | `["us-central1-a", "us-central1-b", "us-central1-c"]` |
| `environment` | string | Environment name (main/staging) | `"main"` or `"staging"` |
| `instance_name` | string | VM instance name | `"${var.environment}-${var.project_name}-vm"` |
| `image_family` | string | Custom image family for VM | `"${var.project_name}-${var.environment}-family"` |
| `machine_type` | string | VM machine type | `"e2-medium"` |
| `vpc_cidr` | string | VPC CIDR block | `"10.0.0.0/16"` |
| `public_subnet_cidrs` | list(string) | Public subnet CIDR blocks | `["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]` |
| `private_subnet_cidrs` | list(string) | Private subnet CIDR blocks | `["10.0.10.0/24", "10.0.20.0/24", "10.0.30.0/24"]` |
| `domain_name` | string | Base domain name | `"example.com"` |
| `app_port` | number | Application port | `3000` |
| `min_instances` | number | Minimum instances in auto scaling group | `2` (main), `1` (staging) |
| `max_instances` | number | Maximum instances in auto scaling group | `10` (main), `5` (staging) |
| `dns_zone_name` | string | DNS zone name for domain management | `"splitlyr"` |

### Customization Guide

Before deploying, customize the `.tfvars` files with your specific values:

1. **Update GCP Configuration:**
   - Set your actual GCP project ID
   - Choose your preferred region and zones
   - Ensure you have proper permissions in the project

2. **Configure Networking:**
   - Adjust CIDR blocks to avoid conflicts with existing networks
   - Ensure subnet sizes meet your capacity requirements

3. **Set Domain Configuration:**
   - Use your actual domain name
   - Ensure you have DNS management permissions for the domain

4. **Choose Instance Configuration:**
   - Select appropriate machine types for your workload
   - Configure custom image families if using pre-built images

## 🌐 Network Architecture

### VPC Design
```
VPC Network (${var.vpc_cidr})
├── Public Subnets
│   ├── ${var.environment}-public-subnet-1 (${var.public_subnet_cidrs[0]}) - ${var.zones[0]}
│   ├── ${var.environment}-public-subnet-2 (${var.public_subnet_cidrs[1]}) - ${var.zones[1]}
│   └── ${var.environment}-public-subnet-3 (${var.public_subnet_cidrs[2]}) - ${var.zones[2]}
├── Private Subnets
│   ├── ${var.environment}-private-subnet-1 (${var.private_subnet_cidrs[0]}) - ${var.zones[0]}
│   ├── ${var.environment}-private-subnet-2 (${var.private_subnet_cidrs[1]}) - ${var.zones[1]}
│   └── ${var.environment}-private-subnet-3 (${var.private_subnet_cidrs[2]}) - ${var.zones[2]}
└── Internet Gateway (${var.environment}-router)
```

### Firewall Rules
- **SSH Access**: Port 22 from anywhere (0.0.0.0/0) to instances
- **Load Balancer to Instances**: Port 3000 from Google Cloud Load Balancer ranges
- **Health Check Access**: Port 3000 from Google Cloud health check ranges
- **Target Tags**: `lb-backend` for load balancer traffic, `coinbreakr-vm` for SSH

## 🌍 DNS Configuration

### DNS Zone Management
- **Zone Name**: `splitlyr.clestiq.com`
- **Environment-specific Records**:
  - **Production**: `api.splitlyr.clestiq.com` → Load Balancer IP
  - **Staging**: `staging.splitlyr.clestiq.com` → Load Balancer IP
- **TTL**: 300 seconds for quick updates
- **Load Balancer Integration**: DNS records automatically use global load balancer IP
- **SSL Certificate Validation**: Domains automatically validated for SSL certificates

### DNS Outputs
```bash
# Get DNS nameservers
terraform output dns_nameservers

# Get DNS record information
terraform output dns_records
```

## 📊 Terraform Outputs

### Available Outputs

| Output | Description |
|--------|-------------|
| `vpc_network_name` | Name of the created VPC network |
| `public_subnet_names` | Names of all public subnets |
| `private_subnet_names` | Names of all private subnets |
| `managed_instance_group` | Name of the managed instance group |
| `load_balancer_ip` | **Global load balancer IP address** |
| `ssl_certificate_name` | Name of the managed SSL certificate |
| `dns_records` | Created DNS records pointing to load balancer |

### Viewing Outputs
```bash
# View all outputs
terraform output

# View load balancer IP
terraform output load_balancer_ip

# View SSL certificate status
terraform output ssl_certificate_name

# View outputs in JSON format
terraform output -json
```

## ⚖️ Load Balancer & Auto Scaling Architecture

### Traffic Flow
```
Internet → DNS → Global Load Balancer → SSL Termination → Backend Service → Instance Group → Instances (port 3000)
```

### Load Balancer Components
- **Global HTTP(S) Load Balancer**: Handles incoming traffic from internet
- **SSL Certificates**: Managed certificates for automatic HTTPS
- **URL Maps**: Route requests to appropriate backend services
- **Backend Services**: Health-checked pools of instances
- **Health Checks**: HTTP checks on `/v1/healthz` endpoint every 15 seconds

### Auto Scaling Configuration
- **Instance Templates**: Consistent VM configuration with startup scripts
- **Managed Instance Groups**: Regional groups for high availability
- **Auto Scaling Policies**: CPU-based scaling at 70% utilization threshold
- **Auto Healing**: Automatic replacement of failed instances after 5 minutes
- **Scaling Limits**:
  - **Production**: 2-10 instances
  - **Staging**: 1-5 instances

### SSL/TLS Security
- **Managed SSL Certificates**: Automatically provisioned and renewed by Google
- **HTTPS Enforcement**: HTTP traffic automatically redirected to HTTPS
- **SSL Termination**: Encryption/decryption handled at load balancer level
- **Certificate Validation**: Automatic domain validation using DNS

### Health Monitoring
- **Health Check Endpoint**: `/v1/healthz` on port 3000
- **Check Frequency**: Every 15 seconds with 10-second timeout
- **Healthy Threshold**: 2 consecutive successful checks
- **Unhealthy Threshold**: 3 consecutive failed checks
- **Auto Healing**: Unhealthy instances replaced automatically

### Testing Your Load Balancer
```bash
# Test HTTPS endpoint (should work)
curl https://staging.splitlyr.clestiq.com/v1/healthz

# Test HTTP redirect (should redirect to HTTPS)
curl -I http://staging.splitlyr.clestiq.com/v1/healthz

# Check SSL certificate
openssl s_client -connect staging.splitlyr.clestiq.com:443 -servername staging.splitlyr.clestiq.com

# Monitor backend health
gcloud compute backend-services get-health staging-coinbreakr-backend --global
```

## 🔧 Management Commands

### State Management
```bash
# View current state
terraform show

# List all resources
terraform state list

# Import existing resource
terraform import google_compute_instance.vm_instance projects/${var.project_id}/zones/${var.zones[0]}/instances/${var.instance_name}

# Remove resource from state
terraform state rm google_compute_instance.vm_instance
```

### Environment Switching
```bash
# Switch to production
terraform workspace select production
terraform apply -var-file="terraform.main.tfvars"

# Switch to staging
terraform workspace select staging
terraform apply -var-file="terraform.staging.tfvars"
```

## 🛡️ Security Best Practices

### Network Security
- **Private Subnets**: Sensitive resources in private subnets
- **Firewall Rules**: Minimal required access only
- **Network Tags**: Proper resource tagging for firewall targeting
- **Regional Routing**: Optimized network routing mode

### Access Control
- **Service Accounts**: Proper IAM roles for VM instances
- **SSH Access**: Controlled SSH access with proper key management
- **API Access**: Required APIs enabled with minimal permissions

### Environment Isolation
- **Separate Resources**: Complete isolation between environments
- **Naming Conventions**: Clear environment-specific naming
- **State Separation**: Separate state files per environment

## 🚀 Deployment Strategies

### Blue-Green Deployment
```bash
# Create new environment
terraform apply -var-file="terraform.main.tfvars" -var="instance_name=${var.environment}-${var.project_name}-vm-new"

# Update DNS to point to new instance
# Destroy old instance after verification
```

### Rolling Updates
```bash
# Update VM image
terraform apply -var-file="terraform.main.tfvars" -var="image_family=${var.project_name}-production-family-v2"
```

### Disaster Recovery
```bash
# Backup state file
cp terraform.tfstate terraform.tfstate.backup.$(date +%Y%m%d)

# Restore from backup if needed
cp terraform.tfstate.backup.YYYYMMDD terraform.tfstate
```

## 🔍 Troubleshooting

### Common Issues

#### Authentication Errors
```bash
# Re-authenticate with gcloud
gcloud auth application-default login

# Verify project access
gcloud projects list
```

#### State Lock Issues
```bash
# Force unlock (use with caution)
terraform force-unlock LOCK_ID

# Check state lock status
terraform state list
```

#### Resource Conflicts
```bash
# Import existing resources
terraform import google_compute_network.vpc_network projects/${var.project_id}/global/networks/${var.environment}-${var.project_name}-vpc

# Remove conflicting resources
terraform state rm google_compute_network.vpc_network
```

#### DNS Propagation
```bash
# Check DNS propagation
nslookup api.${var.project_name}.${var.domain_name}

# Verify nameservers
dig NS ${var.project_name}.${var.domain_name}
```

### Validation Commands
```bash
# Validate Terraform syntax
terraform validate

# Format Terraform files
terraform fmt -recursive

# Check for security issues
terraform plan -out=tfplan
terraform show -json tfplan | jq '.'
```

## 📈 Monitoring & Maintenance

### Resource Monitoring
- **GCP Console**: Monitor resources through GCP Console
- **Cloud Monitoring**: Set up alerts for VM health
- **DNS Monitoring**: Monitor DNS resolution and propagation
- **Cost Monitoring**: Track infrastructure costs

### Regular Maintenance
```bash
# Update Terraform providers
terraform init -upgrade

# Refresh state with actual infrastructure
terraform refresh -var-file="terraform.main.tfvars"

# Plan for drift detection
terraform plan -var-file="terraform.main.tfvars"
```

## 🧹 Cleanup

### Destroy Resources
```bash
# Destroy staging environment
terraform destroy -var-file="terraform.staging.tfvars"

# Destroy production environment (use with extreme caution)
terraform destroy -var-file="terraform.main.tfvars"

# Destroy specific resources
terraform destroy -target=google_compute_instance.vm_instance -var-file="terraform.staging.tfvars"
```

## 📚 Additional Resources

- [Terraform GCP Provider Documentation](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [Google Cloud Compute Engine Documentation](https://cloud.google.com/compute/docs)
- [Google Cloud DNS Documentation](https://cloud.google.com/dns/docs)
- [Terraform Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices/index.html)

---

**Terraform Version**: 1.0+  
**GCP Provider Version**: 4.0+  
**Target Platform**: Google Cloud Platform  
**Supported Environments**: Production (main), Staging