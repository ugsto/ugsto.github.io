## Health Checks: provas de vida, prontidão e inicialização

O Kubernetes não sabe se sua aplicação está funcionando só porque o processo existe. Um processo pode estar executando mas com deadlock. Ou pode ter iniciado mas ainda estar carregando cache. Health checks resolvem isso.

Três tipos de probe no Kubernetes:

- Liveness probe: "O container está vivo?" Se falha, o kubelet mata e reinicia o container.
- Readiness probe: "O container está pronto para receber tráfego?" Se falha, o Pod é removido dos endpoints do Service. Não reinicia.
- Startup probe: "O container já terminou de inicializar?" Enquanto executa, liveness e readiness ficam em pausa. Útil para apps que demoram para subir (Java, migrations, cache warmup).

Cada probe pode usar três mecanismos: `httpGet` (faz GET HTTP), `tcpSocket` (tenta abrir socket TCP), ou `exec` (executa comando dentro do container).

## Liveness probe falhando: o ciclo de restart

Vamos criar um Pod com uma liveness probe configurada para um caminho que não responde. A aplicação escuta na porta 8080, mas o probe aponta para a porta 9090 (conexão recusada).

```bash
kubectl apply -f - <<YAML
apiVersion: v1
kind: Pod
metadata:
  name: liveness-fail
  labels:
    demo: health
spec:
  containers:
  - name: app
    image: busybox:1.36
    command:
    - sh
    - -c
    - |
      echo "Server starting on port 8080"
      httpd -f -p 8080 -h /tmp
    ports:
    - containerPort: 8080
    livenessProbe:
      httpGet:
        path: /healthz
        port: 9090
      initialDelaySeconds: 5
      periodSeconds: 5
      failureThreshold: 2
YAML
```

O que está configurado: após 5 segundos iniciais, a cada 5 segundos, faz GET em `http://<pod-ip>:9090/healthz`. Depois de 2 falhas consecutivas, mata e reinicia o container.

Depois de ~90 segundos, olha o estado do Pod:

```bash
kubectl get pod liveness-fail
```

```
NAME            READY   STATUS    RESTARTS     AGE
liveness-fail   1/1     Running   2 (1s ago)   93s
```

`RESTARTS: 2`. O container já foi morto e recriado duas vezes. Isso é o restart loop.

### kubectl describe: os Events contam a história

```bash
kubectl describe pod liveness-fail
```

```
Name:             liveness-fail
Namespace:        default
Node:             ip-172-31-34-6/172.31.34.6
Start Time:       Sun, 24 May 2026 23:55:02 +0000
Labels:           demo=health
Status:           Running
IP:               10.0.1.139
Containers:
  app:
    Container ID:  containerd://859bdd7f5b5f40358ea3e02ec69c219bd858495d75b53f4da79b73ac40975ddd
    Image:         busybox:1.36
    Port:          8080/TCP
    State:          Running
      Started:      Sun, 24 May 2026 23:56:33 +0000
    Last State:     Terminated
      Reason:       Error
      Exit Code:    137
      Started:      Sun, 24 May 2026 23:55:48 +0000
      Finished:     Sun, 24 May 2026 23:56:33 +0000
    Ready:          True
    Restart Count:  2
    Liveness:       http-get http://:9090/healthz delay=5s timeout=1s period=5s #success=1 #failure=2
Events:
  Type     Reason     Age                From               Message
  ----     ------     ----               ----               -------
  Normal   Scheduled  99s                default-scheduler  Successfully assigned default/liveness-fail to ip-172-31-34-6
  Warning  Unhealthy  39s (x4 over 89s)  kubelet            Liveness probe failed: Get "http://10.0.1.139:9090/healthz": dial tcp 10.0.1.139:9090: connect: connection refused
  Normal   Killing    39s (x2 over 84s)  kubelet            Container app failed liveness probe, will be restarted
  Normal   Pulled     8s (x3 over 98s)   kubelet            Container image "busybox:1.36" already present on machine
  Normal   Created    8s (x3 over 98s)   kubelet            Created container: app
  Normal   Started    8s (x3 over 98s)   kubelet            Started container app
```

O que os Events contam:

