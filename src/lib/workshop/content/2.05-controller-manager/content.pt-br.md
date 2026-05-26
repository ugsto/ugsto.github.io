## O coração do Kubernetes

O Controller Manager (`kube-controller-manager`) é o conjunto de controladores que mantém o estado declarado. Cada controller faz uma coisa: observa um tipo de recurso, compara estado atual com desejado, e age pra corrigir a diferença.

Esse loop (observar → comparar → agir → repetir) é chamado de **reconciliation loop**. É o pattern central do Kubernetes.

## Reconciliation loop

O pseudo-código de todo controller:

```
loop:
    estado_atual = observa_api_server()
    estado_desejado = le_spec_do_recurso()
    if estado_atual != estado_desejado:
        cria_ou_deleta_recursos_para_corrigir()
    sleep(intervalo_ou_espera_watch_event)
```

Sem ifs complexos. Sem lógica de edge cases. O controller não tenta acertar de primeira. Ele tenta, erra, tenta de novo. Se algo falha, ele simplesmente tenta de novo no próximo loop.

Isso é **declarativo**: você declara o estado desejado e o sistema converge pra ele. O oposto é **imperativo**: você executa passos (faz A, depois B, se erro faz C). Declarativo é mais resiliente porque o sistema sempre converge pro estado desejado, não importa quantas falhas aconteçam no caminho.

## Declarativo vs Imperativo na prática

### Abordagem imperativa (Docker puro)

```bash
docker run -d --name web1 nginx
docker run -d --name web2 nginx
docker run -d --name web3 nginx
```

```
abc123...  web1
def456...  web2
ghi789...  web3
```

Agora alguém deleta um container:

```bash
docker kill web2
```

Resultado: 2 containers executando. O terceiro não voltou. Você tem que lembrar de recriar manualmente.

### Abordagem declarativa (Kubernetes)

```bash
kubectl create deployment web --image=nginx --replicas=3
```

```
deployment.apps/web created
```

Vamos ver os pods:

```bash
kubectl get pods -l app=web -o wide
```

```text
NAME                   READY   STATUS    RESTARTS   AGE   IP           NODE               NOMINATED NODE   READINESS GATES
web-65d846d465-nfffc   1/1     Running   0          15m   10.0.2.112   ip-172-31-34-6     <none>           <none>
web-65d846d465-pnvdg   1/1     Running   0          15m   10.0.3.77    ip-172-31-38-213   <none>           <none>
web-65d846d465-ppvlq   1/1     Running   0          15m   10.0.1.168   ip-172-31-43-16    <none>           <none>
```

Três pods, todos Running. Agora deleta um:

```bash
kubectl delete pod web-65d846d465-6nhqs
```

```
pod "web-65d846d465-6nhqs" deleted
```

E imediatamente confere de novo:

```bash
kubectl get pods -l app=web -o wide
```

```
NAME                   READY   STATUS    RESTARTS   AGE   IP           NODE          NOMINATED NODE   READINESS GATES
web-65d846d465-c9zzz   1/1     Running   0          17s   10.0.1.136   ip-172-31-34-6   <none>           <none>
web-65d846d465-pfqfh   1/1     Running   0          17s   10.0.1.67    ip-172-31-34-6   <none>           <none>
web-65d846d465-vlzrl   1/1     Running   0          4s    10.0.1.142   ip-172-31-34-6   <none>           <none>
```

Três pods de novo. O pod deletado sumiu (`6nhqs`), mas um novo apareceu (`vlzrl`, age 4s). O Deployment controller detectou: "quero 3, tenho 2, preciso criar 1". Nenhum humano interveio. Nenhum if. Nenhum script de monitoramento.

O que o Deployment controller registrou:

```bash
kubectl describe deployment web | grep -A5 Events
```

```
Events:
  Type    Reason             Age   From                   Message
  ----    ------             ----  ----                   -------
  Normal  ScalingReplicaSet  26s   deployment-controller  Scaled up replica set web-65d846d465 from 0 to 3
```

