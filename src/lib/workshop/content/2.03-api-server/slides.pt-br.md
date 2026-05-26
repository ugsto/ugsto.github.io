## API Server: a porta de entrada

- Único componente que fala com o etcd
- Toda operação: kubectl → API Server → etcd
- REST, autenticação, autorização (RBAC), validação

## REST

`kubectl` é um cliente HTTP. Todo recurso tem um endpoint:

```
GET    /api/v1/namespaces/default/pods
POST   /api/v1/namespaces/default/pods
DELETE /api/v1/namespaces/default/pods/nginx
```

## kubectl --v=6

Mostra as chamadas REST reais. Exemplo:

```
GET https://172.31.45.35:6443/api/v1/namespaces/default/pods?limit=500 200 OK in 11 milliseconds
```

## Watch

`?watch=true`: conexão aberta, streaming de eventos (ADDED, MODIFIED, DELETED). Scheduler, controllers, kubelet: todos usam watch. Sem polling.

## RBAC

- Subject (quem) + Resource (o quê) + Verb (ação)
- Role: conjunto de permissões (resources + verbs)
- RoleBinding: liga subject a role
- ClusterRole / ClusterRoleBinding: mesma coisa, escopo cluster

## kubectl auth can-i

Testa permissões sem fazer a operação:

```
kubectl auth can-i get pods -n kube-system          → yes
kubectl auth can-i delete pods -n default            → yes
kubectl auth can-i create pods --as sa:default:default → no
```

## Fluxo de uma requisição

1. TLS handshake (certificado de cliente)
2. Authentication (valida certificado)
3. Authorization (RBAC)
4. Admission Control (plugins)
5. Validação (schema)
6. Escrita no etcd
7. Resposta (200 OK)

A resposta volta antes da ação acontecer. O kubelet recebe o watch event e age.

## Configuração real

```
--authorization-mode=Node,RBAC
--etcd-servers=https://127.0.0.1:2379
--secure-port=6443
--service-cluster-ip-range=10.96.0.0/12
```

Node autoriza kubelets. RBAC autoriza usuários. Porta 6443, TLS obrigatório.

```cheatsheet
Ver chamadas REST que o kubectl faz
kubectl get pods -v=6 2>&1 | grep GET

Ver chamadas com mais detalhes
kubectl get pods -v=8 2>&1 | head -30

Testar permissões
kubectl auth can-i <verb> <resource> -n <namespace>
kubectl auth can-i create pods --as system:serviceaccount:default:default

Listar roles e bindings
kubectl get roles,rolebindings --all-namespaces
kubectl get clusterroles,clusterrolebindings

Listar API resources disponíveis
kubectl api-resources
```
