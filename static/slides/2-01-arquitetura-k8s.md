## Arquitetura: dois grupos

- Control plane: quem decide (cérebro)
- Workers: quem executa (músculos)

## Control plane (4 componentes)

Static pods em `/etc/kubernetes/manifests/`:

```
etcd.yaml
kube-apiserver.yaml
kube-controller-manager.yaml
kube-scheduler.yaml
```

- etcd: banco de dados distribuído (Raft). Tudo que existe no cluster está aqui.
- API Server: porta de entrada REST. Autenticação, autorização (RBAC), validação. Todo mundo fala com ele.
- Scheduler: escolhe nó pra cada pod. Filtros (predicates) + ranking (priorities). Pod nasce Pending, sai com nodeName.
- Controller Manager: reconciliação contínua. Cada controller observa um tipo de recurso e mantém o estado declarado.

## Workers (3 componentes)

- kubelet: agente em cada nó. Recebe ordens do API Server, gerencia pods via container runtime.
- Container runtime: containerd + runc. Interface CRI. Cria containers Linux (namespaces + cgroups).
- kube-proxy: regras de rede (iptables). Cilium (eBPF) substitui o kube-proxy.

## Cluster real

```
kubectl get nodes -o wide
NAME          STATUS   ROLES           AGE   VERSION
ip-172-31-45-35   Ready    control-plane   15m   v1.32.13
ip-172-31-34-6   Ready    <none>          14m   v1.32.13
```

Control plane tem taint `NoSchedule` pra proteger recursos críticos.

## Fluxo de um kubectl create

1. kubectl → API Server (POST REST)
2. API Server → etcd (escreve Deployment)
3. Deployment controller → cria ReplicaSet
4. ReplicaSet controller → cria Pod (Pending)
5. Scheduler → atribui nó
6. kubelet → containerd → container executando

Cada componente faz uma coisa só. Ninguém chama ninguém diretamente. Todo mundo lê/escreve via API Server.
