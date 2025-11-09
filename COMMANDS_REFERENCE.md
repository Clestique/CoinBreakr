# Quick Commands Reference

Essential commands for managing the Kubernetes testing environment.

## 🚀 Initial Setup

```bash
# Deploy infrastructure
cd terraform-k8s
terraform init
terraform apply -var-file="terraform.testing.tfvars"

# Configure kubectl
gcloud container clusters get-credentials coinbreakr-testing-cluster \
  --zone us-central1-a --project coinbreakr

# Create secrets
kubectl create secret generic coinbreakr-secrets \
  --from-literal=mongo-url='YOUR_MONGO_URL' \
  --from-literal=jwt-secret='YOUR_JWT_SECRET'

# Deploy application
cd ../k8s
kubectl apply -f .
```

## 📊 Monitoring

```bash
# View all resources
kubectl get all -l app=coinbreakr-api

# View pods
kubectl get pods -l app=coinbreakr-api

# View logs (all pods)
kubectl logs -l app=coinbreakr-api --tail=100

# View logs (specific pod)
kubectl logs -f <pod-name>

# View logs (previous crashed pod)
kubectl logs <pod-name> --previous

# View deployment status
kubectl get deployments

# View service and external IP
kubectl get service coinbreakr-api-service

# View HPA status
kubectl get hpa

# View events
kubectl get events --sort-by=.metadata.creationTimestamp

# Resource usage
kubectl top pods
kubectl top nodes
```

## 🔄 Deployment Operations

```bash
# Update image
kubectl set image deployment/coinbreakr-api \
  api=us-central1-docker.pkg.dev/coinbreakr/coinbreakr-testing/services:NEW_TAG

# Check rollout status
kubectl rollout status deployment/coinbreakr-api

# View rollout history
kubectl rollout history deployment/coinbreakr-api

# Rollback to previous version
kubectl rollout undo deployment/coinbreakr-api

# Rollback to specific revision
kubectl rollout undo deployment/coinbreakr-api --to-revision=2

# Restart deployment (picks up new secrets/configmap)
kubectl rollout restart deployment/coinbreakr-api

# Pause rollout
kubectl rollout pause deployment/coinbreakr-api

# Resume rollout
kubectl rollout resume deployment/coinbreakr-api
```

## 📈 Scaling

```bash
# Manual scale
kubectl scale deployment coinbreakr-api --replicas=5

# View HPA status
kubectl get hpa coinbreakr-api-hpa

# Describe HPA
kubectl describe hpa coinbreakr-api-hpa

# Edit HPA
kubectl edit hpa coinbreakr-api-hpa
```

## 🔍 Debugging

```bash
# Describe pod (shows events and status)
kubectl describe pod <pod-name>

# Describe deployment
kubectl describe deployment coinbreakr-api

# Describe service
kubectl describe service coinbreakr-api-service

# Get pod YAML
kubectl get pod <pod-name> -o yaml

# Execute command in pod
kubectl exec -it <pod-name> -- /bin/sh

# Execute specific command
kubectl exec <pod-name> -- env

# Port forward to local machine
kubectl port-forward deployment/coinbreakr-api 3000:3000

# Check endpoints
kubectl get endpoints coinbreakr-api-service
```

## 🔐 Secrets & ConfigMaps

```bash
# View secrets (names only)
kubectl get secrets

# Describe secret (shows keys, not values)
kubectl describe secret coinbreakr-secrets

# Delete and recreate secret
kubectl delete secret coinbreakr-secrets
kubectl create secret generic coinbreakr-secrets \
  --from-literal=mongo-url='NEW_URL' \
  --from-literal=jwt-secret='NEW_SECRET'

# View ConfigMap
kubectl get configmap coinbreakr-config -o yaml

# Edit ConfigMap
kubectl edit configmap coinbreakr-config

# After updating secrets/configmap, restart pods
kubectl rollout restart deployment/coinbreakr-api
```

## 🐳 Docker Operations

```bash
# Authenticate Docker
gcloud auth configure-docker us-central1-docker.pkg.dev

# Build image
docker build -t us-central1-docker.pkg.dev/coinbreakr/coinbreakr-testing/services:TAG ./services

# Push image
docker push us-central1-docker.pkg.dev/coinbreakr/coinbreakr-testing/services:TAG

# List images in registry
gcloud artifacts docker images list us-central1-docker.pkg.dev/coinbreakr/coinbreakr-testing

# Delete image from registry
gcloud artifacts docker images delete \
  us-central1-docker.pkg.dev/coinbreakr/coinbreakr-testing/services:TAG
```

## 🌐 Testing API

```bash
# Get external IP
EXTERNAL_IP=$(kubectl get service coinbreakr-api-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Health check
curl http://$EXTERNAL_IP/v1/healthz

# Register user
curl -X POST http://$EXTERNAL_IP/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"pass123"}'

# Login
curl -X POST http://$EXTERNAL_IP/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'
```

