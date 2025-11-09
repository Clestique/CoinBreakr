# Kubernetes Manifests

Kubernetes deployment manifests for the CoinBreakr API testing environment.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP/HTTPS
                             │
                    ┌────────▼────────┐
                    │  Load Balancer  │
                    │  (External IP)  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐         ┌────▼────┐         ┌────▼────┐
   │  Pod 1  │         │  Pod 2  │   ...   │  Pod N  │
   │         │         │         │         │         │
   │ API:3000│         │ API:3000│         │ API:3000│
   └────┬────┘         └────┬────┘         └────┬────┘
        │                   │                    │
        └───────────────────┼────────────────────┘
                            │
                   ┌────────▼────────┐
                   │   Kubernetes    │
                   │     Service     │
                   └────────┬────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼────┐         ┌───▼────┐         ┌───▼────┐
   │ Node 1  │         │ Node 2 │   ...   │ Node N │
   │e2-medium│         │e2-medium│         │e2-medium│
   └─────────┘         └────────┘         └────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                   ┌────────▼────────┐
                   │   GKE Cluster   │
                   │  (us-central1)  │
                   └─────────────────┘
```

## 📁 Files

- `deployment.yaml` - Main application deployment with 2-10 replicas
- `service.yaml` - LoadBalancer service for external access
- `hpa.yaml` - Horizontal Pod Autoscaler (CPU/Memory based)
- `configmap.yaml` - Non-sensitive configuration
- `secret-template.yaml` - Template for secrets (DO NOT commit actual secrets)

## 🚀 Quick Deploy

### 1. Create Secrets First
```bash
kubectl create secret generic coinbreakr-secrets \
  --from-literal=mongo-url='mongodb+srv://username:password@cluster.mongodb.net/Splitlyr?retryWrites=true&w=majority' \
  --from-literal=jwt-secret='your-super-secret-jwt-key-here-make-it-long-and-random'
