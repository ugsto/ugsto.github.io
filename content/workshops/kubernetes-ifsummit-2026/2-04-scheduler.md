+++
date = 2026-01-01
title = "O que o scheduler faz"
weight = 204
path = "13"
[extra]
part = 2
section = 4
read_time_minutes = 7
hands_on_minutes = 10
+++



## O que o scheduler faz

Quando você cria um pod, ele nasce no estado **Pending**. Sem nó atribuído. O scheduler (`kube-scheduler`) assiste o API Server por pods novos (`?watch=true`) e decide em qual nó cada um vai executar.

A decisão tem duas fases: predicates (filtros) e priorities (ranqueamento).

## Fase 1: Predicates (filtros)

Predicates são regras booleanas. Se o nó não passa em **qualquer** predicate, é descartado. Os principais:

- NodeUnschedulable: o nó está marcado como unschedulable (`kubectl cordon`)
- NodeHasSufficientMemory: o nó tem RAM disponível pra soma dos `resources.requests` de todos os containers
- NodeHasSufficientCPU: o nó tem CPU disponível
- TaintToleration: o pod tolera os taints do nó
- NodePorts: a porta NodePort que o pod pede não conflita com outro pod
- NodeAffinity: o nó atende os requisitos de affinity do pod

Em clusters de produção, o control plane tipicamente tem o taint `node-role.kubernetes.io/control-plane:NoSchedule`. Isso impede que workloads comuns sejam agendadas no nó de controle. Neste cluster, o taint foi removido para permitir scheduling em todos os nós.

## Fase 2: Priorities (ranqueamento)

Depois de filtrar, o scheduler ranqueia os nós que sobraram. Cada priority function dá uma pontuação de 0 a 10. O nó com maior soma ganha.

Na configuração padrão do Kubernetes, o scheduler usa `LeastRequestedPriority` + `BalancedResourceAllocation`. Isso tende a espalhar pods entre os nós disponíveis.

Outras priority functions:

- MostRequestedPriority: prefere nós mais ocupados (empacota, economiza custo)
- ImageLocality: prefere nós que já têm a imagem do container em cache
- NodeAffinityPriority: dá mais pontos pra nós que batem com node affinity

## Mão na massa: com e sem scheduler

Vamos criar dois pods e ver a diferença nos eventos.

### Pod 1: com nodeName (bypass do scheduler)

Quando você especifica `nodeName` no YAML, o scheduler é ignorado. O pod vai direto pro nó indicado:

```bash
kubectl run scheduler-bypass --image=nginx --restart=Never --overrides='{"spec":{"nodeName":"ip-172-31-34-6"}}'
```

```
pod/scheduler-bypass created
```

Agora olha os eventos:

```bash
kubectl describe pod scheduler-bypass | grep -A5 Events
```

```text
Events:
  Type    Reason   Age   From     Message
  ----    ------   ----  ----     -------
  Normal  Pulling  15m   kubelet  Pulling image "nginx"
  Normal  Pulled   15m   kubelet  Successfully pulled image "nginx" in 4.319s (4.319s including waiting). Image size: 63120520 bytes.
  Normal  Created  15m   kubelet  Created container: scheduler-bypass
  Normal  Started  15m   kubelet  Started container scheduler-bypass
```

Repara: não tem evento `Scheduled`. O kubelet foi direto criar o container. O scheduler nem foi consultado.

### Pod 2: sem nodeName (scheduler age)

Agora deixa o scheduler decidir:

```bash
kubectl run natural-pod --image=nginx --restart=Never
```

```
pod/natural-pod created
```

Eventos:

```bash
kubectl describe pod natural-pod | grep -A10 Events
```

```text
Events:
  Type    Reason     Age   From               Message
  ----    ------     ----  ----               -------
  Normal  Scheduled  15m   default-scheduler  Successfully assigned default/natural-pod to ip-172-31-34-6
  Normal  Pulling    15m   kubelet            Pulling image "nginx"
  Normal  Pulled     15m   kubelet            Successfully pulled image "nginx" in 4.779s (4.779s including waiting). Image size: 63120520 bytes.
  Normal  Created    15m   kubelet            Created container: natural-pod
  Normal  Started    15m   kubelet            Started container natural-pod
```