## 🏗️ Terraform Operations

```bash
# Navigate to terraform-k8s
cd terraform-k8s

# Initialize
terraform init

# Plan changes
terraform plan -var-file="terraform.testing.tfvars"

# Apply changes
terraform apply -var-file="terraform.testing.tfvars"

# Show current state
terraform show

# List resources
terraform state list

# View outputs
terraform output

# Destroy infrastructure
terraform destroy -var-file="terraform.testing.tfvars"
```

## 🔧 GKE Cluster Operations

```bash
# Get cluster info
gcloud container clusters describe coinbreakr-testing-cluster \
  --zone us-central1-a

# List clusters
gcloud container clusters list

# Resize node pool
gcloud container clusters resize coinbreakr-testing-cluster \
  --node-pool coinbreakr-testing-cluster-node-pool \
  --num-nodes 3 \
  --zone us-central1-a

# Upgrade cluster
gcloud container clusters upgrade coinbreakr-testing-cluster \
  --zone us-central1-a

# Get credentials (if lost)
gcloud container clusters get-credentials coinbreakr-testing-cluster \
  --zone us-central1-a --project coinbreakr
```

## 📦 Artifact Registry Operations

```bash
# List repositories
gcloud artifacts repositories list --location us-central1

# List images
gcloud artifacts docker images list \
  us-central1-docker.pkg.dev/coinbreakr/coinbreakr-testing

# List tags for an image
gcloud artifacts docker tags list \
  us-central1-docker.pkg.dev/coinbreakr/coinbreakr-testing/services

# Delete old images
gcloud artifacts docker images delete \
  us-central1-docker.pkg.dev/coinbreakr/coinbreakr-testing/services:OLD_TAG \
  --delete-tags
```

## 🧹 Cleanup

```bash
# Delete Kubernetes resources
kubectl delete -f k8s/

# Delete secrets
kubectl delete secret coinbreakr-secrets

# Destroy infrastructure
cd terraform-k8s
terraform destroy -var-file="terraform.testing.tfvars"
```

## 📋 Useful Aliases

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
# Kubernetes aliases
alias k='kubectl'
alias kgp='kubectl get pods'
alias kgs='kubectl get services'
alias kgd='kubectl get deployments'
alias kgh='kubectl get hpa'
alias kl='kubectl logs -f'
alias kd='kubectl describe'
alias ke='kubectl exec -it'

# CoinBreakr specific
alias cb-pods='kubectl get pods -l app=coinbreakr-api'
alias cb-logs='kubectl logs -f deployment/coinbreakr-api'
alias cb-restart='kubectl rollout restart deployment/coinbreakr-api'
alias cb-status='kubectl rollout status deployment/coinbreakr-api'
alias cb-ip='kubectl get service coinbreakr-api-service -o jsonpath="{.status.loadBalancer.ingress[0].ip}"'
```

## 🔍 Troubleshooting Commands

```bash
# Pod stuck in Pending
kubectl describe pod <pod-name> | grep -A 5 Events

# Pod CrashLoopBackOff
kubectl logs <pod-name> --previous

# Image pull errors
kubectl describe pod <pod-name> | grep -A 10 "Failed to pull image"

# Service not accessible
kubectl get endpoints coinbreakr-api-service

# HPA not scaling
kubectl get hpa coinbreakr-api-hpa
kubectl describe hpa coinbreakr-api-hpa
kubectl top pods

# Check node resources
kubectl describe nodes
kubectl top nodes

# View all events
kubectl get events --all-namespaces --sort-by=.metadata.creationTimestamp
```

## 📊 Monitoring Commands

```bash
# Watch pods
kubectl get pods -l app=coinbreakr-api -w

# Watch HPA
kubectl get hpa -w

# Watch service
kubectl get service coinbreakr-api-service -w

# Continuous logs
kubectl logs -f deployment/coinbreakr-api --all-containers=true

# Resource usage over time
watch kubectl top pods
```

## 🎯 One-Liners

```bash
# Get external IP
kubectl get service coinbreakr-api-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}'

# Count running pods
kubectl get pods -l app=coinbreakr-api --no-headers | wc -l

# Get all pod IPs
kubectl get pods -l app=coinbreakr-api -o jsonpath='{.items[*].status.podIP}'

# Get image version
kubectl get deployment coinbreakr-api -o jsonpath='{.spec.template.spec.containers[0].image}'

# Check if all pods are ready
kubectl get pods -l app=coinbreakr-api -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}'

# Get pod restart count
kubectl get pods -l app=coinbreakr-api -o jsonpath='{.items[*].status.containerStatuses[0].restartCount}'
```

---

**Tip**: Use `kubectl explain <resource>` to get documentation for any Kubernetes resource.

Example: `kubectl explain deployment.spec.template.spec.containers`