`deployment-controller` escalou o ReplicaSet de 0 pra 3 réplicas.

## ReplicaSet: o intermediário

Um detalhe importante: o Deployment não gerencia pods diretamente. O Deployment cria um ReplicaSet, e o ReplicaSet cria os pods.

```
Deployment  →  ReplicaSet  →  Pod(s)
```

Conferindo o ReplicaSet:

```bash
kubectl get replicaset -l app=web
```

```
NAME             DESIRED   CURRENT   READY   AGE
web-65d846d465   3         3         3       55s
```

DESIRED=3, CURRENT=3, READY=3. O ReplicaSet controller é quem mantém o número de pods. O Deployment controller gerencia o ReplicaSet.

Quando você faz um rolling update (muda a imagem, por exemplo), o Deployment cria um ReplicaSet novo e escala o antigo pra baixo. O capítulo 2.09 cobre isso em detalhe.

## Controllers em execução no cluster

```bash
kubectl get pod -n kube-system kube-controller-manager-ip-172-31-45-35 -o yaml
```

```
--controllers=*,bootstrapsigner,tokencleaner
```

O `*` significa "todos os controllers padrão". No Kubernetes 1.32, são mais de 30 controllers. Os principais:

- Deployment: garante número de réplicas. Observa Deployment e ReplicaSet.
- ReplicaSet: garante pods do ReplicaSet. Observa ReplicaSet e Pod.
- Node: monitora saúde dos nós. Observa Node.
- Service: cria endpoints pra Services. Observa Service e Pod.
- EndpointSlice: gerencia fatias de endpoints. Observa Service e Pod.
- Job: garante completação de Jobs. Observa Job e Pod.
- CronJob: cria Jobs no schedule. Observa CronJob.
- DaemonSet: garante 1 pod por nó. Observa DaemonSet e Pod.
- StatefulSet: ordenação e identidade estável. Observa StatefulSet e Pod.
- Namespace: gerencia ciclo de vida de namespaces. Observa Namespace.
- ServiceAccount: cria token secrets. Observa ServiceAccount.

Cada controller é independente. Se o Deployment controller travar, o ReplicaSet controller continua funcionando. Se o Node controller travar, o Job controller não é afetado.

## O que acontece quando o controller manager falha

Se o controller manager cair, nada imediatamente quebra. Os pods continuam executando. O cluster continua funcionando. Mas mudanças param de ser reconciliadas: pods mortos não renascem, endpoints não atualizam, nodes não são marcados como NotReady.

Quando o controller manager volta (ou um novo leader é eleito, em HA), ele retoma o reconciliation loop de onde parou. O estado converge de novo.

Essa tolerância a falhas é parte do design. Todo componente pode cair e voltar sem perder estado. Por que? Porque o estado está no etcd, não em memória.

## Configuração real do nosso controller manager

Argumentos principais:

```
kube-controller-manager
--allocate-node-cidrs=true
--cluster-cidr=10.244.0.0/16
--controllers=*,bootstrapsigner,tokencleaner
--leader-elect=true
--service-cluster-ip-range=10.96.0.0/12
```

- `--cluster-cidr=10.244.0.0/16`: range de IPs pros pods. Cada nó ganha um /24. O Cilium usa esse range.
- `--allocate-node-cidrs=true`: o controller manager aloca sub-redes pra nós novos automaticamente.
- `--leader-elect=true`: em HA, só o leader faz reconciliação. Outros ficam em standby.
- `--controllers=*`: executa todos os controllers padrão. Dá pra ser seletivo e desabilitar controllers que você não precisa.

O controller manager escuta em `127.0.0.1:10257` (HTTPS) pra healthz e métricas.

> ℹ️ Declarativo não é mágica. Alguém tem que escrever o controller. Mas uma vez escrito, o controller funciona pra sempre, pra qualquer escala, sem intervenção humana. Esse é o segredo do Kubernetes: você não opera containers, você declara estado e o sistema mantém.
