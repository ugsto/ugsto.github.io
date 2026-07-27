+++
date = 2026-01-01
title = "ArgoCD: GitOps no Kubernetes"
weight = 402
path = "30"
[extra]
part = 4
section = 2
read_time_minutes = 7
hands_on_minutes = 15
+++



## ArgoCD: GitOps no Kubernetes

No capítulo 4.00 a gente viu o Helm, que resolve o problema de empacotar e instalar aplicações. Mas ainda tem uma pergunta: **como garantir que o que está no cluster é exatamente o que está no Git?** O Helm sozinho não resolve isso. Você ainda precisa lembrar de executar `helm upgrade` toda vez que mudar alguma coisa.

É aí que entra o ArgoCD.

### O problema: kubectl apply é manual

Pensa no fluxo típico de deploy no Kubernetes:

1. Você escreve os YAMLs (Deployment, Service, ConfigMap...)
2. Coloca no Git (espero)
3. Executa `kubectl apply -f pasta/` na máquina local
4. Alguém do time muda uma variável de ambiente direto no cluster com `kubectl edit`
5. Duas semanas depois, ninguém sabe qual é a versão correta

Isso é o que chamam de **configuration drift**: o cluster vai divergindo do Git. O Git diz uma coisa, o cluster está com outra. Para resolver, você precisaria ficar dando `kubectl apply` manualmente toda hora, o que ninguém faz.

**GitOps** vira esse problema de cabeça para baixo. A ideia é simples:

> O Git é a única fonte da verdade. O cluster deve espelhar o Git. Sempre.

Em vez de você *empurrar* mudanças para o cluster (`kubectl apply`), um operador dentro do cluster **puxa** as mudanças do Git e aplica automaticamente. Se alguém mudar algo direto no cluster com `kubectl edit`, o operador detecta a divergência e reverte para o que está no Git.

### O que é o ArgoCD

O ArgoCD é um **operador GitOps** que roda dentro do Kubernetes. Ele:

- Monitora um repositório Git (ou Helm chart, ou Kustomize)
- Detecta quando a versão no Git difere da versão no cluster
- Sincroniza automaticamente (ou manualmente, você escolhe)
- Oferece uma UI web para visualizar o estado de todas as aplicações

Ele é um projeto open source da CNCF (a mesma fundação do Kubernetes) e é a ferramenta de GitOps mais usada no ecossistema.

O modelo mental é:

```
Git Repo ──(monitora)──► ArgoCD ──(sincroniza)──► Cluster Kubernetes
```

O ArgoCD fica olhando o Git. Quando você faz push de uma mudança, ele aplica no cluster. Se alguém mexe no cluster manualmente, ele reverte. O Git manda.

### Instalação do ArgoCD

O ArgoCD pode ser instalado via manifesto oficial ou via Helm. Vamos usar o Helm, que é a forma recomendada e mais flexível.

Primeiro, adicione o repositório e crie o namespace:

```bash
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update
kubectl create namespace argocd
```

```text
"argo" has been added to your repositories
Hang tight while we grab the latest from your chart repositories...
...Successfully got an update from the "argo" chart repository
Update Complete. ⎈Happy Helming!⎈
namespace/argocd created
```

Agora instale o chart:

```bash
helm install argocd argo/argo-cd -n argocd
```

```text
NAME: argocd
LAST DEPLOYED: Mon May 25 16:52:04 2026
NAMESPACE: argocd
STATUS: deployed
REVISION: 1
TEST SUITE: None
NOTES:
In order to access the server UI you have the following options:

1. kubectl port-forward service/argocd-server -n argocd 8080:443

    and then open the browser on http://localhost:8080 and accept the certificate

2. enable ingress in the values file...
```

O chart instala:

- **argocd-server**: a API e a UI web
- **argocd-application-controller**: o controlador que faz a reconciliação
- **argocd-repo-server**: serviço que clona repositórios Git e gera os manifests
- **argocd-redis**: cache
- **argocd-dex-server**: autenticação (opcional, integra com OIDC)
- **argocd-notifications-controller**: notificações
- **argocd-applicationset-controller**: ApplicationSets

Vamos verificar se os Pods subiram:

```bash
kubectl get pods -n argocd
```

