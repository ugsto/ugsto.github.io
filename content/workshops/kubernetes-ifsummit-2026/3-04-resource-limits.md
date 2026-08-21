+++
date = 2026-01-01
title = "Resource Limits: quanto de CPU e memória cada Pod pode usar"
weight = 304
[extra]
part = 3
section = 4
read_time_minutes = 6
hands_on_minutes = 10
+++



## Resource Limits: quanto de CPU e memória cada Pod pode usar

Todo container consome recursos do nó: CPU e memória. Se um container começa a consumir demais, ele pode afetar os outros containers no mesmo nó. O Kubernetes resolve isso com **requests** e **limits**.

A diferença é simples: **requests** é o mínimo que o container precisa para funcionar (o scheduler usa isso para decidir em qual nó colocar o Pod). **limits** é o teto máximo. Se o container tentar usar mais memória que o limit, o kernel faz OOMKill (Out of Memory Kill). Se tentar usar mais CPU que o limit, o kernel faz throttle (reduz a velocidade, mas não mata).

## Requests e limits na prática

Vamos criar um Pod com requests e limits explícitos:

```bash
kubectl apply -f - <<YAML
apiVersion: v1
kind: Pod
metadata:
  name: oom-demo
spec:
  containers:
  - name: memory-eater
    image: polinux/stress
    command: ["stress"]
    args: ["--vm", "1", "--vm-bytes", "80M", "--vm-hang", "0", "--timeout", "30"]
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
  name: oom-demo
spec:
  containers:
  - name: memory-eater
    image: polinux/stress
    command: ["stress"]
    args: ["--vm", "1", "--vm-bytes", "80M", "--vm-hang", "0", "--timeout", "30"]
    resources:
      requests:
        memory: "32Mi"
        cpu: "50m"
      limits:
        memory: "64Mi"
        cpu: "100m"
```

```output
pod/oom-demo created
```

O que declaramos:
- O container **pede** 32 MiB de memória e 50 millicores de CPU (request)
- O container **pode usar no máximo** 64 MiB de memória e 100m de CPU (limit)
- O comando `stress` tenta alocar 80 MiB de memória. Isso é mais que o limit de 64 MiB.

## OOMKill: o kernel age

Depois de alguns segundos, o container tenta alocar os 80 MiB. O kernel detecta que o cgroup do container atingiu o limite de 64 MiB e envia SIGKILL. O container morre com **OOMKilled**:

```bash
kubectl get pod oom-demo -o wide
```

```output
NAME       READY   STATUS             RESTARTS     AGE   IP           NODE          NOMINATED NODE   READINESS GATES
oom-demo   0/1     CrashLoopBackOff   1 (7s ago)   12s   10.0.1.200   ip-172-31-34-6   <none>           <none>
```

Status `CrashLoopBackOff`. O container já morreu e o kubelet está tentando reiniciar (o `restartPolicy` padrão é `Always`). Vamos ver o describe:

```bash
kubectl describe pod oom-demo
```

```output
Name:             oom-demo
Namespace:        default
...
Containers:
  memory-eater:
    ...
    State:          Terminated
      Reason:       OOMKilled
      Exit Code:    137
      Started:      Sun, 24 May 2026 23:42:25 +0000
      Finished:     Sun, 24 May 2026 23:42:26 +0000
    Last State:     Terminated
      Reason:       OOMKilled
      Exit Code:    137
      Started:      Sun, 24 May 2026 23:42:11 +0000
      Finished:     Sun, 24 May 2026 23:42:11 +0000
    Ready:          False
    Restart Count:  2
    Limits:
      cpu:     100m
      memory:  64Mi
    Requests:
      cpu:        50m
      memory:     32Mi
...
QoS Class:                   Burstable
...
Events:
  Type     Reason     Age               From               Message
  ----     ------     ----              ----               -------
  Normal   Scheduled  20s               default-scheduler  Successfully assigned default/oom-demo to ip-172-31-34-6
  Normal   Pulled     17s               kubelet            Successfully pulled image "polinux/stress" in 1.668s
  Warning  BackOff    0s (x3 over 14s)  kubelet            Back-off restarting failed container memory-eater in pod oom-demo
```

Dois pontos importantes:

- **Reason: OOMKilled** e **Exit Code: 137** (137 = 128 + 9, onde 9 é SIGKILL). Esse é o marcador clássico de OOM.
- **QoS Class: Burstable**. O Kubernetes classifica Pods em três categorias de Quality of Service.

## As três classes de QoS

O Kubernetes atribui uma classe de QoS a cada Pod baseado nos requests e limits dos containers:

| Classe | Condição | Prioridade em caso de pressão de memória |
|---|---|---|
| **Guaranteed** | requests == limits para CPU e memória em todos os containers | Mais alta (último a ser morto) |
| **Burstable** | pelo menos um container tem request definido, mas request != limit | Média |
| **BestEffort** | nenhum container tem request ou limit | Mais baixa (primeiro a ser morto) |

No nosso Pod `oom-demo`, declaramos `requests: 32Mi` e `limits: 64Mi`. Como os valores são diferentes, a classe é **Burstable**.

Quando o nó fica sem memória, o kubelet segue a ordem: mata BestEffort primeiro, depois Burstable, depois Guaranteed. Dentro da mesma classe, mata o Pod que está usando mais memória acima do request (em proporção).

## CPU throttling: o limite que não mata

Diferente de memória, CPU não causa OOMKill. Se o container tenta usar mais CPU que o limit, o kernel faz **throttle**: limita o tempo de CPU que o container recebe. A aplicação fica mais lenta, mas não morre.

Memória é um recurso **incompressível**. Se você alocou 64 MiB e tenta usar 80 MiB, alguém tem que morrer. CPU é **compressível**: se você quer usar 200m e só tem 100m, o kernel simplesmente reduz a fatia de tempo.

## Como escolher requests e limites

Não existe fórmula mágica. Mas uma heurística comum:

- Request de CPU: 50m a 200m para a maioria das aplicações web. O suficiente para o scheduler não empilhar containers demais no mesmo nó.
- Limit de CPU: pode ser mais generoso que o request. Se a máquina tiver CPU ociosa, o container pode usar mais que o request.
- Request de memória: o que a aplicação realmente usa em regime normal. Monitore com Prometheus ou `kubectl top pod` por alguns dias.
- Limit de memória: um pouco acima do pico observado. Memória demais = desperdício. Memória de menos = OOMKill.

Para serviços críticos em produção, use **Guaranteed** (request == limit). Isso evita que seu Pod seja morto em situações de pressão.

## Resumo do capítulo

- **requests** = mínimo garantido. O scheduler usa para decidir em qual nó colocar o Pod.
- **limits** = teto máximo. Memória acima do limit causa OOMKill (Exit Code 137). CPU acima do limit causa throttle.
- QoS classes: Guaranteed (request == limit), Burstable (request != limit), BestEffort (sem request/limit).
- Em pressão de memória, o kubelet mata BestEffort primeiro, Guaranteed por último.
- CPU é compressível (throttle). Memória é incompressível (OOMKill).
- Monitore o uso real antes de definir limites. Use Prometheus + `kubectl top`.

No próximo capítulo: volumes para compartilhar dados entre containers e persistir além do ciclo de vida do Pod.
