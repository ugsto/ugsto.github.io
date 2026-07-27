## Ingress: proxy reverso L7

Um ponto de entrada HTTP/HTTPS único que roteia para múltiplos Services baseado em path e host.

- Recurso Ingress: regras YAML (host, path, service).
- Ingress Controller: motor que implementa as regras (NGINX, Traefik, HAProxy).
- Sem controller, Ingress não faz nada.

## Path-based routing

```
/v1  →  Service app-v1:80
/v2  →  Service app-v2:80
```

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: demo-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
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

## rewrite-target: remove o prefixo do path

Sem rewrite-target: `GET /v1/index.html` → backend recebe `/v1/index.html` (provavelmente 404).

Com rewrite-target: `GET /v1/index.html` → backend recebe `/index.html` (funciona).

| Annotation | Comportamento |
|---|---|
| `rewrite-target: /` | Remove prefixo, encaminha raiz |
| `rewrite-target: /api` | Substitui prefixo por /api |
| `rewrite-target: /$1` | Usa grupo de captura regex |

## LoadBalancer `<pending>` em bare-metal

```bash
kubectl get svc -n ingress-nginx ingress-nginx-controller
```

```
TYPE           EXTERNAL-IP   PORT(S)
LoadBalancer   <pending>     80:32456/TCP,443:30123/TCP
```

- Cloud provider gerencia LB automaticamente (AWS ELB, GCP LB).
- Bare-metal: sem cloud-controller-manager → EXTERNAL-IP nunca é atribuído.
- NodePort pode estar bloqueado por security group / firewall / Cilium eBPF.

## MetalLB: LoadBalancer para qualquer cluster

```bash
helm repo add metallb https://metallb.github.io/metallb
helm install metallb metallb/metallb --namespace metallb-system --create-namespace
```

Pool de IPs (Layer 2):

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

MetalLB aloca IP do pool, responde ARP, e o EXTERNAL-IP aparece:

```
TYPE           EXTERNAL-IP      PORT(S)
LoadBalancer   192.168.1.100    80:32456/TCP,443:30123/TCP
```

## Alternativas para teste local

```bash
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8080:80
curl http://localhost:8080/v1
```

## Cheatsheet

```cheatsheet
Criar Ingress com path routing
kubectl apply -f ingress.yaml

Listar Ingress
kubectl get ingress

Descrever Ingress
kubectl describe ingress <nome>

Listar IngressClass disponível
kubectl get ingressclass

Ver logs do NGINX Ingress Controller
kubectl logs -n ingress-nginx deploy/ingress-nginx-controller

Ver Service do controller
kubectl get svc -n ingress-nginx

Testar roteamento internamente
kubectl exec -n ingress-nginx deploy/ingress-nginx-controller -- curl -s http://localhost/v1

Port-forward para teste local
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8080:80

Instalar MetalLB (helm)
helm install metallb metallb/metallb -n metallb-system --create-namespace

Ver IPs alocados pelo MetalLB
kubectl get svc -A --field-selector spec.type=LoadBalancer

Ver pool de IPs do MetalLB
kubectl get ipaddresspools -n metallb-system
```
