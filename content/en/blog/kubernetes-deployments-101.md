---
title: "Kubernetes Deployments: From Zero to Production"
slug: kubernetes-deployments-101-en
description: Learn Kubernetes deployment fundamentals including pods, deployments, services, and production-ready configurations with practical examples.
summary: A hands-on guide to **Kubernetes deployments**, covering core concepts, deployment strategies, health checks, and production best practices.
keywords: [kubernetes, k8s, devops, containers, cloud native]
media: https://media.giphy.com/media/jnQYWZ0T4mkhCmkzcn/giphy.gif
tags:
- DevOps
- Kubernetes
- Cloud
- Tutorial
draft: true
---

## Introduction

Kubernetes has become the de facto standard for container orchestration, but its learning curve can be steep. This guide breaks down Kubernetes deployments into digestible pieces, taking you from basic concepts to production-ready configurations.

We'll focus on the core objects you need to deploy applications: Pods, Deployments, Services, and ConfigMaps.

## Core Concepts

### Pods

A Pod is the smallest deployable unit in Kubernetes—a group of one or more containers:

{{< highlight yaml >}}
apiVersion: v1
kind: Pod
metadata:
  name: my-app
  labels:
    app: my-app
spec:
  containers:
    - name: app
      image: my-app:1.0.0
      ports:
        - containerPort: 8080
      resources:
        requests:
          memory: "128Mi"
          cpu: "100m"
        limits:
          memory: "256Mi"
          cpu: "500m"
{{< / highlight >}}

> **Note:** You rarely create Pods directly. Instead, use Deployments which manage Pods for you.

### Deployments

Deployments manage the desired state of your Pods:

{{< highlight yaml >}}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  labels:
    app: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: app
          image: my-app:1.0.0
          ports:
            - containerPort: 8080
          env:
            - name: NODE_ENV
              value: "production"
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "500m"
{{< / highlight >}}

### Services

Services expose your Pods to network traffic:

{{< highlight yaml >}}
apiVersion: v1
kind: Service
metadata:
  name: my-app-service
spec:
  selector:
    app: my-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
  type: ClusterIP
{{< / highlight >}}

## Service Types Comparison

| Type | Description | Use Case |
|------|-------------|----------|
| ClusterIP | Internal cluster IP only | Inter-service communication |
| NodePort | Exposes on each node's IP | Development, simple access |
| LoadBalancer | Cloud provider load balancer | Production external access |
| ExternalName | Maps to external DNS | External service integration |

## Health Checks

Kubernetes uses probes to manage container health:

{{< highlight yaml >}}
spec:
  containers:
    - name: app
      image: my-app:1.0.0
      livenessProbe:
        httpGet:
          path: /health
          port: 8080
        initialDelaySeconds: 30
        periodSeconds: 10
        failureThreshold: 3
      readinessProbe:
        httpGet:
          path: /ready
          port: 8080
        initialDelaySeconds: 5
        periodSeconds: 5
        failureThreshold: 3
      startupProbe:
        httpGet:
          path: /health
          port: 8080
        failureThreshold: 30
        periodSeconds: 10
{{< / highlight >}}

### Probe Types Explained

- **Liveness**: Is the container alive? Failure triggers restart
- **Readiness**: Is the container ready for traffic? Failure removes from service
- **Startup**: Has the container started? Delays other probes until success

## Configuration Management

### ConfigMaps

Store non-sensitive configuration:

{{< highlight yaml >}}
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  DATABASE_HOST: "postgres.default.svc.cluster.local"
  LOG_LEVEL: "info"
  config.json: |
    {
      "features": {
        "darkMode": true,
        "betaFeatures": false
      }
    }
{{< / highlight >}}

### Secrets

Store sensitive data (base64 encoded):

{{< highlight yaml >}}
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  DATABASE_PASSWORD: cGFzc3dvcmQxMjM=  # base64 encoded
  API_KEY: c2VjcmV0LWFwaS1rZXk=
{{< / highlight >}}

### Using Configuration in Deployments

{{< highlight yaml >}}
spec:
  containers:
    - name: app
      image: my-app:1.0.0
      envFrom:
        - configMapRef:
            name: app-config
        - secretRef:
            name: app-secrets
      volumeMounts:
        - name: config-volume
          mountPath: /app/config
  volumes:
    - name: config-volume
      configMap:
        name: app-config
        items:
          - key: config.json
            path: config.json
{{< / highlight >}}

## Deployment Strategies

### Rolling Update (Default)

{{< highlight yaml >}}
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Max pods over desired count
      maxUnavailable: 0  # Max pods unavailable during update
{{< / highlight >}}

### Blue-Green Deployment

Create two deployments, switch service selector:

{{< highlight yaml >}}
# Blue deployment (current)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app-blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
      version: blue
  # ...

# Green deployment (new version)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app-green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
      version: green
  # ...

# Service - switch selector to deploy
apiVersion: v1
kind: Service
metadata:
  name: my-app
spec:
  selector:
    app: my-app
    version: blue  # Change to 'green' to switch
{{< / highlight >}}

## Resource Management

Always set resource requests and limits:

{{< highlight yaml >}}
resources:
  requests:
    memory: "128Mi"   # Guaranteed minimum
    cpu: "100m"       # 0.1 CPU cores
  limits:
    memory: "256Mi"   # Maximum allowed
    cpu: "500m"       # 0.5 CPU cores
{{< / highlight >}}

### Resource Units

| Resource | Unit | Example |
|----------|------|---------|
| CPU | millicores | 100m = 0.1 cores |
| Memory | bytes | 128Mi = 128 mebibytes |

## Horizontal Pod Autoscaler

Scale based on metrics:

{{< highlight yaml >}}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
{{< / highlight >}}

## Common kubectl Commands

{{< highlight bash >}}
# Apply configuration
kubectl apply -f deployment.yaml

# Check deployment status
kubectl get deployments
kubectl describe deployment my-app

# View pods
kubectl get pods
kubectl logs my-app-xyz123

# Scale deployment
kubectl scale deployment my-app --replicas=5

# Rolling restart
kubectl rollout restart deployment my-app

# Check rollout status
kubectl rollout status deployment my-app

# Rollback
kubectl rollout undo deployment my-app

# Port forward for debugging
kubectl port-forward pod/my-app-xyz123 8080:8080
{{< / highlight >}}

## Production Checklist

Before deploying to production, ensure you have:

- [ ] Resource requests and limits defined
- [ ] Liveness and readiness probes configured
- [ ] Multiple replicas for high availability
- [ ] Pod Disruption Budgets set
- [ ] Secrets stored securely (not in plain YAML)
- [ ] Network policies defined
- [ ] Logging and monitoring configured
- [ ] Horizontal Pod Autoscaler enabled

## Pod Disruption Budgets

Ensure availability during cluster maintenance:

{{< highlight yaml >}}
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: my-app-pdb
spec:
  minAvailable: 2  # Or use maxUnavailable
  selector:
    matchLabels:
      app: my-app
{{< / highlight >}}

## Conclusion

Kubernetes deployments involve understanding several interconnected concepts, but the fundamentals remain consistent: define your desired state declaratively, and let Kubernetes handle the rest.

Key takeaways:
- Use Deployments, not bare Pods
- Always configure health probes
- Set resource requests and limits
- Use ConfigMaps and Secrets for configuration
- Plan your deployment strategy based on requirements
- Implement autoscaling for production workloads

Start simple, iterate, and gradually add complexity as your needs grow.
