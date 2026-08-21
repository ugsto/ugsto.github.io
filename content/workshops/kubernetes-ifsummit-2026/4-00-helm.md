+++
date = 2026-01-01
title = "Helm: o package manager do Kubernetes"
weight = 400
[extra]
part = 4
section = 0
read_time_minutes = 0
hands_on_minutes = 0
+++



## Helm: o package manager do Kubernetes

Se você já usou Linux, conhece o `apt` (Debian/Ubuntu) ou `dnf` (Fedora). Eles instalam pacotes com um comando só, baixando binários e dependências, colocando tudo no lugar certo. O Helm faz a mesma coisa, só que com aplicações Kubernetes.

### O problema que o Helm resolve

Até agora, a gente instalou tudo com `kubectl apply -f arquivo.yaml`. Funciona, mas pensa no seguinte: uma aplicação típica no Kubernetes não é só um Deployment. Você precisa de:

- Deployment (os Pods)
- Service (rede interna)
- ConfigMap (configuração)
- Secret (credenciais)
- Ingress (acesso externo)
- ServiceAccount (permissões)
- HPA (auto-scaling)

Isso dá uns 5 a 7 arquivos YAML. Por aplicação. Se você tem 10 aplicações, são 50 a 70 arquivos para gerenciar. Manter versões, atualizar, compartilhar com o time: vira um pesadelo.

O Helm resolve isso empacotando todos esses YAMLs em uma unidade chamada **Chart**. Em vez de aplicar 7 arquivos, você instala a aplicação inteira com um comando:

```bash
helm install minha-app meu-chart
```

Pronto. O Helm cria todos os recursos, na ordem certa, com as dependências resolvidas.

### O que é um Chart

Um Chart é um diretório com uma estrutura padronizada. Você pode criar um chart vazio com `helm create`:

```bash
helm create meu-chart
```

Isso gera a seguinte estrutura:

```
meu-chart/
├── Chart.yaml          # metadados do chart (nome, versão, descrição)
├── values.yaml         # valores padrão que você pode sobrescrever
├── charts/             # dependências (outros charts)
└── templates/          # os YAMLs do Kubernetes com placeholders
    ├── deployment.yaml
    ├── service.yaml
    ├── ingress.yaml
    ├── hpa.yaml
    └── ...
```

A mágica está nos placeholders. Olha um pedaço de um `deployment.yaml` dentro de `templates/`:

{% raw %}
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}
spec:
  replicas: {{ .Values.replicaCount }}
  template:
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
```

Repare nos `{{ .Values.xxx }}`. Esses são placeholders que o Helm substitui na hora de instalar. O `values.yaml` define os defaults:
{% endraw %}

```yaml
replicaCount: 1

image:
  repository: nginx
  tag: latest
