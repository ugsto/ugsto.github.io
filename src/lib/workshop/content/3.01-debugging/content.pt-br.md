## Debugging no Kubernetes: o que fazer quando algo quebra

Pod não sobe. Container reinicia sozinho. Serviço não responde. Acontece o tempo todo. A diferença entre debuggar em 5 minutos e debuggar em 2 horas é saber onde olhar.

Este capítulo cobre as quatro ferramentas principais de debugging: `kubectl get events`, `kubectl logs --previous`, `kubectl describe`, e containers efêmeros (`kubectl debug`).

## A hierarquia do debugging

Quando um Pod não está funcionando, siga esta ordem:

1. `kubectl get pods` para ver o status (Running? Pending? CrashLoopBackOff?)
2. `kubectl describe pod` para ver os Events
3. `kubectl logs` para ver a saída do container
4. Se o container crashou: `kubectl logs --previous`
5. Se precisa inspecionar ao vivo: `kubectl exec` ou `kubectl debug`

Não pule etapas. Events primeiro, logs depois, shell por último.

## kubectl get events: a linha do tempo do cluster

Events são o log de auditoria do Kubernetes. Tudo que acontece gera um Event. O scheduler agendou? Event. A imagem foi puxada? Event. O container iniciou? Event. Falhou? Event também.

```bash
kubectl get events --sort-by=.metadata.creationTimestamp
```

Aqui está a saída real de um cluster nos últimos minutos:

```
LAST SEEN   TYPE      REASON              OBJECT                               MESSAGE
16m         Normal    Scheduled           pod/debug-pod                        Successfully assigned default/debug-pod to ip-172-31-34-6
16m         Normal    Pulling             pod/debug-pod                        Pulling image "alpine/curl:latest"
16m         Normal    Pulled              pod/debug-pod                        Successfully pulled image "alpine/curl:latest" in 1.554s
16m         Normal    Created             pod/debug-pod                        Created container: debug-pod
16m         Normal    Started             pod/debug-pod                        Started container debug-pod
10m         Normal    Scheduled           pod/dns-test-cp                      Successfully assigned default/dns-test-cp to ip-172-31-45-35
10m         Normal    Pulling             pod/dns-test-cp                      Pulling image "busybox:1.36"
10m         Normal    Pulled              pod/dns-test-cp                      Successfully pulled image "busybox:1.36" in 1.607s
10m         Normal    Started             pod/dns-test-cp                      Started container dns-test-cp
10m         Normal    Created             pod/dns-test-cp                      Created container: dns-test-cp
10m         Normal    ScalingReplicaSet   deployment/nginx-svc                 Scaled up replica set nginx-svc-bb9477cb5 from 0 to 1
10m         Normal    SuccessfulCreate    replicaset/nginx-svc-bb9477cb5       Created pod: nginx-svc-bb9477cb5-xgk2x
10m         Normal    Scheduled           pod/nginx-svc-bb9477cb5-xgk2x        Successfully assigned to ip-172-31-34-6
10m         Normal    Created             pod/nginx-svc-bb9477cb5-xgk2x        Created container: nginx
10m         Normal    Started             pod/nginx-svc-bb9477cb5-xgk2x        Started container nginx
```

Events são namespace-scoped. Para ver eventos de um Pod específico:

```bash
kubectl get events --field-selector involvedObject.name=debug-pod
```

Para filtrar só warnings (problemas):

```bash
kubectl get events --field-selector type=Warning
```

Events expiram depois de 1 hora por padrão. Não espere muito para debugar.

## kubectl describe pod: o prontuário do paciente

`describe` é o comando mais completo para inspecionar um Pod. Ele mostra tudo: qual nó, qual IP, quais containers, se estão prontos, quantos restarts, as condições e os events.

```bash
kubectl describe pod nginx-svc-demo-7cbf4fc967-gsnkj
```

```
Name:             nginx-svc-demo-7cbf4fc967-gsnkj
Namespace:        default
Priority:         0
Service Account:  default
Node:             ip-172-31-34-6/172.31.34.6
Start Time:       Sun, 24 May 2026 23:11:21 +0000
Labels:           app=nginx-svc-demo
                  pod-template-hash=7cbf4fc967
Status:           Running
IP:               10.0.1.105
Controlled By:    ReplicaSet/nginx-svc-demo-7cbf4fc967
Containers:
  nginx:
    Container ID:   containerd://556e65fe018a8140f5382360f3f2538720156fd4d3270278da9aa10ff9a68bbe
    Image:          nginx:1.25
    Port:           80/TCP
    State:          Running
      Started:      Sun, 24 May 2026 23:11:22 +0000
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
  Normal  Scheduled  17m   default-scheduler  Successfully assigned to ip-172-31-34-6
  Normal  Pulled     17m   kubelet            Container image "nginx:1.25" already present on machine
  Normal  Created    17m   kubelet            Created container: nginx
  Normal  Started    17m   kubelet            Started container nginx
```

