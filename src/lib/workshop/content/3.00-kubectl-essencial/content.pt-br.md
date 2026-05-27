## kubectl essencial: o canivete suíço do Kubernetes

`kubectl` é o CLI que conversa com a API server. Toda interação com o cluster passa por ele. Neste capítulo, você vai dominar os comandos que usa todo dia: `get`, `describe`, `logs`, `exec`, `apply`, `delete`.

A ideia não é memorizar. É saber o que cada um faz e onde achar a informação quando precisar. O cheatsheet no final do capítulo é seu mapa.

## Cluster de workshop

Nosso cluster tem quatro nós. Um control-plane e três workers:

```bash
kubectl get nodes -o wide
```

```text
NAME               STATUS   ROLES           AGE   VERSION    INTERNAL-IP     EXTERNAL-IP   OS-IMAGE             KERNEL-VERSION    CONTAINER-RUNTIME
ip-172-31-34-6     Ready    <none>          30m   v1.32.13   172.31.34.6     <none>        Ubuntu 24.04.4 LTS   6.17.0-1007-aws   containerd://2.2.1
ip-172-31-38-213   Ready    <none>          30m   v1.32.13   172.31.38.213   <none>        Ubuntu 24.04.4 LTS   6.17.0-1007-aws   containerd://2.2.1
ip-172-31-43-16    Ready    <none>          30m   v1.32.13   172.31.43.16    <none>        Ubuntu 24.04.4 LTS   6.17.0-1007-aws   containerd://2.2.1
ip-172-31-45-35    Ready    control-plane   32m   v1.32.13   172.31.45.35    <none>        Ubuntu 24.04.4 LTS   6.17.0-1007-aws   containerd://2.2.1
```

Cilium como CNI, containerd como runtime. Kubernetes 1.32.13.

## kubectl get: listar recursos

O comando mais usado. Lista qualquer recurso do cluster.

```bash
kubectl get pods
```

```
NAME                              READY   STATUS      RESTARTS   AGE
debug-pod                         1/1     Running     0          16m
dns-test-cp                       0/1     Completed   0          10m
nginx-svc-demo-7cbf4fc967-gsnkj   1/1     Running     0          17m
nginx-svc-demo-7cbf4fc967-w58r7   1/1     Running     0          17m
svc-demo-5f5b47b456-5hrtv         1/1     Running     0          63m
svc-demo-5f5b47b456-z5nmr         1/1     Running     0          63m
```

A flag `-o wide` adiciona IP e nó:

```bash
kubectl get pods -o wide
```

```
NAME                              READY   STATUS      RESTARTS   AGE   IP           NODE          NOMINATED NODE   READINESS GATES
debug-pod                         1/1     Running     0          16m   10.0.1.140   ip-172-31-34-6   <none>           <none>
dns-test-cp                       0/1     Completed   0          10m   10.0.0.244   ip-172-31-45-35   <none>           <none>
nginx-svc-demo-7cbf4fc967-gsnkj   1/1     Running     0          17m   10.0.1.105   ip-172-31-34-6   <none>           <none>
nginx-svc-demo-7cbf4fc967-w58r7   1/1     Running     0          17m   10.0.1.134   ip-172-31-34-6   <none>           <none>
svc-demo-5f5b47b456-5hrtv         1/1     Running     0          63m   10.0.1.191   ip-172-31-34-6   <none>           <none>
svc-demo-5f5b47b456-z5nmr         1/1     Running     0          63m   10.0.1.221   ip-172-31-34-6   <none>           <none>
```

O `get` funciona com qualquer resource. Alguns atalhos:

```bash
kubectl get nodes        # ou kubectl get no
kubectl get services     # ou kubectl get svc
kubectl get deployments  # ou kubectl get deploy
kubectl get configmaps   # ou kubectl get cm
kubectl get secrets      # ou kubectl get secret
kubectl get namespaces   # ou kubectl get ns
```

Para listar recursos de todos os namespaces:

```bash
kubectl get pods -A
```

