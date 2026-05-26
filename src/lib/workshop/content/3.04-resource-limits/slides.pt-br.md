## Resource Limits

Requests = mínimo garantido. Limits = teto máximo.

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
    args: ["--vm", "1", "--vm-bytes", "80M", "--timeout", "30"]
    resources:
      requests:
        memory: "32Mi"
        cpu: "50m"
      limits:
        memory: "64Mi"
        cpu: "100m"
YAML
```

```output
pod/oom-demo created
```

## OOMKill em ação

Container pede 80 MiB. Limit é 64 MiB. Kernel envia SIGKILL.

```bash
kubectl describe pod oom-demo
```

```output
    State:          Terminated
      Reason:       OOMKilled
      Exit Code:    137
    Last State:     Terminated
      Reason:       OOMKilled
      Exit Code:    137
...
QoS Class:                   Burstable
```

- Exit Code 137 = 128 + 9 (SIGKILL)
- Container morre, kubelet reinicia (restartPolicy: Always)
- Ciclo: OOMKill → restart → OOMKill → CrashLoopBackOff

## Três classes de QoS

| Classe | Regra | Prioridade |
|---|---|---|
| Guaranteed | request == limit (CPU e mem) | Alta |
| Burstable | request != limit em algum container | Média |
| BestEffort | sem request nem limit | Baixa |

Pressão de memória → kubelet mata BestEffort primeiro.

## CPU vs Memória

| | CPU | Memória |
|---|---|---|
| Acima do limit | Throttle | OOMKill |
| Tipo de recurso | Compressível | Incompressível |
| Exit code | N/A | 137 |

## Heurísticas

```
Request CPU:  50m~200m (apps web)
Limit CPU:    generoso (usa idle se tiver)
Request Mem:  uso normal (monitore por dias)
Limit Mem:    pico + margem (10-20%)
```

Produção crítica: use Guaranteed (request == limit).

## Cheatsheet

```cheatsheet
Ver uso de recursos de um Pod
kubectl top pod <nome>

Ver uso de recursos de um nó
kubectl top node <nome>

Ver QoS Class de um Pod
kubectl get pod <nome> -o jsonpath='{.status.qosClass}'

Criar Pod Guaranteed (request == limit)
kubectl run guaranteed --image=nginx --requests='cpu=100m,memory=128Mi' --limits='cpu=100m,memory=128Mi'

Criar Pod BestEffort (sem requests/limits)
kubectl run besteffort --image=nginx
```
