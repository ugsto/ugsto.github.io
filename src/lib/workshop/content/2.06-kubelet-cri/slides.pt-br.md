## kubelet: o agente de cada nó

- Executa em **todo nó** (control plane + workers)
- Recebe ordens do API Server, gerencia pods localmente
- Fala com container runtime via CRI (socket UNIX gRPC)
- Garante que os containers descritos nos Pods estão executando e saudáveis

## kubelet no worker (processo real)

```
/usr/bin/kubelet
  --container-runtime-endpoint=unix:///var/run/containerd/containerd.sock
  --config=/var/lib/kubelet/config.yaml
  --pod-infra-container-image=registry.k8s.io/pause:3.10
```

- `--container-runtime-endpoint`: socket do containerd (CRI)
- `--config`: políticas de eviction, cgroup driver, limites
- `--pod-infra-container-image`: imagem do pause container

## Static pods (control plane)

- kubelet lê YAMLs em `/etc/kubernetes/manifests/`
- Mantém esses pods sempre executando (etcd, API Server, scheduler, controller-manager)
- Remove o YAML → pod some. Edita o YAML → pod reinicia

## CRI (Container Runtime Interface)

- Interface padronizada entre Kubernetes e container runtimes
- Dois serviços gRPC: RuntimeService (containers) + ImageService (imagens)
- Qualquer runtime que implemente CRI funciona: containerd, CRI-O, Docker (via cri-dockerd)

## containerd no worker

Hierarquia: **kubelet → containerd → containerd-shim-runc-v2 → runc → processo**

- `containerd`: daemon principal, gerencia ciclo de vida
- `containerd-shim`: um por container, sobrevive a restart do containerd
- `runc`: cria o container Linux (namespaces + cgroups)
- Socket: `/run/containerd/containerd.sock` (mesmo que `/var/run/containerd/containerd.sock`)

## crictl: debug direto no runtime

```bash
sudo crictl ps           # containers executando
sudo crictl pods          # pods (sandboxes)
sudo crictl stats         # CPU, memória, disco por container
sudo crictl images        # imagens em cache no nó
sudo crictl inspect <id>  # detalhes completos de um container
```

Não passa pelo Kubernetes. Mostra o que o containerd realmente vê.

## Fluxo quando um pod chega no nó

1. kubelet detecta pod via watch no API Server
2. `RunPodSandbox` → cria pause container com namespaces compartilhados
3. `PullImage` → baixa imagem (se não em cache)
4. `CreateContainer` → specs do container
5. `StartContainer` → containerd-shim + runc criam processo Linux
6. kubelet reporta status de volta pro API Server

```cheatsheet
Ver processo do kubelet
ps aux | grep kubelet | grep -v grep

Listar containers direto no runtime (worker)
sudo crictl ps
sudo crictl pods
sudo crictl stats
sudo crictl images

Socket do containerd
sudo ls -la /run/containerd/containerd.sock

Config do kubelet
echo $(< /var/lib/kubelet/config.yaml)

Static pod manifests (control plane)
ls /etc/kubernetes/manifests/
```
