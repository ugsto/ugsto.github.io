## Deployments: estado desejado, controlador que reconcilia

No Kubernetes, você não cria Pods manualmente em produção. Você declara o **estado desejado** e um controlador trabalha para manter a realidade igual ao que você pediu. O Deployment é o controlador mais comum.

Funciona assim: você diz "quero 3 réplicas do nginx:1.25" e o deployment controller cria os Pods, monitora a saúde deles e reconstrói qualquer um que morrer. Se você mudar o estado desejado (nova imagem, mais réplicas), ele faz a transição de forma controlada.

O Deployment não gerencia Pods diretamente. Ele cria um **ReplicaSet**, que por sua vez cria os Pods. A cada mudança no spec do Deployment, um novo ReplicaSet é criado e o antigo é escalado para zero. Isso permite rollback instantâneo: é só voltar para o ReplicaSet anterior.

## Criando um Deployment

Vamos criar um Deployment de nginx com 3 réplicas:

```bash
kubectl create deployment nginx-demo --image=nginx:1.25 --port=80 --replicas=3
```

```
deployment.apps/nginx-demo created
```

O comando cria o Deployment, que imediatamente dispara a criação de um ReplicaSet e dos Pods.

## Inspecionando Deployment, ReplicaSet e Pods

Depois de alguns segundos, os Pods estão executando:

```bash
kubectl get deploy nginx-demo
```

```
NAME         READY   UP-TO-DATE   AVAILABLE   AGE
nginx-demo   3/3     3            3           23s
```

Colunas importantes: `READY` (réplicas prontas), `UP-TO-DATE` (réplicas na versão atual), `AVAILABLE` (réplicas disponíveis para tráfego).

O Deployment criou um ReplicaSet automaticamente:

```bash
kubectl get rs -l app=nginx-demo
```

```
NAME                   DESIRED   CURRENT   READY   AGE
nginx-demo-bcfbb455d   3         3         3       23s
```

E o ReplicaSet criou os Pods:

```bash
kubectl get pods -l app=nginx-demo -o wide
```

```
NAME                         READY   STATUS    RESTARTS   AGE   IP           NODE          NOMINATED NODE   READINESS GATES
nginx-demo-bcfbb455d-lpfwn   1/1     Running   0          23s   10.0.3.206    ip-172-31-34-6   <none>           <none>
nginx-demo-bcfbb455d-pv8gz   1/1     Running   0          23s   10.0.1.163   ip-172-31-34-6   <none>           <none>
nginx-demo-bcfbb455d-rzpfw   1/1     Running   0          23s   10.0.1.133   ip-172-31-34-6   <none>           <none>
```

Note o padrão de nomes: `<deployment>-<rs-hash>-<pod-hash>`. O hash do ReplicaSet (`bcfbb455d`) é derivado do PodTemplate. Se o template mudar, o hash muda e um novo ReplicaSet é criado.

## Escalando o Deployment

Precisa de mais réplicas? O comando é um só:

```bash
kubectl scale deployment nginx-demo --replicas=5
```

```
deployment.apps/nginx-demo scaled
```

Os novos Pods aparecem imediatamente:

```bash
kubectl get pods -l app=nginx-demo -o wide
```

```
NAME                         READY   STATUS              RESTARTS   AGE   IP           NODE          NOMINATED NODE   READINESS GATES
nginx-demo-bcfbb455d-lpfwn   1/1     Running             0          30s   10.0.3.206    ip-172-31-34-6   <none>           <none>
nginx-demo-bcfbb455d-ntl47   0/1     ContainerCreating   0          0s    <none>       ip-172-31-34-6   <none>           <none>
nginx-demo-bcfbb455d-pv8gz   1/1     Running             0          30s   10.0.1.163   ip-172-31-34-6   <none>           <none>
nginx-demo-bcfbb455d-rzpfw   1/1     Running             0          30s   10.0.1.133   ip-172-31-34-6   <none>           <none>
nginx-demo-bcfbb455d-xw9z4   0/1     ContainerCreating   0          0s    <none>       ip-172-31-34-6   <none>           <none>
```

Dois novos Pods em `ContainerCreating`. Em poucos segundos todos estarão `Running`. O ReplicaSet continua o mesmo (`bcfbb455d`), porque o template não mudou (só a contagem de réplicas).

## Rolling update: trocando a imagem sem downtime

O verdadeiro poder do Deployment está no rolling update. Você troca a imagem e ele substitui os Pods aos poucos, garantindo que sempre haja réplicas disponíveis:

```bash
kubectl set image deployment nginx-demo nginx=nginx:1.26
```

```
deployment.apps/nginx-demo image updated
```

Acompanhe o progresso com `rollout status`:

```bash
kubectl rollout status deployment nginx-demo --timeout=60s
```

```
Waiting for deployment "nginx-demo" rollout to finish: 2 out of 5 new replicas have been updated...
Waiting for deployment "nginx-demo" rollout to finish: 3 out of 5 new replicas have been updated...
Waiting for deployment "nginx-demo" rollout to finish: 4 out of 5 new replicas have been updated...
Waiting for deployment "nginx-demo" rollout to finish: 1 old replicas are pending termination...
deployment "nginx-demo" successfully rolled out
```

O que aconteceu por trás: o Deployment criou um novo ReplicaSet (`nginx-demo-69c8c84985`) com a imagem nova, escalou ele progressivamente e foi matando os Pods do ReplicaSet antigo. Sempre mantendo pelo menos 4 de 5 disponíveis (25% max unavailable).

Veja os dois ReplicaSets:

```bash
kubectl get rs -l app=nginx-demo
```