```
NAMESPACE     NAME                                  READY   STATUS      RESTARTS   AGE
default       debug-pod                             1/1     Running     0          16m
default       dns-test-cp                           0/1     Completed   0          10m
default       nginx-svc-demo-7cbf4fc967-gsnkj       1/1     Running     0          17m
default       nginx-svc-demo-7cbf4fc967-w58r7       1/1     Running     0          17m
default       svc-demo-5f5b47b456-5hrtv             1/1     Running     0          63m
default       svc-demo-5f5b47b456-z5nmr             1/1     Running     0          63m
kube-system   cilium-dl4tx                          1/1     Running     0          71m
kube-system   cilium-envoy-lhzfn                    1/1     Running     0          69m
kube-system   cilium-envoy-vcxsv                    1/1     Running     0          71m
kube-system   cilium-operator-76d7589df-bjbcz       1/1     Running     0          71m
kube-system   cilium-sps6b                          1/1     Running     0          69m
kube-system   coredns-668d6bf9bc-7kc2j              1/1     Running     0          71m
kube-system   coredns-668d6bf9bc-gglfc              1/1     Running     0          71m
kube-system   etcd-ip-172-31-45-35                      1/1     Running     0          71m
kube-system   kube-apiserver-ip-172-31-45-35            1/1     Running     0          71m
kube-system   kube-controller-manager-ip-172-31-45-35   1/1     Running     0          71m
kube-system   kube-scheduler-ip-172-31-45-35            1/1     Running     0          71m
```

Filtros com label selector:

```bash
kubectl get pods -l app=nginx-svc-demo
```

Formatos de output alternativos:

```bash
kubectl get pods -o yaml   # YAML completo
kubectl get pods -o json   # JSON completo
kubectl get pods -o name   # só os nomes
```

## kubectl describe: todos os detalhes

Enquanto `get` mostra um resumo, `describe` mostra tudo que o Kubernetes sabe sobre o recurso. Events, condições, containers, volumes, IPs, tolerations. É o primeiro lugar que você olha quando algo não funciona.

```bash
kubectl describe pod debug-pod
```

```
Name:             debug-pod
Namespace:        default
Priority:         0
Service Account:  default
Node:             ip-172-31-34-6/172.31.34.6
Start Time:       Sun, 24 May 2026 23:11:53 +0000
Labels:           run=debug-pod
Status:           Running
IP:               10.0.1.140
Containers:
  debug-pod:
    Container ID:  containerd://e00a79318441998fd6eea8e0b10f5d650978b2c9523d6b4869781cb8ece2a0b7
    Image:         alpine/curl:latest
    State:          Running
      Started:      Sun, 24 May 2026 23:11:55 +0000
    Ready:          True
    Restart Count:  0
Conditions:
  Type                        Status
  PodReadyToStartContainers   True
  Initialized                 True
  Ready                       True
  ContainersReady             True
  PodScheduled                True
Events:
  Type    Reason     Age   From               Message
  ----    ------     ----  ----               -------
  Normal  Scheduled  16m   default-scheduler  Successfully assigned default/debug-pod to ip-172-31-34-6
  Normal  Pulling    16m   kubelet            Pulling image "alpine/curl:latest"
  Normal  Pulled     16m   kubelet            Successfully pulled image "alpine/curl:latest" in 1.554s
  Normal  Created    16m   kubelet            Created container: debug-pod
  Normal  Started    16m   kubelet            Started container debug-pod
```

Os Events descrevem o histórico do Pod. Scheduled, Pulling, Pulled, Created, Started. Se algo der errado, o erro aparece aqui.

Describe funciona com qualquer recurso:

```bash
kubectl describe node ip-172-31-34-6
kubectl describe service nginx-clusterip
kubectl describe deployment svc-demo
```

## kubectl logs: a saída do container

Logs mostram stdout e stderr do container. Igual `docker logs`.

```bash
kubectl logs nginx-svc-demo-7cbf4fc967-gsnkj --tail 10
```

```
2026/05/24 23:11:22 [notice] 1#1: nginx/1.25.5
2026/05/24 23:11:22 [notice] 1#1: built by gcc 12.2.0 (Debian 12.2.0-14)
2026/05/24 23:11:22 [notice] 1#1: OS: Linux 6.17.0-1007-aws
2026/05/24 23:11:22 [notice] 1#1: getrlimit(RLIMIT_NOFILE): 1024:524288
2026/05/24 23:11:22 [notice] 1#1: start worker processes
2026/05/24 23:11:22 [notice] 1#1: start worker process 29
2026/05/24 23:11:22 [notice] 1#1: start worker process 30
10.0.1.140 - - [24/May/2026:23:12:00 +0000] "GET / HTTP/1.1" 200 615 "-" "curl/8.19.0" "-"
10.0.1.140 - - [24/May/2026:23:12:07 +0000] "GET / HTTP/1.1" 200 615 "-" "curl/8.19.0" "-"
10.0.1.140 - - [24/May/2026:23:13:52 +0000] "GET / HTTP/1.1" 200 615 "-" "curl/8.19.0" "-"
```

