+++
date = 2026-01-01
title = "A porta de entrada"
weight = 203
[extra]
part = 2
section = 3
read_time_minutes = 6
hands_on_minutes = 10
+++



## A porta de entrada

O API Server (`kube-apiserver`) é o único componente que fala com o etcd. Toda operação no cluster passa por ele. `kubectl` fala com o API Server. Os controllers falam com o API Server. O scheduler fala com o API Server. O kubelet fala com o API Server.

Não existe acesso direto ao etcd (só o API Server tem). Isso é por design: o API Server é a camada de autenticação, autorização e validação do cluster.

## REST

O API Server expõe uma API RESTful com Verbos HTTP padrão:

```
GET    /api/v1/pods                         lista todos os pods
POST   /api/v1/namespaces/default/pods      cria um pod
GET    /api/v1/namespaces/default/pods/nginx lê um pod específico
PUT    /api/v1/namespaces/default/pods/nginx substitui o pod inteiro
PATCH  /api/v1/namespaces/default/pods/nginx atualiza campos específicos
DELETE /api/v1/namespaces/default/pods/nginx deleta o pod
```

Todo recurso tem um path REST. Pods, services, deployments, configmaps, secrets, nodes: cada um tem seu endpoint. O `kubectl` é só um cliente HTTP que fala essa API.

## kubectl é um cliente REST

Vamos ver as chamadas HTTP que o `kubectl` faz. O flag `-v=6` mostra o log de requisições:

```bash
kubectl get pods -v=6 2>&1 | grep GET
```

```
I0524 22:38:13.870636    9299 round_trippers.go:560] GET https://172.31.45.35:6443/api/v1/namespaces/default/pods?limit=500 200 OK in 11 milliseconds
```

O que está acontecendo:

- `kubectl` carregou o kubeconfig (`/home/ubuntu/.kube/config`)
- Conectou via HTTPS na porta `6443` (API Server)
- Fez um `GET /api/v1/namespaces/default/pods?limit=500`
- O API Server respondeu `200 OK` em 11 milissegundos

Toda operação do kubectl é uma chamada REST. Criar um deployment é um POST. Listar pods é um GET. Deletar é um DELETE. O kubectl só traduz sua linha de comando em HTTP.

Você pode usar `-v=8` pra ver ainda mais detalhes (headers, corpo da resposta, TLS handshake). Mas o `-v=6` já mostra o essencial: qual endpoint foi chamado, quanto tempo levou e o código de resposta.

## Watch

Assim como o etcd, o API Server suporta watch. Adiciona `?watch=true` na query string e a conexão fica aberta, enviando eventos em streaming.

O scheduler assiste `GET /api/v1/pods?watch=true` pra descobrir pods novos sem polling. O kubelet assiste pods atribuídos ao seu nó. O controller manager assiste deployments, replicasets e tudo mais que gerencia.

É um pattern consistente: cada componente abre watches nos recursos que lhe interessam e reage a eventos (`ADDED`, `MODIFIED`, `DELETED`). Sem watch, cada componente teria que fazer polling. Com milhares de recursos, polling não escala.

## RBAC (Role-Based Access Control)

O API Server decide quem pode fazer o quê. O modelo é simples:

- Subject: quem (usuário, grupo, service account)
- Resource: o quê (pods, deployments, secrets, nodes)
- Verb: ação (get, list, create, delete, watch, update, patch)
- Role: conjunto de permissões (resources + verbs)
- RoleBinding: liga um subject a uma role

Vamos testar na prática com `kubectl auth can-i`:

```bash
kubectl auth can-i get pods -n kube-system
```

```
yes
```

Podemos listar pods no kube-system.

```bash
kubectl auth can-i delete pods -n default
```

```
yes
```

Podemos deletar pods no default namespace.

Agora uma service account sem permissões:

```bash
kubectl auth can-i create pods --as system:serviceaccount:default:default
```

```
no
```

A service account `default` no namespace `default` não pode criar pods.

```bash
kubectl auth can-i create deployments -n kube-system --as system:serviceaccount:default:default
```

```
no
```

Ela também não pode criar deployments no kube-system. Toda service account nasce sem permissões. Você tem que criar Roles e RoleBindings explicitamente.

### Exemplo de Role e RoleBinding

Uma Role que permite listar pods no namespace `default`:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: default
  name: pod-reader
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
```

E um RoleBinding que dá essa permissão pra uma service account:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  namespace: default
  name: read-pods
subjects:
- kind: ServiceAccount
  name: my-app
  namespace: default
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

A lógica é: Role define permissões. RoleBinding conecta a permissão a alguém. Sem RoleBinding, a Role não serve pra nada. Sem Role, o RoleBinding não tem o que conceder.

Para permissões que valem no cluster inteiro (todos os namespaces), use **ClusterRole** e **ClusterRoleBinding**. A estrutura é idêntica, mas sem o campo `namespace`.

## Fluxo completo de uma requisição

Quando você faz `kubectl delete pod nginx`, o caminho é:

1. TLS handshake: `kubectl` apresenta certificado de cliente (do kubeconfig)
2. Authentication: API Server valida o certificado contra a CA do cluster
3. Authorization: API Server verifica se o usuário tem permissão pra `delete pods` no namespace
4. Admission Control: plugins podem modificar ou rejeitar a requisição. Exemplo: `NamespaceLifecycle` impede deletar namespaces protegidos
5. Validação: API Server valida o JSON/YAML contra o schema do recurso
6. Escrita no etcd: API Server escreve o objeto (marca pra deleção)
7. Resposta: `200 OK` volta pro `kubectl`

A resposta volta antes do pod ser deletado. A deleção real acontece quando o kubelet recebe o watch event e manda o containerd parar o container. O API Server não executa nada, ele só orquestra.

## Configuração real do nosso API Server

```bash
kubectl get pod -n kube-system kube-apiserver-ip-172-31-45-35 -o yaml
```

Argumentos principais que você vai ver no output:

```
--advertise-address=172.31.45.35
--authorization-mode=Node,RBAC
--client-ca-file=/etc/kubernetes/pki/ca.crt
--etcd-servers=https://127.0.0.1:2379
--secure-port=6443
--service-cluster-ip-range=10.96.0.0/12
--tls-cert-file=/etc/kubernetes/pki/apiserver.crt
--tls-private-key-file=/etc/kubernetes/pki/apiserver.key
```

Alguns pontos importantes:

- `--authorization-mode=Node,RBAC`: dois modos. Node autoriza kubelets automaticamente. RBAC autoriza usuários e service accounts.
- `--etcd-servers=https://127.0.0.1:2379`: etcd está no mesmo nó, escutando em localhost com TLS.
- `--secure-port=6443`: porta padrão do API Server. Toda comunicação é TLS.
- `--service-cluster-ip-range=10.96.0.0/12`: range de IPs virtuais (ClusterIP). Não são IPs reais de rede. O Cilium (ou kube-proxy) traduz esses IPs pros pods reais.

> ℹ️ Nenhum componente fala diretamente com outro (exceto via API Server). O scheduler não chama o kubelet. O controller-manager não chama o scheduler. Todo mundo lê e escreve no etcd via API Server. Esse desacoplamento é o que torna o Kubernetes extensível e resiliente.
