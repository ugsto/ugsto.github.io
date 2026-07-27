## O problema

- "Container é uma VM leve." Você já ouviu, eu também, o papagaio também.
- No papel isolam processos, têm filesystem próprio, empacotam aplicação com dependências
- Mas container não é VM. Se fosse, a gente não rodava 200 containers onde cabem 4 VMs

## A diferença

- VM: virtualiza hardware. Hipervisor traduz chamada de hardware entre SO guest e host o tempo todo. Tem kernel, init system, systemd, cron, syslog. O pacote completo.
- Container: virtualiza SO. Compartilha kernel do host. Só namespaces + cgroups isolando processos

Para mostrar na prática, um benchmark sem repetição:

### Hardware

- 2vCPU Intel Xeon (Icelake), 7.8 GB RAM, 38 GB SSD, kernel 6.8.0-106

### VM (KVM, Alpine 3.23, 512 MB)

Antes de executar, baixe a ISO do Alpine e crie o disco:

```bash
curl -LO https://dl-cdn.alpinelinux.org/alpine/v3.23/releases/x86_64/alpine-virt-3.23.4-x86_64.iso
qemu-img create -f qcow2 alpine-test.qcow2 5G
```

Agora a VM:

```bash
time expect << EOF
set timeout 10

spawn qemu-system-x86_64 -enable-kvm -m 512 -smp 1 \
    -cdrom alpine-virt-3.23.4-x86_64.iso \
    -drive file=alpine-test.qcow2,if=virtio \
    -nographic -net none

expect "localhost login:"

send \x01x
expect eof
EOF
```

```text
Welcome to Alpine Linux 3.23
Kernel 6.18.22-0-virt on x86_64 (/dev/ttyS0)

localhost login: QEMU: Terminated

real	0m5,625s
user	0m0,014s
sys	0m0,018s
```

5 segundos até o prompt. Live CD, sem systemd, sem rede. VM com SO instalado leva mais.

### Container (Docker, Alpine 3.23)

```bash
time docker run --rm alpine:3.23 echo ok
```

```text
ok

real    0m0.319s
user    0m0.017s
sys     0m0.016s
```

```bash
time docker run -d --name test alpine:3.23 sleep infinity
```

```text
51cc6a282c41d3d4ba2e3fe3d9a5876e912b488336802914038c45197cecdbc9

real    0m0.201s
user    0m0.008s
sys     0m0.017s
```

0.2 segundos. Sem BIOS, sem kernel, sem init system. Só um processo em namespace isolado.

### RAM

```bash
ps -o pid,rss,comm -p $(pgrep qemu-system)
  PID   RSS COMMAND
 9295 201364 qemu-system-x86

ps -o pid,rss,comm -p $(docker inspect test | jq -r '.[0].State.Pid')
  PID   RSS COMMAND 9347   844 sleep
```

- VM: ~197 MB RSS (512 MB alocados)
- Container: 844 KB
- Diferença: ~240x em RAM, ~85x em boot

## Mão na massa

KVM + Docker instalados. VM e container lado a lado.

### Passo 1: VM com KVM

```bash
time virt-install \
  --name workshop-vm \
  --ram 512 \
  --vcpus 1 \
  --disk size=5 \
  --cdrom alpine-virt-3.23.4-x86_64.iso \
  --noautoconsole
```

### Passo 2: Container equivalente

```bash
time docker run -d --name workshop-container alpine:3.23 sleep infinity
```

### Passo 3: Comparar RAM

RAM do QEMU (processo da VM):

```bash
ps -o pid,rss,comm -p $(pgrep qemu-system)
```

```text
  PID   RSS COMMAND
95116 211792 .qemu-system-x8
```

RAM do container:

```bash
ps -o pid,rss,comm -p $(docker inspect test | jq -r '.[0].State.Pid')
```

```text
  PID   RSS COMMAND
94349   848 sleep
```

Namespaces isolados:

```bash
lsns -t pid | grep $PID
```

O container é só mais um processo na tabela do host. O kernel só isola o que cada namespace enxerga.

## O que container NÃO é

- Container não é mais seguro que VM. Compartilham kernel do host. Um bug no kernel afeta todos. VM isola até o kernel.
- Container não substitui VM pra tudo. Precisa de kernel diferente (Windows no Linux, driver legado)? Ainda é VM.

---

No próximo capítulo: como o kernel implementa isolamento com **namespaces**. Container na mão, sem Docker, dois terminais, chamadas de sistema.
