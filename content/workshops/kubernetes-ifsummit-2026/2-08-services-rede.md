+++
date = 2026-01-01
title = "ClusterIP: comunicação interna"
weight = 208
path = "17"
[extra]
part = 2
section = 8
read_time_minutes = 6
hands_on_minutes = 10
+++



## O problema

Você tem pods efêmeros. Eles morrem, renascem, mudam de IP. Um pod que era `10.0.1.5` vira `10.0.2.30` depois de um restart. Como outros pods (ou o mundo externo) encontram ele?

A resposta é **Service**: um IP fixo e um nome DNS estável que representam um conjunto de pods.

## ClusterIP: comunicação interna

O tipo mais comum. Um IP virtual acessível apenas dentro do cluster. O Service seleciona pods por labels.

Crie um deployment e exponha com ClusterIP:

```bash
kubectl create deployment nginx --image=nginx
kubectl expose deployment nginx --port=80
```

O Service ganha um IP fixo (`10.105.247.104`). Os pods continuam efêmeros:

```bash
kubectl get svc nginx
```

```
NAME    TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
nginx   ClusterIP   10.105.247.104   <none>        80/TCP    8s
```

```bash
kubectl get endpoints nginx
```

```
NAME    ENDPOINTS       AGE
nginx   10.0.1.248:80   8s
```

O `ENDPOINTS` mostra o IP real do pod. O Service mantém esse mapeamento atualizado automaticamente. Se o pod morrer e renascer com outro IP, o Endpoint é atualizado.

Teste de dentro do cluster:

```bash
kubectl run debug --image=busybox --restart=Never --command -- sleep 3600
kubectl exec debug -- wget -qO- http://10.105.247.104/
```

```
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
```

O pod `debug` acessou o nginx pelo IP do Service. Ele não precisa saber qual é o IP real do pod nginx. O Service faz o proxy.

## DNS: nomes, não IPs

Todo Service ganha um registro DNS automático: `<nome>.<namespace>.svc.cluster.local`. O CoreDNS resolve.

Verifique no seu cluster:

```bash
kubectl get svc -n kube-system kube-dns
```

```text
NAME       TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)                  AGE
kube-dns   ClusterIP   10.96.0.10   <none>        53/UDP,53/TCP,9153/TCP   24m
```

Dois pods CoreDNS respondendo:

```bash
kubectl get pods -n kube-system -l k8s-app=kube-dns
```

```
NAME                       READY   STATUS    RESTARTS   AGE
coredns-668d6bf9bc-7kc2j   1/1     Running   0          62m
coredns-668d6bf9bc-gglfc   1/1     Running   0          62m
```

Qualquer pod no cluster resolve `nginx.default.svc.cluster.local` para o ClusterIP do Service. O `default` é o namespace. Dentro do mesmo namespace, `nginx` basta.

## NodePort: expondo pro mundo

ClusterIP é interno. Para expor um Service fora do cluster, você usa NodePort. Ele abre uma porta alta (30000-32767) em **todos os nodes** e redireciona pro Service.

```bash
kubectl expose deployment nginx --type=NodePort --port=80 --name=nginx-np
```

```bash
kubectl get svc nginx-np
```

```
NAME       TYPE       CLUSTER-IP       EXTERNAL-IP   PORT(S)        AGE
nginx-np   NodePort   10.98.13.207   <none>        80:30948/TCP   2s
```

Porta `30948` aberta em todos os nodes. Acessar `http://<ip-do-node>:30948` bate no nginx.

**Na prática em cloud (AWS, GCP):** o security group bloqueia portas altas por padrão. Tentar acessar via IP público do worker resulta em timeout:

```
 *   Trying <ip-do-worker>:30948...
* Failed to connect: Timeout was reached
```

Para NodePort funcionar em cloud você precisa abrir a porta no security group. Em clusters on-premise (ou com SG configurado), funciona direto.

Acesso interno via IP privado do worker também pode ser bloqueado dependendo das regras de rede internas. O caminho garantido é sempre via ClusterIP de dentro do cluster.

## O que acontece por baixo

Quando você cria um Service, três coisas acontecem:

1. IP virtual alocado: o `kube-apiserver` registra um ClusterIP que não pertence a interface de rede nenhuma
2. Endpoints populados: o `kube-controller-manager` varre pods com labels que batem e preenche o objeto `Endpoints`
3. Regras de rede instaladas: o CNI cria regras para redirecionar tráfego do ClusterIP para os pods reais

O **Cilium** (eBPF) substitui o kube-proxy completamente:

```bash
kubectl get pods -n kube-system | grep kube-proxy
```

Nenhum output. Zero pods de kube-proxy. O Cilium instala programas eBPF diretamente no kernel de cada node. Quando um pacote chega no ClusterIP, o eBPF no kernel consulta o mapa de endpoints e redireciona. Sem passar por userspace, sem iptables, sem proxy.

Em clusters tradicionais, o kube-proxy faria esse trabalho via iptables (ou IPVS). O efeito pro usuário é idêntico. `kubectl expose` funciona igual. A diferença é performance: eBPF é mais rápido e escala melhor com muitos Services.

## Tipos de Service

| Tipo | Acesso | Caso de uso |
|---|---|---|
| ClusterIP | Interno ao cluster | Comunicação entre microsserviços |
| NodePort | IP do node:porta alta | Dev/test, acesso rápido externo |
| LoadBalancer | IP externo provisionado | Produção (requer cloud controller) |
| ExternalName | Redireciona pra DNS externo | Serviços fora do cluster |

LoadBalancer pode ficar pendente se o cluster não tiver cloud controller configurado. Para produção, o caminho real é **Ingress** (capítulo 3.07).

```cheatsheet
kubectl expose deployment <nome> --port=80 | ClusterIP básico
kubectl expose deployment <nome> --type=NodePort --port=80 | NodePort (abre porta alta)
kubectl get svc | Listar Services
kubectl get endpoints <svc> | Ver para quais pods o Service aponta
kubectl run tmp --image=busybox --rm -it -- wget -qO- http://<svc-ip> | Testar de dentro do cluster
kubectl describe svc <nome> | Detalhes: IP, portas, selector, endpoints
```

---

No próximo capítulo: Deployments. Rolling update, rollback, scale. Como evoluir aplicação sem downtime.