```
NAME                    DESIRED   CURRENT   READY   AGE
nginx-demo-69c8c84985   5         5         5       17s
nginx-demo-bcfbb455d    0         0         0       61s
```

O ReplicaSet antigo (`bcfbb455d`) está com 0 réplicas. O novo (`69c8c84985`) tem as 5 ativas.

O histórico de revisões:

```bash
kubectl rollout history deployment nginx-demo
```

```
deployment.apps/nginx-demo
REVISION  CHANGE-CAUSE
1         <none>
2         <none>
```

Revisão 1: criação inicial com nginx:1.25. Revisão 2: set image para nginx:1.26.

## Rollback: voltando atrás em segundos

Se a nova versão tiver problema, o rollback é instantâneo:

```bash
kubectl rollout undo deployment nginx-demo
```

```
deployment.apps/nginx-demo rolled back
```

Acompanhe a volta:

```bash
kubectl rollout status deployment nginx-demo --timeout=60s
```

```
Waiting for deployment "nginx-demo" rollout to finish: 2 out of 5 new replicas have been updated...
Waiting for deployment "nginx-demo" rollout to finish: 3 out of 5 new replicas have been updated...
Waiting for deployment "nginx-demo" rollout to finish: 4 out of 5 new replicas have been updated...
Waiting for deployment "nginx-demo" rollout to finish: 1 old replicas are pending termination...
deployment "nginx-demo" successfully rolled out
```

Depois do rollback, o ReplicaSet antigo volta a ter as réplicas e o novo é zerado:

```bash
kubectl get rs -l app=nginx-demo
```

```
NAME                    DESIRED   CURRENT   READY   AGE
nginx-demo-69c8c84985   0         0         0       30s
nginx-demo-bcfbb455d    5         5         5       74s
```

O histórico agora mostra 3 revisões. A revisão 3 é o rollback (que na prática volta para o spec da revisão 1):

```bash
kubectl rollout history deployment nginx-demo
```

```
deployment.apps/nginx-demo
REVISION  CHANGE-CAUSE
2         <none>
3         <none>
```

## kubectl describe deployment: a ficha completa

O `kubectl describe` mostra tudo que importa sobre o Deployment:

```bash
kubectl describe deployment nginx-demo
```

```
Name:                   nginx-demo
Namespace:              default
CreationTimestamp:      Sun, 24 May 2026 23:05:21 +0000
Labels:                 app=nginx-demo
Annotations:            deployment.kubernetes.io/revision: 3
Selector:               app=nginx-demo
Replicas:               5 desired | 5 updated | 5 total | 5 available | 0 unavailable
StrategyType:           RollingUpdate
MinReadySeconds:        0
RollingUpdateStrategy:  25% max unavailable, 25% max surge
Pod Template:
  Labels:  app=nginx-demo
  Containers:
   nginx:
    Image:         nginx:1.25
    Port:          80/TCP
    Host Port:     0/TCP
    Environment:   <none>
    Mounts:        <none>
  Volumes:         <none>
  Node-Selectors:  <none>
  Tolerations:     <none>
Conditions:
  Type           Status  Reason
  ----           ------  ------
  Available      True    MinimumReplicasAvailable
  Progressing    True    NewReplicaSetAvailable
OldReplicaSets:  nginx-demo-69c8c84985 (0/0 replicas created)
NewReplicaSet:   nginx-demo-bcfbb455d (5/5 replicas created)
Events:
  Type    Reason             Age               From                   Message
  ----    ------             ----              ----                   -------
  Normal  ScalingReplicaSet  80s               deployment-controller  Scaled up replica set nginx-demo-bcfbb455d from 0 to 3
  Normal  ScalingReplicaSet  50s               deployment-controller  Scaled up replica set nginx-demo-bcfbb455d from 3 to 5
  Normal  ScalingReplicaSet  36s               deployment-controller  Scaled up replica set nginx-demo-69c8c84985 from 0 to 2
  Normal  ScalingReplicaSet  36s               deployment-controller  Scaled down replica set nginx-demo-bcfbb455d from 5 to 4
  Normal  ScalingReplicaSet  36s               deployment-controller  Scaled up replica set nginx-demo-69c8c84985 from 2 to 3
  Normal  ScalingReplicaSet  28s               deployment-controller  Scaled down replica set nginx-demo-bcfbb455d from 4 to 3
  Normal  ScalingReplicaSet  28s               deployment-controller  Scaled up replica set nginx-demo-69c8c84985 from 3 to 4
  Normal  ScalingReplicaSet  28s               deployment-controller  Scaled down replica set nginx-demo-bcfbb455d from 3 to 1
  Normal  ScalingReplicaSet  28s               deployment-controller  Scaled up replica set nginx-demo-69c8c84985 from 4 to 5
  Normal  ScalingReplicaSet  7s (x9 over 26s)  deployment-controller  (combined from similar events): Scaled down replica set nginx-demo-69c8c84985 from 1 to 0
```

Os Events contam a história completa. Dá para ver a sequência: scale inicial para 3, scale para 5, o rolling update degrau por degrau (sobe o novo, desce o antigo), e o rollback que reverteu tudo. É o seu primeiro lugar para olhar quando algo der errado.

## Resumo do fluxo

Deployment → ReplicaSet → Pod. O Deployment é a camada declarativa: você diz o que quer. O ReplicaSet é a camada operacional: garante o número certo de réplicas. O Pod é a unidade que efetivamente executa o container.

Toda mudança no PodTemplate gera um novo ReplicaSet. Isso permite rollback instantâneo, porque o ReplicaSet antigo continua lá, só com réplicas zeradas. Rollback é basicamente "escala o ReplicaSet antigo e zera o novo".
