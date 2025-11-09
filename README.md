# Expense Splitting Platform

A complete full-stack expense splitting platform with mobile app, backend API, marketing website, and cloud infrastructure. This repository contains all components needed to deploy and maintain a comprehensive expense sharing solution.

## 🏗️ Project Architecture

This project consists of four main components that work together to provide a complete expense splitting solution:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Marketing     │    │   Mobile App    │    │   Backend API   │
│    Website      │    │    (Client)     │    │   (Services)    │
│                 │    │                 │    │                 │
│  Brand Image    │    │ Expense Splitting│    │ User Management │
│  App Downloads  │    │ Friend Management│    │ Friend System   │
│  Information    │    │ Group Creation  │    │ Group Management│
└─────────────────┘    │ Balance Tracking│    │ Expense Tracking│
                       └─────────────────┘    │ Balance Calc    │
                                              └─────────────────┘
                                                       │
                                              ┌─────────────────┐
                                              │ Cloud Infrastructure│
                                              │   (Terraform)   │
                                              │                 │
                                              │ GCP Deployment  │
                                              │ VPC & Networking│
                                              │ DNS Management  │
                                              │ VM + Kubernetes │
                                              └─────────────────┘
```

## 🚀 Deployment Architectures

### Production & Staging (VM-based)
```
Internet → Load Balancer → VM Instances (2-10) → MongoDB
           (SSL/TLS)        (Auto-scaling)
```

### Testing (Kubernetes-based) 🆕
```
Internet → Load Balancer → Kubernetes Pods (2-10) → MongoDB
           (External IP)    (GKE Auto-scaling)
           
┌─────────────────────────────────────────────────────────────────┐
│                    GKE Cluster Architecture                      │
└─────────────────────────────────────────────────────────────────┘

    Internet
        │
        ▼
    Load Balancer (External IP)
        │
        ├─► Pod 1 (API:3000)
        ├─► Pod 2 (API:3000)
        └─► Pod N (API:3000)
             │
             ▼
        Kubernetes Service
             │
        ┌────┴────┐
        │         │
    Node 1    Node N
    (e2-medium)
