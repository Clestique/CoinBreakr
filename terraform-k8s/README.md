# Kubernetes Infrastructure (Testing Environment)

Terraform configuration for deploying Kubernetes infrastructure on Google Cloud Platform (GCP) for the testing environment.

## 🏗️ Overview

This Terraform setup provisions:
- **GKE Cluster**: Managed Kubernetes cluster with auto-scaling
- **Artifact Registry**: Private Docker image repository
- **IAM & Service Accounts**: Secure access management
- **Node Pools**: Auto-scaling node pools (1-5 nodes)
- **API Enablement**: Automatic enablement of required GCP APIs

## 📁 Structure

```
terraform-k8s/
├── provider.tf              # GCP and Kubernetes provider configuration
├── variables.tf             # Input variable definitions
├── gke.tf                   # GKE cluster and node pool configuration
├── artifact-registry.tf     # Docker image registry
├── outputs.tf               # Output values
├── terraform.testing.tfvars # Testing environment configuration
└── README.md                # This file
```

## 🚀 Quick Start

### Prerequisites
- Terraform v1.0+
- Google Cloud SDK (`gcloud`)
- kubectl
- Authenticated GCP account with proper permissions

### Initial Setup

1. **Navigate to terraform-k8s directory:**
   ```bash
   cd terraform-k8s
   ```

2. **Initialize Terraform:**
   ```bash
   terraform init
   ```

3. **Review the plan:**
   ```bash
   terraform plan -var-file="terraform.testing.tfvars"
   ```

4. **Apply the configuration:**
   ```bash
   terraform apply -var-file="terraform.testing.tfvars"
   ```

### Connect to GKE Cluster

After deployment, configure kubectl:
```bash
gcloud container clusters get-credentials coinbreakr-testing-cluster \
  --zone us-east1-b \
  --project coinbreakr
```

Verify connection:
```bash
kubectl get nodes
kubectl get pods --all-namespaces
```

## ⚙️ Configuration

### Key Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `project_id` | GCP Project ID | `coinbreakr` |
| `region` | GCP region | `us-central1` |
| `zone` | GCP zone | `us-central1-a` |
| `gke_cluster_name` | GKE cluster name | `coinbreakr-testing-cluster` |
| `gke_min_nodes` | Minimum nodes | `1` |
| `gke_max_nodes` | Maximum nodes | `5` |
| `gke_machine_type` | Node machine type | `e2-medium` |
| `artifact_registry_repository` | Docker repo name | `coinbreakr-testing` |

### Customization

Edit `terraform.testing.tfvars` to customize your deployment:
```hcl
gke_machine_type = "e2-standard-2"  # Larger instances
gke_max_nodes    = 10               # More scaling capacity
```

## 🐳 Artifact Registry

### Docker Image URL Format
```
us-central1-docker.pkg.dev/coinbreakr/coinbreakr-testing/services:TAG
```

### Push Image to Registry
```bash
# Authenticate Docker
gcloud auth configure-docker us-central1-docker.pkg.dev

# Tag your image
docker tag services:latest us-central1-docker.pkg.dev/coinbreakr/coinbreakr-testing/services:latest

# Push to registry
docker push us-central1-docker.pkg.dev/coinbreakr/coinbreakr-testing/services:latest
```

## 🔧 Management Commands

### View Outputs
```bash
terraform output
terraform output -json
terraform output artifact_registry_url
```

### Update Infrastructure
```bash
terraform plan -var-file="terraform.testing.tfvars"
terraform apply -var-file="terraform.testing.tfvars"
```

### Destroy Resources
```bash
terraform destroy -var-file="terraform.testing.tfvars"
```

## 🛡️ Security Features

- **Workload Identity**: Secure pod-to-GCP service authentication
- **Private Artifact Registry**: Controlled image access
- **Service Account**: Minimal permissions for GKE nodes
- **Auto-repair**: Automatic node health management
- **Auto-upgrade**: Automatic Kubernetes version updates

## 📊 Monitoring

### Check Cluster Status
```bash
kubectl cluster-info
kubectl get nodes
kubectl top nodes
```

### View Logs
```bash
kubectl logs -f deployment/coinbreakr-api
kubectl logs -f -l app=coinbreakr-api
```

## 🔍 Troubleshooting

### Authentication Issues
```bash
gcloud auth application-default login
gcloud config set project coinbreakr
```

### Cluster Connection Issues
```bash
gcloud container clusters get-credentials coinbreakr-testing-cluster \
  --zone us-central1-a --project coinbreakr
```

### Image Pull Issues
```bash
# Verify service account permissions
kubectl describe serviceaccount default

# Check image pull secrets
kubectl get secrets
```

## 📈 Cost Optimization

- **Preemptible Nodes**: Set `preemptible = true` in `gke.tf` for cost savings
- **Auto-scaling**: Cluster scales down to 1 node when idle
- **Image Cleanup**: Old images automatically deleted after 30 days

## 🧹 Cleanup

To remove all resources:
```bash
terraform destroy -var-file="terraform.testing.tfvars"
```

---

**Terraform Version**: 1.0+  
**GCP Provider**: 5.0+  
**Kubernetes Provider**: 2.23+  
**Target Platform**: Google Kubernetes Engine (GKE)
