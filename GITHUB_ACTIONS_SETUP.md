# GitHub Actions Setup Guide

Configuration guide for GitHub Actions workflows.

## 🔐 Required Secrets

These secrets are already configured for main/staging and will work for testing:

### Existing Secrets (No Changes Needed)
- `WIF` - Workload Identity Federation provider
- `IAM` - Service account email for authentication

## 📝 Required Variables

Add these to your GitHub repository settings:

### Existing Variables (Already Configured)
- `GCP_PROJECT_ID` = `coinbreakr`
- `SOURCE_IMAGE_FAMILY` = (for Packer)
- `SOURCE_IMAGE_PROJECT_ID` = (for Packer)
- `IMAGE_NAME_VALIDATE` = (for Packer)
- `IMAGE_FAMILY_VALIDATE` = (for Packer)
- `ZONE` = `us-central1-a`
- `MACHINE_TYPE_PACKER` = (for Packer)
- `USERNAME_PACKER` = (for Packer)
- `DISK_SIZE` = (for Packer)
- `DISK_TYPE` = (for Packer)
- `NETWORK` = (for Packer)
- `SUBNETWORK` = (for Packer)

### No New Variables Needed!

All Kubernetes-specific configuration is hardcoded in the workflows:
- GKE cluster name: `coinbreakr-testing-cluster`
- Artifact Registry: `us-central1-docker.pkg.dev`
- Repository: `coinbreakr-testing`
- Region: `us-central1`
- Zone: `us-central1-a`

## 🔧 How to Add Variables (If Needed)

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **Variables** tab
4. Click **New repository variable**
5. Add name and value
6. Click **Add variable**

## 🔄 Workflow Triggers

### CI Workflow (`.github/workflows/ci.yml`)
**Triggers on:**
- Pull requests to `main`, `staging`, or `testing` branches

**Jobs:**
- Lint and code quality
- Security audit
- Packer validation
- Terraform validation

### Docker Test Workflow (`.github/workflows/docker-test.yml`)
**Triggers on:**
- Pull requests to `testing` branch

**Jobs:**
- Docker build test
- Security scanning (Trivy)
- Container startup test
- Kubernetes manifest validation
- Terraform validation (K8s)

### Docker Push & Deploy Workflow (`.github/workflows/docker-push-k8s-deploy.yml`)
**Triggers on:**
- Push/merge to `testing` branch

**Jobs:**
- Build Docker image
- Security scan
- Push to Artifact Registry
- Deploy to GKE
- Health checks

### Packer Build Workflow (`.github/workflows/packer-build.yml`)
**Triggers on:**
- Push/merge to `main` or `staging` branches

**Jobs:**
- Build VM image with Packer
- Store in GCP Compute Engine

### Cleanup Workflow (`.github/workflows/cleanup-staging.yml`)
**Triggers on:**
- Daily schedule (2 AM UTC)
- Manual trigger

**Jobs:**
- Delete old staging VM instances (>7 days)

## 🔍 Workflow Permissions

All workflows use Workload Identity Federation for secure authentication:

```yaml
permissions:
  id-token: write
  contents: read
```

This allows workflows to authenticate to GCP without storing service account keys.

## 🧪 Testing Workflows Locally

### Test Docker Build
```bash
cd services
docker build -t coinbreakr-api:test .
docker run -d -p 3000:3000 \
  -e MONGO_URL="mongodb://test:test@localhost:27017/test" \
  -e JWT_SECRET="test-secret" \
  coinbreakr-api:test
```

### Test Kubernetes Manifests
```bash
kubectl apply --dry-run=client -f k8s/deployment.yaml
kubectl apply --dry-run=client -f k8s/service.yaml
kubectl apply --dry-run=client -f k8s/hpa.yaml
```

### Test Terraform
```bash
cd terraform-k8s
terraform init
terraform validate
terraform plan -var-file="terraform.testing.tfvars"
```

## 📊 Workflow Status

Check workflow status:
1. Go to **Actions** tab in GitHub
2. View recent workflow runs
3. Click on a run to see details
4. View logs for each job

## 🐛 Troubleshooting

### Workflow Fails on Authentication
- Check `WIF` and `IAM` secrets are correct
- Verify service account has required permissions
- Check Workload Identity Federation is configured

### Docker Build Fails
- Check Dockerfile syntax
- Verify all dependencies are available
- Check for security vulnerabilities

### Kubernetes Deployment Fails
- Verify GKE cluster exists
- Check kubectl connection
- Verify secrets are created
- Check image exists in Artifact Registry

### Terraform Fails
- Check GCP APIs are enabled
- Verify service account permissions
- Check for resource conflicts
- Review Terraform state

## 📈 Monitoring Workflows

### View Workflow Logs
```bash
# Using GitHub CLI
gh run list
gh run view <run-id>
gh run view <run-id> --log
```

### Workflow Artifacts
Some workflows upload artifacts:
- ESLint results
- Security scan reports
- Terraform plans

Access these in the workflow run summary.

## 🔄 Workflow Dependencies

```
Pull Request to testing
├── ci.yml (validation)
└── docker-test.yml (Docker & K8s validation)

Merge to testing
└── docker-push-k8s-deploy.yml (build & deploy)

Pull Request to main/staging
└── ci.yml (validation)

Merge to main/staging
└── packer-build.yml (VM image build)

Daily Schedule
└── cleanup-staging.yml (cleanup old instances)
```

## ✅ Checklist for New Setup

- [ ] Verify `WIF` and `IAM` secrets exist
- [ ] Verify GCP project ID is correct
- [ ] Deploy Terraform infrastructure first
- [ ] Create Kubernetes secrets manually
- [ ] Test Docker build locally
- [ ] Create testing branch
- [ ] Push to testing branch
- [ ] Monitor workflow execution
- [ ] Verify deployment in GKE
- [ ] Test API endpoint

---

**Note**: The testing branch workflows are completely independent from main/staging workflows. No changes to existing workflows are required!
