## O problema

- Pods efêmeros: IP muda a cada restart
- Service: IP fixo + DNS estável → conjunto de pods
- Seleciona pods por labels

## ClusterIP

IP virtual interno. Só acessível dentro do cluster.

```bash
kubectl create deployment nginx --image=nginx
kubectl expose deployment nginx --port=80

kubectl get svc nginx
```

```
NAME    TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
nginx   ClusterIP   10.107.234.88   <none>        80/TCP    8s
```

```bash
kubectl get endpoints nginx
```

```
NAME    ENDPOINTS       AGE
nginx   10.0.1.248:80   8s
```

Endpoints = IPs reais dos pods. Service mantém mapeamento atualizado.

Teste de dentro do cluster:

```bash
kubectl run debug --image=busybox --restart=Never --command -- sleep 3600
kubectl exec debug -- wget -qO- http://10.107.234.88/
```

```
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
```

## DNS

CoreDNS: `<serviço>.<namespace>.svc.cluster.local`

```bash
kubectl get svc -n kube-system kube-dns
```

```
NAME       TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)                  AGE
kube-dns   ClusterIP   10.96.0.10   <none>        53/UDP,53/TCP,9153/TCP   63m
```

Mesmo namespace → `nginx` basta.

## NodePort

Abre porta alta (30000-32767) em todos os nodes.

```bash
kubectl expose deployment nginx --type=NodePort --port=80 --name=nginx-np
```

```
NAME       TYPE       CLUSTER-IP       PORT(S)        AGE
nginx-np   NodePort   10.109.138.101   80:32304/TCP   2s
```

Em cloud: security group bloqueia porta alta. Timeout no IP público. Precisa abrir SG.

## Cilium: sem kube-proxy

Cilium eBPF substitui kube-proxy. Programas no kernel redirecionam tráfego direto.

```bash
kubectl get pods -n kube-system | grep kube-proxy
```

Zero pods. eBPF > iptables em performance.

## Tipos de Service

- ClusterIP: interno
- NodePort: IP do node:porta
- LoadBalancer: IP externo (precisa cloud controller)
- ExternalName: redireciona pra DNS externo

```cheatsheet
kubectl expose deployment <nome> --port=80 | ClusterIP
kubectl expose deployment <nome> --type=NodePort --port=80 | NodePort
kubectl get svc | Listar
kubectl get endpoints <svc> | Ver endpoints
kubectl describe svc <nome> | Detalhes
kubectl run tmp --image=busybox --rm -it -- wget -qO- http://<ip> | Testar
```

---

Próximo: Deployments. Rolling update, rollback, scale.
