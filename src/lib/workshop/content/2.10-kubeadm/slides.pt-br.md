## kubeadm: bootstrap completo

- kubeadm é a ferramenta oficial de bootstrap do Kubernetes
- Control plane como static pods em `/etc/kubernetes/manifests/`
- CNI é instalado separadamente (não é responsabilidade do kubeadm)
- Tokens de join expiram em 24h. Recrie com `kubeadm token create --print-join-command`

## Pré-requisitos (todos os nós)

```bash
modprobe overlay br_netfilter                          # módulos do kernel
sysctl net.bridge.bridge-nf-call-iptables=1            # iptables vê bridge
sysctl net.ipv4.ip_forward=1                           # IP forwarding
swapoff -a                                             # kubelet não aceita swap
```

containerd: `SystemdCgroup = true` em `/etc/containerd/config.toml`

Verificações:

```bash
lsmod | grep -E "overlay|br_netfilter"
sysctl net.bridge.bridge-nf-call-iptables net.ipv4.ip_forward
free -h | grep Swap
```

## kubeadm init (control plane)

```bash
sudo kubeadm init \
  --pod-network-cidr=10.244.0.0/16 \
  --skip-phases=addon/kube-proxy
```

- `--pod-network-cidr`: range de IPs para Pods (Cilium usa 10.244.0.0/16)
- `--skip-phases=addon/kube-proxy`: Cilium substitui kube-proxy com eBPF

Copie o kubeconfig:

```bash
mkdir -p $HOME/.kube
sudo cp /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

## Static pods (control plane)

```bash
ls /etc/kubernetes/manifests/
```

```
etcd.yaml
kube-apiserver.yaml
kube-controller-manager.yaml
kube-scheduler.yaml
```

- kubelet assiste o diretório. Adicionou manifest, sobe o Pod. Removeu, mata.
- Sem Deployment, sem ReplicaSet. É o kubelet direto.

## Cilium CLI + instalação

```bash
curl -L --remote-name-all https://github.com/cilium/cilium-cli/releases/download/v1.19.1/cilium-linux-amd64.tar.gz
sudo tar xzvfC cilium-linux-amd64.tar.gz /usr/local/bin
cilium install
cilium status
```

Componentes: cilium (DaemonSet, agente eBPF), cilium-envoy (DaemonSet, proxy L7), cilium-operator (Deployment, gestão global).

## kubeadm join (worker)

```bash
sudo kubeadm join <ip-do-control-plane>:6443 \
  --token w30091.4nn8cecjs8roi03o \
  --discovery-token-ca-cert-hash sha256:655e900b139721a7c2bad8cebf07415f782021a768befbe56fa3f3e3d40ed576
```

Token expirado? Recrie:

```bash
sudo kubeadm token create --print-join-command
```

## Verificação final

```bash
kubectl get nodes -o wide
```

```text
NAME               STATUS   ROLES           AGE   VERSION
ip-172-31-34-6     Ready    <none>          30m   v1.32.13
ip-172-31-38-213   Ready    <none>          30m   v1.32.13
ip-172-31-43-16    Ready    <none>          30m   v1.32.13
ip-172-31-45-35    Ready    control-plane   32m   v1.32.13
```

```bash
kubeadm version
```

```
kubeadm version: ... v1.32.13 ... Platform:"linux/amd64"
```

```bash
cilium status
```

```
Cilium: OK  |  Operator: OK  |  Envoy DaemonSet: OK
DaemonSet cilium: 4/4  |  cilium-operator: 1/1
```

## Fases do kubeadm init

preflight → certs → kubeconfig → etcd → control-plane → kubelet-config → upload-config → mark-control-plane → bootstrap-token → addon

Execute fase por fase com `kubeadm init phase <fase>` se precisar de controle granular.
