+++
date = 2026-01-01
title = "O banco do cluster"
weight = 202
[extra]
part = 2
section = 2
read_time_minutes = 7
hands_on_minutes = 12
+++



## O banco do cluster

etcd é onde o Kubernetes guarda tudo. Não guarda containers, imagens nem volumes. Guarda **estado**: quais pods existem, em quais nós, com quais IPs, quais labels, quais secrets. É um key-value store distribuído com consistência forte.

O nome "etcd" vem de `/etc` + "d" (distributed). A ideia original: um `/etc` distribuído pra configuração de cluster.

## Key-value com watch

O modelo é simples: chave → valor. Toda chave é um caminho hierárquico:

```
/registry/pods/default/nginx-demo-54544f4cbb-fbglw
/registry/services/endpoints/default/svc-demo
/registry/deployments/default/svc-demo
/registry/secrets/default/default-token-xxxxx
```

Cada recurso do Kubernetes é uma chave no etcd. O API Server serializa em JSON e escreve.

Mas o pulo do gato não é o key-value. É o **watch**. Um cliente abre uma conexão long-lived e recebe notificações sempre que uma chave muda. Todo componente do control plane usa watch. O scheduler assiste `/registry/pods/` pra ver pods novos. O controller manager assiste `/registry/deployments/` pra ver deployments novos. O kubelet assiste pods atribuídos ao seu nó.

Sem watch, cada componente teria que fazer polling. Com milhares de recursos, polling não escala. Watch resolve isso.

## Consenso Raft

etcd é distribuído. Em produção, você tem 3 ou 5 nós etcd pra tolerar falhas. O algoritmo Raft garante que todos os nós concordam sobre o estado.

Como funciona: um nó é o **leader**. Toda escrita passa por ele. O leader replica a escrita pros **followers**. Quando a maioria confirma (quorum), a escrita é commitada. Se o leader cai, um follower se elege leader.

Para aprendizado, 1 nó etcd (single-node) basta. Em produção o mínimo são 3.

## etcd no cluster: mão na massa

O etcd executa como static pod no nó de controle. Vamos conversar com ele usando `etcdctl`. O acesso é autenticado com TLS mútuo, então precisamos dos certificados:

### Membros do cluster

```bash
kubectl exec -n kube-system etcd-ip-172-31-45-35 -- etcdctl \
  --cacert /etc/kubernetes/pki/etcd/ca.crt \
  --cert /etc/kubernetes/pki/etcd/server.crt \
  --key /etc/kubernetes/pki/etcd/server.key \
  --endpoints https://127.0.0.1:2379 \
  member list --write-out=table
```

```text
+------------------+---------+-----------------+---------------------------+---------------------------+------------+
|        ID        | STATUS  |      NAME       |        PEER ADDRS         |       CLIENT ADDRS        | IS LEARNER |
+------------------+---------+-----------------+---------------------------+---------------------------+------------+
| 79ff5dd93cfdb087 | started | ip-172-31-45-35 | https://172.31.45.35:2380 | https://172.31.45.35:2379 |      false |
+------------------+---------+-----------------+---------------------------+---------------------------+------------+
```

Um membro só. `started`, `IS LEARNER = false`. Duas portas:

- 2379: porta de clientes. O API Server se conecta aqui.
- 2380: porta de peers. Comunicação Raft entre nós etcd (em clusters multi-nó).

### Status do endpoint

```bash
kubectl exec -n kube-system etcd-ip-172-31-45-35 -- etcdctl \
  --cacert /etc/kubernetes/pki/etcd/ca.crt \
  --cert /etc/kubernetes/pki/etcd/server.crt \
  --key /etc/kubernetes/pki/etcd/server.key \
  --endpoints https://127.0.0.1:2379 \
  endpoint status --write-out=table
```

```text
+------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
|        ENDPOINT        |        ID        | VERSION | DB SIZE | IS LEADER | IS LEARNER | RAFT TERM | RAFT INDEX | RAFT APPLIED INDEX | ERRORS |
+------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
| https://127.0.0.1:2379 | 79ff5dd93cfdb087 |  3.5.24 |   33 MB |      true |      false |         2 |       4650 |               4650 |        |
+------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
```

O que cada campo significa:

- VERSION: etcd 3.5.24. É a versão que veio com o Kubernetes 1.32.
- DB SIZE: 33 MB. Cluster com alguns recursos já criados, quase vazio. Em produção, clusters maduros chegam a 1-2 GB.
- IS LEADER: true. Como só tem um nó, ele é o leader por definição.
- RAFT TERM: 2. Já houve uma eleição (term 1 foi a inicialização, term 2 foi uma re-eleição depois de algum evento).
- RAFT INDEX: 4650. Significa que 4650 operações já passaram pelo consenso Raft desde que o cluster subiu.

### O que está guardado lá dentro

