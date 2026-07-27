## O problema em escala

Docker puro não revive container morto. Você mata, ficou morto. Em produção isso não funciona.

## Docker: matei, morreu

```bash
docker run -d --name doomed nginx:alpine
docker kill doomed
docker ps -a | grep doomed
```

Container Exited. Ninguém recriou.

## Kubernetes: matei, reviveu

```bash
kubectl create deployment demo-autoheal --image=nginx:alpine --replicas=1
kubectl get pods -l app=demo-autoheal -o wide
kubectl delete pod demo-autoheal-xxx --grace-period=0 --force
kubectl get pods -l app=demo-autoheal -o wide
```

2 segundos depois, um pod novo aparece. Nome diferente, IP diferente, mesma aplicação.

## Eventos

```
Killing          → pod antigo parou
SuccessfulCreate → ReplicaSet criou pod novo
Scheduled        → Scheduler atribuiu ao worker
Pulled           → imagem em cache
Created          → container criado
Started          → container executando
```

Tudo no mesmo segundo. Sistema declarativo com controle contínuo.

## Imperativo vs Declarativo

- Docker: imperativo. Você manda executar. Morreu? Problema seu.
- Kubernetes: declarativo. Você diz o estado desejado. O sistema mantém.

Essa diferença de mentalidade é o coração do K8s. O resto é detalhe de implementação.

```cheatsheet
Auto-healing em ação
kubectl create deployment demo --image=nginx:alpine --replicas=1
kubectl delete pod -l app=demo --grace-period=0 --force
kubectl get pods -l app=demo -o wide
kubectl get events --sort-by=.lastTimestamp | grep demo

O pod volta sozinho em segundos.
Trate pods como efêmeros. O estado que importa é o declarado.
```
