+++
date = 2026-01-01
title = "O que é o kubelet"
weight = 206
path = "15"
[extra]
part = 2
section = 6
read_time_minutes = 7
hands_on_minutes = 12
+++



## O que é o kubelet

O kubelet é o agente que executa em **todo nó** do cluster, inclusive no control plane. Ele é o braço operacional do Kubernetes: recebe ordens do API Server e gerencia os pods localmente.

Seu trabalho é garantir que os containers descritos nos Pods estejam executando e saudáveis. Ele fala com o container runtime via CRI (Container Runtime Interface) para criar, iniciar, parar e monitorar containers.

Vamos ver o kubelet executando no worker:

```bash
ps aux | grep kubelet | grep -v grep
```

```text
root  3233  4.2  3.4 2267024 67460 ?  Ssl  16:46  1:01 /usr/bin/kubelet
  --bootstrap-kubeconfig=/etc/kubernetes/bootstrap-kubelet.conf
  --kubeconfig=/etc/kubernetes/kubelet.conf
  --config=/var/lib/kubelet/config.yaml
  --container-runtime-endpoint=unix:///var/run/containerd/containerd.sock
  --pod-infra-container-image=registry.k8s.io/pause:3.10
```

Alguns parâmetros importantes:

- `--kubeconfig`: credenciais pra se autenticar no API Server. O kubelet é um cliente como qualquer outro.
- `--config`: arquivo de configuração do kubelet. Define políticas de eviction, cgroup driver, limites de recursos.
- `--container-runtime-endpoint`: socket do container runtime. `unix:///var/run/containerd/containerd.sock`. É por esse socket UNIX que o kubelet chama o containerd.
- `--pod-infra-container-image`: imagem do pause container. Todo pod tem um container "pause" que mantém os namespaces compartilhados.

## O kubelet e os static pods

No control plane, o kubelet também gerencia os **static pods**. Ele lê os manifestos YAML em `/etc/kubernetes/manifests/` e garante que esses pods estejam sempre executando. Se um static pod morrer, o kubelet recria. Se o manifesto for removido, o pod é deletado.

É assim que os componentes do control plane (etcd, API Server, scheduler, controller-manager) executam. Eles não são gerenciados por Deployments. São static pods, mantidos diretamente pelo kubelet.

## Container Runtime Interface (CRI)

O Kubernetes não fala diretamente com Docker ou containerd. Ele fala com uma interface padronizada: a **CRI** (Container Runtime Interface).

A CRI define dois serviços gRPC:

- RuntimeService: operações de ciclo de vida de containers e sandboxes (pods). Criar, iniciar, parar, remover.
- ImageService: operações de imagem. Pull, list, remove, status.

Qualquer runtime que implemente esses dois serviços funciona com Kubernetes. O containerd implementa a CRI nativamente (via plugin `io.containerd.grpc.v1.cri`).

## O containerd no worker

O containerd é o runtime que gerencia o ciclo de vida dos containers. Ele usa o runc para criar containers Linux. Vamos ver os processos:

```bash
ps aux | grep containerd | grep -v grep
```

```text
root  2175  1.5  1.7 2157648 70496 ?  Ssl  16:45  0:32 /usr/bin/containerd
root  3233  4.2  3.4 2267024 67460 ?  Ssl  16:46  1:01 /usr/bin/kubelet ...
root  3303  0.0  0.3 1235360 12168 ?  Sl   16:46  0:00 /usr/bin/containerd-shim-runc-v2 ...
root  3349  0.0  0.3 1235360 11804 ?  Sl   16:46  0:00 /usr/bin/containerd-shim-runc-v2 ...
root  6939  0.0  0.2 1235616 11528 ?  Sl   16:50  0:00 /usr/bin/containerd-shim-runc-v2 ...
root  6965  0.0  0.3 1235616 11876 ?  Sl   16:50  0:00 /usr/bin/containerd-shim-runc-v2 ...
```

A hierarquia é: **kubelet → containerd → containerd-shim-runc-v2 → runc → processo do container**.

Cada container tem seu próprio `containerd-shim`. O shim fica entre o containerd e o runc. Ele permite que o containerd reinicie sem matar os containers: o shim mantém os processos vivos independentemente.

## O socket do containerd

A comunicação entre kubelet e containerd é via socket UNIX:

```bash
sudo ls -la /var/run/containerd/containerd.sock
```

```text
srw-rw---- 1 root root 0 May 25 16:45 /run/containerd/containerd.sock
```

O diretório `/var/run` é um symlink para `/run` no Ubuntu:

```bash
ls -la /var/run
```

```
lrwxrwxrwx 1 root root 4 Mar 13 22:05 /var/run -> /run
```

Na prática, `/var/run/containerd/containerd.sock` e `/run/containerd/containerd.sock` são o mesmo socket.

## crictl: o canivete suíço do CRI

`crictl` é o CLI pra interagir diretamente com o container runtime via CRI. Ele mostra o que o runtime está fazendo, sem passar pelo Kubernetes. É essencial pra debug: se o kubelet diz que um container não existe, o que o containerd acha?

