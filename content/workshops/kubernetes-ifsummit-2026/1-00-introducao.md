+++
date = 2026-01-01
title = "Introdução: o que vamos construir"
weight = 100
[extra]
part = 1
section = 0
read_time_minutes = 3
hands_on_minutes = 0
+++



## Sobre este workshop

Este workshop é uma construção progressiva: cada capítulo adiciona uma peça e você termina entendendo o sistema inteiro, não decorando comandos.

O formato é mão na massa. Você vai criar namespaces no terminal, limitar CPU com cgroups, montar overlay na mão, construir um container artesanal e só depois usar Docker. Lá no final, Kubernetes vai fazer sentido porque você já entendeu o que ele abstrai.

## Roteiro

### Parte 1: Fundamentos (o que é um container)

1.01 VM vs Container: boot de VM Alpine em 17 segundos vs container em 0.4s. ~262x menos RAM. A diferença é o kernel compartilhado.

1.02 Linux Namespaces: o mecanismo de isolamento. Você cria namespaces PID, network, mount e UTS com `unshare`. Vê na prática como cada tipo esconde uma parte do sistema.

1.03 cgroups: o mecanismo de limite de recursos. Você limita um processo a 50% de CPU e 50 MB de RAM. Vê o kernel aplicar OOM kill quando o limite estoura.

1.04 Union Filesystems: como imagens Docker funcionam. Você monta um overlay com lowerdir readonly e upperdir writable. Descobre copy-on-write na prática.

1.05 Container manual: você junta namespaces + cgroups + overlay e cria um container artesanal. Sem Docker, sem containerd. Puro kernel Linux.

1.06 Docker: a camada de conveniência. `docker run` não faz nada que você já não fez na mão. Você inspeciona os namespaces e cgroups de um container Docker pra provar.

1.07 Dockerfile: como criar imagens. Multi-stage builds, cache de camadas, boas práticas.

1.08 Docker Compose: múltiplos containers. Flask + Redis com `docker compose up`.

### Parte 2: Kubernetes

2.00 O problema em escala: você mata um container e ninguém revive. K8s assiste e reage.

2.01-2.07 Arquitetura: control plane, etcd, API server, scheduler, controllers, kubelet, pods. Cada componente explicado com o que ele faz e por que existe.

2.08-2.09 Operação: Services, Deployments, rede, rolling update. O ciclo de vida de uma aplicação no K8s.

2.10 kubeadm: bootstrap de um cluster real.

### Parte 3: Operação

3.00-3.07: kubectl essencial, debugging, ConfigMaps, health checks, resource limits, volumes, RBAC, Ingress.

### Parte 4: Ecossistema

4.0 Helm: package manager para Kubernetes.
4.1 Prometheus + Grafana: métricas e dashboards.
4.2 ArgoCD: GitOps e deploy contínuo.
4.3 Vault: secrets management e CSI Provider.
4.4 Conclusão e próximos passos.

## Antes de começar

Você vai precisar de:
- Acesso root (sudo): namespaces e cgroups exigem
- Docker instalado
- KVM (opcional, só pro capítulo 1.01)
- Máquina Linux (os exemplos usam kernel 6.8, mas qualquer kernel >= 4.x funciona)
