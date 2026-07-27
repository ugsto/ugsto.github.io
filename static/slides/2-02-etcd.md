## etcd: o banco do cluster

Key-value distribuído. Armazena estado: pods, services, secrets, nós. Não guarda containers nem imagens. Nome = `/etc` + `d` (distributed `/etc`).

## Key-value com watch

- Chaves hierárquicas: `/registry/pods/default/nginx-xxx`
- API Server serializa cada recurso em JSON e escreve no etcd
- Watch: conexão long-lived, notificações em tempo real quando chave muda
- Todo componente do control plane usa watch (scheduler, controller-manager, kubelet)
- Sem watch = polling. Com milhares de recursos, polling não escala.

## Consenso Raft

- Leader + followers. Toda escrita passa pelo leader.
- Leader replica pros followers. Maioria confirma (quorum) → commit.
- Leader cai → follower se elege leader.
- Nosso cluster: 1 nó (workshop). Produção: mínimo 3 (tolera falha de 1).

## Estado real do cluster

etcd executa como static pod. Acesso via `kubectl exec` com certificados TLS:

```
VERSION   DB SIZE   IS LEADER   RAFT TERM   RAFT INDEX
3.5.24    33 MB    true        2           3084
```

- 33 MB: cluster recém-criado, quase vazio
- Raft term 2: já houve uma eleição
- Raft index 4650: 4650 operações passaram pelo consenso

## O que está no etcd

Prefix scan com `etcdctl get / --prefix --keys-only`:

```
/registry/apiextensions.k8s.io/customresourcedefinitions/...
/registry/apiregistration.k8s.io/apiservices/...
/registry/pods/kube-system/etcd-ip-172-31-45-35
/registry/pods/kube-system/coredns-668d6bf9bc-7kc2j
...
```

Cada recurso do Kubernetes é uma chave. CRDs do Cilium, apiservices, pods, services, deployments: tudo chave/valor no etcd.

## Por que etcd, não SQL?

1. Watch nativo no protocolo (SQL precisa de polling/triggers)
2. Consistência forte via Raft (SQL tradicional usa replicação assíncrona)
3. Key-value mais simples que schema SQL pra estado de cluster

Preço: sensível a latência de disco. Toda escrita faz `fsync`. Exige SSD.

## Segurança

- TLS mútul (mTLS): API Server autentica com certificado de cliente
- Escuta só em `127.0.0.1:2379` (localhost)
- Ninguém além do API Server acessa diretamente
- Expor etcd = expor o cluster inteiro (secrets em plain text)
