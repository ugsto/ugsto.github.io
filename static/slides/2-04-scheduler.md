## Scheduler: quem decide onde

- Pod nasce "Pending". Scheduler assiste (?watch=true) e atribui nó.
- Duas fases: predicates (filtros booleanos) + priorities (ranqueamento 0-10).

## Predicates (filtros)

- NodeUnschedulable, TaintToleration
- NodeHasSufficientMemory, NodeHasSufficientCPU
- NodePorts, NodeAffinity

Control plane tem taint `NoSchedule`. Pods de aplicação não passam no predicate.

## Priorities (ranqueamento)

- LeastRequestedPriority: distribui carga
- BalancedResourceAllocation: balanceia CPU/RAM
- ImageLocality: prefere nó com imagem em cache

Nosso cluster: LeastRequested + BalancedResource.

## Bypass: nodeName

```bash
kubectl run bypass --image=nginx --overrides='{"spec":{"nodeName":"ip-172-31-34-6"}}'
```

Ignora o scheduler completamente. Evento: sem `Scheduled`. Kubelet age direto.

## Natural: scheduler decide

```bash
kubectl run natural --image=nginx
```

Evento mostra: `default-scheduler Successfully assigned default/natural to ip-172-31-34-6`. Scheduler escreve `.spec.nodeName`. Kubelet age depois.

## Node Affinity

Influencia o scheduler sem fixar nó:

```yaml
affinity:
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      nodeSelectorTerms:
      - matchExpressions:
        - key: disktype
          operator: In
          values: [ssd]
```

`requiredDuringScheduling`: obrigatório. Sem nó compatível → Pending.
`preferredDuringScheduling`: preferência com peso. Sem nó compatível → agenda em qualquer um.

## nodeName vs affinity

- `nodeName`: bypass total. Se o nó cair, acabou.
- `affinity`: scheduler decide. Se o nó não existe, pod espera.

## Scheduler real

```
--leader-elect=true
--bind-address=127.0.0.1
porta 10259 (HTTPS)
```

Só o leader toma decisões. Outros em standby (HA).
