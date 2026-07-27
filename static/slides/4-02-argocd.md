## ArgoCD: GitOps no Kubernetes

### O problema: kubectl apply é manual

- Fluxo típico: escreve YAML → Git → `kubectl apply` manual
- Alguém muda direto no cluster com `kubectl edit` → configuration drift
- Cluster diverge do Git, ninguém sabe a versão correta
- GitOps resolve: Git é a fonte da verdade, cluster espelha o Git

### O que é o ArgoCD

- Operador GitOps que roda dentro do Kubernetes
- Monitora repositório Git → detecta divergências → sincroniza
- CNCF open source, ferramenta GitOps mais usada

```
Git Repo ──(monitora)──► ArgoCD ──(sincroniza)──► Cluster Kubernetes
```

- Se alguém mexer no cluster manualmente, o ArgoCD reverte

### Instalação

```bash
kubectl create namespace argocd
```

```
namespace/argocd created
```

```bash
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

```
customresourcedefinition.apiextensions.k8s.io/applications.argoproj.io created
... (dezenas de recursos)
deployment.apps/argocd-server created
statefulset.apps/argocd-application-controller created
```

Componentes instalados:

- **argocd-server**: API + UI web
- **argocd-application-controller**: reconciliação
- **argocd-repo-server**: clona Git, gera manifests
- **argocd-redis**: cache
- **argocd-dex-server**: autenticação OIDC

Verificar:

```bash
kubectl get pods -n argocd
```

```
NAME                                       READY   STATUS    RESTARTS   AGE
argocd-application-controller-0            1/1     Running   0          30s
argocd-applicationset-controller-xxxxx     1/1     Running   0          30s
argocd-dex-server-xxxxx                    1/1     Running   0          30s
argocd-notifications-controller-xxxxx      1/1     Running   0          30s
argocd-redis-xxxxx                         1/1     Running   0          30s
argocd-repo-server-xxxxx                   1/1     Running   0          30s
argocd-server-xxxxx                        1/1     Running   0          30s
```

### Acessando a UI

Port-forward (recomendado):

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Senha inicial:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo
```

```
aB1cD2eF3gH4iJ5kL6
```

- Usuário: `admin`
- URL: `https://localhost:8080`

NodePort (alternativa):

```bash
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "NodePort"}}'
```

### Criando uma aplicação de exemplo

CLI login:

```bash
argocd login localhost:8080 --username admin --password <senha> --insecure
```

Criar app (guestbook):

```bash
argocd app create guestbook \
  --repo https://github.com/argoproj/argocd-example-apps.git \
  --path guestbook \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace default
```

```
application 'guestbook' created
```

Status inicial: **OutOfSync** (recursos no Git, não no cluster)

```bash
argocd app get guestbook
```

```
Sync Status:        OutOfSync from HEAD (53e28ff)
Health Status:      Missing
```

### Sync manual vs automático

**Sync manual** (padrão):

```bash
argocd app sync guestbook
```

```
Service/default/guestbook-ui       Synced  Healthy
Deployment/default/guestbook-ui    Synced  Progressing
Sync Status:  Synced to HEAD
Health Status: Healthy
```

**Sync automático**:

```bash
argocd app set guestbook --sync-policy automated
```

- ArgoCD detecta mudanças no Git → aplica automaticamente
- Polling padrão: 3 minutos

**Self-healing**:

```bash
argocd app set guestbook --sync-policy automated --self-heal
```

- Mudanças manuais no cluster são revertidas automaticamente
- Teste: `kubectl scale deployment guestbook-ui --replicas=5` → volta para 1

### A UI do ArgoCD

- Dashboard: visão geral, Sync e Health de todas as apps
- Detalhes da aplicação: árvore de recursos, logs, eventos
- Diff: antes do sync, mostra linha por linha o que vai mudar

### Próximo capítulo

- 4.3: Vault - gestão centralizada de secrets

```cheatsheet
kubectl create namespace argocd | Criar namespace do ArgoCD
kubectl apply -n argocd -f https://.../install.yaml | Instalar ArgoCD
kubectl get pods -n argocd | Verificar Pods
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" \| base64 -d; echo | Senha inicial
kubectl port-forward svc/argocd-server -n argocd 8080:443 | Acessar UI
argocd login localhost:8080 --username admin --password <senha> --insecure | Login CLI
argocd app create <nome> --repo <url> --path <dir> --dest-server <cluster> --dest-namespace <ns> | Criar app
argocd app list | Listar apps
argocd app get <nome> | Detalhes da app
argocd app sync <nome> | Sync manual
argocd app set <nome> --sync-policy automated | Auto-sync
argocd app set <nome> --sync-policy automated --self-heal | Auto-sync + self-healing
argocd app diff <nome> | Diff Git vs cluster
argocd app delete <nome> | Remover app
```