Por padrão, o `crictl` procura o socket em `/run/containerd/containerd.sock`. Os warnings aparecem porque não temos `/etc/crictl.yaml`, mas ele encontra o socket automaticamente.

Listar containers:

```bash
sudo crictl ps
```

```text
CONTAINER           IMAGE               CREATED          STATE    NAME                      POD
4fd4a5cc32a4d       1ca64cd86eb37       8 minutes ago    Running  kube-apiserver            kube-apiserver-ip-172-31-45-35
48fada32f81a1       f1b5c176c6ee8       8 minutes ago    Running  cilium-operator           cilium-operator-655d446646-x77ff
fa928d83b7158       e74b80806e1da       10 minutes ago   Running  node-exporter             prometheus-prometheus-node-exporter-wd2l6
672d4ea2f5ee0       59a2147964ea7       15 minutes ago   Running  kube-controller-manager   kube-controller-manager-ip-172-31-45-35
30f5c511cfcca       2fab0ac6a3f2b       15 minutes ago   Running  kube-scheduler            kube-scheduler-ip-172-31-45-35
1a7d2464f4936       c69fa2e9cbf5f       23 minutes ago   Running  coredns                   coredns-668d6bf9bc-7bzm7
```

Quatro containers executando no worker. Dois do deployment `svc-demo` (nginx) e dois do Cilium.

Listar pods (sandboxes):

```bash
sudo crictl pods
```

```text
POD ID              CREATED             STATE    NAME                                        NAMESPACE
1e5bff0cc49eb       19 minutes ago      Ready    prometheus-prometheus-node-exporter-wd2l6   monitoring
38c30e2fe713c       23 minutes ago      Ready    coredns-668d6bf9bc-5mr4m                    kube-system
39eadf938588e       23 minutes ago      Ready    coredns-668d6bf9bc-7bzm7                    kube-system
96f1e89d276d9       24 minutes ago      Ready    cilium-envoy-crvht                          kube-system
944911272b50e       24 minutes ago      Ready    cilium-7sst8                                kube-system
```
8dda0fc772dd6  25 minutes ago   Ready  svc-demo-5f5b47b456-5hrtv  default
487811c2a7a5a  25 minutes ago   Ready  svc-demo-5f5b47b456-z5nmr  default
ed4ebe5691d1f  31 minutes ago   Ready  cilium-envoy-lhzfn         kube-system
df4d6a7a0b290  31 minutes ago   Ready  cilium-sps6b               kube-system
```

Ver consumo de recursos:

```bash
sudo crictl stats
```

```
CONTAINER      NAME             CPU %   MEM       DISK     INODES
55781724b8927  cilium-agent     1.44   174.3MB   167.9kB  41
a18646b81db4f  nginx            0.00   3.387MB   94.21kB  19
bd092ae009341  nginx            0.00   3.363MB   94.21kB  19
f7570bc203b7d  cilium-envoy     0.24   14.44MB   28.67kB  7
```

Listar imagens em cache no nó:

```bash
sudo crictl images
```

```
IMAGE                            TAG             IMAGE ID        SIZE
docker.io/library/nginx          alpine          da954fb959a34   26.1MB
docker.io/library/nginx          latest          7aaca76c508f7   63.1MB
quay.io/cilium/cilium             <none>         808119d0de26e   224MB
registry.k8s.io/pause            3.10.1          cd073f4c5f6a8   320kB
```

## O fluxo completo no worker

Quando o scheduler atribui um pod ao worker, acontece:

1. O kubelet detecta o novo pod (via watch no API Server).
2. O kubelet chama o containerd via CRI: `RunPodSandbox`. O containerd cria um "pause container" com os namespaces compartilhados (network, IPC, PID).
3. O kubelet chama `PullImage` pra baixar a imagem (se não estiver em cache).
4. O kubelet chama `CreateContainer` com as specs do container (imagem, comandos, variáveis de ambiente, volumes).
5. O kubelet chama `StartContainer`. O containerd usa runc pra criar o processo Linux.
6. O containerd-shim monitora o processo e reporta status pro containerd.
7. O kubelet reporta o status do pod de volta pro API Server.

Tudo isso acontece em segundos. Mas cada passo é uma chamada gRPC pelo socket UNIX, com cada componente fazendo exatamente sua parte.

> O kubelet não decide nada. Ele só executa. Quem decide é o control plane. O kubelet apenas lê o que foi atribuído ao seu nó e faz acontecer.

## kubelet no control plane

O control plane também tem kubelet. Ele gerencia os static pods dos componentes do control plane. Confere no nó de controle:

```bash
ps aux | grep kubelet | grep -v grep
```

A saída mostra o mesmo binário, mas com os manifestos em `/etc/kubernetes/manifests/` sendo monitorados. É o mesmo kubelet, mesma lógica. Só que no control plane ele gerencia static pods em vez de pods de aplicação.
