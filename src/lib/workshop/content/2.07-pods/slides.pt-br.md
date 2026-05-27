## Pod: a menor unidade do Kubernetes

- Unidade mínima de deploy. Não é container, é Pod.
- Um ou mais containers compartilhando: network namespace (mesmo IP), IPC, PID (opcional), volumes
- Efêmero por natureza. Morre e outro nasce no lugar.
- Padrão sidecar: containers auxiliares (log collector, proxy, monitor) no mesmo Pod

## O pause container

- Todo Pod tem um container pause invisível (imagem `registry.k8s.io/pause`)
- Inicia primeiro, morre por último
- Cria e mantém os namespaces compartilhados
- Containers do Pod herdam os namespaces do pause

## Criando um Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: demo-pod
  labels:
    app: demo
spec:
  containers:
  - name: busybox
    image: busybox:1.36
    command: ["sleep", "3600"]
    resources:
      requests:
        memory: "32Mi"
        cpu: "50m"
      limits:
        memory: "64Mi"
        cpu: "100m"
```

- `spec.containers` é uma lista. Vários containers = sidecar.
- `resources.requests`: o que o Pod pede ao scheduler
- `resources.limits`: teto de CPU/memória

## Inspecionando o Pod

```bash
kubectl get pods -o wide          # status + IP + nó
kubectl describe pod demo-pod     # Events, condições, containers, IPs
kubectl exec demo-pod -- <cmd>    # entrar no container
kubectl logs demo-pod             # stdout/stderr do container
```

- OS Events sempre contam a história: Scheduled → Pulling → Pulled → Created → Started
- Se algo falhar, olhe os Events primeiro