Preste atenção em:

- State: Running, Waiting, Terminated. Se Waiting, olhe o Reason.
- Restart Count: se está subindo, o container está reiniciando (crash loop).
- Conditions: Ready=False é o que faz o Pod não receber tráfego.
- Events: o histórico do que aconteceu. O motivo do erro está aqui.

Se o Pod está em `CrashLoopBackOff`, o describe mostra a sequência de restarts e o motivo da falha.

## kubectl logs --previous: o que aconteceu antes do crash

Quando um container morre e é recriado (restart), os logs do container antigo somem. O `--previous` recupera os logs da instância anterior.

Isso é essencial para debugar crash loops. Sem `--previous`, você só vê os logs do container novo, que talvez ainda nem tenha crashado.

Criamos um Pod que falha de propósito. Ele cria um arquivo, espera 30 segundos, deleta o arquivo. O liveness probe verifica se o arquivo existe. Quando não existe, o probe falha e o container é morto.

Depois de alguns restarts, olhamos os logs do container atual:

```bash
kubectl logs failing-liveness
```

```
started
```

Só mostra "started" porque o container atual acabou de iniciar. O crash aconteceu no anterior. Use `--previous`:

```bash
kubectl logs failing-liveness --previous
```

Se o container anterior produziu saída, você vê aqui. Nem todo crash deixa logs em stdout. Mas quando deixa, o `--previous` é o caminho.

A sequência completa para debugar crash loop:

```bash
kubectl get pods                          # vê Restart Count
kubectl describe pod <nome>               # vê Events, Last State, Exit Code
kubectl logs <nome> --previous            # vê logs do container que crashou
```

## Containers efêmeros: debug sem mexer na imagem

Às vezes o container está executando mas você precisa inspecionar algo que as ferramentas da imagem não cobrem. Instalar pacotes no container de produção é gambiarra e nem sempre possível (imagem distroless, sem package manager).

O Kubernetes tem um recurso chamado **ephemeral containers**. Você adiciona um container temporário ao Pod sem reiniciá-lo. Ele compartilha os mesmos namespaces e pode inspecionar o filesystem e processos do container original.

```bash
kubectl debug -it <pod> --image=busybox:1.36 --target=<container> -- sh
```

A flag `--target=<container>` faz o container efêmero entrar no namespace de processo do container alvo. Você vê os mesmos processos, mesmo filesystem via `/proc/<pid>/root`.

Exemplo real: o Pod `debug-pod` tem um container executando `alpine/curl`. Vamos inspecionar com um container efêmero:

```bash
kubectl debug -it debug-pod --image=busybox:1.36 --target=debug-pod -- sh
```

```
Targeting container "debug-pod". If you don't see processes from this container
it may be because the container runtime doesn't support this feature.
Defaulting debug container name to debugger-xjjtj.
```

Dentro do container efêmero, podemos ver o hostname e IP do Pod:

```bash
hostname && ip addr show eth0 | grep inet
```

```
debug-pod
    inet 10.0.1.140/32 scope global eth0
    inet6 fe80::cc36:28ff:fec0:65a7/64 scope link
```

O container efêmero compartilha o network namespace do Pod. O IP é o mesmo. O hostname é o mesmo.

Para sair, `exit` ou Ctrl+D. O container efêmero é removido automaticamente.

Use cases de containers efêmeros:

- Inspecionar sistema de arquivos de container distroless
- Executar tcpdump para debugar rede
- Verificar processos com `ps aux` quando a imagem base não tem shell
- Executar strace para ver syscalls

## Debugging de rede: o Pod responde?

Às vezes o Pod está Running mas não responde. O problema pode ser rede. Alguns checks rápidos:

```bash
kubectl exec debug-pod -- curl -s -o /dev/null -w "%{http_code}" http://nginx-clusterip
```

```
200
```

Ou via IP do Pod diretamente:

```bash
kubectl exec debug-pod -- wget -q -O- http://10.0.1.105
```

Se o Pod não tem curl/wget, use um container efêmero com as ferramentas que precisa.

## Resumo do capítulo

- Events são a linha do tempo do cluster. `kubectl get events --sort-by=.metadata.creationTimestamp`
- `describe` é o prontuário completo. State, Restart Count, Conditions, Events
- `logs --previous` recupera logs do container que crashou. Essencial para crash loops
- Containers efêmeros (`kubectl debug --target`) permitem inspecionar sem modificar a imagem
- Siga a hierarquia: get pods → describe → logs → logs --previous → exec/debug
- Não pule etapas. Events primeiro, logs depois, shell por último

No próximo capítulo: ConfigMaps e Secrets para separar configuração do código.
