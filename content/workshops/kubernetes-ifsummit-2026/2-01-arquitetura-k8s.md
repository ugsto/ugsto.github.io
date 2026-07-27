+++
date = 2026-01-01
title = "A arquitetura"
weight = 201
path = "10"
[extra]
part = 2
section = 1
read_time_minutes = 6
hands_on_minutes = 10
+++



## A arquitetura

Kubernetes tem dois grupos de componentes: o **control plane** (quem decide) e os **workers** (quem executa).

O control plane é o cérebro. Ele decide onde cada pod vai, monitora o estado do cluster, atende requisições da API e mantém o estado declarado. Os workers são os músculos. Eles executam os containers, usando containerd e runc.

## Control plane

O control plane tem 4 componentes principais. Todos eles executam como **static pods** no nó de controle. O kubelet lê os manifestos YAML em `/etc/kubernetes/manifests/` e mantém esses pods sempre executando:

```bash
ls /etc/kubernetes/manifests/
```

```
etcd.yaml
kube-apiserver.yaml
kube-controller-manager.yaml
kube-scheduler.yaml
```

Quatro arquivos. Quatro componentes. Sempre executando, sempre no nó de controle.

Confere no cluster:

```bash
kubectl get pods -n kube-system
```

```text
NAME                                      READY   STATUS    RESTARTS   AGE
cilium-5xg8m                              1/1     Running   0          15m
cilium-68hd6                              1/1     Running   0          15m
cilium-7sst8                              1/1     Running   0          16m
cilium-envoy-crvht                        1/1     Running   0          16m
cilium-envoy-k64lv                        1/1     Running   0          15m
cilium-envoy-l9575                        1/1     Running   0          15m
cilium-envoy-mrzk6                        1/1     Running   0          15m
cilium-h2dvg                              1/1     Running   0          15m
cilium-operator-655d446646-x77ff          1/1     Running   0          16m
coredns-668d6bf9bc-5mr4m                  1/1     Running   0          16m
coredns-668d6bf9bc-7bzm7                  1/1     Running   0          16m
etcd-ip-172-31-45-35                      1/1     Running   0          16m
kube-apiserver-ip-172-31-45-35            1/1     Running   0          16m
kube-controller-manager-ip-172-31-45-35   1/1     Running   0          16m
kube-scheduler-ip-172-31-45-35            1/1     Running   0          16m
```

Os 4 componentes do control plane estão lá. Os outros pods (cilium, coredns) são addons que instalamos junto com o cluster.

### Componente por componente

etcd: banco de dados distribuído. Armazena tudo: pods, services, configmaps, secrets, nós. Tudo que existe no cluster está no etcd. Usa o algoritmo de consenso Raft. Capítulo 2.2.

API Server: a porta de entrada. Toda comunicação com o cluster passa por ele. `kubectl`, controllers, scheduler, kubelet: todo mundo fala com o API Server. REST, autenticação, autorização (RBAC), validação. Capítulo 2.3.

Scheduler: decide onde cada pod executa. Quando você cria um pod, ele nasce "Pending". O scheduler olha os nós disponíveis, aplica filtros (predicates) e ranqueia (priorities). Escolhe o melhor nó e escreve no etcd. Capítulo 2.4.

Controller Manager: mantém o estado declarado. Cada controller observa um tipo de recurso e reconcilia o estado atual com o desejado. O Deployment controller garante o número de réplicas. O Node controller monitora saúde dos nós. Capítulo 2.5.

## Workers

Cada worker (também chamado de node) tem 3 componentes:

kubelet: o agente. Executa em todo nó (inclusive no control plane). Recebe ordens do API Server e gerencia os pods naquele nó. Fala com o container runtime (containerd) pra criar, iniciar, parar containers. Capítulo 2.6.

container runtime: o executor, que usa runc pra criar containers Linux (namespaces + cgroups). A interface padrão é o CRI (Container Runtime Interface). Capítulo 2.6.

kube-proxy: gerencia regras de rede. Nos clusters tradicionais, ele escreve regras iptables pra rotear tráfego dos Services pros pods. O Cilium (eBPF) substitui o kube-proxy, com melhor performance e segurança. Capítulo 2.8.

## O cluster real

Nosso cluster tem 2 nós:

```bash
kubectl get nodes -o wide
```

```
NAME          STATUS   ROLES           AGE   VERSION    INTERNAL-IP     EXTERNAL-IP   OS-IMAGE             KERNEL-VERSION    CONTAINER-RUNTIME
ip-172-31-45-35   Ready    control-plane   15m   v1.32.13   172.31.45.35   <none>        Ubuntu 24.04.4 LTS   6.17.0-1007-aws   containerd://2.2.1
ip-172-31-34-6   Ready    <none>          14m   v1.32.13   172.31.34.6   <none>        Ubuntu 24.04.4 LTS   6.17.0-1007-aws   containerd://2.2.1
```

- **ip-172-31-45-35**: é o control plane. Executa os 4 componentes (etcd, API Server, scheduler, controller-manager) como static pods.
- **ip-172-31-34-6**: é o worker. Só executa pods de aplicação e os addons de sistema (cilium, coredns).
- Contêiner runtime: containerd 2.2.4 em ambos. Kernel 6.17, Ubuntu 24.04.

O control plane tem um **taint** que impede pods comuns de agendarem nele:

```bash
kubectl describe node ip-172-31-45-35 | grep Taints
```

```
Taints:             node-role.kubernetes.io/control-plane:NoSchedule
```

Isso protege o control plane. Se um pod de aplicação consumir toda a CPU, o API Server ou etcd podem ficar lentos e o cluster inteiro sofre.

## Fluxo de um kubectl create

Quando você executa `kubectl create deployment nginx --image=nginx`:

1. `kubectl` envia um POST REST pro API Server
2. API Server autentica, autoriza, valida e escreve o Deployment no etcd
3. Controller Manager (Deployment controller) vê o novo Deployment e cria um ReplicaSet
4. Controller Manager (ReplicaSet controller) vê o novo ReplicaSet e cria um Pod (ainda sem nó)
5. Scheduler vê o Pod "Pending", escolhe um nó e atribui
6. kubelet do nó escolhido vê o Pod atribuído e pede pro containerd criar os containers

Cada componente só faz uma coisa. Cada um observa o etcd (via API Server) e reage a mudanças. Essa separação de responsabilidades é o que torna o Kubernetes resiliente e extensível.

> ℹ️ Nenhum componente fala diretamente com outro (exceto via API Server). O scheduler não chama o kubelet. O controller-manager não chama o scheduler. Todo mundo lê e escreve no etcd via API Server. Esse desacoplamento é o segredo da arquitetura.
