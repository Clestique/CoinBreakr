# Deployment Checklist - Testing Environment

Step-by-step checklist for deploying the Kubernetes testing environment.

## 📋 Pre-Deployment Checklist

### Prerequisites
- [ ] GCP account with billing enabled
- [ ] Project ID: `coinbreakr`
- [ ] gcloud CLI installed and configured
- [ ] kubectl installed
- [ ] Terraform installed (v1.0+)
- [ ] Docker installed
- [ ] GitHub repository access

### GCP Setup
- [ ] Authenticated to GCP: `gcloud auth login`
- [ ] Set project: `gcloud config set project coinbreakr`
- [ ] Service account configured for GitHub Actions
- [ ] Workload Identity Federation configured

### GitHub Setup
- [ ] Repository secrets configured (`WIF`, `IAM`)
- [ ] Repository variables configured (existing ones)
- [ ] Testing branch created

## 🚀 Deployment Steps

### Step 1: Deploy Infrastructure (15 minutes)

```bash
cd terraform-k8s
terraform init
terraform plan -var-file="terraform.testing.tfvars"
terraform apply -var-file="terraform.testing.tfvars"
```

**Verify:**
- [ ] Terraform apply completed successfully
- [ ] GKE cluster created
- [ ] Artifact Registry created
- [ ] Service accounts created
- [ ] Note the outputs (cluster name, registry URL)

### Step 2: Configure kubectl (2 minutes)

```bash
# Install GKE auth plugin (required)
gcloud components install gke-gcloud-auth-plugin

# Configure kubectl
gcloud container clusters get-credentials coinbreakr-testing-cluster \
  --zone us-central1-a \
  --project coinbreakr
```

**Verify:**
- [ ] kubectl configured: `kubectl cluster-info`
- [ ] Nodes visible: `kubectl get nodes`
- [ ] Nodes are ready (STATUS: Ready)

### Step 3: Create Kubernetes Secrets (1 minute)

```bash
kubectl create secret generic coinbreakr-secrets \
  --from-literal=mongo-url='mongodb+srv://username:password@cluster.mongodb.net/Splitlyr?retryWrites=true&w=majority' \
  --from-literal=jwt-secret='your-super-secret-jwt-key-minimum-32-characters-long'
```

**Verify:**
- [ ] Secret created: `kubectl get secrets`
- [ ] Secret contains correct keys: `kubectl describe secret coinbreakr-secrets`

### Step 4: Build and Push Docker Image (5 minutes)

```bash
# Authenticate Docker
gcloud auth configure-docker us-central1-docker.pkg.dev

# Build image
cd services
docker build -t us-central1-docker.pkg.dev/coinbreakr/coinbreakr-testing/services:latest .

# Push image
docker push us-central1-docker.pkg.dev/coinbreakr/coinbreakr-testing/services:latest
```

**Verify:**
- [ ] Docker build successful
- [ ] Image pushed to registry
- [ ] Image visible in GCP Console → Artifact Registry

### Step 5: Deploy to Kubernetes (3 minutes)

```bash
cd ../k8s

# Apply ConfigMap
kubectl apply -f configmap.yaml

# Deploy application
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f hpa.yaml
```

**Verify:**
- [ ] ConfigMap created: `kubectl get configmap`
- [ ] Deployment created: `kubectl get deployments`
- [ ] Pods running: `kubectl get pods`
- [ ] Service created: `kubectl get services`
- [ ] HPA created: `kubectl get hpa`

### Step 6: Wait for External IP (2-3 minutes)

```bash
kubectl get service coinbreakr-api-service -w
```

**Verify:**
- [ ] External IP assigned (not `<pending>`)
- [ ] Note the external IP address

### Step 7: Test the API (1 minute)

```bash
EXTERNAL_IP=$(kubectl get service coinbreakr-api-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
curl http://$EXTERNAL_IP/v1/healthz
```

**Verify:**
- [ ] Health endpoint responds
- [ ] Response is JSON with `"success": true`
- [ ] Database connection is healthy

## ✅ Post-Deployment Verification

### Application Health
- [ ] All pods are running: `kubectl get pods -l app=coinbreakr-api`
- [ ] Pods are ready (2/2 READY)
- [ ] No crash loops or errors
- [ ] Logs look healthy: `kubectl logs -l app=coinbreakr-api`

### Auto-scaling
- [ ] HPA is active: `kubectl get hpa`
- [ ] Current replicas match desired (2)
- [ ] Metrics are available (CPU/Memory percentages shown)

### Load Balancer
- [ ] Service has external IP
- [ ] Health endpoint accessible from internet
- [ ] API endpoints work correctly

### Monitoring
- [ ] Check GCP Console → Kubernetes Engine → Workloads
- [ ] Verify deployment is healthy
- [ ] Check logs in GCP Console

