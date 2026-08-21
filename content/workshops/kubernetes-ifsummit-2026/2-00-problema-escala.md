+++
date = 2026-01-01
title = "Docker: matei, morreu"
weight = 200
[extra]
part = 2
section = 0
read_time_minutes = 5
hands_on_minutes = 8
+++



## O problema

Na Parte 1 você aprendeu a criar containers. Docker, Dockerfile, Compose. Funciona. Mas e quando um container morre?

No Docker puro, ninguém revive, se você mata um `nginx` e ele fica morto. Se o processo crasha, ninguém reinicia. Se você quer 3 réplicas, tem que subir 3 manualmente. Se uma máquina cai, os containers que estavam nela vão junto.

Isso funciona pra desenvolvimento local, mas em produção, com dezenas ou centenas de containers, não.

## Docker: matei, morreu

A lógica do Docker é simples: você manda executar um container, ele executa. Se algo dá errado, o Docker reporta o status e para. Ele não tem um "controller" observando.

```bash
docker run -d --name doomed nginx:alpine
```

```text
08b4e370b7d929aaf39545f9d7927d41f1a274df1f1a801e0c722150dcc24367
```

```bash
docker kill doomed
```

{% raw %}
```bash
docker ps -a --filter name=doomed --format '{{.Names}}: {{.Status}}'
```
{% endraw %}

```text
doomed: Exited (137) Less than a second ago
```

O container fica `Exited` porque ninguém recriou. Esse é o comportamento esperado. O Docker faz exatamente o que você mandou.

## Kubernetes: matei, reviveu

Vamos fazer o mesmo no cluster que acabamos de montar.

Cria um Deployment com 1 réplica:

```bash
kubectl create deployment demo-autoheal --image=nginx:alpine --replicas=1
```

```text
deployment.apps/demo-autoheal created
```

Confere o pod:

```bash
kubectl get pods -l app=demo-autoheal -o wide
```

```text
NAME                             READY   STATUS    RESTARTS   AGE   IP           NODE               NOMINATED NODE   READINESS GATES
demo-autoheal-5f7fd64857-bj5mn   1/1     Running   0          10m   10.0.1.111   ip-172-31-43-16    <none>           <none>
```

Agora deleta o pod:

```bash
kubectl delete pod demo-autoheal-5f7fd64857-bj5mn --grace-period=0 --force
```

```text
Warning: Immediate deletion does not wait for confirmation that the running resource has been terminated. The resource may continue to run on the cluster indefinitely.
pod "demo-autoheal-5f7fd64857-bj5mn" force deleted
```

Espera 2 segundos e olha de novo:

```bash
kubectl get pods -l app=demo-autoheal -o wide
```

```text
NAME                             READY   STATUS    RESTARTS   AGE   IP           NODE               NOMINATED NODE   READINESS GATES
demo-autoheal-5f7fd64857-x6j7v   1/1     Running   0          11m   10.0.3.250   ip-172-31-38-213   <none>           <none>
```

O pod voltou. Nome diferente (`x6j7v` em vez de `bj5mn`), IP diferente, nó diferente, mas mesma aplicação. O Deployment detectou que a réplica desejada (1) não batia com a atual (0) e criou um pod novo.

Isso é o tal do **auto-healing**. Você declara o estado desejado e o Kubernetes trabalha pra manter esse estado. O capítulo 2.05 explica o mecanismo por trás disso: o reconciliation loop.

## O que aconteceu nos bastidores

```bash
kubectl get events --sort-by=.lastTimestamp | grep demo-autoheal
```

```text
11m         Normal    ScalingReplicaSet         deployment/demo-autoheal               Scaled up replica set demo-autoheal-5f7fd64857 from 0 to 1
11m         Normal    SuccessfulCreate          replicaset/demo-autoheal-5f7fd64857    Created pod: demo-autoheal-5f7fd64857-x6j7v
11m         Normal    Scheduled                 pod/demo-autoheal-5f7fd64857-x6j7v     Successfully assigned default/demo-autoheal-5f7fd64857-x6j7v to ip-172-31-38-213
11m         Normal    Pulling                   pod/demo-autoheal-5f7fd64857-x6j7v     Pulling image "nginx:alpine"
11m         Normal    Started                   pod/demo-autoheal-5f7fd64857-x6j7v     Started container nginx
11m         Normal    Created                   pod/demo-autoheal-5f7fd64857-x6j7v     Created container: nginx
11m         Normal    Pulled                    pod/demo-autoheal-5f7fd64857-x6j7v     Successfully pulled image "nginx:alpine" in 2.691s
```

Equanto o docker é **imperativo** (você manda executar, ele executa), o Kubernetes é **declarativo**: você diz "quero 1 réplica de nginx". O sistema monitora e age pra manter isso verdade. Se o pod morre, ele recria. Se você escala pra 5, ele sobe mais 4. Se você volta pra 2, ele mata 3.

Essa mudança de mentalidade (imperativo para declarativo) é o coração do Kubernetes. O resto é detalhe de implementação.

> Note: O Deployment não "ressuscita" o pod antigo. Ele cria um novo. Nome, IP, identidade: tudo diferente. Trate pods como efêmeros. O estado que importa é o declarado, não o atual.
