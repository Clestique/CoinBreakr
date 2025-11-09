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
                                              │ VM Instances    │
                                              └─────────────────┘
```

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
- Google Cloud SDK
- Expo CLI
- MongoDB (local or cloud)

### 1. Infrastructure Setup
```bash
cd terraform
terraform init
terraform plan -var-file="terraform.main.tfvars"
terraform apply -var-file="terraform.main.tfvars"
```

### 2. Backend Services
```bash
cd services
npm install
cp .env.example .env
# Configure environment variables
npm run dev
```

### 3. Mobile Application
```bash
cd Client
npm install
cp .env.example .env
# Configure API endpoints
npm start
```

### 4. Marketing Website
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
- ✅ Multi-environment support
- ✅ **Auto-scaling capabilities** with CPU-based scaling
- ✅ **Global Load Balancer** with SSL termination
- ✅ **Managed SSL Certificates** for automatic HTTPS
- ✅ **Health Checks** and auto-healing instances
- ✅ Automated deployments
- ✅ DNS management
- ✅ Security and compliance

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

#### Testing Branch (Kubernetes-based) 🆕
```
PR to testing → Docker build test + security scan + K8s validation
Merge to testing → Build Docker image → Push to Artifact Registry → Deploy to GKE → Health checks
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

---

**Project Type**: Full-stack expense splitting platform  
**Architecture**: Microservices with mobile-first approach  
**Deployment**: Multi-environment cloud infrastructure  
**Target Users**: Individuals and groups sharing expenses