```

### 2. Apply ConfigMap
```bash
kubectl apply -f configmap.yaml
```

### 3. Deploy Application
```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f hpa.yaml
```

### 4. Verify Deployment
```bash
kubectl get deployments
kubectl get pods
kubectl get services
kubectl get hpa
```

## 🔍 Check Status

### Get Service External IP
```bash
kubectl get service coinbreakr-api-service
```

Wait for `EXTERNAL-IP` to be assigned (may take 2-3 minutes).

### Test the API
```bash
# Get the external IP
EXTERNAL_IP=$(kubectl get service coinbreakr-api-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Test health endpoint
curl http://$EXTERNAL_IP/v1/healthz
```

### View Logs
```bash
# All pods
kubectl logs -l app=coinbreakr-api

# Specific pod
kubectl logs -f <pod-name>

# Follow logs
kubectl logs -f deployment/coinbreakr-api
```

## 📊 Monitoring

### Pod Status
```bash
kubectl get pods -l app=coinbreakr-api
kubectl describe pod <pod-name>
```

### HPA Status
```bash
kubectl get hpa coinbreakr-api-hpa
kubectl describe hpa coinbreakr-api-hpa
```

### Resource Usage
```bash
kubectl top pods
kubectl top nodes
```

## 🔄 Update Deployment

### Update Image
```bash
kubectl set image deployment/coinbreakr-api \
  api=us-central1-docker.pkg.dev/coinbreakr/coinbreakr-testing/services:NEW_TAG
```

### Rollout Status
```bash
kubectl rollout status deployment/coinbreakr-api
```

### Rollback
```bash
kubectl rollout undo deployment/coinbreakr-api
```

## 🛠️ Troubleshooting

### Pod Not Starting
```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```

### Image Pull Errors
```bash
# Check if secret exists
kubectl get secrets

# Verify service account
kubectl describe serviceaccount default
```

### Service Not Accessible
```bash
# Check service
kubectl describe service coinbreakr-api-service

# Check endpoints
kubectl get endpoints coinbreakr-api-service
```

## 🔐 Secrets Management

### View Secrets (names only)
```bash
kubectl get secrets
```

### Update Secret
```bash
kubectl delete secret coinbreakr-secrets
kubectl create secret generic coinbreakr-secrets \
  --from-literal=mongo-url='NEW_MONGO_URL' \
  --from-literal=jwt-secret='NEW_JWT_SECRET'

# Restart pods to pick up new secret
kubectl rollout restart deployment/coinbreakr-api
```

## 📈 Scaling

### Manual Scaling
```bash
kubectl scale deployment coinbreakr-api --replicas=5
```

### Auto-scaling (HPA)
The HPA automatically scales between 2-10 pods based on:
- CPU utilization: 70% threshold
- Memory utilization: 80% threshold

## 🧹 Cleanup

### Delete All Resources
```bash
kubectl delete -f hpa.yaml
kubectl delete -f service.yaml
kubectl delete -f deployment.yaml
kubectl delete -f configmap.yaml
kubectl delete secret coinbreakr-secrets
```

## 🔧 Configuration

### Environment Variables

**From ConfigMap:**
- `JWT_EXPIRES_IN`: JWT token expiration time
- `RATE_LIMIT_WINDOW_MS`: Rate limiting window
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window

**From Secrets:**
- `MONGO_URL`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret

### Resource Limits

**Per Pod:**
- Requests: 256Mi memory, 250m CPU
- Limits: 512Mi memory, 500m CPU

**Auto-scaling:**
- Min replicas: 2
- Max replicas: 10
- Scale up: Fast (30s stabilization)
- Scale down: Slow (300s stabilization)

## 🏥 Health Checks

**Liveness Probe:**
- Endpoint: `/v1/healthz`
- Initial delay: 30s
- Period: 10s
- Failure threshold: 3

**Readiness Probe:**
- Endpoint: `/v1/healthz`
- Initial delay: 10s
- Period: 5s
- Failure threshold: 3

## 🔄 Auto-scaling Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Auto-scaling Triggers                         │
└─────────────────────────────────────────────────────────────────┘

    High Load
        │
        ├─► CPU > 70%  ──┐
        │                │
        └─► Memory > 80% ┘
                │
                ▼
        ┌───────────────┐
        │      HPA      │
        │  (Horizontal  │
        │     Pod       │
        │  Autoscaler)  │
        └───────┬───────┘
                │
                ├─► Scale Up Pods (2 → 10)
                │   └─► Add new pods to deployment
                │
                ▼
        More pods needed?
                │
                ├─► Yes: Node pool scales up (1 → 5)
                │        └─► GKE adds new nodes
                │
                └─► No: Use existing nodes

    Low Load
        │
        ├─► CPU < 70%  ──┐
        │                │
        └─► Memory < 80% ┘
                │
                ▼
        ┌───────────────┐
        │      HPA      │
        └───────┬───────┘
                │
                ├─► Scale Down Pods (10 → 2)
                │   └─► Remove pods (5 min stabilization)
                │
                ▼
        Nodes underutilized?
                │
                └─► Yes: Node pool scales down (5 → 1)
                         └─► GKE removes nodes
```

## 📊 Detailed Command Reference

### Deployment Commands

```bash
# Apply all manifests at once
kubectl apply -f .

# Apply specific manifest
kubectl apply -f deployment.yaml

# Apply with dry-run (validation)
kubectl apply -f deployment.yaml --dry-run=client

# View applied manifest
kubectl get deployment coinbreakr-api -o yaml

# Edit deployment live
kubectl edit deployment coinbreakr-api

# Delete deployment
kubectl delete -f deployment.yaml
```

### Pod Management

```bash
# List all pods
kubectl get pods

# List pods with labels
kubectl get pods -l app=coinbreakr-api

# List pods with more details
kubectl get pods -o wide

# Watch pods in real-time
kubectl get pods -w

# Describe specific pod
kubectl describe pod <pod-name>

# Get pod YAML
kubectl get pod <pod-name> -o yaml

# Get pod JSON
kubectl get pod <pod-name> -o json

# Execute command in pod
kubectl exec <pod-name> -- env

# Interactive shell in pod
kubectl exec -it <pod-name> -- /bin/sh

# Copy files from pod
kubectl cp <pod-name>:/path/to/file ./local-file

# Copy files to pod
kubectl cp ./local-file <pod-name>:/path/to/file
```

### Logging & Debugging

```bash
# View logs from all pods
kubectl logs -l app=coinbreakr-api

# Follow logs from deployment
kubectl logs -f deployment/coinbreakr-api

# View logs from specific pod
kubectl logs <pod-name>

# Follow logs from specific pod
kubectl logs -f <pod-name>

# View previous pod logs (if crashed)
kubectl logs <pod-name> --previous

# View logs with timestamps
kubectl logs <pod-name> --timestamps

# View last 100 lines
kubectl logs <pod-name> --tail=100

# View logs since 1 hour ago
kubectl logs <pod-name> --since=1h

# Stream logs from all containers
kubectl logs -f deployment/coinbreakr-api --all-containers=true
```

### Service & Networking

```bash
# Get services
kubectl get services

# Get service details
kubectl get service coinbreakr-api-service

# Describe service
kubectl describe service coinbreakr-api-service

# Get service YAML
kubectl get service coinbreakr-api-service -o yaml

# Get external IP
kubectl get service coinbreakr-api-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}'

# Get service endpoints
kubectl get endpoints coinbreakr-api-service

# Port forward to local machine
kubectl port-forward service/coinbreakr-api-service 8080:80

# Port forward specific pod
kubectl port-forward <pod-name> 8080:3000
```

### HPA (Horizontal Pod Autoscaler)

```bash
# Get HPA status
kubectl get hpa

# Describe HPA
kubectl describe hpa coinbreakr-api-hpa

# Get HPA YAML
kubectl get hpa coinbreakr-api-hpa -o yaml

# Watch HPA in real-time
kubectl get hpa -w

# Edit HPA
kubectl edit hpa coinbreakr-api-hpa

# Delete HPA
kubectl delete hpa coinbreakr-api-hpa
```

### Resource Monitoring

```bash
# View pod resource usage
kubectl top pods

# View node resource usage
kubectl top nodes

# View pod resource usage with labels
kubectl top pods -l app=coinbreakr-api

# Sort pods by CPU
kubectl top pods --sort-by=cpu

# Sort pods by memory
kubectl top pods --sort-by=memory
```

### Rollout Management

```bash
# Check rollout status
kubectl rollout status deployment/coinbreakr-api

# View rollout history
kubectl rollout history deployment/coinbreakr-api

# View specific revision
kubectl rollout history deployment/coinbreakr-api --revision=2

# Rollback to previous version
kubectl rollout undo deployment/coinbreakr-api

# Rollback to specific revision
kubectl rollout undo deployment/coinbreakr-api --to-revision=2

# Pause rollout
kubectl rollout pause deployment/coinbreakr-api

# Resume rollout
kubectl rollout resume deployment/coinbreakr-api

# Restart deployment (rolling restart)
kubectl rollout restart deployment/coinbreakr-api
```

### Scaling Operations

```bash
# Manual scale
kubectl scale deployment coinbreakr-api --replicas=5

# Scale with timeout
kubectl scale deployment coinbreakr-api --replicas=5 --timeout=5m

# Autoscale (create HPA)
kubectl autoscale deployment coinbreakr-api --min=2 --max=10 --cpu-percent=70
```

### ConfigMap & Secrets

```bash
# List ConfigMaps
kubectl get configmaps

# Describe ConfigMap
kubectl describe configmap coinbreakr-config

# View ConfigMap data
kubectl get configmap coinbreakr-config -o yaml

# Edit ConfigMap
kubectl edit configmap coinbreakr-config

# List secrets
kubectl get secrets

# Describe secret (doesn't show values)
kubectl describe secret coinbreakr-secrets

# View secret data (base64 encoded)
kubectl get secret coinbreakr-secrets -o yaml

# Decode secret value
kubectl get secret coinbreakr-secrets -o jsonpath='{.data.mongo-url}' | base64 --decode

# Create secret from literal
kubectl create secret generic coinbreakr-secrets \
  --from-literal=mongo-url='mongodb://...' \
  --from-literal=jwt-secret='secret'

# Create secret from file
kubectl create secret generic coinbreakr-secrets \
  --from-file=mongo-url=./mongo-url.txt \
  --from-file=jwt-secret=./jwt-secret.txt

# Update secret (delete and recreate)
kubectl delete secret coinbreakr-secrets
kubectl create secret generic coinbreakr-secrets \
  --from-literal=mongo-url='NEW_URL' \
  --from-literal=jwt-secret='NEW_SECRET'
```

### Events & Troubleshooting

```bash
# View all events
kubectl get events

# View events sorted by time
kubectl get events --sort-by=.metadata.creationTimestamp

# View events for specific pod
kubectl get events --field-selector involvedObject.name=<pod-name>

# View events in all namespaces
kubectl get events --all-namespaces

# Describe node
kubectl describe node <node-name>

# Get cluster info
kubectl cluster-info

# View API resources
kubectl api-resources

# Explain resource
kubectl explain deployment
kubectl explain deployment.spec.template.spec.containers
```

### Advanced Operations

```bash
# Apply with record (for rollout history)
kubectl apply -f deployment.yaml --record

# Replace resource
kubectl replace -f deployment.yaml

# Patch resource
kubectl patch deployment coinbreakr-api -p '{"spec":{"replicas":3}}'

# Label resources
kubectl label pods <pod-name> environment=testing

# Annotate resources
kubectl annotate deployment coinbreakr-api description="CoinBreakr API"

# Wait for condition
kubectl wait --for=condition=available --timeout=300s deployment/coinbreakr-api

# Diff before apply
kubectl diff -f deployment.yaml
```

### Cleanup Commands

```bash
# Delete specific resource
kubectl delete deployment coinbreakr-api

# Delete by label
kubectl delete pods -l app=coinbreakr-api

# Delete all resources in manifest
kubectl delete -f deployment.yaml

# Delete all resources in directory
kubectl delete -f .

# Force delete pod
kubectl delete pod <pod-name> --force --grace-period=0

# Delete all pods (deployment will recreate)
kubectl delete pods --all
```

### Useful One-Liners

```bash
# Get all pod IPs
kubectl get pods -l app=coinbreakr-api -o jsonpath='{.items[*].status.podIP}'

# Get all pod names
kubectl get pods -l app=coinbreakr-api -o jsonpath='{.items[*].metadata.name}'

# Count running pods
kubectl get pods -l app=coinbreakr-api --no-headers | wc -l

# Get image version
kubectl get deployment coinbreakr-api -o jsonpath='{.spec.template.spec.containers[0].image}'

# Check if all pods are ready
kubectl get pods -l app=coinbreakr-api -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}'

# Get pod restart count
kubectl get pods -l app=coinbreakr-api -o jsonpath='{.items[*].status.containerStatuses[0].restartCount}'

# Get external IP and test
curl http://$(kubectl get service coinbreakr-api-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}')/v1/healthz

# Watch pod status continuously
watch kubectl get pods -l app=coinbreakr-api
```

## 🔐 Security Best Practices

```bash
# Check pod security context
kubectl get pod <pod-name> -o jsonpath='{.spec.securityContext}'

# Check container security context
kubectl get pod <pod-name> -o jsonpath='{.spec.containers[0].securityContext}'

# View service account
kubectl get serviceaccount default -o yaml

# Check RBAC permissions
kubectl auth can-i create pods
kubectl auth can-i delete deployments
```

## 📈 Performance Tuning

```bash
# View resource requests and limits
kubectl describe pod <pod-name> | grep -A 5 "Limits\|Requests"

# Check node capacity
kubectl describe nodes | grep -A 5 "Capacity\|Allocatable"

# View pod QoS class
kubectl get pod <pod-name> -o jsonpath='{.status.qosClass}'
```

---

**Kubernetes Version**: 1.27+  
**Target Platform**: Google Kubernetes Engine (GKE)  
**Full Architecture**: See [ARCHITECTURE_DIAGRAM.md](../ARCHITECTURE_DIAGRAM.md)