```
NAME                                                READY   STATUS      RESTARTS   AGE
argocd-application-controller-0                     1/1     Running     0          38s
argocd-applicationset-controller-6dff55bccd-lbjxf   1/1     Running     0          38s
argocd-dex-server-85bf497d49-2j27d                  1/1     Running     0          39s
argocd-notifications-controller-7987779784-kpct8    1/1     Running     0          38s
argocd-redis-cf4b7d64d-xr8kn                        1/1     Running     0          39s
argocd-redis-secret-init-78rd6                      0/1     Completed   0          55s
argocd-repo-server-7c78f989c6-vzgnw                 1/1     Running     0          38s
argocd-server-6dcb974c8f-7l8x7                      1/1     Running     0          39s
```

Todos os Pods em `Running`. O ArgoCD está pronto.

### Acessando a UI

O ArgoCD expõe uma interface web. Para acessar, você tem duas opções: `port-forward` (mais simples, local) ou `NodePort`/Ingress (acesso externo).

**Opção 1: Port-forward (recomendado para teste)**

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

```
Forwarding from 127.0.0.1:8080 -> 443
Forwarding from [::1]:8080 -> 443
```

Agora abre `https://localhost:8080` no navegador. O ArgoCD usa um certificado autoassinado, então o navegador vai reclamar. Aceite o risco e prossiga.

**Login inicial**

O usuário padrão é `admin`. A senha inicial fica em um Secret:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo
```

```
yaVGCXBHdgQDN1C4
```

Copie essa senha e faça login na UI com usuário `admin`.

> 💡 **Dica**: você pode mudar a senha depois com `argocd account update-password`, mas para o workshop a senha inicial resolve.

**Opção 2: NodePort (acesso direto pelo IP do nó)**

Se quiser acessar sem port-forward, pode mudar o Service para NodePort:

```bash
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "NodePort"}}'
```

Depois descubra a porta:

```bash
kubectl get svc argocd-server -n argocd
```

```
NAME            TYPE       CLUSTER-IP       EXTERNAL-IP   PORT(S)                      AGE
argocd-server   NodePort   10.103.215.37    <none>        80:30080/TCP,443:30443/TCP   5m
```

Acesse `https://<IP-DO-NÓ>:30443`.

### Criando uma aplicação de exemplo

Agora vamos criar nossa primeira aplicação no ArgoCD. Vamos usar o repositório de exemplo oficial, que contém uma aplicação guestbook simples.

Primeiro, instale a CLI do ArgoCD (opcional, mas útil):

```bash
curl -sSL -o argocd-linux-amd64 https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
sudo install -m 555 argocd-linux-amd64 /usr/local/bin/argocd
rm argocd-linux-amd64
```

Faça login via CLI:

```bash
argocd login localhost:8080 --username admin --password aB1cD2eF3gH4iJ5kL6 --insecure
```

```
'admin:login' logged in successfully
Context 'localhost:8080' updated
```

Agora crie a aplicação. O comando `argocd app create` aponta para um repositório Git e define onde os recursos serão criados no cluster:

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

O que cada parâmetro significa:

- `--repo`: o repositório Git que contém os manifests
- `--path`: o diretório dentro do repo onde estão os YAMLs
- `--dest-server`: a API do cluster de destino (o próprio cluster onde o ArgoCD está)
- `--dest-namespace`: o namespace onde criar os recursos

Depois de criada, a aplicação aparece com status `OutOfSync` (ainda não sincronizada):

```bash
argocd app get guestbook
```

```
Name:               argocd/guestbook
Project:            default
Server:             https://kubernetes.default.svc
Namespace:          default
Repo:               https://github.com/argoproj/argocd-example-apps.git
Target:             HEAD
Path:               guestbook
Sync Status:        OutOfSync from HEAD (53e28ff)
Health Status:      Missing
```

Os recursos existem no Git mas não no cluster. Hora de sincronizar.

### Sync automático vs manual

O ArgoCD oferece dois modos de sincronização:

**Sync manual** (padrão)

Você decide quando aplicar as mudanças. Para sincronizar manualmente:

```bash
argocd app sync guestbook
```

```
TIMESTAMP                  GROUP        KIND   NAMESPACE                  NAME    STATUS    HEALTH        HOOK  MESSAGE
2024-01-15T10:30:00+00:00            Service     default          guestbook-ui  OutOfSync  Missing
2024-01-15T10:30:00+00:00  apps  Deployment     default          guestbook-ui  OutOfSync  Missing
2024-01-15T10:30:01+00:00            Service     default          guestbook-ui    Synced  Healthy              service/guestbook-ui created
2024-01-15T10:30:02+00:00  apps  Deployment     default          guestbook-ui    Synced  Progressing          deployment.apps/guestbook-ui created

Name:               argocd/guestbook
Project:            default
Server:             https://kubernetes.default.svc
Namespace:          default
Repo:               https://github.com/argoproj/argocd-example-apps.git
...
Sync Status:        Synced to HEAD (53e28ff)
Health Status:      Healthy
```

