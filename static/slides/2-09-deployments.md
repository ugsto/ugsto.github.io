## Deployment: estado desejado

- Deployment declara estado desejado. Controlador reconcilia: realidade → desejado.
- Deployment → ReplicaSet → Pod. Cada camada com responsabilidade própria.
- Mudança no PodTemplate gera novo ReplicaSet. Antigo fica guardado para rollback.
- Strategy: RollingUpdate (padrão) ou Recreate.

## Comandos essenciais

```bash
kubectl create deployment <nome> --image=<img> --port=<porta> --replicas=N
kubectl get deploy
kubectl get rs -l app=<nome>
kubectl get pods -l app=<nome> -o wide
kubectl scale deployment <nome> --replicas=N
kubectl set image deployment <nome> <container>=<nova-img>
kubectl rollout status deployment <nome>
kubectl rollout history deployment <nome>
kubectl rollout undo deployment <nome>
kubectl describe deployment <nome>
```

## Rolling update na prática (output real)

Criação com 3 réplicas:

```bash
kubectl create deployment nginx-demo --image=nginx:1.25 --port=80 --replicas=3
```

```
deployment.apps/nginx-demo created
```

Scale para 5:

```bash
kubectl scale deployment nginx-demo --replicas=5
```

Rolling update para nginx:1.26:

```bash
kubectl set image deployment nginx-demo nginx=nginx:1.26
kubectl rollout status deployment nginx-demo
```

```
Waiting for deployment "nginx-demo" rollout to finish: 2 out of 5 new replicas...
deployment "nginx-demo" successfully rolled out
```

Rollback:

```bash
kubectl rollout undo deployment nginx-demo
```

```
deployment.apps/nginx-demo rolled back
```

## ReplicaSets antes e depois do rollback

Após update para nginx:1.26:

```
NAME                    DESIRED   CURRENT   READY   AGE
nginx-demo-69c8c84985   5         5         5       17s   ← nova imagem
nginx-demo-bcfbb455d    0         0         0       61s   ← imagem antiga, zerado
```

Após rollback:

```
NAME                    DESIRED   CURRENT   READY   AGE
nginx-demo-69c8c84985   0         0         0       30s   ← zerado
nginx-demo-bcfbb455d    5         5         5       74s   ← voltou a ativa
```

## kubectl describe: o que olhar

- `Replicas`: desired / updated / total / available / unavailable
- `StrategyType`: RollingUpdate com Max unavailable e Max surge
- `Conditions`: Available, Progressing
- `OldReplicaSets` / `NewReplicaSet`: quais ReplicaSets estão ativos
- `Events`: a história completa de escalas, passo a passo