Flags úteis de logs:

```bash
kubectl logs <pod> -f                    # follow, igual tail -f
kubectl logs <pod> --tail=50             # últimas 50 linhas
kubectl logs <pod> --since=5m            # logs dos últimos 5 minutos
kubectl logs <pod> --previous            # logs do container anterior (crashou)
kubectl logs <pod> -c <container>        # escolhe o container (Pod com sidecar)
kubectl logs <pod> --timestamps          # prefixa cada linha com timestamp
```

Se o Pod tem múltiplos containers, você precisa especificar qual:

```bash
kubectl logs my-pod -c sidecar
```

## kubectl exec: entrar no container

Executa comandos dentro do container. Igual `docker exec`.

```bash
kubectl exec debug-pod -- hostname
```

```
debug-pod
```

```bash
kubectl exec debug-pod -- date -u
```

```
Sun May 24 23:28:33 UTC 2026
```

Para shell interativo:

```bash
kubectl exec -it debug-pod -- sh
```

O `-it` aloca um terminal interativo (stdin + tty). Pressione Ctrl+D ou digite `exit` para sair.

Se o Pod tem múltiplos containers:

```bash
kubectl exec -it my-pod -c sidecar -- sh
```

## kubectl apply: criar e atualizar recursos

`apply` é declarativo. Você descreve o estado desejado e o Kubernetes faz o necessário para chegar lá. Se o recurso não existe, cria. Se existe, atualiza.

Vamos criar um Pod simples:

```bash
kubectl apply -f - <<YAML
apiVersion: v1
kind: Pod
metadata:
  name: demo-pod
  labels:
    app: demo
spec:
  containers:
  - name: busybox
    image: busybox:1.36
    command: ["sleep", "3600"]
    resources:
      requests:
        memory: "32Mi"
        cpu: "50m"
      limits:
        memory: "64Mi"
        cpu: "100m"
YAML
```

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: demo-pod
  labels:
    app: demo
spec:
  containers:
  - name: busybox
    image: busybox:1.36
    command: ["sleep", "3600"]
    resources:
      requests:
        memory: "32Mi"
        cpu: "50m"
      limits:
        memory: "64Mi"
        cpu: "100m"
```

```
pod/demo-pod created
```

O `apply` também funciona com arquivos:

```bash
kubectl apply -f pod.yaml
kubectl apply -f deployment.yaml
kubectl apply -f ./manifests/    # aplica todos os YAMLs do diretório
```

A diferença entre `apply` e `create`:

- `kubectl create` é imperativo. Se o recurso já existe, dá erro.
- `kubectl apply` é declarativo. Atualiza se já existe, cria se não.

No dia a dia, use `apply`. É idempotente e mais seguro para automação.

## kubectl delete: remover recursos

```bash
kubectl delete pod demo-pod
```

```
pod "demo-pod" deleted
```

Delete por label:

```bash
kubectl delete pods -l app=demo
```

Delete por arquivo:

```bash
kubectl delete -f pod.yaml
```

Delete com grace period (tempo que o container tem para finalizar gracefulmente):

```bash
kubectl delete pod demo-pod --grace-period=30
```

Delete forçado (sem esperar graceful shutdown, cuidado):

```bash
kubectl delete pod demo-pod --force --grace-period=0
```

## Resumo do capítulo

- `kubectl get`: lista recursos. `-o wide` para IP e nó, `-A` para todos os namespaces, `-l` para filtrar por label
- `kubectl describe`: detalhes completos do recurso. Events, condições, containers, IPs
- `kubectl logs`: stdout/stderr do container. `--previous` para ver o container que crashou
- `kubectl exec`: executa comandos dentro do container. `-it` para shell interativo
- `kubectl apply`: cria ou atualiza recursos declarativamente. Prefira `apply` ao `create`
- `kubectl delete`: remove recursos. `--grace-period` para shutdown graceful

No próximo capítulo: como debugar quando algo dá errado.