```

Na instalação, você pode sobrescrever qualquer valor:

```bash
helm install meu-nginx ./meu-chart --set replicaCount=3 --set image.tag=alpine
```

O Helm pega o template, injeta os valores que você passou e gera os YAMLs finais. Sem você precisar editar arquivos manualmente.

### Comandos essenciais do Helm

O Helm tem dois modos de trabalho: com repositórios (charts remotos) e com charts locais. Os comandos principais são os mesmos.

Primeiro, adicionar um repositório. No capítulo 3.07 a gente usou o repositório do Kong:

```bash
helm repo add kong https://charts.konghq.com
helm repo update
```

Agora você pode buscar charts disponíveis:

```bash
helm search repo kong
```

```
NAME                    CHART VERSION   APP VERSION     DESCRIPTION
kong/kong               2.47.0          3.9.0           The Cloud-Native Ingress and API-Management
kong/ingress            0.21.0          3.9.0           DEPRECATED Kong for Kubernetes
```

Para instalar um chart, você usa `helm install`. Dê um nome para a release (é assim que o Helm chama uma instância instalada):

```bash
helm install kong kong/kong -n kong --create-namespace
```

```
NAME: kong
LAST DEPLOYED: ...
NAMESPACE: kong
STATUS: deployed
REVISION: 1
```

Alguns pontos importantes sobre esse comando:

- `kong` é o nome da release (você escolhe)
- `kong/kong` é o chart (repositório/nome)
- `-n kong` é o namespace onde instalar
- `--create-namespace` cria o namespace se não existir

Para ver as releases instaladas:

```bash
helm list -n kong
```

```
NAME    NAMESPACE       REVISION        STATUS          CHART           APP VERSION
kong    kong            1               deployed        kong-2.47.0     3.9.0
```

Para atualizar uma release (por exemplo, mudar o tipo do proxy para LoadBalancer):

```bash
helm upgrade kong kong/kong -n kong --set proxy.type=LoadBalancer
```

```
Release "kong" has been upgraded. Happy Helming!
LAST DEPLOYED: ...
NAMESPACE: kong
STATUS: deployed
REVISION: 2
```

Repare que a revisão foi de 1 para 2. O Helm mantém um histórico de revisões, então você pode voltar atrás se algo der errado:

```bash
helm rollback kong 1 -n kong
```

```
Rollback was a success! Happy Helming!
```

E para remover uma release completamente:

```bash
helm uninstall kong -n kong
```

```
release "kong" uninstalled
```

O `uninstall` remove todos os recursos Kubernetes que o chart criou. É como se a aplicação nunca tivesse existido.

### Values: customizando instalações

O Helm tem três níveis de configuração, do mais simples ao mais completo:

**1. Sobrescrita inline com `--set`**

Para mudanças pontuais, você passa valores direto na linha de comando:

```bash
helm install meu-nginx bitnami/nginx --set service.type=NodePort --set replicaCount=2
```

Funciona bem para um ou dois valores. Para configurações mais complexas, fica inviável.

**2. Arquivo values.yaml**

Você cria um arquivo com todas as customizações:

```yaml
# meus-valores.yaml
service:
  type: NodePort
replicaCount: 2
resources:
  limits:
    memory: 256Mi
    cpu: 500m
```

E passa na instalação:

```bash
helm install meu-nginx bitnami/nginx -f meus-valores.yaml
```

Você pode usar múltiplos arquivos `-f` e combiná-los com `--set`. A ordem de precedência é: o último `-f` ou `--set` sobrescreve os anteriores.

**3. Inspecionar valores disponíveis**

Cada chart expõe um conjunto de valores que você pode customizar. Para ver todos:

```bash
helm show values kong/kong
```

```
# Esse output é enorme: mostra todos os valores configuráveis do chart do Kong.
# Vão desde proxy.type até database.host, plugins, ingress controller settings...
```

Esse comando é essencial. Antes de instalar qualquer chart, execute `helm show values` para entender o que dá para configurar. A maioria dos charts bem mantidos (Bitnami, Kong, Grafana, Prometheus) tem documentação nos comentários do próprio `values.yaml`.

### Helm no workshop

A gente já usou Helm no capítulo 3.07 para instalar o Kong Ingress Controller. E vamos usar de novo nos próximos capítulos:

- **4.1**: Prometheus e Grafana para monitoramento e dashboards
- **4.2**: ArgoCD para GitOps (deploy automatizado a partir do Git)
- **4.3**: Vault para gestão centralizada de secrets

O Helm é a forma padrão de instalar coisas no Kubernetes hoje. Praticamente toda ferramenta do ecossistema oferece um chart oficial. Saber usar Helm significa que você instala qualquer coisa no cluster com meia dúzia de comandos, em vez de copiar YAMLs da documentação.

E o melhor: quando o chart é bem feito, ele já vem com boas práticas embutidas. Health checks, resource limits, security contexts, affinity rules. Você herda tudo isso sem precisar configurar do zero. Faz sentido?

```cheatsheet
helm repo add <nome> <url> | Adicionar repositório
helm repo update | Atualizar índices dos repositórios
helm search repo <termo> | Buscar charts por nome
helm install <nome> <chart> -n <ns> --create-namespace | Instalar release
helm upgrade <nome> <chart> -n <ns> | Atualizar release
helm uninstall <nome> -n <ns> | Remover release e todos os recursos
helm list -n <ns> | Listar releases no namespace
helm list -A | Listar releases em todos os namespaces
helm show values <chart> | Ver valores configuráveis do chart
helm show chart <chart> | Ver metadados do chart
helm rollback <nome> <rev> -n <ns> | Voltar para revisão anterior
helm history <nome> -n <ns> | Ver histórico de revisões
helm get values <nome> -n <ns> | Ver valores usados na instalação
helm template <nome> <chart> --debug | Renderizar templates sem instalar (útil para debug)
```
