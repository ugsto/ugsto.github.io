+++
date = 2026-01-01
title = "Ingress: roteamento HTTP inteligente"
weight = 307
path = "27"
[extra]
part = 3
section = 7
read_time_minutes = 7
hands_on_minutes = 12
+++



## Ingress: roteamento HTTP inteligente

Você já tem Services expondo seus Pods internamente. Mas Services do tipo ClusterIP só são acessíveis dentro do cluster. Services do tipo NodePort expõem em portas altas (30000-32767). Services do tipo LoadBalancer dependem de um load balancer externo (cloud provider ou MetalLB).

O problema: se você tem 10 aplicações, você não quer 10 LoadBalancers (cada um com seu IP público, cada um custando dinheiro). Você quer um ponto de entrada único que roteia o tráfego baseado no path ou no host.

É isso que o Ingress faz: um proxy reverso L7 (HTTP/HTTPS) que inspeciona o Host header e o path da requisição e encaminha para o Service correto.

## Arquitetura do Ingress

O Ingress no Kubernetes tem duas partes:

1. **Recurso Ingress**: objeto YAML que declara as regras de roteamento (host, path, service). Você, desenvolvedor, cria esse recurso.
2. **Ingress Controller**: pod que efetivamente implementa as regras. É um proxy reverso (Kong, Traefik, HAProxy, Contour) que assiste os recursos Ingress e atualiza sua configuração.

Sem um Ingress Controller executando no cluster, recursos Ingress não fazem nada. O controller é o "motor" que transforma as regras YAML em configuração de proxy.

## Nosso Ingress Controller: Kong

No cluster do workshop, vamos instalar o Kong Ingress Controller via Helm. O Kong funciona em modo DB-less (sem banco de dados), usando a configuração declarativa do Kubernetes como fonte da verdade.

Se você nunca mexeu com Helm, não se preocupe. No capítulo 4.00 a gente explica tudo: o que é Chart, como funciona o `values.yaml`, os comandos essenciais. Por enquanto, confia em mim e segue os comandos que tudo faz sentido lá na frente.

Adicione o repositório Helm do Kong e instale:

```bash
helm repo add kong https://charts.konghq.com
helm repo update
```

```bash
helm install kong kong/kong -n kong --create-namespace \
  --set ingressController.enabled=true \
  --set image.repository=kong/kong-gateway \
  --set image.tag=3.9 \
  --set env.database=off \
  --set proxy.type=NodePort
```

```
NAME: kong
LAST DEPLOYED: ...
NAMESPACE: kong
STATUS: deployed
REVISION: 1
```

Aguarde alguns segundos para o controller iniciar e verifique os Pods:

```bash
kubectl get pods -n kong
```

```
NAME                        READY   STATUS    RESTARTS   AGE
kong-kong-9f8cd85f5-gm7bm   2/2     Running   0          58s
```

O Service do controller foi criado como NodePort:

```bash
kubectl get svc -n kong kong-kong-proxy
```

```
NAME              TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)                      AGE
kong-kong-proxy   NodePort   10.96.xxx.xxx   <none>        80:32456/TCP,443:30123/TCP   58s
```

Repare que o tipo é NodePort, não LoadBalancer. As portas altas (32456 e 30123) são mapeadas para os nós do cluster. Vamos falar sobre acesso externo mais adiante.

## Path-based routing: /v1 e /v2

O cenário mais comum de Ingress é rotear por path. Duas versões de uma aplicação, cada uma com seu Service, acessíveis por paths diferentes:

```
/v1  →  Service app-v1 (porta 80)
/v2  →  Service app-v2 (porta 80)
```

Primeiro, criamos dois Deployments e dois Services:

```bash
kubectl create deployment app-v1 --image=nginx:alpine
kubectl expose deployment app-v1 --port=80
```

```
deployment.apps/app-v1 created
service/app-v1 exposed
```

```bash
kubectl create deployment app-v2 --image=nginx:alpine
kubectl expose deployment app-v2 --port=80
```

```
deployment.apps/app-v2 created
service/app-v2 exposed
```

Cada um serve a página padrão do NGINX (a mesma nos dois). Na prática seriam aplicações diferentes, mas para testar o roteamento isso é suficiente.

Agora o recurso Ingress:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: demo-ingress
  annotations:
    konghq.com/strip-path: "true"
spec:
  ingressClassName: kong
  rules:
  - http:
      paths:
      - path: /v1
        pathType: Prefix
        backend:
          service:
            name: app-v1
            port:
              number: 80
      - path: /v2
        pathType: Prefix
        backend:
          service:
            name: app-v2
            port:
              number: 80
