## Namespaces e RBAC: isolamento e controle de acesso

Conforme o cluster cresce, você precisa separar ambientes e controlar quem pode fazer o quê. O Kubernetes resolve isso com Namespaces (isolamento lógico) e RBAC (Role-Based Access Control).

Um namespace é uma partição virtual do cluster. Recursos com o mesmo nome podem existir em namespaces diferentes sem colidir. O RBAC define quem (subject) pode fazer quais ações (verbs) em quais recursos, dentro de qual namespace (Role) ou no cluster inteiro (ClusterRole).

## Namespaces: criando e usando

Criar um namespace é uma linha:

```bash
kubectl create namespace demo-ns
```

```output
namespace/demo-ns created
```

A partir desse momento, você pode criar recursos nesse namespace:

```bash
kubectl run pod-alpha --image=nginx:alpine -n demo-ns
```

```output
pod/pod-alpha created
```

Sem namespace, os comandos vão para o namespace `default`. É uma boa prática sempre explicitar `-n`.

Namespaces built-in do Kubernetes:

- `default`: onde tudo vai se você não especificar namespace.
- `kube-system`: componentes do plano de controle (api-server, scheduler, etcd, coredns).
- `kube-public`: recursos públicos (como o ConfigMap `cluster-info`).
- `kube-node-lease`: heartbeats dos nós (leases de renovação).

## RBAC: ServiceAccount, Role e RoleBinding

RBAC funciona com quatro conceitos:

1. **ServiceAccount**: identidade de um Pod (ou de um usuário externo). É o "quem".
2. **Role**: conjunto de permissões (verbs + resources) dentro de um namespace.
3. **RoleBinding**: liga uma ServiceAccount a uma Role. "Esta SA pode fazer isso nesse namespace".
4. **ClusterRole / ClusterRoleBinding**: igual, mas em escopo de cluster (todos os namespaces).

Vamos criar uma ServiceAccount, uma Role que permite listar Pods, e um RoleBinding:

```bash
kubectl create serviceaccount demo-sa -n demo-ns
```

```output
serviceaccount/demo-sa created
```

```bash
kubectl create role pod-reader --verb=get,list,watch --resource=pods -n demo-ns
```

```output
role.rbac.authorization.k8s.io/pod-reader created
```

```bash
kubectl create rolebinding demo-rb --role=pod-reader --serviceaccount=demo-ns:demo-sa -n demo-ns
```

```output
rolebinding.rbac.authorization.k8s.io/demo-rb created
```

Vamos ver a Role criada:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: demo-ns
rules:
- apiGroups:
  - ""
  resources:
  - pods
  verbs:
  - get
  - list
  - watch
```

Os verbs dizem exatamente o que a Role permite: `get`, `list` e `watch` no recurso `pods`.

## Verificando permissões com auth can-i

O `kubectl auth can-i` verifica se um subject tem permissão para uma ação. Com `--as` você simula a identidade de uma ServiceAccount:

A SA pode listar pods no namespace demo-ns:

```bash
kubectl auth can-i list pods --as=system:serviceaccount:demo-ns:demo-sa -n demo-ns
```

```output
yes
```

A SA não pode deletar pods no mesmo namespace (a Role só tem `get/list/watch`):

```bash
kubectl auth can-i delete pods --as=system:serviceaccount:demo-ns:demo-sa -n demo-ns
```

```output
no
```

A SA não pode listar pods em outro namespace (a Role é namespaced):

```bash
kubectl auth can-i list pods --as=system:serviceaccount:demo-ns:demo-sa -n default
```

```output
no
```

O formato do subject é `system:serviceaccount:<namespace>:<sa-name>`. É assim que o Kubernetes identifica internamente a ServiceAccount.

## Demonstração prática: isolamento entre namespaces

Namespaces não são apenas organizacionais. Eles também fornecem isolamento: um Pod no namespace A não consegue listar Pods no namespace B usando a API do Kubernetes (a menos que tenha RBAC para isso).

Criamos um Pod em cada namespace:

```bash
kubectl run pod-alpha --image=nginx:alpine -n demo-ns
kubectl run pod-beta --image=nginx:alpine -n default
```

```output
pod/pod-alpha created
pod/pod-beta created
```

Agora, listando pods de cada namespace. O namespace `default` só enxerga seus próprios pods:

```bash
kubectl get pods -n default
```

```output
NAME                              READY   STATUS    RESTARTS   AGE
pod-beta                          1/1     Running   0          6s
```

O namespace `demo-ns` também só enxerga os seus:

```bash
kubectl get pods -n demo-ns
```

```output
NAME        READY   STATUS    RESTARTS   AGE
pod-alpha   1/1     Running   0          6s
```

Cada namespace é um universo separado. Recursos em namespaces diferentes não colidem: `pod-alpha` existe em `demo-ns` sem conflito com nenhum outro `pod-alpha` em outro namespace.

Esse isolamento vale para quase todos os recursos: Pods, Services, ConfigMaps, Secrets, Deployments, PVCs. Alguns recursos são cluster-scoped (não pertencem a namespace): Nodes, PersistentVolumes, Namespaces, StorageClasses, ClusterRoles.

## Token da ServiceAccount

Em Kubernetes 1.24+, ServiceAccounts não ganham token automático. Você cria um token sob demanda com `kubectl create token`:

```bash
kubectl create token demo-sa -n demo-ns
```

```output
eyJhbGciOiJSUzI1NiIsImtpZCI6InptSl9oN0... (JWT truncado)
```

Esse token é um JWT assinado pelo API server. Um Pod que executa com essa ServiceAccount monta esse token automaticamente em `/var/run/secrets/kubernetes.io/serviceaccount/token`.

## Quando usar ClusterRole em vez de Role

- Role: permissões dentro de um namespace específico. Ex: "pode listar pods no namespace dev".
- ClusterRole: permissões em nível de cluster ou em recursos cluster-scoped. Ex: "pode listar Nodes", "pode criar Namespaces".

Um ClusterRole também pode ser usado com RoleBinding (em vez de ClusterRoleBinding). Nesse caso, as permissões do ClusterRole são limitadas ao namespace do RoleBinding. Isso é útil para reutilizar uma definição de permissão em vários namespaces sem duplicar a Role.

## Resumo do capítulo

- Namespaces particionam logicamente o cluster. Recursos de namespaces diferentes não colidem.
- RBAC: ServiceAccount (quem) + Role (o que) + RoleBinding (ligação). Role é namespaced. ClusterRole é cluster-scoped.
- `kubectl auth can-i --as=system:serviceaccount:<ns>:<sa>` testa permissões sem precisar de token.
- `kubectl create token <sa> -n <ns>` gera token JWT para uso externo.
- Isolamento entre namespaces é real: Pod no ns A não lista Pods no ns B sem RBAC explícito.
- Recursos cluster-scoped (Nodes, PVs, Namespaces) não pertencem a namespace. Use ClusterRole para controlar acesso a eles.

No próximo capítulo: Ingress. Roteamento HTTP, path-based routing e TLS.
