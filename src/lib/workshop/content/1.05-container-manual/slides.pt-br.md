## Receita do container

1. Rootfs (Alpine) → lowerdir do overlay
2. Overlay → mount com upperdir writable
3. Namespaces → unshare PID+net+mount+UTS+IPC
4. Cgroups → limites CPU e RAM
5. chroot → `/merged` vira `/`

### 1. Rootfs

```bash
CID=$(sudo docker create alpine:3.23)
sudo docker export $CID | tar -C /tmp/clab -x
```

### 2. Overlay

```bash
mkdir -p /tmp/clab/{upper,work,merged}
sudo mount -t overlay overlay \
  -o lowerdir=/tmp/clab,upperdir=/tmp/clab/upper,workdir=/tmp/clab/work \
  /tmp/clab/merged
```

### 3+4+5. Namespaces + cgroups + chroot

```bash
sudo cgcreate -g cpu,memory:/container-demo
echo "50M" | sudo tee /sys/fs/cgroup/container-demo/memory.max

sudo cgexec -g cpu,memory:/container-demo \
  unshare --pid --fork --mount-proc --uts --net --mount --ipc \
  chroot /tmp/clab/merged /bin/sh
```

## Dentro do container

```
PID: 1
hostname: container-artesanal
PID   USER     TIME  COMMAND
criado-dentro
```

PID 1, hostname isolado, só loopback, só vê os próprios processos.

Arquivo criado vai pro upper (copy-on-write):

```bash
echo $(< /tmp/clab/upper/tmp/teste.txt)
```

```
criado-dentro
```

Lower (rootfs original) intocado.

## O que falta pra um container "real"

- Rede: veth pair conectando ao host
- PID file: gerenciamento de lifecycle
- TTY: terminal alocado
- Multi-layer: imagens em camadas

Tudo isso o `runc`/`containerd` faz. Mas o núcleo é o que acabamos de fazer.

```cheatsheet
sudo docker create alpine:3.23 | Criar container (sem executar)
sudo docker export <id> | tar -C /tmp/rootfs -x | Extrair rootfs
sudo mount -t overlay overlay -o lowerdir=/tmp/rootfs,upperdir=U,workdir=W /tmp/M | Overlay
sudo cgcreate -g cpu,memory:/demo && echo "50M" > /sys/fs/cgroup/demo/memory.max | Cgroup
sudo cgexec -g cpu,memory:/demo unshare --pid --fork --mount-proc --uts --net --mount --ipc chroot /tmp/M /bin/sh | Container artesanal
```
