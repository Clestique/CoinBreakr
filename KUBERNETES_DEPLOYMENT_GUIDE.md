# Kubernetes Deployment Guide - Testing Environment

Complete guide for deploying the CoinBreakr API to Kubernetes on GCP.

## 🎯 Overview

This guide covers the complete setup for the **testing branch** which uses:
- **Docker** for containerization
- **GCP Artifact Registry** for image storage
- **Google Kubernetes Engine (GKE)** for orchestration
- **Horizontal Pod Autoscaler** for auto-scaling
- **LoadBalancer Service** for external access

## 📋 Prerequisites

### Required Tools
```bash
# Install gcloud CLI
# https://cloud.google.com/sdk/docs/install

# Install kubectl
gcloud components install kubectl

# Install GKE auth plugin (REQUIRED for kubectl to work with GKE)
gcloud components install gke-gcloud-auth-plugin

# Install Terraform
# https://developer.hashicorp.com/terraform/downloads

# Install Docker
# https://docs.docker.com/get-docker/
```

### GCP Setup
1. Active GCP project: `coinbreakr`
2. Billing enabled
3. Required APIs enabled (done by Terraform)
4. Service account with proper permissions

## 🚀 Step-by-Step Deployment

### Step 1: Deploy Infrastructure with Terraform

```bash
# Navigate to terraform-k8s directory
cd terraform-k8s

# Initialize Terraform
terraform init

# Review the plan
terraform plan -var-file="terraform.testing.tfvars"

# Apply the configuration
terraform apply -var-file="terraform.testing.tfvars"
```

**What gets created:**
- GKE cluster with 1-5 nodes (auto-scaling)
- Artifact Registry for Docker images
- Service accounts with proper IAM roles
- Network configuration

**Time:** ~10-15 minutes

### Step 2: Configure kubectl

```bash
# Get cluster credentials
gcloud container clusters get-credentials coinbreakr-testing-cluster \
  --zone us-central1-a \
  --project coinbreakr

# Verify connection
kubectl cluster-info
kubectl get nodes
```

### Step 3: Create Kubernetes Secrets

```bash
# Create secrets for MongoDB and JWT
kubectl create secret generic coinbreakr-secrets \
  --from-literal=mongo-url='mongodb+srv://username:password@cluster.mongodb.net/Splitlyr?retryWrites=true&w=majority' \
  --from-literal=jwt-secret='your-super-secret-jwt-key-minimum-32-characters-long'

# Verify secret creation
kubectl get secrets
```

### Step 4: Build and Push Docker Image

```bash
# Authenticate Docker with Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev

# Navigate to services directory
cd services

# Build the Docker image
docker build -t us-central1-docker.pkg.dev/coinbreakr/coinbreakr-testing/services:latest .

# Push to Artifact Registry
docker push us-central1-docker.pkg.dev/coinbreakr/coinbreakr-testing/services:latest
```

### Step 5: Deploy to Kubernetes

```bash
# Navigate to k8s directory
cd k8s

# Apply ConfigMap
kubectl apply -f configmap.yaml

# Deploy the application
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f hpa.yaml

# Verify deployment
kubectl get deployments
kubectl get pods
kubectl get services
kubectl get hpa
```

### Step 6: Get External IP and Test

```bash
# Get the external IP (may take 2-3 minutes)
kubectl get service coinbreakr-api-service

# Wait for EXTERNAL-IP to be assigned
# Once assigned, test the API
EXTERNAL_IP=$(kubectl get service coinbreakr-api-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Test health endpoint
curl http://$EXTERNAL_IP/v1/healthz

# Expected response:
# {"success":true,"message":"Server is healthy","data":{...}}
```

## 🔄 CI/CD Workflow

### Automated Deployment (Recommended)

Once infrastructure is set up, use GitHub Actions:

**On PR to testing branch:**
- Docker build test
- Security scanning
- Kubernetes manifest validation
- Terraform validation

**On merge to testing branch:**
- Build Docker image
- Push to Artifact Registry
- Deploy to GKE
- Update load balancer
- Health checks

### Manual Deployment

```bash
# Build new image
docker build -t us-central1-docker.pkg.dev/coinbreakr/coinbreakr-testing/services:v1.0.1 ./services

# Push image
docker push us-central1-docker.pkg.dev/coinbreakr/coinbreakr-testing/services:v1.0.1

# Update deployment
kubectl set image deployment/coinbreakr-api \
  api=us-central1-docker.pkg.dev/coinbreakr/coinbreakr-testing/services:v1.0.1

# Check rollout status
kubectl rollout status deployment/coinbreakr-api
```

## 📊 Monitoring & Management

### View Logs
```bash
# All pods
kubectl logs -l app=coinbreakr-api

# Specific pod
kubectl logs -f <pod-name>

# Follow deployment logs
kubectl logs -f deployment/coinbreakr-api
```

### Check Pod Status
```bash
kubectl get pods -l app=coinbreakr-api
kubectl describe pod <pod-name>
```

