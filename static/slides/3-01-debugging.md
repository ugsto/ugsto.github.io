## Hierarquia do debugging

Ordem certa para debugar um Pod:

1. `kubectl get pods` → status (Running? Pending? CrashLoopBackOff?)
2. `kubectl describe pod <nome>` → Events, State, Restart Count, Conditions
3. `kubectl logs <nome>` → stdout/stderr do container
4. `kubectl logs <nome> --previous` → logs do container que crashou
5. `kubectl exec -it <nome> -- sh` → shell interativo
6. `kubectl debug -it <nome> --image=bash --target=<c>` → container efêmero

Não pule etapas. Events primeiro, logs depois, shell por último.

## kubectl get events: linha do tempo

```bash
kubectl get events                              # todos os events do namespace
kubectl get events --sort-by=.metadata.creationTimestamp
kubectl get events --field-selector involvedObject.name=debug-pod
kubectl get events --field-selector type=Warning    # só problemas
kubectl get events -A                               # todos os namespaces
```

- Events expiram em 1h por padrão. Debugue rápido.
- Eventos de Warning são a bandeira vermelha: Unhealthy, Failed, BackOff, Killing
- Events de Normal contam o fluxo: Scheduled → Pulling → Pulled → Created → Started

## kubectl describe pod: prontuário completo

```bash
kubectl describe pod <nome>
```

O que olhar no describe:

- State: Running, Waiting (olhe Reason), Terminated (olhe Exit Code)
- Restart Count: se > 0, container já morreu e renasceu
- Last State: Reason e Exit Code do container anterior
- Conditions: Ready=False → não recebe tráfego. PodScheduled=False → não achou nó.
- Events: o histórico completo. O motivo do erro está aqui.

Exit codes comuns:

- Exit Code 0: terminou normalmente
- Exit Code 1: erro da aplicação
- Exit Code 137: SIGKILL (OOM kill ou liveness probe falhou)
- Exit Code 143: SIGTERM (graceful shutdown)

## kubectl logs --previous: crash loop

Quando o container reinicia, os logs antigos somem. Use `--previous`:

```bash
kubectl logs <nome> --previous       # logs da instância anterior
kubectl logs <nome> --previous -f    # se quiser follow (raro)
```

Sequência para crash loop:

```bash
kubectl get pods                              # vê RESTARTS
kubectl describe pod <nome>                   # vê Last State, Exit Code
kubectl logs <nome> --previous                # vê o que aconteceu
```

## Containers efêmeros: kubectl debug

Adiciona container temporário ao Pod sem reiniciá-lo:

```bash
kubectl debug -it <pod> --image=busybox:1.36 --target=<container> -- sh
```

- `--target=<container>`: entra no namespace de PID do container alvo
- Compartilha network namespace do Pod (mesmo IP)
- Filesystem do alvo acessível via `/proc/<pid>/root`
- Ideal para distroless, imagens sem shell, debugging de rede

```bash
kubectl debug -it debug-pod --image=busybox:1.36 --target=debug-pod -- sh
```

Use cases:

- Imagem sem shell (distroless): inspecionar filesystem
- Debugar rede: tcpdump, curl, nslookup
- Ver processos: ps aux, top
- Syscall tracing: strace

## Cheatsheet

```cheatsheet
Events do namespace
kubectl get events --sort-by=.metadata.creationTimestamp

Events de um Pod específico
kubectl get events --field-selector involvedObject.name=<pod>

Apenas warnings
kubectl get events --field-selector type=Warning

Descrever Pod (prontuário completo)
kubectl describe pod <nome>

Logs do container atual
kubectl logs <nome>
kubectl logs <nome> --tail=100

Logs do container anterior (crash loop)
kubectl logs <nome> --previous

Container efêmero para debug
kubectl debug -it <pod> --image=busybox:1.36 --target=<container> -- sh

Verificar conectividade de rede
kubectl exec <pod> -- curl -v <url>
kubectl exec <pod> -- wget -q -O- <url>
```