A aplicação foi criada no cluster. O status agora é `Synced` e `Healthy`.

Pela UI, você veria os recursos aparecendo como uma árvore: o Deployment, o Service, os Pods.

**Sync automático**

Se você quiser que o ArgoCD sincronize automaticamente sempre que detectar mudanças no Git, basta adicionar a flag `--sync-policy automated` na criação ou atualizar depois:

```bash
argocd app set guestbook --sync-policy automated
```

Ou via UI: clique na aplicação, depois em `APP DETAILS` → `SYNC POLICY` → `Enable Auto-Sync`.

Com sync automático, o fluxo fica:

1. Você faz push de uma mudança no Git (ex: sobe a imagem de `v1.0` para `v2.0`)
2. O ArgoCD detecta a diferença (por padrão, a cada 3 minutos)
3. O ArgoCD aplica a mudança automaticamente no cluster
4. Se alguém fizer `kubectl edit` manualmente, o ArgoCD reverte (self-healing)

O **self-healing** é um dos recursos mais poderosos do ArgoCD. Com ele ativado, qualquer alteração manual no cluster é desfeita automaticamente. O Git sempre vence.

Para ativar self-healing junto com auto-sync:

```bash
argocd app set guestbook --sync-policy automated --self-heal
```

Agora, testa: tente mudar a quantidade de réplicas manualmente:

```bash
kubectl scale deployment guestbook-ui --replicas=5
```

```
deployment.apps/guestbook-ui scaled
```

Em poucos segundos, o ArgoCD detecta a divergência e reverte para o valor do Git:

```bash
kubectl get deployment guestbook-ui -o jsonpath="{.spec.replicas}"
```

```
1
```

As réplicas voltaram para 1. O Git manda.

### A UI do ArgoCD

A interface web é onde você passa a maior parte do tempo. Algumas telas importantes:

- Dashboard: visão geral de todas as aplicações, com indicadores de Sync e Health
- Detalhes da aplicação: árvore de recursos (Deployment → ReplicaSet → Pods), logs, eventos
- Diff: mostra exatamente o que mudou entre o Git e o cluster antes de sincronizar

O diff é especialmente útil. Antes de dar sync, você vê linha por linha o que vai mudar no cluster. É como um `git diff` aplicado ao Kubernetes:

```
--- Live State (cluster)
+++ Desired State (Git)
@@ -10,7 +10,7 @@
 spec:
-  replicas: 5
+  replicas: 1
```

Isso dá visibilidade total sobre as mudanças antes de aplicá-las. Nada de `kubectl apply` no escuro.

### ArgoCD no workshop

O ArgoCD fecha o ciclo do GitOps. A gente tem:

- **Git**: onde o código e os manifests vivem
- **ArgoCD**: o operador que mantém o cluster sincronizado com o Git
- **Helm** (capítulo 4.00): empacota as aplicações

O ArgoCD funciona com manifests YAML puros, Helm charts e Kustomize. Isso significa que você pode usar o que preferir para definir suas aplicações. O ArgoCD só garante que o cluster reflita o Git.

No próximo capítulo (4.3), a gente vai ver o Vault, que resolve o problema de gerenciar secrets de forma centralizada e segura. Secrets no Git são um problema, e o Vault é a solução.

```cheatsheet
kubectl create namespace argocd | Criar namespace do ArgoCD
kubectl apply -n argocd -f https://.../install.yaml | Instalar ArgoCD
kubectl get pods -n argocd | Verificar Pods do ArgoCD
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" \| base64 -d; echo | Recuperar senha inicial
kubectl port-forward svc/argocd-server -n argocd 8080:443 | Acessar UI via port-forward
argocd login localhost:8080 --username admin --password <senha> --insecure | Login via CLI
argocd app create <nome> --repo <url> --path <dir> --dest-server <cluster> --dest-namespace <ns> | Criar aplicação
argocd app list | Listar aplicações
argocd app get <nome> | Ver detalhes da aplicação
argocd app sync <nome> | Sincronizar manualmente
argocd app set <nome> --sync-policy automated | Ativar auto-sync
argocd app set <nome> --sync-policy automated --self-heal | Ativar auto-sync com self-healing
argocd app diff <nome> | Ver diff entre Git e cluster
argocd app delete <nome> | Remover aplicação
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "NodePort"}}' | Expor UI como NodePort
```