### Monitor Auto-scaling
```bash
# HPA status
kubectl get hpa coinbreakr-api-hpa

# Detailed HPA info
kubectl describe hpa coinbreakr-api-hpa

# Resource usage
kubectl top pods
kubectl top nodes
```

### Service Status
```bash
# Get service details
kubectl get service coinbreakr-api-service
kubectl describe service coinbreakr-api-service

# Check endpoints
kubectl get endpoints coinbreakr-api-service
```

## 🔧 Common Operations

### Scale Manually
```bash
# Scale to specific number of replicas
kubectl scale deployment coinbreakr-api --replicas=5

# HPA will override this if enabled
```

### Update Environment Variables
```bash
# Update ConfigMap
kubectl edit configmap coinbreakr-config

# Update Secrets
kubectl delete secret coinbreakr-secrets
kubectl create secret generic coinbreakr-secrets \
  --from-literal=mongo-url='NEW_MONGO_URL' \
  --from-literal=jwt-secret='NEW_JWT_SECRET'

# Restart pods to pick up changes
kubectl rollout restart deployment/coinbreakr-api
```

### Rollback Deployment
```bash
# View rollout history
kubectl rollout history deployment/coinbreakr-api

# Rollback to previous version
kubectl rollout undo deployment/coinbreakr-api

# Rollback to specific revision
kubectl rollout undo deployment/coinbreakr-api --to-revision=2
```

### Debug Pod Issues
```bash
# Describe pod
kubectl describe pod <pod-name>

# Get pod logs
kubectl logs <pod-name>

# Execute command in pod
kubectl exec -it <pod-name> -- /bin/sh

# Check events
kubectl get events --sort-by=.metadata.creationTimestamp
```

## 🛡️ Security Best Practices

### Secrets Management
- ✅ Never commit secrets to Git
- ✅ Use Kubernetes Secrets for sensitive data
- ✅ Rotate secrets regularly
- ✅ Use GCP Secret Manager for production

### Image Security
- ✅ Scan images for vulnerabilities (Trivy)
- ✅ Use specific image tags, not `latest` in production
- ✅ Keep base images updated
- ✅ Use minimal base images

### Network Security
- ✅ Use private GKE clusters for production
- ✅ Configure network policies
- ✅ Use Workload Identity
- ✅ Restrict service account permissions

## 🧹 Cleanup

### Delete Kubernetes Resources
```bash
kubectl delete -f k8s/hpa.yaml
kubectl delete -f k8s/service.yaml
kubectl delete -f k8s/deployment.yaml
kubectl delete -f k8s/configmap.yaml
kubectl delete secret coinbreakr-secrets
```

### Destroy Infrastructure
```bash
cd terraform-k8s
terraform destroy -var-file="terraform.testing.tfvars"
```

## 🐛 Troubleshooting

### Pod Not Starting
```bash
# Check pod status
kubectl describe pod <pod-name>

# Common issues:
# - Image pull errors: Check Artifact Registry permissions
# - CrashLoopBackOff: Check logs for application errors
# - Pending: Check node resources
```

### Service Not Accessible
```bash
# Check service
kubectl get service coinbreakr-api-service

# Check endpoints
kubectl get endpoints coinbreakr-api-service

# If no endpoints, pods might not be ready
kubectl get pods -l app=coinbreakr-api
```

### Image Pull Errors
```bash
# Verify service account has Artifact Registry access
kubectl describe serviceaccount default

# Check if nodes can pull images
gcloud projects get-iam-policy coinbreakr \
  --flatten="bindings[].members" \
  --filter="bindings.role:roles/artifactregistry.reader"
```

### HPA Not Scaling
```bash
# Check metrics server
kubectl get apiservice v1beta1.metrics.k8s.io

# Check HPA status
kubectl describe hpa coinbreakr-api-hpa

# View current metrics
kubectl get hpa coinbreakr-api-hpa
```

## 📈 Performance Tuning

### Resource Limits
Edit `k8s/deployment.yaml`:
```yaml
resources:
  requests:
    memory: "512Mi"  # Increase for better performance
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

### Auto-scaling Thresholds
Edit `k8s/hpa.yaml`:
```yaml
metrics:
- type: Resource
  resource:
    name: cpu
    target:
      type: Utilization
      averageUtilization: 60  # Lower = more aggressive scaling
```

### Node Pool Scaling
Edit `terraform-k8s/terraform.testing.tfvars`:
```hcl
gke_max_nodes = 10  # Increase for more capacity
gke_machine_type = "e2-standard-2"  # Larger instances
```

## 📚 Additional Resources

- [GKE Documentation](https://cloud.google.com/kubernetes-engine/docs)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Artifact Registry Documentation](https://cloud.google.com/artifact-registry/docs)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)

---

**Environment**: Testing  
**Cluster**: coinbreakr-testing-cluster  
**Registry**: us-central1-docker.pkg.dev/coinbreakr/coinbreakr-testing
