## Namespaces e RBAC

Namespaces: partição virtual do cluster. Recursos não colidem entre namespaces.
RBAC: ServiceAccount (quem) + Role (o que) + RoleBinding (ligação).

## Criar namespace

```bash
kubectl create namespace demo-ns
kubectl run pod-alpha --image=nginx:alpine -n demo-ns
```

Namespaces built-in: default, kube-system, kube-public, kube-node-lease.

## ServiceAccount

```bash
kubectl create serviceaccount demo-sa -n demo-ns
```

Identidade do Pod. Em K8s 1.24+, token é criado sob demanda.

## Role (permissões dentro de um namespace)

```bash
kubectl create role pod-reader --verb=get,list,watch --resource=pods -n demo-ns
```

Verbs comuns: get, list, watch, create, update, patch, delete.

## RoleBinding (liga SA à Role)

```bash
kubectl create rolebinding demo-rb --role=pod-reader --serviceaccount=demo-ns:demo-sa -n demo-ns
```

Formato do subject: `system:serviceaccount:<ns>:<sa-name>`.

## auth can-i: testar permissões sem token

```bash
kubectl auth can-i list pods --as=system:serviceaccount:demo-ns:demo-sa -n demo-ns
```

```
yes
```

```bash
kubectl auth can-i delete pods --as=system:serviceaccount:demo-ns:demo-sa -n demo-ns
```

```
no
```

Isolamento entre namespaces: SA do ns A não lista pods do ns B sem RBAC explícito.

## ClusterRole vs Role

| Escopo | Recurso | Use |
|---|---|---|
| Role | namespaced | permissões em um namespace |
| ClusterRole | cluster-scoped | Nodes, PVs, Namespaces, StorageClasses |

ClusterRole com RoleBinding: permissões limitadas ao namespace do binding. Reutiliza definição sem duplicar.

## Criar token JWT

```bash
kubectl create token demo-sa -n demo-ns
```

Montado automaticamente em `/var/run/secrets/kubernetes.io/serviceaccount/token`.

## Recursos cluster-scoped (não pertencem a namespace)

Nodes, PersistentVolumes, Namespaces, StorageClasses, ClusterRoles.

## Cheatsheet

```cheatsheet
Criar namespace
kubectl create namespace <nome>

Listar namespaces
kubectl get namespaces

Criar ServiceAccount
kubectl create serviceaccount <nome> -n <ns>

Criar Role (get + list + watch em pods)
kubectl create role <nome> --verb=get,list,watch --resource=pods -n <ns>

Criar RoleBinding
kubectl create rolebinding <nome> --role=<role> --serviceaccount=<ns>:<sa> -n <ns>

Testar permissão
kubectl auth can-i <verb> <resource> --as=system:serviceaccount:<ns>:<sa> -n <ns>

Listar Roles
kubectl get roles -n <ns>

Listar RoleBindings
kubectl get rolebindings -n <ns>

Criar token JWT
kubectl create token <sa> -n <ns>

Ver recursos cluster-scoped (sem namespace)
kubectl api-resources --namespaced=false
```
