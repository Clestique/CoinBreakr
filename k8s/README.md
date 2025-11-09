# Kubernetes Manifests

Kubernetes deployment manifests for the CoinBreakr API testing environment.

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

---

**Kubernetes Version**: 1.27+  
**Target Platform**: Google Kubernetes Engine (GKE)
