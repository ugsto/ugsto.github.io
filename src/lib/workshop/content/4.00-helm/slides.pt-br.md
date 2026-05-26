## Helm: o package manager do Kubernetes

### O problema

- Toda aplicação Kubernetes precisa de 5+ YAMLs (Deployment, Service, ConfigMap, Secret, Ingress...)
- 10 aplicações = 50+ arquivos para gerenciar
- Helm resolve: empacota tudo em um Chart, instala com um comando

### O que é um Chart

```
meu-chart/
├── Chart.yaml          # metadados (nome, versão)
├── values.yaml         # defaults que você sobrescreve
├── charts/             # dependências
└── templates/          # YAMLs com placeholders {{ .Values.xxx }}
```

- `values.yaml` define os defaults
- `templates/` usa placeholders `{{ .Values.xxx }}` que o Helm substitui na instalação
- `helm create meu-chart` gera a estrutura inicial

### Comandos essenciais

Adicionar repositório e buscar charts:

```bash
helm repo add kong https://charts.konghq.com
helm repo update
helm search repo kong
```

Instalar:

```bash
helm install kong kong/kong -n kong --create-namespace
```

```
NAME: kong
NAMESPACE: kong
STATUS: deployed
REVISION: 1
```

Listar releases:

```bash
helm list -n kong
```

Atualizar com novos valores:

```bash
helm upgrade kong kong/kong -n kong --set proxy.type=LoadBalancer
```

```
REVISION: 2
```

Rollback se der problema:

```bash
helm rollback kong 1 -n kong
```

Remover tudo:

```bash
helm uninstall kong -n kong
```

### Customizando valores

Três formas de customizar:

1. **`--set`** para valores simples:

```bash
helm install meu-nginx bitnami/nginx --set service.type=NodePort
```

2. **Arquivo `values.yaml`** para configurações complexas:

```bash
helm install meu-nginx bitnami/nginx -f meus-valores.yaml
```

3. **`helm show values`** para ver todos os valores disponíveis:

```bash
helm show values kong/kong
```

### Helm no workshop

- Já usamos no capítulo 3.07 para instalar o Kong Ingress Controller
- Vamos usar de novo em:
  - 4.1: Prometheus + Grafana (monitoramento)
  - 4.2: ArgoCD (GitOps)
  - 4.3: Vault (secrets)
- Helm é a forma padrão de instalar ferramentas no Kubernetes hoje
- Charts bem feitos já trazem boas práticas: health checks, resource limits, security contexts

```cheatsheet
helm repo add <nome> <url> | Adicionar repositório
helm repo update | Atualizar índices
helm search repo <termo> | Buscar charts
helm install <nome> <chart> -n <ns> --create-namespace | Instalar release
helm upgrade <nome> <chart> -n <ns> | Atualizar release
helm uninstall <nome> -n <ns> | Remover release
helm list -n <ns> | Listar releases
helm list -A | Listar releases em todos os namespaces
helm show values <chart> | Ver valores configuráveis
helm show chart <chart> | Ver metadados do chart
helm rollback <nome> <rev> -n <ns> | Voltar para revisão anterior
helm history <nome> -n <ns> | Ver histórico de revisões
helm get values <nome> -n <ns> | Ver valores usados na instalação
helm template <nome> <chart> --debug | Renderizar sem instalar (debug)
```
