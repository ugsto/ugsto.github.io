+++
date = 2026-01-01
title = "Conclusão e próximos passos"
weight = 404
path = "32"
[extra]
part = 4
section = 4
read_time_minutes = 4
hands_on_minutes = 0
+++



## Conclusão e próximos passos

Você chegou ao final do workshop. Vamos recapitular o que você construiu.

### O que você sabe agora

Você começou com namespaces e cgroups no terminal e terminou com um cluster Kubernetes completo com observabilidade, GitOps, secrets e API Gateway.

Parte 1: Fundamentos:
- Namespaces isolam o que um processo vê (PID, rede, mount, UTS, IPC)
- Cgroups limitam o que um processo usa (CPU, memória)
- Overlay filesystem cria camadas readonly + writable com copy-on-write
- Juntando as três peças, você criou um container artesanal
- Docker empacota tudo isso com uma API conveniente

Parte 2: Kubernetes:
- Control plane (etcd, API server, scheduler, controllers) + workers (kubelet, runtime)
- kubeadm bootstrap de um cluster real do zero
- Cilium como CNI (eBPF, sem kube-proxy)
- Pods, Deployments, Services (ClusterIP, NodePort)
- Rolling updates e rollbacks

Parte 3: Operação:
- kubectl essencial (get, describe, logs, exec, apply, delete)
- Debugging (events, conditions, restarts)
- ConfigMaps e Secrets
- Health checks (liveness, readiness)
- Resource limits (requests, limits, QoS)
- Volumes (emptyDir, hostPath, PV/PVC)
- Namespaces e RBAC
- Ingress com Kong (path-based routing, strip-path)

Parte 4: Ecossistema:
- Helm (package manager, charts, values, repositórios)
- Prometheus + Grafana (métricas, dashboards, alertas)
- ArgoCD (GitOps, reconciliação contínua)
- Vault (secrets criptografados, políticas, rotação)

### O que NÃO foi coberto (e você deve estudar depois)

Este workshop focou no núcleo: o que é um container, como o Kubernetes funciona por dentro e as ferramentas essenciais do ecossistema. Coisas que ficaram de fora:

- **Service Mesh**: Istio, Linkerd. Quando o tráfego entre serviços precisa de mTLS, retry, circuit breaking.
- **Policy as Code**: OPA/Gatekeeper, Kyverno. Validar e impor políticas de segurança nos recursos do cluster.
- **CI/CD**: GitHub Actions, GitLab CI, Tekton. Integrar o cluster com pipelines de deploy.
- **Terraform**: gerência de infraestrutura como código. O próprio cluster, as VMs, a rede.
- **Segurança**: Falco (detecção de ameaças), Trivy (scan de imagens), cert-manager (TLS automático).

### Ok, mas e agora?

Duas coisas que você pode fazer amanhã:

1. **Refazer o workshop do zero**, sem olhar o tutorial. Subir o cluster, instalar o Kong, o Prometheus, o ArgoCD. A repetição solidifica.
2. **Criar uma aplicação real**. Não um nginx de exemplo. Sua aplicação, com seu Dockerfile, seu Deployment, seu Service, seu Ingress. Ver executando.

### Agradecimento

Valeu por chegar até aqui. Esse workshop foi feito pra ser diferente: sem abstrações mágicas, sem "container é VM leve", sem decorar comando. A ideia era você entender o que acontece quando sobe um container e quando aplica um YAML no Kubernetes.

Se esse material te ajudou, compartilha com alguém que também tá nessa jornada. O conhecimento só vale quando circula.

Até a próxima.
