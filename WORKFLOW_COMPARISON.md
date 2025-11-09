# Workflow Comparison: VM vs Kubernetes

Complete comparison of deployment workflows for different branches.

## 🌿 Branch Strategy

### Main Branch (Production)
- **Infrastructure**: Packer + Terraform (VMs)
- **Deployment**: VM images with auto-scaling groups
- **Load Balancer**: GCP Global HTTP(S) Load Balancer
- **Domain**: `api.splitlyr.clestiq.com`

### Staging Branch
- **Infrastructure**: Packer + Terraform (VMs)
- **Deployment**: VM images with auto-scaling groups
- **Load Balancer**: GCP Global HTTP(S) Load Balancer
- **Domain**: `staging.splitlyr.clestiq.com`

### Testing Branch (NEW)
- **Infrastructure**: Terraform (GKE)
- **Deployment**: Docker containers on Kubernetes
- **Load Balancer**: Kubernetes LoadBalancer Service
- **Access**: External IP (no DNS configured)

## 🔄 CI/CD Workflows

### Main & Staging Branches (Existing - NO CHANGES)

#### On Pull Request:
```
1. Lint code (ESLint)
2. Security audit (npm audit)
3. Validate Packer template
4. Validate Terraform configuration
```

#### On Push/Merge:
```
1. Create services.zip
2. Build VM image with Packer
   └─ Install Node.js
   └─ Deploy application code
   └─ Configure systemd service
3. Image stored in GCP Compute Engine
4. Manual Terraform apply to use new image
```

**Workflow Files:**
- `.github/workflows/ci.yml` - PR validation
- `.github/workflows/packer-build.yml` - Image building

---

### Testing Branch (NEW)

#### On Pull Request to Testing:
```
1. Lint code (ESLint)
2. Security audit (npm audit)
3. Docker build test
4. Dockerfile linting (Hadolint)
5. Security scan (Trivy)
6. Container startup test
7. Validate Kubernetes manifests
8. Validate Terraform (K8s)
```

#### On Push/Merge to Testing:
```
1. Build Docker image
2. Security scan (Trivy)
3. Push to Artifact Registry
   └─ Tag: commit-sha
   └─ Tag: latest
   └─ Tag: timestamp
4. Deploy to GKE
   └─ Apply ConfigMap
   └─ Apply Deployment
   └─ Apply Service (LoadBalancer)
   └─ Apply HPA
5. Update deployment with new image
6. Wait for rollout completion
7. Health check verification
```

**Workflow Files:**
- `.github/workflows/ci.yml` - PR validation (updated)
- `.github/workflows/docker-test.yml` - Docker & K8s validation
- `.github/workflows/docker-push-k8s-deploy.yml` - Build & deploy

## 📊 Infrastructure Comparison

### VM-Based (Main & Staging)

**Components:**
```
VPC Network
├── Public Subnets (3 zones)
├── Private Subnets (3 zones)
├── Firewall Rules
└── Router

Compute Resources
├── Instance Template
├── Managed Instance Group
│   ├── Auto-scaling (2-10 instances)
│   ├── Health Checks
│   └── Auto-healing
└── Load Balancer
    ├── Backend Service
    ├── URL Map
    ├── SSL Certificate
    └── Global Forwarding Rule

DNS
└── Cloud DNS Zone
    ├── api.splitlyr.clestiq.com (main)
    └── staging.splitlyr.clestiq.com (staging)
```

**Terraform Files:**
- `terraform/provider.tf`
- `terraform/vpc.tf`
- `terraform/load_balancer.tf`
- `terraform/dns.tf`
- `terraform/variables.tf`

---

### Kubernetes-Based (Testing)

**Components:**
```
GKE Cluster
├── Control Plane (managed)
├── Node Pool
│   ├── Auto-scaling (1-5 nodes)
│   ├── Auto-repair
│   └── Auto-upgrade
└── Workload Identity

Artifact Registry
├── Docker Repository
├── Image Cleanup Policies
└── IAM Permissions

Kubernetes Resources
├── Deployment (2-10 pods)
├── Service (LoadBalancer)
├── HPA (CPU/Memory based)
├── ConfigMap
└── Secrets
```

**Terraform Files:**
- `terraform-k8s/provider.tf`
- `terraform-k8s/gke.tf`
- `terraform-k8s/artifact-registry.tf`
- `terraform-k8s/variables.tf`
- `terraform-k8s/outputs.tf`