Agora tem `Scheduled`: `default-scheduler` atribuiu o pod ao `ip-172-31-34-6`. Depois o kubelet criou o container. O scheduler não executa nada, ele só escreve o nome do nó no campo `.spec.nodeName` do pod (via API Server). Quem age é o kubelet.

Os dois pods foram pro mesmo nó (`ip-172-31-34-6`), mas por caminhos completamente diferentes:

```bash
kubectl get pods scheduler-bypass natural-pod -o wide
```

```text
NAME               READY   STATUS    RESTARTS   AGE   IP           NODE              NOMINATED NODE   READINESS GATES
scheduler-bypass   1/1     Running   0          15m   10.0.1.167   ip-172-31-43-16   <none>           <none>
natural-pod        1/1     Running   0          15m   10.0.2.232   ip-172-31-34-6    <none>           <none>
```

## Node Affinity

Você pode influenciar o scheduler com **node affinity**. Em vez de fixar um nodeName (rígido, sem fallback), você expressa uma preferência ou requisito.

Vamos etiquetar o worker com `disktype=ssd`:

```bash
kubectl label node ip-172-31-34-6 disktype=ssd
```

```
node/ip-172-31-34-6 labeled
```

Conferindo:

```bash
kubectl get nodes --show-labels | grep disktype
```

```text
ip-172-31-34-6     Ready    <none>   20m   v1.32.13   ...,disktype=ssd,...
ip-172-31-43-16    Ready    <none>   21m   v1.32.13   ...,disktype=ssd,...
```

Agora um pod que **só agenda em nós com SSD**:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: affinity-pod
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: disktype
            operator: In
            values:
            - ssd
  containers:
  - name: nginx
    image: nginx
```

```bash
kubectl apply -f affinity-pod.yaml
kubectl get pod affinity-pod -o wide
```

```text
NAME           READY   STATUS    RESTARTS   AGE   IP       NODE             NOMINATED NODE   READINESS GATES
affinity-pod   1/1     Running   0          10s   10.0.3.x   ip-172-31-34-6   <none>           <none>
```

O scheduler respeitou a affinity e colocou o pod no `ip-172-31-34-6` (único nó com `disktype=ssd`).

`requiredDuringScheduling`: se nenhum nó atender, o pod fica **Pending** pra sempre. Há também `preferredDuringScheduling`: "prefira nós com label X, mas se não tiver, pode agendar em qualquer um". O preferred é peso, não requisito.

## O scheduler real

```bash
kubectl get pod -n kube-system kube-scheduler-ip-172-31-45-35 -o yaml
```

Argumentos principais:

```
kube-scheduler
--bind-address=127.0.0.1
--kubeconfig=/etc/kubernetes/scheduler.conf
--leader-elect=true
```

- `--leader-elect=true`: em HA, só o leader toma decisões. Os outros schedulers ficam em standby.
- `--bind-address=127.0.0.1`: métricas e healthz só em localhost (porta 10259, HTTPS).

## Por que um scheduler separado?

O scheduler poderia ser parte do controller manager. Mas é separado por dois motivos:

1. Extensibilidade: você pode trocar o scheduler padrão por um customizado (ex: scheduler que considera preço de spot instances na AWS, ou latência entre nós)
2. Separação de responsabilidades: cada componente faz uma coisa só. Scheduler decide onde. Controller manager reconcilia estado. API Server serve a API.

> ℹ️ `nodeName` vs node affinity: `nodeName` ignora o scheduler completamente. Se o nó cair, o pod não agenda em outro lugar. Já a node affinity deixa o scheduler trabalhar. Se o nó não existe ou não atende o requisito, o pod fica Pending até aparecer um nó compatível.
