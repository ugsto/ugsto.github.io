## Prometheus & Grafana: observabilidade no cluster

### O problema: cluster no escuro

- `kubectl get pods` mostra `Running`, mas a aplicação está lenta: e agora?
- Sem métricas, você só descobre problemas quando os usuários reclamam
- Prometheus coleta métricas de tudo no cluster (CPU, memória, disco, rede, estado dos objetos)
- Grafana transforma métricas em dashboards visuais

### O ecossistema

```
Prometheus (coleta e armazena métricas)
    └── Grafana (dashboards e visualização)
    └── AlertManager (alertas por e-mail, Slack, PagerDuty)
    └── Exporters (node-exporter, kube-state-metrics)
```

### Instalação via Helm

Adicionar repositório:

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
```

Instalar:

```bash
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
```

```text
NAME: prometheus
NAMESPACE: monitoring
STATUS: deployed
REVISION: 1
```

Um comando só. Menos de 2 minutos. Tudo pronto.

### Componentes instalados

```bash
kubectl get pods -n monitoring
```

```text
NAME                                                  READY   STATUS    RESTARTS   AGE
alertmanager-prometheus-kube-prometheus-alertmanager   2/2     Running   0          2m
prometheus-grafana-6b8d4567c9-xz4kl                   3/3     Running   0          2m
prometheus-kube-prometheus-operator-7f8d9b6c4-m9pq2   1/1     Running   0          2m
prometheus-kube-state-metrics-7c8d9b6f4-kt5lm         1/1     Running   0          2m
prometheus-prometheus-kube-prometheus-prometheus-0    2/2     Running   0          2m
prometheus-prometheus-node-exporter-89d6k             1/1     Running   0          2m
prometheus-prometheus-node-exporter-hf3k2             1/1     Running   0          2m
prometheus-prometheus-node-exporter-rx9vq             1/1     Running   0          2m
```

Cada componente:

- **prometheus**: coleta e armazena métricas (scraping dos endpoints /metrics)
- **grafana**: renderiza dashboards a partir dos dados do Prometheus
- **alertmanager**: gerencia regras de alerta e notificações
- **kube-state-metrics**: exporta estado dos objetos Kubernetes
- **node-exporter** (um por nó): exporta métricas do SO (CPU, memória, disco, rede)
- **operator**: gerencia configuração como CRDs (ServiceMonitor, PrometheusRule)

### Acessando Grafana

```bash
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
```

```text
Forwarding from 127.0.0.1:3000 -> 3000
```

Login: `admin` / `prom-operator`

Pegar senha:

```bash
kubectl get secret -n monitoring prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 --decode ; echo
```

### Dashboards padrão (já vêm prontos!)

- Kubernetes / Compute Resources / Cluster (visão geral)
- Kubernetes / Compute Resources / Node (Pods)
- Kubernetes / Compute Resources / Namespace (Pods)
- Kubernetes / Compute Resources / Pod (drill-down)
- Kubernetes / Networking / Cluster
- Node Exporter / Nodes (métricas do SO)
- Prometheus / Overview (saúde do Prometheus)

### Consultando Prometheus (PromQL)

```bash
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
```

Exemplos de consultas:

```promql
sum(rate(container_cpu_usage_seconds_total{namespace!=""}[5m])) by (namespace)
```

```promql
container_memory_usage_bytes{namespace="monitoring"}
```

```promql
count(kube_pod_info) by (namespace)
```

```promql
kube_node_status_condition{condition="Ready", status="true"}
```

### Alternativa: NodePort

```bash
kubectl patch svc prometheus-grafana -n monitoring -p '{"spec":{"type":"NodePort"}}'
```

```text
service/prometheus-grafana patched
```

Acessível em `<ip-do-nó>:<porta-alta>`.

### Por que importa

- Você vê problemas **antes** dos usuários (memory leak aparece no gráfico dias antes do crash)
- Depuração rápida: identifica qual Pod está consumindo mais recursos
- Planejamento de capacidade: gráficos históricos mostram tendências
- Alertas inteligentes: thresholds com contexto temporal

Tudo isso instalado em 2 minutos com um comando Helm. Sem Helm, seria um dia inteiro configurando cada componente manualmente.

```cheatsheet
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts | Adicionar repositório
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace | Instalar stack
kubectl get pods -n monitoring | Ver componentes
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80 | Acessar Grafana
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090 | Acessar Prometheus
kubectl patch svc prometheus-grafana -n monitoring -p '{"spec":{"type":"NodePort"}}' | Expor como NodePort
helm list -n monitoring | Ver releases
helm uninstall prometheus -n monitoring | Remover tudo
```
