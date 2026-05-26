## Health Checks: os três tipos de probe

- Liveness probe: "está vivo?" Se falha, reinicia o container.
- Readiness probe: "está pronto?" Se falha, remove do Service. Não reinicia.
- Startup probe: "terminou de inicializar?" Pausa liveness/readiness até passar.

Três mecanismos: `httpGet`, `tcpSocket`, `exec`.

## Liveness probe: detecta deadlock e crash silencioso

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
  failureThreshold: 2
```

- Após 2 falhas consecutivas → kubelet mata o container (SIGKILL, exit code 137).
- `describe pod` mostra: `Warning Unhealthy` + `Normal Killing`.
- `RESTARTS` incrementa. Se chegar em CrashLoopBackOff, o kubelet espera entre restarts (backoff exponencial: 10s, 20s, 40s, 80s... até 5 min).

```bash
kubectl get pod liveness-fail
```

```
NAME            READY   STATUS    RESTARTS     AGE
liveness-fail   1/1     Running   2 (1s ago)   93s
```

## Readiness probe: controla entrada no Service

```yaml
readinessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 3
  periodSeconds: 5
```

- Se falha: Pod removido dos Endpoints do Service. Tráfego para de chegar.
- Container não é reiniciado. Continua executando, só fica fora do load balancer.
- `Conditions: Ready: False` no describe.
- Útil para warmup (cache, connection pool) e degradação temporária.

## Startup probe: evita kill prematuro

```yaml
startupProbe:
  httpGet:
    path: /healthz
    port: 8080
  periodSeconds: 10
  failureThreshold: 12
```

- Enquanto a startup probe executa: liveness e readiness ficam em pausa.
- Se falha depois de 12 tentativas (120s): container é reiniciado.
- Se passa: liveness e readiness assumem normalmente.
- Sem startup probe: você precisa de `initialDelaySeconds` grande no liveness.

## Thresholds e timing

```yaml
initialDelaySeconds: 5    # espera antes da primeira verificação
periodSeconds: 10         # intervalo entre verificações
timeoutSeconds: 1         # timeout da requisição (default: 1)
failureThreshold: 3       # falhas consecutivas antes de agir
successThreshold: 1       # sucessos consecutivos para considerar OK
```

- Liveness kill time = initialDelaySeconds + (periodSeconds * failureThreshold)
- Readiness: `successThreshold` precisa ser 1 (default). Se for > 1, o Pod fica `NotReady` por mais tempo.
- Startup: `failureThreshold * periodSeconds` define o tempo máximo de inicialização.

## Debugging de health checks

```bash
kubectl describe pod <nome>       # Events contam a história
kubectl get events --field-selector involvedObject.name=<pod>
kubectl logs <pod> --previous     # logs do container anterior (morto pelo probe)
```

Sinais de liveness probe falhando:

- `RESTARTS` > 0 e crescendo.
- Events: `Warning Unhealthy` seguido de `Normal Killing`.
- `Last State: Terminated, Exit Code: 137`.
- Status pode ser `CrashLoopBackOff` (backoff exponencial entre restarts).

## Cheatsheet

```cheatsheet
Liveness: reinicia em caso de deadlock
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
  failureThreshold: 3

Readiness: remove do Service temporariamente
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5

Startup: protege apps com inicialização lenta
startupProbe:
  httpGet:
    path: /healthz
    port: 8080
  periodSeconds: 10
  failureThreshold: 12

Probe com comando (exec)
livenessProbe:
  exec:
    command:
    - pgrep
    - myapp
  initialDelaySeconds: 5

Probe com TCP (tcpSocket)
readinessProbe:
  tcpSocket:
    port: 3306
  initialDelaySeconds: 3

Verificar probe configurado
kubectl describe pod <nome> | grep -A5 "Liveness:"
```
