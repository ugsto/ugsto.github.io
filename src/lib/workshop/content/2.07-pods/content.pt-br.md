## O Pod: a menor unidade do Kubernetes

No Kubernetes você não implanta containers diretamente. A unidade mínima é o **Pod**. Um Pod é um grupo de um ou mais containers que compartilham:

- Network namespace: mesmo IP, mesma interface de rede. Containers no mesmo Pod falam via `localhost`.
- IPC namespace: comunicação entre processos via semáforos, memória compartilhada.
- PID namespace (opcional): compartilham o espaço de PIDs.
- Volumes: diretórios montados que todos os containers do Pod acessam.

O Pod é efêmero por natureza. Se um nó morre, os Pods nele somem. Não tente tratar Pod como pet. É gado.

## Por que Pods e não containers soltos?

O Pod existe para resolver o **padrão sidecar**. Muitas aplicações precisam de um processo auxiliar junto: um coletor de logs, um proxy de rede (Envoy), um agente de monitoramento. Em vez de criar uma abstração nova, o Kubernetes agrupa os containers em Pods.

O **pause container** é o segredo. Todo Pod tem um container invisível chamado `pause` (imagem `registry.k8s.io/pause`). Ele é o primeiro a iniciar e o último a morrer. Ele cria e mantém os namespaces que os outros containers do Pod herdam.

## Criando um Pod na prática

Vamos criar um Pod simples no cluster. Um container busybox que fica executando em loop:

```bash
kubectl apply -f - <<YAML
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
YAML
```

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

O campo `spec.containers` é uma lista. Um Pod pode ter vários containers, mas o caso mais comum é um container principal e opcionalmente sidecars.

## Inspecionando o Pod

Depois de criado, o Pod é agendado para um nó pelo scheduler. Vamos ver o status:

```bash
kubectl get pods -l app=demo -o wide
```

```
NAME       READY   STATUS    RESTARTS   AGE   IP           NODE          NOMINATED NODE   READINESS GATES
demo-pod   1/1     Running   0          12s   10.0.2.97   ip-172-31-34-6   <none>           <none>
```

O pod ganhou um IP (`10.0.2.97`) no range de Pods do Cilium. Esse IP é efêmero: se o Pod morrer e for recriado, o IP muda. Quem acessa o Pod pelo IP? Ninguém deveria. Serviços existem pra isso (próximo capítulo).

## kubectl describe: todos os detalhes

O `kubectl describe` mostra tudo que o Kubernetes sabe sobre o recurso. Eventos, condições, IPs, containers, volumes, tolerations:

```bash
kubectl describe pod demo-pod
```

```
Name:             demo-pod
Namespace:        default
Priority:         0
Service Account:  default
Node:             ip-172-31-34-6/172.31.34.6
Start Time:       Sun, 24 May 2026 22:25:00 +0000
Labels:           app=demo
Status:           Running
IP:               10.0.2.97
Containers:
  busybox:
    Container ID:  containerd://7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d
    Image:         busybox:1.36
    State:          Running
      Started:      Sun, 24 May 2026 22:25:02 +0000
    Ready:          True
    Restart Count:  0
Conditions:
  Type              Status
  PodReadyToStartContainers   True
  Initialized       True
  Ready             True
  ContainersReady   True
  PodScheduled      True
Events:
  Type    Reason     Age   From               Message
  ----    ------     ----  ----               -------
  Normal  Scheduled  32s   default-scheduler  Successfully assigned default/demo-pod to ip-172-31-34-6
  Normal  Pulling    31s   kubelet            Pulling image "busybox:1.36"
  Normal  Pulled     29s   kubelet            Successfully pulled image "busybox:1.36"
  Normal  Created    29s   kubelet            Created container busybox
  Normal  Started    29s   kubelet            Started container busybox
```

## kubectl exec: entrar no Pod

Assim como `docker exec`, o Kubernetes tem `kubectl exec`. Você entra em qualquer container do Pod:

```bash
kubectl exec demo-pod -- hostname
```

