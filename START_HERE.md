# 🚀 START HERE - Kubernetes Testing Environment

Welcome! This guide will get you started with the new Kubernetes-based testing environment.

## ✅ What Was Built

A complete Kubernetes infrastructure for the **testing branch** that includes:

- ✅ **GKE Cluster** - Managed Kubernetes on Google Cloud
- ✅ **Docker Registry** - Private image storage (Artifact Registry)
- ✅ **Auto-scaling** - Pods (2-10) and Nodes (1-5)
- ✅ **Load Balancer** - External access with health checks
- ✅ **CI/CD** - Automated build and deployment via GitHub Actions
- ✅ **Zero Downtime** - Rolling updates with health checks

## 🎯 Quick Start (Choose Your Path)

### Path 1: I Want to Deploy NOW (5 minutes)
→ **[QUICK_START_K8S.md](QUICK_START_K8S.md)**

### Path 2: I Want a Step-by-Step Guide (30 minutes)
→ **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)**

### Path 3: I Want to Understand Everything First
→ **[KUBERNETES_DEPLOYMENT_GUIDE.md](KUBERNETES_DEPLOYMENT_GUIDE.md)**

## 📚 Essential Documentation

### Must Read (Priority Order)
1. **[K8S_INDEX.md](K8S_INDEX.md)** - Documentation index (you are here!)
2. **[QUICK_START_K8S.md](QUICK_START_K8S.md)** - Fast deployment
3. **[COMMANDS_REFERENCE.md](COMMANDS_REFERENCE.md)** - Daily commands

### Important to Know
4. **[WORKFLOW_COMPARISON.md](WORKFLOW_COMPARISON.md)** - VM vs Kubernetes
5. **[ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md)** - Visual diagrams
6. **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - What was built

### Reference Documentation
7. **[terraform-k8s/README.md](terraform-k8s/README.md)** - Infrastructure code
8. **[k8s/README.md](k8s/README.md)** - Kubernetes manifests
9. **[GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md)** - CI/CD setup

## 🔑 Key Concepts

### Branch Strategy
- **main** → Production (VM-based) - NO CHANGES
- **staging** → Staging (VM-based) - NO CHANGES
- **testing** → Testing (Kubernetes) - NEW! 🆕

### Deployment Flow
```
Push to testing → GitHub Actions → Build Docker → Push to Registry → Deploy to GKE
```

### No Impact on Existing Infrastructure
The testing branch is **completely separate** from main/staging. Your existing VM-based infrastructure is untouched!

## 🚀 Deployment in 3 Steps

### Step 1: Deploy Infrastructure (15 min)
```bash
cd terraform-k8s
terraform init
terraform apply -var-file="terraform.testing.tfvars"
```

### Step 2: Create Secrets (1 min)
```bash
# Install GKE auth plugin
gcloud components install gke-gcloud-auth-plugin

# Configure kubectl
gcloud container clusters get-credentials coinbreakr-testing-cluster \
  --zone us-central1-a --project coinbreakr

# Create secrets
kubectl create secret generic coinbreakr-secrets \
  --from-literal=mongo-url='YOUR_MONGO_URL' \
  --from-literal=jwt-secret='YOUR_JWT_SECRET'
```

### Step 3: Deploy Application (5 min)
```bash
# Option A: Automated (push to testing branch)
git push origin testing

# Option B: Manual
cd k8s
kubectl apply -f .
```

## 📊 What You Get

### Infrastructure
- GKE cluster in us-central1-a
- 1-5 auto-scaling nodes (e2-medium)
- Private Docker registry
- Load balancer with external IP

### Application
- 2-10 auto-scaling pods
- Rolling updates (zero downtime)
- Health checks and auto-healing
- Resource limits and requests

### CI/CD
- Automated Docker builds
- Security scanning (Trivy)
- Automated deployments
- Health verification

## 🎓 Learning Resources

### For Beginners
1. Read [QUICK_START_K8S.md](QUICK_START_K8S.md)
2. Follow [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
3. Bookmark [COMMANDS_REFERENCE.md](COMMANDS_REFERENCE.md)

### For Experienced Users
1. Review [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md)
2. Study [terraform-k8s/README.md](terraform-k8s/README.md)
3. Customize as needed

## 🔧 Common Commands

```bash
# View pods
kubectl get pods -l app=coinbreakr-api

# View logs
kubectl logs -f deployment/coinbreakr-api

# Get external IP
kubectl get service coinbreakr-api-service

# Check scaling
kubectl get hpa

# Update deployment
kubectl set image deployment/coinbreakr-api api=NEW_IMAGE

# Rollback
kubectl rollout undo deployment/coinbreakr-api
```

## 🐛 Troubleshooting

### Pods not starting?
```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```

### Service not accessible?
```bash
kubectl get service coinbreakr-api-service
kubectl get endpoints coinbreakr-api-service
```

### Need more help?
→ [KUBERNETES_DEPLOYMENT_GUIDE.md](KUBERNETES_DEPLOYMENT_GUIDE.md) (Troubleshooting section)

## 💰 Cost Estimate

- **Minimum** (idle): ~$45-50/month
- **Maximum** (peak): ~$145-150/month
- **Average** (typical): ~$75-100/month

## ✅ Pre-Deployment Checklist

Before you start:
- [ ] GCP account with billing enabled
- [ ] Project ID: `coinbreakr`
- [ ] gcloud CLI installed
- [ ] kubectl installed
- [ ] Terraform installed
- [ ] Docker installed
- [ ] MongoDB connection string ready
- [ ] JWT secret ready

## 🎯 Success Criteria

Your deployment is successful when:
- [ ] Infrastructure deployed via Terraform
- [ ] GKE cluster is running
- [ ] Pods are healthy (2/2 ready)
- [ ] External IP is assigned
- [ ] Health endpoint responds: `curl http://EXTERNAL_IP/v1/healthz`
- [ ] GitHub Actions deploy automatically

## 📞 Next Steps

1. **Deploy** using [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
2. **Test** using [COMMANDS_REFERENCE.md](COMMANDS_REFERENCE.md)
3. **Monitor** in GCP Console
4. **Iterate** and improve

## 🎉 You're Ready!

Choose your path above and get started. All documentation is comprehensive and tested.

**Good luck with your deployment!** 🚀

---

**Quick Links:**
- [Quick Start](QUICK_START_K8S.md) - 5-minute setup
- [Full Guide](KUBERNETES_DEPLOYMENT_GUIDE.md) - Complete documentation
- [Commands](COMMANDS_REFERENCE.md) - Daily operations
- [Index](K8S_INDEX.md) - All documentation

**Environment**: Testing Branch  
**Infrastructure**: Kubernetes on GKE  
**Status**: Ready to Deploy ✅