```

**See [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md) for detailed diagrams**

## 📱 User Journey & System Flow

### 1. **Discovery & Marketing** (`website/`)
```
User discovers app → Visits marketing website → Learns about features → Downloads mobile app
```

**Purpose**: Brand presence and user acquisition
- **Technology**: Next.js 16, TypeScript, Tailwind CSS
- **Features**: SEO-optimized landing pages, app store links, feature showcases
- **Deployment**: Static website hosting (Vercel/Netlify)

### 2. **Mobile Application** (`Client/`)
```
User downloads app → Registers account → Adds friends → Creates groups → Splits expenses → Tracks balances
```

**Purpose**: Core expense splitting functionality
- **Technology**: React Native, Expo, TypeScript
- **Features**: 
  - User authentication and profile management
  - Friend management with contact sync
  - Group creation and member management
  - Expense creation and splitting
  - Real-time balance calculations
  - Settlement tracking
- **Platforms**: iOS and Android via Expo/EAS

### 3. **Backend Services** (`services/`)
```
Mobile app → API requests → Authentication → Business logic → Database operations → Response
```

**Purpose**: Core business logic and data management
- **Technology**: Node.js, Express, MongoDB, JWT
- **Features**:
  - RESTful API with comprehensive endpoints
  - JWT-based authentication system
  - User and friend management
  - Group operations with role-based access
  - Expense tracking with automatic balance calculations
  - Security middleware and input validation
- **Database**: MongoDB with Mongoose ODM

### 4. **Cloud Infrastructure** (`terraform/`)
```
Code deployment → Terraform provisioning → GCP resources → Load balancer → Auto scaling → DNS routing
```

**Purpose**: Scalable cloud infrastructure with high availability
- **Technology**: Terraform, Google Cloud Platform
- **Features**:
  - Multi-environment support (production/staging)
  - **Global HTTP(S) Load Balancer** with SSL termination
  - **Auto Scaling Groups** with health-based scaling
  - **Managed SSL Certificates** for HTTPS security
  - VPC with public/private subnets
  - **Instance Templates** for consistent deployments
  - Cloud DNS management
  - Advanced firewall and security rules
  - Automated infrastructure deployment

## 🔄 Complete System Workflow

### Development to Production Pipeline

1. **Development Phase**
   ```
   Developer codes → Local testing → Git commit → Push to branch
   ```

2. **Infrastructure Provisioning**
   ```
   Terraform plan → Infrastructure validation → Apply changes → Resources created
   ```

3. **Backend Deployment**
   ```
   Services build → Docker containerization → VM deployment → Health checks
   ```

4. **Mobile App Distribution**
   ```
   Client build → EAS build service → App store submission → User downloads
   ```

5. **Website Deployment**
   ```
   Website build → Static optimization → CDN deployment → SEO indexing
   ```

## 📂 Repository Structure

```
├── Client/                      # React Native Mobile Application
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── screens/             # App screens (auth, friends, groups, expenses)
│   │   ├── services/            # API integration and data management
│   │   ├── navigation/          # App navigation setup
│   │   └── theme/               # Design system and styling
│   ├── app.json                 # Expo configuration
│   ├── package.json             # Dependencies and scripts
│   └── README.md                # Mobile app documentation
│
├── services/                    # Node.js Backend API
│   ├── controllers/             # Request handlers and business logic
│   ├── models/                  # Database schemas (User, Group, Expense)
│   ├── routes/                  # API endpoint definitions
│   ├── middleware/              # Authentication and security
│   ├── config/                  # Database and app configuration
│   ├── docker-compose.yml       # Container orchestration
│   ├── package.json             # Dependencies and scripts
│   └── README.md                # Backend API documentation
│
├── website/                     # Next.js Marketing Website
│   ├── src/
│   │   ├── app/                 # Next.js pages (home, contact, privacy)
│   │   ├── components/          # React components (hero, features, footer)
│   │   └── lib/                 # Utility functions
│   ├── public/                  # Static assets
│   ├── next.config.ts           # Next.js configuration
│   ├── package.json             # Dependencies and scripts
│   └── README.md                # Website documentation
│
├── terraform/                   # Infrastructure as Code (VM-based)
│   ├── provider.tf              # GCP provider configuration
│   ├── vpc.tf                   # Network and compute resources
│   ├── dns.tf                   # Domain and DNS management
│   ├── variables.tf             # Input variable definitions
│   ├── terraform.main.tfvars    # Production environment config
│   ├── terraform.staging.tfvars # Staging environment config
│   └── README.md                # Infrastructure documentation
│
├── terraform-k8s/               # Kubernetes Infrastructure (Testing)
│   ├── provider.tf              # GCP and Kubernetes provider config
│   ├── gke.tf                   # GKE cluster configuration
│   ├── artifact-registry.tf     # Docker image registry
│   ├── variables.tf             # Input variable definitions
│   ├── outputs.tf               # Output values
│   ├── terraform.testing.tfvars # Testing environment config
│   └── README.md                # K8s infrastructure documentation
│
├── k8s/                         # Kubernetes Manifests (Testing)
│   ├── deployment.yaml          # Application deployment
│   ├── service.yaml             # LoadBalancer service
│   ├── hpa.yaml                 # Horizontal Pod Autoscaler
│   ├── configmap.yaml           # Configuration
│   ├── secret-template.yaml     # Secret template
│   └── README.md                # K8s deployment guide
│
└── README.md                    # This comprehensive overview
```

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+
- Terraform 1.0+
- Google Cloud SDK + gke-gcloud-auth-plugin
- kubectl
- Docker
- Expo CLI
- MongoDB (local or cloud)

### Option A: VM-based Deployment (Main/Staging)

#### 1. Infrastructure Setup
```bash
cd terraform
terraform init
terraform plan -var-file="terraform.main.tfvars"
terraform apply -var-file="terraform.main.tfvars"
```

#### 2. Backend Services
```bash
cd services
npm install
cp .env.example .env
# Configure environment variables
npm run dev
```

### Option B: Kubernetes Deployment (Testing) 🆕

#### 1. Deploy GKE Infrastructure
```bash
cd terraform-k8s
terraform init
terraform apply -var-file="terraform.testing.tfvars"
```

#### 2. Configure kubectl & Deploy
```bash
# Install auth plugin
gcloud components install gke-gcloud-auth-plugin

