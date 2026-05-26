## Prometheus & Grafana: observabilidade no cluster

Você tem um cluster Kubernetes executando. Deployments, Services, Ingress, tudo no lugar. Mas como você sabe se o cluster tá saudável? Se um nó tá com CPU no teto? Se um Pod tá reiniciando em loop? Se o disco do etcd tá chegando no limite?

A resposta: você precisa de **observabilidade**. E as duas ferramentas que dominam esse espaço no Kubernetes são Prometheus e Grafana.

### O problema: cluster no escuro

Imagina o seguinte cenário. Seu cluster está em produção. De repente, os usuários começam a reclamar de lentidão. Você abre o terminal e digita `kubectl get pods`. Tudo `Running`. `kubectl top nodes`. Consumo normal. Mas a aplicação está visivelmente mais lenta.

O que aconteceu? Um dos Pods está com memory leak e o garbage collector do Java está consumindo 90% da CPU, mas ainda não estourou o limit. Outro Pod está gerando logs de erro a cada 100ms e saturando o disco. E um terceiro está com latência de rede 3x acima do normal porque o node está com throttle de network.

Nada disso aparece num `kubectl get pods`. O Pod está `Running`, afinal. Você precisa de métricas.

### O ecossistema Prometheus + Grafana

Prometheus é um sistema de monitoramento que **coleta métricas** de tudo no cluster. Ele faz scraping: de tempos em tempos, ele bate nos endpoints `/metrics` dos seus serviços e armazena os dados em um banco de séries temporais. Ele entende métricas como:

```text
container_cpu_usage_seconds_total{namespace="default", pod="api-7d8f9b6c4-x2k9m"} 145.32
```

O Grafana pega esses dados e transforma em dashboards. Gráficos de linha, heatmaps, gauges, tabelas. Você monta painéis visuais que mostram a saúde do cluster em tempo real.

Juntos, eles formam o padrão de facto para observabilidade no Kubernetes. E a instalação, com Helm, é absurdamente simples.

### Instalando o kube-prometheus-stack

O chart que a gente vai usar é o `kube-prometheus-stack`, mantido pela comunidade Prometheus. Ele instala tudo de uma vez: Prometheus, Grafana, AlertManager e vários exporters para Kubernetes.

Primeiro, adicione o repositório:

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
```

```text
"prometheus-community" has been added to your repositories
Hang tight while we grab the latest from your chart repositories...
...Successfully got an update from the "prometheus-community" chart repository
Update Complete. ⎈Happy Helming!⎈
```

Agora, a instalação:

```bash
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
```

```text
NAME: prometheus
LAST DEPLOYED: Mon May 25 16:51:25 2026
NAMESPACE: monitoring
STATUS: deployed
REVISION: 1
TEST SUITE: None
NOTES:
kube-prometheus-stack has been installed. Check its status by running:
  kubectl --namespace monitoring get pods -l "release=prometheus"

Get Grafana 'admin' user password by running:

  kubectl --namespace monitoring get secrets prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 -d ; echo

Access Grafana local instance:

  export POD_NAME=$(kubectl --namespace monitoring get pod -l "app.kubernetes.io/name=grafana,app.kubernetes.io/instance=prometheus" -oname)
  kubectl --namespace monitoring port-forward $POD_NAME 3000