## 🔄 CI/CD Verification

### Test GitHub Actions

1. **Create a test change:**
   ```bash
   git checkout testing
   # Make a small change to services/
   git add .
   git commit -m "test: trigger deployment"
   git push origin testing
   ```

2. **Verify workflows:**
   - [ ] Go to GitHub → Actions
   - [ ] "Build, Push & Deploy to Kubernetes" workflow runs
   - [ ] All jobs complete successfully
   - [ ] New image pushed to registry
   - [ ] Deployment updated in GKE

3. **Verify deployment:**
   ```bash
   kubectl rollout status deployment/coinbreakr-api
   kubectl get pods
   ```
   - [ ] New pods are running
   - [ ] Old pods are terminated
   - [ ] No downtime occurred

## 🧪 Testing Checklist

### API Endpoints
Test key endpoints:

```bash
EXTERNAL_IP=$(kubectl get service coinbreakr-api-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Health check
curl http://$EXTERNAL_IP/v1/healthz

# Register user
curl -X POST http://$EXTERNAL_IP/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://$EXTERNAL_IP/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Verify:**
- [ ] Health endpoint returns 200
- [ ] Register endpoint works
- [ ] Login endpoint works
- [ ] JWT token is returned

### Load Testing (Optional)
```bash
# Install hey (HTTP load generator)
# brew install hey  # macOS
# apt-get install hey  # Ubuntu

# Run load test
hey -n 1000 -c 10 http://$EXTERNAL_IP/v1/healthz
```

**Verify:**
- [ ] All requests succeed
- [ ] Response times are acceptable
- [ ] HPA scales up if needed: `kubectl get hpa -w`

## 🔐 Security Verification

### Secrets
- [ ] Secrets not committed to Git
- [ ] Secrets properly encoded in Kubernetes
- [ ] Application can read secrets

### Images
- [ ] Images scanned for vulnerabilities
- [ ] No critical vulnerabilities
- [ ] Images stored in private registry

### Network
- [ ] Only necessary ports exposed
- [ ] Service account has minimal permissions
- [ ] Workload Identity configured

## 📊 Monitoring Setup

### GCP Console
- [ ] Navigate to Kubernetes Engine → Workloads
- [ ] Verify deployment is visible
- [ ] Check resource usage
- [ ] Review logs

### kubectl Monitoring
```bash
# Watch pods
kubectl get pods -l app=coinbreakr-api -w

# Watch HPA
kubectl get hpa -w

# View events
kubectl get events --sort-by=.metadata.creationTimestamp
```

## 🐛 Troubleshooting Checklist

If something goes wrong:

### Pods Not Starting
```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```
- [ ] Check image pull errors
- [ ] Verify secrets exist
- [ ] Check resource limits

### Service Not Accessible
```bash
kubectl get service coinbreakr-api-service
kubectl get endpoints coinbreakr-api-service
```
- [ ] Verify external IP assigned
- [ ] Check if pods are ready
- [ ] Verify service selector matches pods

### HPA Not Working
```bash
kubectl describe hpa coinbreakr-api-hpa
kubectl top pods
```
- [ ] Verify metrics server is running
- [ ] Check if metrics are available
- [ ] Verify resource requests are set

## 📝 Documentation Review

Before considering deployment complete:

- [ ] Read `KUBERNETES_DEPLOYMENT_GUIDE.md`
- [ ] Review `QUICK_START_K8S.md`
- [ ] Understand `WORKFLOW_COMPARISON.md`
- [ ] Check `GITHUB_ACTIONS_SETUP.md`
- [ ] Review `terraform-k8s/README.md`
- [ ] Review `k8s/README.md`

## 🎉 Deployment Complete!

When all items are checked:

- [ ] Infrastructure deployed
- [ ] Application running
- [ ] External IP accessible
- [ ] Health checks passing
- [ ] Auto-scaling working
- [ ] CI/CD pipeline functional
- [ ] Monitoring configured
- [ ] Documentation reviewed

## 📞 Next Steps

1. **Monitor the deployment** for 24 hours
2. **Test all API endpoints** thoroughly
3. **Verify auto-scaling** under load
4. **Review costs** in GCP Console
5. **Set up alerts** for critical metrics
6. **Document any issues** encountered
7. **Share external IP** with team

## 🧹 Rollback Plan

If you need to rollback:

```bash
# Rollback Kubernetes deployment
kubectl rollout undo deployment/coinbreakr-api

# Or destroy everything
kubectl delete -f k8s/
cd terraform-k8s
terraform destroy -var-file="terraform.testing.tfvars"
```

---

**Environment**: Testing  
**Deployment Type**: Kubernetes on GKE  
**Expected Time**: ~30 minutes total  
**Difficulty**: Intermediate

Good luck with your deployment! 🚀
