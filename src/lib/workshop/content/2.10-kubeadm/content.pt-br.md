## kubeadm: bootstrap de cluster na prática

kubeadm é a ferramenta oficial do Kubernetes para criar clusters. Não é um instalador completo de SO (isso é coisa do kOps, Kubespray, etc.), mas é a ferramenta canônica para subir a control plane e conectar workers. Todo cluster criado com kubeadm segue as melhores práticas do upstream.

Neste capítulo você vai ver o bootstrap completo de um cluster real: pré-requisitos, `kubeadm init`, instalação do Cilium como CNI e `kubeadm join` no worker. O cluster usado tem Kubernetes v1.32.13 e Cilium 1.19.1, executando em Ubuntu 24.04 com containerd 2.2.1.

## Pré-requisitos: preparando o nó

Antes de executar o kubeadm, todo nó (control plane e worker) precisa dos binários instalados e de alguns pré-requisitos de kernel.

### Instalar containerd, kubeadm, kubelet e kubectl

No Ubuntu/Debian:

```bash
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl gpg
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.32/deb/Release.key | \
  sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.32/deb/ /' | \
  sudo tee /etc/apt/sources.list.d/kubernetes.list

sudo apt-get update
sudo apt-get install -y containerd kubeadm kubelet kubectl
sudo apt-mark hold kubeadm kubelet kubectl
```

No Fedora/RHEL:

```bash
cat <<EOF | sudo tee /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://pkgs.k8s.io/core:/stable:/v1.32/rpm/
enabled=1
gpgcheck=1
gpgkey=https://pkgs.k8s.io/core:/stable:/v1.32/rpm/repodata/repomd.xml.key
EOF

sudo dnf install -y containerd kubeadm kubelet kubectl
sudo systemctl enable --now containerd
```

Depois de instalado, verifique as versões:

```bash
containerd --version
kubeadm version
kubectl version --client
```

```text
containerd github.com/containerd/containerd/v2 2.2.1
kubeadm version: &version.Info{Major:"1", Minor:"32", GitVersion:"v1.32.13", GitCommit:"6172d7357c6287643350a4fc7e048f24098f2a1b", GitTreeState:"clean", BuildDate:"2026-02-26T20:22:27Z", GoVersion:"go1.24.13", Compiler:"gc", Platform:"linux/amd64"}
Client Version: v1.32.13
Kustomize Version: v5.5.0
```

Agora que os binários estão no lugar, vamos aos pré-requisitos de kernel que o kubelet e o container runtime esperam.

### Módulos do kernel

Dois módulos são obrigatórios: `overlay` (para o filesystem em camadas do containerd) e `br_netfilter` (para o iptables enxergar tráfego bridge).

```bash
modprobe overlay
modprobe br_netfilter
```

Verifique que estão carregados:

```bash
lsmod | grep -E "overlay|br_netfilter"
```

```text
br_netfilter           32768  0
bridge                421888  1 br_netfilter
overlay               221184  18
```

Para garantir que carreguem no boot:

```bash
echo "overlay" | sudo tee /etc/modules-load.d/k8s.conf
echo "br_netfilter" | sudo tee -a /etc/modules-load.d/k8s.conf
```

### Parâmetros de kernel (sysctl)

O Kubernetes precisa que o iptables processe tráfego bridge e que IP forwarding esteja habilitado:

```bash
sysctl net.bridge.bridge-nf-call-iptables=1
sysctl net.ipv4.ip_forward=1
```

Confirme os valores:

```bash
sysctl net.bridge.bridge-nf-call-iptables net.ipv4.ip_forward
```

```text
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.ip_forward = 1
```

Para persistir no boot, crie `/etc/sysctl.d/k8s.conf` com esses parâmetros.

### Swap desligado

O kubelet se recusa a iniciar se swap estiver ativo. O motivo: o scheduler assume que a memória alocada está realmente disponível. Se o SO fizer swapping, as garantias de scheduling vão para o espaço.

```bash
swapoff -a
```

Confirme que está zerado:

```bash
free -h | grep Swap
```

```text
Swap:             0B          0B          0B
```

Remova a entrada de swap do `/etc/fstab` para não voltar no reboot.

### containerd com systemd cgroup

O container runtime precisa usar o driver de cgroup `systemd`. Isso evita que dois gerenciadores de cgroup diferentes (systemd e o cgroupfs do containerd) compitam pelos recursos do nó.

