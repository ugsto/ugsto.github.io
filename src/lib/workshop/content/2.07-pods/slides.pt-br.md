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
kubectl get pods -o wide         # status + IP + nó
kubectl describe pod demo-pod     # Events, condições, containers, IPs
kubectl exec demo-pod -- <cmd>    # entrar no container
kubectl logs demo-pod             # stdout/stderr do container
```

- Events contam a história: Scheduled → Pulling → Pulled → Created → Started
- Se algo falhar, olhe os Events primeiro

## Heartbeat: conectando ao dashboard

Cada aluno cria um Pod heartbeat. A imagem detecta automaticamente onde está:

- `KUBERNETES_SERVICE_HOST` existe → tool="k8s"
- Caso contrário → tool="docker"

Crie `heartbeat-pod.yaml` com seu nome:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: heartbeat-NOME
  labels:
    app: heartbeat
spec:
  containers:
  - name: heartbeat
    image: docker.io/ugsto/workshop-ifsummit-2026-heartbeat:latest
    env:
    - name: NAME
      value: "NOME"
```

```bash
kubectl apply -f heartbeat-pod.yaml
kubectl logs heartbeat-NOME
```

Acesse o dashboard: https://workshop-ifsummit-2026.bortoli.phd

```cheatsheet
Criar Pod a partir de YAML
kubectl apply -f pod.yaml

Listar Pods com IP e nó
kubectl get pods -o wide

Inspecionar Pod (Events, condições, containers)
kubectl describe pod <nome>

Entrar no container
kubectl exec <pod> -- <comando>

Ver logs
kubectl logs <pod>
kubectl logs -f <pod>

Deletar Pod
kubectl delete pod <nome>

Criar Pod heartbeat do workshop
kubectl apply -f heartbeat-pod.yaml

Dashboard do workshop
https://workshop-ifsummit-2026.bortoli.phd
```