# Get cluster credentials
gcloud container clusters get-credentials coinbreakr-testing-cluster \
  --zone us-central1-a --project coinbreakr

# Create secrets
kubectl create secret generic coinbreakr-secrets \
  --from-literal=mongo-url='YOUR_MONGO_URL' \
  --from-literal=jwt-secret='YOUR_JWT_SECRET'

# Deploy application
cd ../k8s
kubectl apply -f .

# Get external IP
kubectl get service coinbreakr-api-service
```

#### 3. Test Deployment
```bash
# Get IP and test
EXTERNAL_IP=$(kubectl get service coinbreakr-api-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
curl http://$EXTERNAL_IP/v1/healthz
```

**📚 Full Kubernetes Guide**: See [START_HERE.md](START_HERE.md) or [KUBERNETES_DEPLOYMENT_GUIDE.md](KUBERNETES_DEPLOYMENT_GUIDE.md)

### Mobile Application & Website

#### 3. Mobile Application
```bash
cd Client
npm install
cp .env.example .env
# Configure API endpoints
npm start
```

#### 4. Marketing Website
```bash
cd website
npm install
npm run dev
```

## 🌐 Environment Management

### Multi-Environment Architecture

#### Production Environment
- **Infrastructure**: `terraform.main.tfvars`
- **API**: Production MongoDB, optimized settings
- **Mobile**: Production builds via EAS
- **Website**: Production deployment with CDN
- **Domain**: `api.${domain}` for API, `${domain}` for website

#### Staging Environment
- **Infrastructure**: `terraform.staging.tfvars`
- **API**: Staging database, debug settings
- **Mobile**: Development builds for testing
- **Website**: Staging deployment for review
- **Domain**: `staging.${domain}` for all services

#### Testing Environment (NEW - Kubernetes)
- **Infrastructure**: `terraform-k8s/terraform.testing.tfvars`
- **Deployment**: Docker containers on GKE
- **API**: Kubernetes deployment with auto-scaling (2-10 pods)
- **Load Balancer**: Kubernetes LoadBalancer service
- **Registry**: GCP Artifact Registry for Docker images
- **Access**: External IP (no DNS configured)

#### Development Environment
- **Infrastructure**: Local or minimal cloud resources
- **API**: Local MongoDB, development settings
- **Mobile**: Expo development server
- **Website**: Local Next.js development server

## 🔐 Security & Best Practices

### Authentication Flow
```
User Registration → JWT Token Generation → API Authentication → Resource Access
```

### Data Security
- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: Brute force protection
- **HTTPS**: SSL/TLS encryption for all communications

### Infrastructure Security
- **Network Segmentation**: VPC with public/private subnets
- **Firewall Rules**: Restrictive access control
- **Environment Isolation**: Separate resources per environment
- **Secret Management**: Environment variables and secure storage

## 📊 Key Features & Capabilities

### Mobile App Features
- ✅ User registration and authentication
- ✅ Friend management with contact sync
- ✅ Group creation and member management
- ✅ Expense creation and splitting
- ✅ Real-time balance calculations
- ✅ Settlement tracking and history
- ✅ Offline support with sync
- ✅ Push notifications (planned)

### Backend API Features
- ✅ RESTful API with 20+ endpoints
- ✅ JWT-based authentication
- ✅ User and friend management
- ✅ Group operations with roles
- ✅ Expense tracking and calculations
- ✅ Automatic balance management
- ✅ Health monitoring and logging

### Infrastructure Features

#### VM-based (Main & Staging)
- ✅ Multi-environment support
- ✅ **Auto-scaling capabilities** with CPU-based scaling (2-10 VMs)
- ✅ **Global Load Balancer** with SSL termination
- ✅ **Managed SSL Certificates** for automatic HTTPS
- ✅ **Health Checks** and auto-healing instances
- ✅ Automated deployments via Packer
- ✅ DNS management with Cloud DNS
- ✅ Security and compliance

#### Kubernetes-based (Testing) 🆕
- ✅ **GKE Cluster** with auto-scaling nodes (1-5)
- ✅ **Horizontal Pod Autoscaler** (2-10 pods)
- ✅ **Docker containerization** with Artifact Registry
- ✅ **Rolling updates** with zero downtime
- ✅ **Health checks** (liveness + readiness probes)
- ✅ **Automated CI/CD** via GitHub Actions
- ✅ **Load Balancer** with external IP
- ✅ **Resource limits** and requests per pod

## 🔧 Development Workflow

### Git Branch Strategy
```
main branch     → Production deployments (VM-based)
staging branch  → Staging environment testing (VM-based)
testing branch  → Testing environment (Kubernetes-based) 🆕
dev branch      → Development and feature work
feature/*       → Individual feature development
```

### Deployment Workflows

#### Main & Staging Branches (VM-based)
```
Push to branch → Packer builds VM image → Terraform deploys → Load balancer routes traffic
```

**Workflow**: `.github/workflows/packer-build.yml`

#### Testing Branch (Kubernetes-based) 🆕
```
PR to testing → Docker build test + security scan + K8s validation
                ↓
Merge to testing → Build Docker image → Push to Artifact Registry 
                   → Deploy to GKE → Health checks
```

**Workflows**: 
- `.github/workflows/docker-test.yml` (PR validation)
- `.github/workflows/docker-push-k8s-deploy.yml` (Deployment)

**Architecture Flow**:
```
Developer
    │
    │ git push origin testing
    │
    ▼
GitHub Actions
    │
    ├─► Build Docker Image
    ├─► Security Scan (Trivy)
    ├─► Push to Artifact Registry
    │   └─► us-central1-docker.pkg.dev/coinbreakr/coinbreakr-testing
    │
    ▼
Deploy to GKE
    │
    ├─► Apply ConfigMap
    ├─► Apply Deployment (2-10 pods)
    ├─► Apply Service (LoadBalancer)
    ├─► Apply HPA (Auto-scaling)
    │
    ▼
Health Check
    └─► curl http://EXTERNAL_IP/v1/healthz
```

### CI/CD Pipeline (Planned)
```
Code Push → Automated Tests → Build → Deploy → Health Checks → Monitoring
```

### Testing Strategy
- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Complete user flow testing
- **Performance Tests**: Load and stress testing

## 📈 Monitoring & Maintenance

### Health Monitoring
- **API Health**: `/v1/healthz` endpoint monitoring
- **Database**: Connection and performance monitoring
- **Infrastructure**: GCP monitoring and alerting
- **Mobile App**: Crash reporting and analytics

### Performance Metrics
- **API Response Times**: Track endpoint performance
- **Database Queries**: Monitor query efficiency
- **Mobile App**: Track user engagement and performance
- **Website**: Core Web Vitals and SEO metrics

## 🚧 Future Enhancements

### Planned Features
- [ ] Push notifications for expense updates
- [ ] Receipt scanning with OCR
- [ ] Multi-currency support
- [ ] Advanced analytics and reporting
- [ ] Integration with payment platforms
- [ ] Web application version
- [ ] Advanced group permissions
- [ ] Expense categories and budgeting

### Infrastructure Improvements
- ✅ **Auto-scaling implementation** (CPU-based with 2-10 instances)
- ✅ **Load balancer setup** (Global HTTP(S) with SSL)
- [ ] CDN integration
- [ ] Advanced monitoring and alerting
- [ ] Backup and disaster recovery
- [ ] Multi-region deployment

## 📋 Essential Commands

### Kubernetes (Testing Environment)

```bash
# Get cluster status
kubectl get all -l app=coinbreakr-api

# View pods
kubectl get pods -l app=coinbreakr-api

# View logs
kubectl logs -f deployment/coinbreakr-api

# Get external IP
kubectl get service coinbreakr-api-service

# Check auto-scaling
kubectl get hpa

# Update deployment
kubectl set image deployment/coinbreakr-api \
  api=us-central1-docker.pkg.dev/coinbreakr/coinbreakr-testing/services:NEW_TAG

# Rollback deployment
kubectl rollout undo deployment/coinbreakr-api

# Scale manually
kubectl scale deployment coinbreakr-api --replicas=5

# Restart deployment
kubectl rollout restart deployment/coinbreakr-api

# Get load balancer IP
kubectl get service coinbreakr-api-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}'

# Test API
curl http://$(kubectl get service coinbreakr-api-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}')/v1/healthz
```

**Full Command Reference**: [COMMANDS_REFERENCE.md](COMMANDS_REFERENCE.md)  
**Kubernetes Guide**: [k8s/README.md](k8s/README.md)

### Terraform

```bash
# VM Infrastructure (Main/Staging)
cd terraform
terraform init
terraform plan -var-file="terraform.main.tfvars"
terraform apply -var-file="terraform.main.tfvars"

# Kubernetes Infrastructure (Testing)
cd terraform-k8s
terraform init
terraform plan -var-file="terraform.testing.tfvars"
terraform apply -var-file="terraform.testing.tfvars"
```

### Docker

```bash
# Build image
docker build -t coinbreakr-api:latest ./services

# Push to Artifact Registry
docker tag coinbreakr-api:latest \
  us-central1-docker.pkg.dev/coinbreakr/coinbreakr-testing/services:latest
docker push us-central1-docker.pkg.dev/coinbreakr/coinbreakr-testing/services:latest
```

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch from `dev`
3. Set up local development environment
4. Make changes and test thoroughly
5. Submit pull request with detailed description

### Code Standards
- **TypeScript**: Strict type checking
- **ESLint**: Follow configured rules
- **Testing**: Write tests for new features
- **Documentation**: Update relevant README files

## 📄 License

This project is proprietary software. All rights reserved.

## 📚 Documentation

### Getting Started
- **[START_HERE.md](START_HERE.md)** - Quick start guide for Kubernetes
- **[QUICK_START_K8S.md](QUICK_START_K8S.md)** - 5-minute Kubernetes setup
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Step-by-step deployment

### Architecture & Design
- **[ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md)** - Visual architecture diagrams
- **[WORKFLOW_COMPARISON.md](WORKFLOW_COMPARISON.md)** - VM vs Kubernetes comparison
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - What was built

### Deployment Guides
- **[KUBERNETES_DEPLOYMENT_GUIDE.md](KUBERNETES_DEPLOYMENT_GUIDE.md)** - Complete K8s guide
- **[terraform-k8s/README.md](terraform-k8s/README.md)** - Terraform infrastructure
- **[k8s/README.md](k8s/README.md)** - Kubernetes manifests with detailed commands
- **[DNS_SETUP_GUIDE.md](DNS_SETUP_GUIDE.md)** - Domain and DNS configuration

### Operations & Maintenance
- **[COMMANDS_REFERENCE.md](COMMANDS_REFERENCE.md)** - Daily command reference
- **[GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md)** - CI/CD configuration
- **[GET_LOAD_BALANCER_IP.sh](GET_LOAD_BALANCER_IP.sh)** - Get K8s external IP (Bash)
- **[GET_LOAD_BALANCER_IP.ps1](GET_LOAD_BALANCER_IP.ps1)** - Get K8s external IP (PowerShell)

### Component Documentation
- **[services/README.md](services/README.md)** - Backend API documentation
- **[terraform/README.md](terraform/README.md)** - VM infrastructure documentation
- **[Client/README.md](Client/README.md)** - Mobile app documentation
- **[website/README.md](website/README.md)** - Marketing website documentation

---

**Project Type**: Full-stack expense splitting platform  
**Architecture**: Microservices with mobile-first approach  
**Deployment**: Multi-environment cloud infrastructure (VM + Kubernetes)  
**Target Users**: Individuals and groups sharing expenses  
**Kubernetes**: ✅ Testing environment ready  
**Auto-scaling**: ✅ Pods (2-10) + Nodes (1-5)