```bash
kubectl exec -n kube-system etcd-ip-172-31-45-35 -- etcdctl \
  --cacert /etc/kubernetes/pki/etcd/ca.crt \
  --cert /etc/kubernetes/pki/etcd/server.crt \
  --key /etc/kubernetes/pki/etcd/server.key \
  --endpoints https://127.0.0.1:2379 \
  get / --prefix --keys-only | head -30
```

```
/registry/apiextensions.k8s.io/customresourcedefinitions/ciliumcidrgroups.cilium.io

/registry/apiextensions.k8s.io/customresourcedefinitions/ciliumclusterwidenetworkpolicies.cilium.io

/registry/apiextensions.k8s.io/customresourcedefinitions/ciliumendpoints.cilium.io

/registry/apiextensions.k8s.io/customresourcedefinitions/ciliumexternalworkloads.cilium.io

/registry/apiextensions.k8s.io/customresourcedefinitions/ciliumidentities.cilium.io

/registry/apiextensions.k8s.io/customresourcedefinitions/ciliuml2announcementpolicies.cilium.io

/registry/apiextensions.k8s.io/customresourcedefinitions/ciliumloadbalancerippools.cilium.io

/registry/apiextensions.k8s.io/customresourcedefinitions/ciliumnetworkpolicies.cilium.io

/registry/apiextensions.k8s.io/customresourcedefinitions/ciliumnodeconfigs.cilium.io

/registry/apiextensions.k8s.io/customresourcedefinitions/ciliumnodes.cilium.io

/registry/apiextensions.k8s.io/customresourcedefinitions/ciliumpodippools.cilium.io

/registry/apiregistration.k8s.io/apiservices/v1.

/registry/apiregistration.k8s.io/apiservices/v1.admissionregistration.k8s.io

/registry/apiregistration.k8s.io/apiservices/v1.apiextensions.k8s.io

/registry/apiregistration.k8s.io/apiservices/v1.apps

/registry/apiregistration.k8s.io/apiservices/v1.authentication.k8s.io

/registry/apiregistration.k8s.io/apiservices/v1.authorization.k8s.io

/registry/apiregistration.k8s.io/apiservices/v1.autoscaling

/registry/apiregistration.k8s.io/apiservices/v1.batch

/registry/apiregistration.k8s.io/apiservices/v1.certificates.k8s.io

/registry/apiregistration.k8s.io/apiservices/v1.coordination.k8s.io

/registry/apiregistration.k8s.io/apiservices/v1.discovery.k8s.io

/registry/apiregistration.k8s.io/apiservices/v1.events.k8s.io

/registry/apiregistration.k8s.io/apiservices/v1.flowcontrol.apiserver.k8s.io

/registry/apiregistration.k8s.io/apiservices/v1.networking.k8s.io

/registry/apiregistration.k8s.io/apiservices/v1.node.k8s.io

/registry/apiregistration.k8s.io/apiservices/v1.policy

/registry/apiregistration.k8s.io/apiservices/v1.rbac.authorization.k8s.io

/registry/apiregistration.k8s.io/apiservices/v1.scheduling.k8s.io

/registry/apiregistration.k8s.io/apiservices/v1.storage.k8s.io
```

Cada linha é um recurso do Kubernetes. As primeiras 5 linhas são CRDs do Prometheus e ArgoCD, seguidas pelos CRDs do Cilium que instalamos. Depois vêm os `apiservices` que registram cada API group. Mais pra baixo (fora do `head -30`) apareceriam os pods, services, deployments.

O cluster inteiro cabe nessas chaves. Se você der `get / --prefix --keys-only` sem `head`, vai ver centenas de chaves. Cada pod, cada service, cada secret: uma chave no etcd.

## Por que etcd, e não SQL?

etcd foi escolhido por 3 razões:

1. Watch nativo: SQL precisa de polling ou triggers. etcd tem watch no protocolo.
2. Consistência forte: Raft garante que todo nó vê o mesmo estado. SQL tradicional usa replicação assíncrona.
3. Simplicidade: key-value é mais simples que schema SQL pra representar estado de cluster.

O preço: etcd é sensível a latência de disco. Toda escrita espera `fsync`. Por isso etcd exige SSD e idealmente deve executar sozinho na máquina (ou com recursos dedicados).

## Segurança

O etcd no Kubernetes é protegido por:

- TLS mútuo (mTLS): o API Server se autentica com certificado de cliente (`apiserver-etcd-client`). Nos comandos acima, usamos `--cert` e `--key` pra nos identificar.
- Porta local: etcd só escuta em `127.0.0.1:2379`. Nenhum tráfego externo.
- Firewall: portas 2379-2380 só abertas entre nós do control plane.

Ninguém além do API Server deve acessar o etcd diretamente. Em produção, o acesso direto é bloqueado por firewall e os certificados são rotacionados automaticamente.

> Note: Nunca exponha o etcd pra internet. Se alguém acessar o etcd, acessou o cluster inteiro. Cada secret, cada token de service account, cada ConfigMap com credenciais: tudo em plain text (ou base64, que é equivalente).