```

```bash
kubectl apply -f ingress.yaml
```

```
ingress.networking.k8s.io/demo-ingress created
```

Vamos verificar se o Ingress foi criado e se o controller atribuiu um endereço:

```bash
kubectl get ingress demo-ingress
```

```
NAME           CLASS   HOSTS   ADDRESS        PORTS   AGE
demo-ingress   kong    *       10.96.xxx.xxx  80      10s
```

O campo ADDRESS mostra o IP interno do Service do Kong (ClusterIP). O `*` em HOSTS significa que aceita qualquer host.

## Testando o roteamento internamente

O Service do Kong é NodePort, então o acesso externo depende das portas dos nós estarem acessíveis. Mas podemos testar diretamente contra o Service dentro do cluster, usando um Pod da aplicação como cliente:

```bash
kubectl exec deploy/app-v1 -- curl -s http://kong-kong-proxy.kong.svc.cluster.local/v1
```

```
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
...
</html>
```

```bash
kubectl exec deploy/app-v1 -- curl -s http://kong-kong-proxy.kong.svc.cluster.local/v2
```

```
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
...
</html>
```

As duas requisições retornam HTML. O Kong Ingress Controller recebeu a requisição, inspecionou o path e roteou para o Service correto. Se fossem aplicações diferentes, o conteúdo seria diferente.

## A annotation strip-path

A annotation `konghq.com/strip-path: "true"` é essencial quando você faz path-based routing. Sem ela, o Kong encaminha o path original para o backend.

Comportamento sem strip-path:

```
Requisição: GET /v1/index.html
Encaminhado para o backend: GET /v1/index.html
```

O backend recebe `/v1/index.html` e precisa saber servir assets a partir desse path. Se sua aplicação espera requisições na raiz (`/`), ela vai retornar 404.

Com `strip-path: "true"`:

```
Requisição: GET /v1/index.html
Encaminhado para o backend: GET /index.html
```

O prefixo `/v1` é removido antes de encaminhar. O backend vê `/index.html`, que é exatamente o que ele espera.

Comportamentos da annotation strip-path:

- **`strip-path: "true"`**: Remove o prefixo do path antes de encaminhar para o backend. É o equivalente ao `rewrite-target: /` do NGINX.
- **`strip-path: "false"`** (padrão): O path chega intacto ao backend. Útil quando o backend já espera o prefixo no path.

Para cenários mais complexos de reescrita (como substituir parte do path), o Kong oferece o plugin `request-transformer`, configurável via annotations ou KongPlugin CRDs.

## Acesso externo com NodePort

O Service do Kong Ingress Controller é tipo NodePort:

```bash
kubectl get svc -n kong kong-kong-proxy
```

```
NAME              TYPE       EXTERNAL-IP   PORT(S)
kong-kong-proxy   NodePort   <none>        80:32456/TCP,443:30123/TCP
```

Com NodePort, o Kong fica acessível em `<ip-do-nó>:32456` (HTTP) e `<ip-do-nó>:30123` (HTTPS). Isso funciona em qualquer cluster, sem depender de cloud provider.

No entanto, dependendo da configuração do cluster, as portas NodePort podem estar bloqueadas externamente. Security groups de cloud providers e certas configurações de CNI (como Cilium com eBPF) podem impedir acesso externo direto às portas dos nós.

Se você estiver em um ambiente onde as portas dos nós são acessíveis (ex: cluster local com kind ou minikube), o acesso via NodePort funciona diretamente:

```bash
curl http://<ip-do-nó>:32456/v1
```

## MetalLB: LoadBalancer para bare-metal

Para ter um IP dedicado sem depender de cloud provider, você pode usar o MetalLB. Ele atribui um IP de um pool configurado e responde a ARP requests por esse IP.

Primeiro, instale o MetalLB:

```bash
helm repo add metallb https://metallb.github.io/metallb
helm install metallb metallb/metallb --namespace metallb-system --create-namespace
```

Configuração do pool de IPs (Layer 2, o modo mais simples):

```yaml
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: first-pool
  namespace: metallb-system
spec:
  addresses:
  - 192.168.1.100-192.168.1.150
---
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: l2-advert
  namespace: metallb-system
```

Depois, altere o Service do Kong para LoadBalancer:

```bash
kubectl patch svc -n kong kong-kong-proxy -p '{"spec":{"type":"LoadBalancer"}}'
```

Com o MetalLB ativo, o Service ganha um IP externo:

```bash
kubectl get svc -n kong kong-kong-proxy
```

```
NAME              TYPE           EXTERNAL-IP      PORT(S)
kong-kong-proxy   LoadBalancer   192.168.1.100    80:32456/TCP,443:30123/TCP
```

A partir desse momento, `curl http://192.168.1.100/v1` funciona de fora do cluster. O MetalLB responde ARP requests para 192.168.1.100 e encaminha para o Kong Ingress Controller.

Alternativa ao MetalLB: se você está em cloud, basta criar o Service como LoadBalancer desde o início (use `--set proxy.type=LoadBalancer` no helm install) e o cloud-controller-manager provisiona um load balancer real automaticamente. Em desenvolvimento local, você pode usar `kubectl port-forward` para testes rápidos:

```bash
kubectl port-forward -n kong svc/kong-kong-proxy 8080:80
curl http://localhost:8080/v1
```

## Resumo do capítulo

- Ingress é um proxy L7 que roteia HTTP baseado em host e path, consolidando múltiplos Services atrás de um único ponto de entrada.
- O Ingress Controller (Kong, neste caso) é o motor que implementa as regras. Sem controller, recursos Ingress são inúteis.
- `konghq.com/strip-path` remove o prefixo do path antes de encaminhar para o backend. Essencial para path-based routing.
- O Kong foi instalado como NodePort, acessível nas portas altas dos nós. Em ambientes com portas abertas, isso já resolve o acesso externo.
- Services do tipo LoadBalancer ficam `<pending>` em bare-metal porque não há cloud controller para provisionar um LB externo.
- MetalLB resolve isso anunciando IPs via BGP ou ARP (Layer 2), dando EXTERNAL-IP real para Services LoadBalancer em qualquer cluster. Basta alterar o Service do Kong para LoadBalancer.
- NodePort pode estar bloqueado por security group (cloud) ou configuração de CNI. Para acesso externo real, use MetalLB ou port-forward para testes locais.

Este é o último capítulo da Parte 3. Na Parte 4, vamos explorar o ecossistema: Cilium como CNI, ArgoCD para GitOps, Prometheus/Grafana para observabilidade, Vault para gestão de secrets e Kong (que você já conhece como Ingress Controller) estendido com plugins de API Gateway.