```

O Helm criou o namespace `monitoring` e instalou todos os componentes. Vamos ver o que está executando:

### Verificando os Pods

```bash
kubectl get pods -n monitoring
```

```text
NAME                                                     READY   STATUS    RESTARTS   AGE
alertmanager-prometheus-kube-prometheus-alertmanager-0   2/2     Running   0          79s
prometheus-grafana-85ddbcf4cf-gw7v8                      3/3     Running   0          88s
prometheus-kube-prometheus-operator-77df44bf6-ws97j      1/1     Running   0          88s
prometheus-kube-state-metrics-75bfd85f54-fhpvk           1/1     Running   0          88s
prometheus-prometheus-kube-prometheus-prometheus-0       2/2     Running   0          78s
prometheus-prometheus-node-exporter-fkh7g                1/1     Running   0          88s
prometheus-prometheus-node-exporter-mf5z8                1/1     Running   0          88s
prometheus-prometheus-node-exporter-wd2l6                1/1     Running   0          88s
prometheus-prometheus-node-exporter-xfn6p                1/1     Running   0          88s
```

Cada componente tem um papel específico:

- prometheus-prometheus-0: o servidor Prometheus em si, que coleta e armazena métricas
- prometheus-grafana-xxx: o Grafana, que renderiza os dashboards
- alertmanager-xxx: gerencia alertas (você define regras tipo "se CPU > 80% por 5 minutos, manda e-mail")
- kube-state-metrics-xxx: exporta métricas sobre o estado dos objetos Kubernetes (Deployments, Pods, Nodes)
- node-exporter-xxx: um por nó, exporta métricas do sistema operacional (CPU, memória, disco, rede)
- prometheus-operator-xxx: gerencia a configuração do Prometheus como recursos customizados do Kubernetes

Repare no node-exporter: são 4 Pods, um por nó do cluster. É um DaemonSet, não um Deployment. Isso garante que todo nó tenha um exporter local.

### Verificando os Services

```bash
kubectl get svc -n monitoring
```

```text
NAME                                      TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                      AGE
alertmanager-operated                     ClusterIP   None             <none>        9093/TCP,9094/TCP,9094/UDP   88s
prometheus-grafana                        ClusterIP   10.103.117.88    <none>        80/TCP                       97s
prometheus-kube-prometheus-alertmanager   ClusterIP   10.108.133.0     <none>        9093/TCP,8080/TCP            97s
prometheus-kube-prometheus-operator       ClusterIP   10.109.177.90    <none>        443/TCP                      97s
prometheus-kube-prometheus-prometheus     ClusterIP   10.105.105.92    <none>        9090/TCP,8080/TCP            97s
prometheus-kube-state-metrics             ClusterIP   10.106.169.127   <none>        8080/TCP                     97s
prometheus-operated                       ClusterIP   None             <none>        9090/TCP                     87s
prometheus-prometheus-node-exporter       ClusterIP   10.104.64.130    <none>        9100/TCP                     97s
```

Todos os Services são `ClusterIP`, ou seja, acessíveis apenas dentro do cluster. Isso é seguro: você não quer expor métricas e dashboards para a internet sem autenticação.

### Acessando o Grafana

O Grafana está executando no Service `prometheus-grafana` na porta 80. A forma mais simples de acessar é com `kubectl port-forward`:

```bash
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
```

```text
Forwarding from 127.0.0.1:3000 -> 80
Forwarding from [::1]:3000 -> 80
```

Agora abra `http://localhost:3000` no navegador. O login padrão é:

- Usuário: `admin`
- Senha: veja o comando acima para recuperá-la

Para pegar a senha que foi gerada na instalação:

```bash
kubectl get secret -n monitoring prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 --decode ; echo
```

```text
PBvlq6Q6vZJoZXCwcnaY6GNitYTs2uiTrC5WAHqL
```

### Dashboards padrão

O `kube-prometheus-stack` já vem com dezenas de dashboards pré-configurados. Você não precisa criar nada do zero. No menu lateral do Grafana, vá em **Dashboards > Browse** e você vai ver:

- Kubernetes / Compute Resources / Cluster: visão geral do cluster (CPU, memória, disco, rede agregados)
- Kubernetes / Compute Resources / Node (Pods): consumo por Pod em cada nó
- Kubernetes / Compute Resources / Namespace (Pods): consumo agregado por namespace
- Kubernetes / Compute Resources / Pod: drill-down em um Pod específico
- Kubernetes / Networking / Cluster: tráfego de rede entre componentes
- Kubernetes / API Server: métricas do API server
- **Kubernetes / Kubelet**: métricas do kubelet em cada nó
- **Node Exporter / Nodes**: métricas do sistema operacional (disco, CPU, rede, processos)
- **Prometheus / Overview**: saúde do próprio Prometheus

Abra o dashboard **Kubernetes / Compute Resources / Cluster**. Você vai ver algo assim:

- **CPU Utilization**: porcentagem de CPU usada vs. alocada no cluster inteiro
- **Memory Utilization**: memória usada vs. alocada
- **Disk Utilization**: uso de disco por nó
- **Network I/O**: tráfego de rede agregado

Isso te dá uma visão instantânea do cluster. Se a linha de CPU estiver batendo 90%, você sabe que precisa escalar ou investigar.

O dashboard **Kubernetes / Compute Resources / Namespace (Pods)** é especialmente útil no dia a dia: você seleciona um namespace (por exemplo, o `monitoring` ou o namespace da sua aplicação) e vê o consumo de cada Pod. Se um Pod específico está consumindo muito mais que os outros, você já sabe onde olhar.

