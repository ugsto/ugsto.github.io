## Kubernetes from Scratch

Workshop progressivo: da syscall ao cluster.

### Parte 1: O container
1.01 VM vs Container: boot 17s vs 0.4s, ~262x RAM
1.02 Namespaces: unshare PID/net/mount/UTS
1.03 cgroups: limite de CPU/RAM, OOM kill
1.04 OverlayFS: camadas, copy-on-write
1.05 Container manual: namespaces + cgroups + overlay
1.06 Docker: camada de conveniência
1.07 Dockerfile: multi-stage builds
1.08 Docker Compose: Flask + Redis

### Parte 2: Kubernetes
2.00 Escala: K8s auto-heal
2.01-2.07 Arquitetura: control plane, etcd, API, scheduler, kubelet, pods
2.08-2.10 Operação: Services, Deployments, kubeadm

### Parte 3: Operação
kubectl, debugging, ConfigMaps, health checks, limits, volumes, RBAC, Ingress

### Parte 4: Ecossistema
4.0 Helm, 4.1 Prometheus+Grafana, 4.2 ArgoCD, 4.3 Vault, 4.4 Conclusão

### Pré-requisitos
- Linux com sudo
- Docker
- KVM (opcional, 1.1)
