## Controller Manager: reconciliação contínua

- Conjunto de controllers. Cada um observa um tipo de recurso.
- Reconciliation loop: observa → compara → age → repete.
- Pattern central do Kubernetes. Todo controller segue esse loop.

## Declarativo vs Imperativo

- Imperativo (Docker): você executa passos. Se algo falha, você corrige. Container morto não volta.
- Declarativo (K8s): você declara estado desejado. O sistema converge sozinho. Pod morto renasce automaticamente.

## Demo ao vivo

```bash
kubectl create deployment web --image=nginx --replicas=3
```

3 pods executando. Deleta um:

```bash
kubectl delete pod web-xxx-yyy
```

Imediatamente: novo pod aparece (AGE: 4s). 3 pods de novo. Sem intervenção humana.

## ReplicaSet: o intermediário

```
Deployment → ReplicaSet → Pod(s)
```

- Deployment controller gerencia ReplicaSet
- ReplicaSet controller gerencia Pods
- Rolling update: Deployment cria ReplicaSet novo, escala antigo pra baixo

```bash
kubectl get replicaset -l app=web
```

```
NAME             DESIRED   CURRENT   READY   AGE
web-65d846d465   3         3         3       55s
```

## Controllers principais (30+ no 1.32)

- Deployment: número de réplicas
- ReplicaSet: pods do ReplicaSet
- Node: saúde dos nós
- Service / EndpointSlice: endpoints de Service
- Job / CronJob: Jobs e schedule
- DaemonSet: 1 pod por nó
- StatefulSet: identidade estável
- Namespace: ciclo de vida
- ServiceAccount: token secrets

Cada controller é independente. Se um falha, os outros continuam.

## Tolerância a falhas

Controller manager cai: pods continuam executando. Mudanças param de reconciliar. Quando volta (ou novo leader eleito), retoma de onde parou. Estado está no etcd, não em memória.

## Configuração real

```
--controllers=*,bootstrapsigner,tokencleaner
--cluster-cidr=10.244.0.0/16
--leader-elect=true
--service-cluster-ip-range=10.96.0.0/12
```

`*` = todos os controllers padrão. Porta 10257 (HTTPS) pra healthz.

```cheatsheet
Ver controllers do cluster
kubectl get pod -n kube-system kube-controller-manager-ip-172-31-45-35 -o yaml | grep controllers

Ver reconciliação em ação (deployment)
kubectl create deployment test --image=nginx --replicas=3
kubectl get pods -l app=test -o wide
kubectl delete pod <nome> && kubectl get pods -l app=test -o wide

Ver ReplicaSet de um deployment
kubectl get replicaset -l app=test

Ver eventos do deployment
kubectl describe deployment test | grep -A5 Events

Ver argumentos do controller manager
kubectl get pod -n kube-system kube-controller-manager-ip-172-31-45-35 -o yaml | grep -A20 command
```