```
demo-pod
```

O hostname do Pod é o nome do Pod. Todos os containers do Pod veem o mesmo hostname (a menos que você configure `hostname` no spec).

```bash
kubectl exec demo-pod -- ip addr show
```

```
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
2: eth0@if36: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP
    link/ether 3a:7b:c5:2e:22:4c brd ff:ff:ff:ff:ff:ff
    inet 10.0.2.97/32 scope global eth0
```

Uma interface de rede só. O IP `10.0.2.97/32` é o IP do Pod, atribuído pelo Cilium via eBPF. Note o `/32`: não tem broadcast, não tem rota. O Cilium cuida de todo o roteamento.

## Heartbeat: vendo o Pod no dashboard

O workshop tem um dashboard que mostra todos os participantes conectados. Cada aluno envia um heartbeat que aparece em tempo real.

O heartbeat é um container que detecta automaticamente onde está executando. Se a variável `KUBERNETES_SERVICE_HOST` existe, ele sabe que está no Kubernetes. O heartbeat envia POSTs periódicos para `https://workshop-ifsummit-2026.bortoli.phd/heartbeat` com o nome do aluno.

Crie um arquivo `heartbeat-pod.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: heartbeat-NOME
  labels:
    app: heartbeat
    aluno: NOME
spec:
  containers:
  - name: heartbeat
    image: docker.io/ugsto/workshop-ifsummit-2026-heartbeat:latest
    env:
    - name: NAME
      value: "NOME"
    resources:
      requests:
        memory: "32Mi"
        cpu: "50m"
      limits:
        memory: "64Mi"
        cpu: "100m"
```

Substitua `NOME` pelo seu nome. A imagem detecta automaticamente:

- Se `KUBERNETES_SERVICE_HOST` existe: tool="k8s"
- Caso contrário: tool="docker"

Aplique o Pod:

```bash
kubectl apply -f heartbeat-pod.yaml
```

```
pod/heartbeat-NOME created
```

Confira que está executando:

```bash
kubectl get pods -l app=heartbeat
```

```
NAME             READY   STATUS    RESTARTS   AGE
heartbeat-NOME   1/1     Running   0          10s
```

Agora acesse o dashboard: **https://workshop-ifsummit-2026.bortoli.phd**. Seu heartbeat aparece como um card verde no grid de participantes. Cada aluno adiciona seu Pod e o dashboard atualiza em tempo real.

## Logs do heartbeat

Para ver o que o heartbeat está fazendo:

```bash
kubectl logs heartbeat-NOME
```

```
=== Workshop IFSummit 2026 ===
Heartbeat agent iniciado
NAME=NOME
TOOL=k8s (detectado via KUBERNETES_SERVICE_HOST)

[2026-05-24T22:57:01Z] heartbeat enviado para https://workshop-ifsummit-2026.bortoli.phd/heartbeat
  name: NOME
  tool: k8s
  status: ok
[2026-05-24T22:57:16Z] heartbeat enviado para https://workshop-ifsummit-2026.bortoli.phd/heartbeat
  name: NOME
  tool: k8s
  status: ok
```

A cada 15 segundos um heartbeat é enviado. O dashboard usa esses heartbeats para manter o status de cada participante. Se um heartbeat não chega por 30 segundos, o card fica cinza.

Para ver os logs em tempo real:

```bash
kubectl logs -f heartbeat-NOME
```

Aperte Ctrl+C para sair.

## Resumo do capítulo

- Pod é a menor unidade deployável do Kubernetes
- Containers no mesmo Pod compartilham network, IPC, PID (opcional) e volumes
- O pause container mantém os namespaces vivos
- Sidecar é o padrão de design que o Pod resolve
- `kubectl describe` mostra Events: seu primeiro lugar pra debugar
- `kubectl exec` entra no container igual `docker exec`
- `kubectl logs` mostra a saída do container
- Cada Pod ganha um IP efêmero no range de Pods do CNI

No próximo capítulo: como expor Pods de forma estável com Services.