**Kubernetes Files:**
- `k8s/deployment.yaml`
- `k8s/service.yaml`
- `k8s/hpa.yaml`
- `k8s/configmap.yaml`
- `k8s/secret-template.yaml`

## ⚡ Deployment Speed

### VM-Based
- **Image Build**: 10-15 minutes
- **Instance Replacement**: 5-10 minutes
- **Total**: ~15-25 minutes

### Kubernetes-Based
- **Docker Build**: 2-3 minutes
- **Push to Registry**: 1-2 minutes
- **K8s Rollout**: 2-3 minutes
- **Total**: ~5-8 minutes

## 💰 Cost Comparison

### VM-Based (Staging)
```
- 1-5 e2-medium instances
- Load Balancer
- Cloud DNS
- Persistent Disks
Estimated: $50-150/month
```

### Kubernetes-Based (Testing)
```
- 1-5 e2-medium nodes
- GKE management fee
- Load Balancer
- Artifact Registry storage
Estimated: $75-175/month
```

## 🔄 Scaling Comparison

### VM-Based
- **Metric**: CPU utilization
- **Threshold**: 70%
- **Scale Range**: 2-10 instances (main), 1-5 (staging)
- **Granularity**: Entire VM instance
- **Time**: 3-5 minutes to add instance

### Kubernetes-Based
- **Metrics**: CPU + Memory utilization
- **Thresholds**: 70% CPU, 80% Memory
- **Scale Range**: 2-10 pods, 1-5 nodes
- **Granularity**: Individual containers
- **Time**: 30 seconds to add pod, 2-3 minutes to add node

## 🛡️ Security Comparison

### VM-Based
- ✅ Network isolation (VPC)
- ✅ Firewall rules
- ✅ Service accounts
- ✅ SSL/TLS termination
- ✅ Health checks
- ⚠️ OS-level patching required

### Kubernetes-Based
- ✅ Network isolation (VPC)
- ✅ Workload Identity
- ✅ Service accounts
- ✅ Container isolation
- ✅ Image scanning
- ✅ Automatic node updates
- ✅ Pod security policies

## 📈 Monitoring & Logging

### VM-Based
- GCP Cloud Monitoring
- VM instance metrics
- Application logs via systemd
- Load balancer metrics

### Kubernetes-Based
- GCP Cloud Monitoring
- GKE cluster metrics
- Pod/container metrics
- kubectl logs
- Kubernetes events
- HPA metrics

## 🔧 Management Operations

### Update Application

**VM-Based:**
```bash
# Build new image
cd packer
packer build ...

# Update Terraform
cd terraform
terraform apply -var="image_family=new-family"
```

**Kubernetes-Based:**
```bash
# Build and push
docker build -t <registry>/services:v1.0.1 .
docker push <registry>/services:v1.0.1

# Update deployment
kubectl set image deployment/coinbreakr-api api=<registry>/services:v1.0.1
```

### Rollback

**VM-Based:**
```bash
# Update to previous image family
terraform apply -var="image_family=previous-family"
```

**Kubernetes-Based:**
```bash
# Rollback deployment
kubectl rollout undo deployment/coinbreakr-api
```

### View Logs

**VM-Based:**
```bash
# SSH to instance
gcloud compute ssh instance-name

# View logs
sudo journalctl -u coinbreakr-api -f
```

**Kubernetes-Based:**
```bash
# View logs
kubectl logs -f deployment/coinbreakr-api

# View specific pod
kubectl logs -f <pod-name>
```

## 🎯 When to Use Each

### Use VM-Based (Main/Staging)
- ✅ Production workloads
- ✅ Stable, long-running deployments
- ✅ Simpler infrastructure
- ✅ Lower operational complexity
- ✅ Established monitoring

### Use Kubernetes-Based (Testing)
- ✅ Rapid iteration
- ✅ Frequent deployments
- ✅ Microservices architecture
- ✅ Advanced scaling requirements
- ✅ Container-native workflows
- ✅ Development/testing environments

## 🚀 Migration Path

To migrate from VM to Kubernetes:

1. **Test in Testing Branch**
   - Deploy to testing environment
   - Validate functionality
   - Monitor performance

2. **Create Staging K8s**
   - Duplicate terraform-k8s for staging
   - Update workflows
   - Test with staging data

3. **Production Migration**
   - Create production K8s cluster
   - Blue-green deployment
   - Gradual traffic shift
   - Monitor and validate

---

**Current Status:**
- ✅ Main: VM-based (production)
- ✅ Staging: VM-based (staging)
- ✅ Testing: Kubernetes-based (testing)