1. `Scheduled`: Pod agendado no nó.
2. `Unhealthy`: Probe falhou quatro vezes. Erro claro: connection refused na porta 9090.
3. `Killing`: Container morto duas vezes por falha no liveness probe.
4. `Pulled/Created/Started` (x3): O container foi puxado, criado e iniciado três vezes. Primeira criação original + duas recriações pós-kill.

O `Last State` mostra `Reason: Error, Exit Code: 137`. 137 = 128 + 9 (SIGKILL). O kubelet mandou SIGKILL porque o container falhou no liveness probe.

### Ajustando os thresholds

O comportamento do probe é definido por:

- `initialDelaySeconds: 5`: espera 5s antes da primeira verificação.
- `periodSeconds: 5`: verifica a cada 5s.
- `failureThreshold: 2`: tolera 2 falhas consecutivas antes de agir.
- `timeoutSeconds: 1`: timeout de 1s para cada requisição (default).

Com essas configs, o restart acontece em: initialDelaySeconds + (periodSeconds * failureThreshold) = 5 + 5*2 = ~15 segundos. Na prática pode ser um pouco mais por causa do scheduling interno do kubelet.

## Readiness probe: quando o Pod está pronto para tráfego

Readiness não reinicia o container. Só controla se o Pod entra nos endpoints do Service. Útil para apps que precisam de warmup (cache, connection pool) ou que ficam temporariamente indisponíveis (sobrecarga, garbage collection).

Vamos criar um Pod com readiness probe saudável. O servidor HTTP serve um arquivo `/healthz`:

```bash
kubectl apply -f - <<YAML
apiVersion: v1
kind: Pod
metadata:
  name: readiness-demo
  labels:
    demo: health
spec:
  containers:
  - name: app
    image: busybox:1.36
    command:
    - sh
    - -c
    - |
      echo "Server starting on port 8080"
      echo "OK" > /tmp/healthz
      httpd -f -p 8080 -h /tmp
    ports:
    - containerPort: 8080
    readinessProbe:
      httpGet:
        path: /healthz
        port: 8080
      initialDelaySeconds: 3
      periodSeconds: 5
YAML
```

```bash
kubectl get pod readiness-demo
```

```
NAME             READY   STATUS    RESTARTS   AGE
readiness-demo   1/1     Running   0          10s
```

O `1/1` em READY significa que o container está pronto. Vamos ver as condições:

```bash
kubectl describe pod readiness-demo
```

```
Conditions:
  Type                        Status
  PodReadyToStartContainers   True
  Initialized                 True
  Ready                       True
  ContainersReady             True
  PodScheduled                True
```

`Ready: True`. Se a readiness probe falhasse, `Ready` seria `False` e o Pod seria removido do Service. O container continuaria executando normalmente, só não receberia tráfego.

## Startup probe: protegendo apps que demoram para subir

A startup probe é um caso especial para aplicações com inicialização lenta (Java com Spring Boot, cache warmup, migrations). Enquanto a startup probe não termina com sucesso, liveness e readiness ficam em pausa, evitando kills prematuros.

Exemplo: app que demora até 60 segundos para inicializar:

```yaml
startupProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 0
  periodSeconds: 10
  failureThreshold: 12
```

Com essa config, o kubelet dá até 120 segundos (12 tentativas * 10s) para a app terminar de inicializar. Se falhar, o container é reiniciado (igual liveness). Se passar, o kubelet começa a executar liveness e readiness normalmente.

Sem startup probe, você teria que configurar `initialDelaySeconds` alto no liveness probe, desperdiçando tempo mesmo quando o container já está saudável.

## Resumo do capítulo

- Liveness probe: "está vivo?" Falha reinicia o container. Use para deadlocks e crashes silenciosos.
- Readiness probe: "está pronto?" Falha remove do Service. Use para warmup e degradação temporária.
- Startup probe: "terminou de inicializar?" Pausa liveness/readiness até passar. Use para apps lentas para subir.
- `kubectl describe pod` mostra os Events do probe. `Warning Unhealthy` + `Normal Killing` = liveness falhando.
- `Exit Code: 137` significa SIGKILL, normal para container morto por liveness.
- Sempre defina `initialDelaySeconds` e `failureThreshold` realistas. Probe muito agressiva mata container saudável. Probe muito lenta demora para detectar falha.

No próximo capítulo: resource limits. Requests, limits e qualidade de serviço (QoS).