### Consultando métricas no Prometheus

Além dos dashboards, você pode consultar métricas diretamente no Prometheus. Acesse com port-forward:

```bash
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
```

```text
Forwarding from 127.0.0.1:9090 -> 9090
Forwarding from [::1]:9090 -> 9090
```

Abra `http://localhost:9090` e você vai ver a interface de consulta do Prometheus. A linguagem de consulta se chama **PromQL**. Alguns exemplos práticos:

**Uso de CPU por namespace (em cores):**

```promql
sum(rate(container_cpu_usage_seconds_total{namespace!=""}[5m])) by (namespace)
```

**Memória usada por Pod (em bytes):**

```promql
container_memory_usage_bytes{namespace="monitoring"}
```

**Número de Pods por namespace:**

```promql
count(kube_pod_info) by (namespace)
```

**Estado dos nós do cluster:**

```promql
kube_node_status_condition{condition="Ready", status="true"}
```

**Taxa de requisições HTTP no API server:**

```promql
rate(apiserver_request_total[5m])
```

Você pode usar esses dados para criar alertas. Por exemplo: "se `kube_node_status_condition{condition='Ready', status='true'}` retornar menos que o número de nós esperados, alguém recebe um alerta no Slack". O AlertManager, que já está instalado, cuida do roteamento desses alertas.

### Alternativa: NodePort para Grafana

Se você prefere não usar port-forward (em ambientes de desenvolvimento, por exemplo), pode expor o Grafana como NodePort. Edite o Service:

```bash
kubectl patch svc prometheus-grafana -n monitoring -p '{"spec":{"type":"NodePort"}}'
```

```text
service/prometheus-grafana patched
```

Agora veja a porta exposta:

```bash
kubectl get svc prometheus-grafana -n monitoring
```

```text
NAME                TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
prometheus-grafana  NodePort   10.96.142.88    <none>        80:32456/TCP   10m
```

O Grafana está acessível em qualquer nó do cluster na porta `32456` (a porta alta é aleatória, a sua vai ser diferente). Abra `http://<ip-do-nó>:32456` e faça login.

Lembrete: NodePort expõe o serviço diretamente. Em produção, use Ingress com TLS e autenticação, ou continue com port-forward.

### Por que isso importa

Sem Prometheus e Grafana, você está operando às cegas. Você só descobre problemas quando os usuários reclamam... ou quando o cluster cai. Com métricas e dashboards, você:

1. **Vê problemas antes dos usuários**: um Pod com memory leak aparece no gráfico de memória dias antes de estourar o limit e ser morto pelo OOMKiller
2. **Depura rápido**: em vez de adivinhar qual componente está lento, você olha o dashboard e vê qual Pod está consumindo mais recursos
3. **Planeja capacidade**: os gráficos históricos mostram tendências de crescimento. Você sabe quando precisa adicionar nós
4. **Cria alertas inteligentes**: "80% de CPU" não é problema. "80% de CPU por mais de 30 minutos" provavelmente é. O Prometheus permite definir thresholds com contexto temporal

E o melhor: com Helm, tudo isso foi instalado em menos de 2 minutos. Um comando só. Compare com instalar cada componente manualmente (configurar Prometheus, ServiceMonitors, Grafana, datasources, dashboards... seria um dia inteiro de trabalho).

No próximo capítulo, a gente vai além do monitoramento e entra em GitOps com ArgoCD: deploy automatizado a partir do Git. Mas antes: gaste uns minutos explorando os dashboards. Mude o período de tempo (canto superior direito do Grafana) para "Last 15 minutes" e veja as métricas mudarem em tempo real. Abra uns 3 dashboards diferentes e entenda o que cada um mostra. É o tipo de coisa que só se aprende mexendo.

```cheatsheet
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts | Adicionar repositório
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace | Instalar stack completa
kubectl get pods -n monitoring | Ver todos os componentes executando
kubectl get svc -n monitoring | Ver serviços internos
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80 | Acessar Grafana localmente
kubectl get secret -n monitoring prometheus-grafana -o jsonpath="{.data.admin-password}" \| base64 --decode | Pegar senha do admin do Grafana
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090 | Acessar Prometheus localmente
kubectl patch svc prometheus-grafana -n monitoring -p '{"spec":{"type":"NodePort"}}' | Expor Grafana como NodePort
helm list -n monitoring | Ver releases instaladas
helm uninstall prometheus -n monitoring | Remover tudo
```
