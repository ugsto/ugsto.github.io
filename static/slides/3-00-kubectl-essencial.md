## kubectl: o CLI do Kubernetes

- Comunicação com a API server. Tudo passa pelo kubectl.
- Comandos seguem o padrão: `kubectl <verbo> <recurso> [flags]`
- Verbos: get, describe, logs, exec, apply, delete, edit, explain, patch
- Recursos têm shortnames (pods=po, services=svc, deployments=deploy, namespaces=ns)

## kubectl get: listar recursos

```bash
kubectl get pods                    # lista pods no namespace atual
kubectl get pods -o wide            # adiciona IP e nó
kubectl get pods -A                 # todos os namespaces
kubectl get pods -l app=demo        # filtra por label
kubectl get pods -o yaml            # output YAML completo
kubectl get pods -o json            # output JSON completo
kubectl get nodes,svc,deploy        # múltiplos recursos de uma vez
kubectl get pods --sort-by=.metadata.creationTimestamp
```

Flags essenciais: `-o wide`, `-A`, `-l`, `-o yaml`, `--sort-by`

## kubectl describe: detalhes completos

```bash
kubectl describe pod <nome>         # Events, condições, containers
kubectl describe node <nome>        # Capacidade, allocatable, condições
kubectl describe service <nome>     # Endpoints, ports, selectors
```

- Events: Scheduled → Pulling → Pulled → Created → Started
- Primeiro lugar para olhar quando algo falha
- Mostra condições (Ready, Initialized, PodScheduled), volumes montados, QoS class

## kubectl logs: stdout/stderr do container

```bash
kubectl logs <pod>                  # logs atuais
kubectl logs <pod> -f               # follow (tail -f)
kubectl logs <pod> --tail=50        # últimas N linhas
kubectl logs <pod> --since=5m       # últimos X minutos
kubectl logs <pod> --previous       # container anterior (crash loop)
kubectl logs <pod> -c <container>   # escolhe container em Pod multi-container
kubectl logs <pod> --timestamps     # prefixa com timestamp
```

## kubectl exec: executar comandos no container

```bash
kubectl exec <pod> -- <comando>     # executa comando
kubectl exec -it <pod> -- sh        # shell interativo
kubectl exec <pod> -c <name> -- sh  # container específico
```

## kubectl apply: declarativo e idempotente

```bash
kubectl apply -f pod.yaml           # aplica um arquivo
kubectl apply -f ./manifests/       # aplica diretório inteiro
kubectl apply -k ./kustomize/       # aplica kustomization
```

- apply vs create: apply é idempotente (atualiza se existe), create dá erro se já existe
- No dia a dia, prefira apply. Seguro para CI/CD.

## kubectl delete: remover recursos

```bash
kubectl delete pod <nome>                           # deleta por nome
kubectl delete -f pod.yaml                          # deleta por arquivo
kubectl delete pods -l app=demo                     # deleta por label
kubectl delete pod <nome> --force --grace-period=0  # força (cuidado!)
```