No arquivo `/etc/containerd/config.toml`, o trecho crítico:

```toml
[plugins.'io.containerd.cri.v1.runtime'.containerd.runtimes.runc.options]
  SystemdCgroup = true
```

Gere a config padrão se não existir:

```bash
sudo mkdir -p /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml
```

Depois edite e garanta `SystemdCgroup = true`. Reinicie o containerd:

```bash
sudo systemctl restart containerd
```

## kubeadm init: criando a control plane

Com os pré-requisitos atendidos, o próximo passo é inicializar a control plane. O comando `kubeadm init` faz várias coisas: gera certificados, sobe os componentes da control plane como static pods, configura o kubelet e gera um token para os workers se juntarem.

Como vamos usar Cilium como CNI (sem kube-proxy), passamos flags específicas:

```bash
sudo kubeadm init \
  --pod-network-cidr=10.244.0.0/16 \
  --skip-phases=addon/kube-proxy
```

Cada flag:

- `--pod-network-cidr=10.244.0.0/16`: o range de IPs que o Cilium vai usar para os Pods. O Cilium usa 10.244.0.0/16 por padrão.
- `--skip-phases=addon/kube-proxy`: pula a instalação do kube-proxy. O Cilium tem substituição nativa para kube-proxy (via eBPF), então não precisamos dele.

A saída do init mostra várias coisas: onde o kubeconfig foi salvo, o comando `kubeadm join` para os workers e instruções para configurar o kubectl.

Copie o kubeconfig para seu usuário:

```bash
mkdir -p $HOME/.kube
sudo cp /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

### Static pods: a control plane sem systemd

O kubeadm sobe os componentes da control plane como **static pods**. São arquivos YAML em `/etc/kubernetes/manifests/` que o kubelet monitora e gerencia diretamente:

```bash
ls /etc/kubernetes/manifests/
```

```
etcd.yaml
kube-apiserver.yaml
kube-controller-manager.yaml
kube-scheduler.yaml
```

Cada arquivo é um Pod manifest. O kubelet assiste esse diretório e garante que esses Pods sempre estejam executando. Se um manifest for removido, o Pod é deletado. Se for adicionado, o Pod é criado. Não tem Deployment, não tem ReplicaSet. É o kubelet direto.

## Instalando o Cilium como CNI

Com a control plane no ar, o próximo passo é instalar o CNI. Vamos usar o Cilium CLI:

```bash
CILIUM_CLI_VERSION=$(curl -s https://raw.githubusercontent.com/cilium/cilium-cli/main/stable.txt)
curl -L --remote-name-all https://github.com/cilium/cilium-cli/releases/download/${CILIUM_CLI_VERSION}/cilium-linux-amd64.tar.gz
sudo tar xzvfC cilium-linux-amd64.tar.gz /usr/local/bin
cilium version
```

Depois instale o Cilium no cluster:

```bash
cilium install
```

O Cilium CLI detecta automaticamente o cluster, aplica os manifestos e espera tudo ficar pronto. Confira o resultado:

```bash
cilium status
```

```text
    /¯¯\
 /¯¯\__/¯¯\    Cilium:             OK
 \__/¯¯\__/    Operator:           OK
 /¯¯\__/¯¯\    Envoy DaemonSet:    OK
 \__/¯¯\__/    Hubble Relay:       disabled
    \__/       ClusterMesh:        disabled

DaemonSet              cilium                   Desired: 1, Ready: 1/1, Available: 1/1
DaemonSet              cilium-envoy             Desired: 1, Ready: 1/1, Available: 1/1
Deployment             cilium-operator          Desired: 1, Ready: 1/1, Available: 1/1
Containers:            cilium                   Running: 1
                       cilium-envoy             Running: 1
                       cilium-operator          Running: 1
Cluster Pods:          2/2 managed by Cilium
Helm chart version:    1.19.1
Image versions         cilium             quay.io/cilium/cilium:v1.19.1
                       cilium-envoy       quay.io/cilium/cilium-envoy:v1.35.9
                       cilium-operator    quay.io/cilium/operator-generic:v1.19.1
```

O Cilium instala três componentes:

- cilium (DaemonSet): agente que executa em cada nó. Responsável por eBPF, rede, políticas e substituição do kube-proxy.
- cilium-envoy (DaemonSet): proxy Envoy para L7 policies e observabilidade.
- cilium-operator (Deployment): gerencia aspectos globais como alocação de IPs.

## kubeadm join: adicionando o worker

Com a control plane pronta e o CNI funcionando, é hora de adicionar o nó worker. O comando `kubeadm join` usa o token e o hash do certificado CA gerados no init:

```bash
sudo kubeadm join <ip-do-control-plane>:6443 \
  --token w30091.4nn8cecjs8roi03o \
  --discovery-token-ca-cert-hash sha256:655e900b139721a7c2bad8cebf07415f782021a768befbe56fa3f3e3d40ed576
```

O que cada parte faz:

- `<ip-do-control-plane>:6443`: IP e porta do API server na control plane
- `--token`: credencial de bootstrap. Tokens expiram em 24h por padrão
- `--discovery-token-ca-cert-hash`: hash do certificado CA. Garante que o worker está falando com a control plane certa, prevenindo MITM

Se o token expirou, gere um novo na control plane:

```bash
sudo kubeadm token create --print-join-command
```

O comando acima imprime o `kubeadm join` completo, pronto para copiar e colar no worker.

## Verificando o cluster

Depois que o worker entra no cluster, os nós aparecem com status Ready:

```bash
kubectl get nodes -o wide
```

```text
NAME               STATUS   ROLES           AGE   VERSION    INTERNAL-IP     EXTERNAL-IP   OS-IMAGE             KERNEL-VERSION    CONTAINER-RUNTIME
ip-172-31-34-6     Ready    <none>          2m    v1.32.13   172.31.34.6     <none>        Ubuntu 24.04.4 LTS   6.17.0-1007-aws   containerd://2.2.1
ip-172-31-38-213   Ready    <none>          2m    v1.32.13   172.31.38.213   <none>        Ubuntu 24.04.4 LTS   6.17.0-1007-aws   containerd://2.2.1
ip-172-31-43-16    Ready    <none>          2m    v1.32.13   172.31.43.16    <none>        Ubuntu 24.04.4 LTS   6.17.0-1007-aws   containerd://2.2.1
ip-172-31-45-35    Ready    control-plane   3m    v1.32.13   172.31.45.35    <none>        Ubuntu 24.04.4 LTS   6.17.0-1007-aws   containerd://2.2.1
```

Quatro nós Ready: 1 control-plane + 3 workers. O control-plane tem a role `control-plane`, os workers não têm role (ainda).

A versão do kubeadm usada:

```bash
kubeadm version
```

```
kubeadm version: &version.Info{Major:"1", Minor:"32", GitVersion:"v1.32.13", GitCommit:"6172d7357c6287643350a4fc7e048f24098f2a1b", GitTreeState:"clean", BuildDate:"2026-02-26T20:22:27Z", GoVersion:"go1.24.13", Compiler:"gc", Platform:"linux/amd64"}
```

## O que o kubeadm init faz por trás

Vale entender o que acontece quando você executa `kubeadm init`. O comando passa por várias fases:

1. **preflight**: valida pré-requisitos (SO, kernel, swap, portas)
2. **certs**: gera a CA e todos os certificados (apiserver, etcd, front-proxy, sa)
3. **kubeconfig**: gera kubeconfigs para controller-manager, scheduler, admin e kubelet
4. **etcd**: sobe o etcd como static pod (ou usa externo se configurado)
5. **control-plane**: sobe apiserver, controller-manager e scheduler como static pods
6. **kubelet-config**: cria o ConfigMap `kubelet-config` no namespace `kube-system`
7. **upload-config**: sobe a config do cluster (`kubeadm-config` ConfigMap)
8. **mark-control-plane**: adiciona label e taint no nó control-plane
9. **bootstrap-token**: gera o token para os workers
10. **addon**: instala kube-proxy e CoreDNS (pulamos o kube-proxy com `--skip-phases`)

Você pode executar fase por fase com `kubeadm init phase <fase>` se precisar de controle granular.

## Resumo

kubeadm é a ferramenta canônica para bootstrap de clusters Kubernetes. O fluxo é: preparar os nós (módulos, sysctl, containerd, swap), `kubeadm init` na control plane, instalar CNI (Cilium no nosso caso), `kubeadm join` nos workers. A control plane sobe como static pods no diretório `/etc/kubernetes/manifests/`. O token de join expira em 24h, mas pode ser recriado a qualquer momento.
