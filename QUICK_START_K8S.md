# Quick Start - Kubernetes Testing Environment

Fast setup guide for the testing branch Kubernetes deployment.

## ⚡ 5-Minute Setup

### 1. Deploy Infrastructure
```bash
cd terraform-k8s
terraform init
terraform apply -var-file="terraform.testing.tfvars" -auto-approve
```

### 2. Configure kubectl
```bash
# Install GKE auth plugin (if not already installed)
gcloud components install gke-gcloud-auth-plugin

# Configure kubectl
gcloud container clusters get-credentials coinbreakr-testing-cluster \
  --zone us-central1-a --project coinbreakr
```

### 3. Create Secrets
```bash
kubectl create secret generic coinbreakr-secrets \
  --from-literal=mongo-url='YOUR_MONGO_URL' \
  --from-literal=jwt-secret='YOUR_JWT_SECRET'
```

### 4. Deploy Application
```bash
cd ../k8s
kubectl apply -f configmap.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f hpa.yaml
```

### 5. Get External IP
```bash
kubectl get service coinbreakr-api-service -w
# Wait for EXTERNAL-IP, then Ctrl+C
```

### 6. Test
```bash
EXTERNAL_IP=$(kubectl get service coinbreakr-api-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
curl http://$EXTERNAL_IP/v1/healthz
```

## 🔄 Update Deployment

```bash
# Build and push new image
docker build -t us-central1-docker.pkg.dev/coinbreakr/coinbreakr-testing/services:v1.0.1 ./services
docker push us-central1-docker.pkg.dev/coinbreakr/coinbreakr-testing/services:v1.0.1

# Update deployment
kubectl set image deployment/coinbreakr-api api=us-central1-docker.pkg.dev/coinbreakr/coinbreakr-testing/services:v1.0.1
kubectl rollout status deployment/coinbreakr-api
```

## 📊 Quick Commands

```bash
# View pods
kubectl get pods -l app=coinbreakr-api

# View logs
kubectl logs -f deployment/coinbreakr-api

# Check scaling
kubectl get hpa

# Restart deployment
kubectl rollout restart deployment/coinbreakr-api
```

## 🧹 Cleanup

```bash
kubectl delete -f k8s/
cd terraform-k8s
terraform destroy -var-file="terraform.testing.tfvars" -auto-approve
```

---

For detailed guide, see [KUBERNETES_DEPLOYMENT_GUIDE.md](KUBERNETES_DEPLOYMENT_GUIDE.md)
