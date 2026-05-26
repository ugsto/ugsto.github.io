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

```bash
time qemu-system-x86_64 -enable-kvm -m 512 -smp 1 \
    -cdrom alpine-virt-3.23.4-x86_64.iso \
    -drive file=alpine-test.qcow2,if=virtio \
    -nographic -net none

SeaBIOS (version 1.16.3-debian-1.16.3-2)
Booting from DVD/CD...
ISOLINUX 6.04 ...
Welcome to Alpine Linux 3.23
Kernel 6.12.13-0-virt on an x86_64 (/dev/ttyS0)

localhost login:
real    0m17.0s
```

17 segundos até o prompt. Live CD, sem systemd, sem rede. VM com SO instalado leva mais.

### Container (Docker, Alpine 3.23)

```bash
time docker run --rm alpine:3.23 echo ok
ok
real    0m0.310s

time docker run -d --name test alpine:3.23 sleep infinity
real    0m0.195s
```

0.2 segundos. Sem BIOS, sem kernel, sem init system. Só um processo em namespace isolado.

### RAM

```bash
ps -o pid,rss,comm -p $(pgrep qemu-system)
  PID   RSS COMMAND
 9295 201364 qemu-system-x86

ps -o pid,rss,comm -p $(docker inspect test | jq -r '.[0].State.Pid')
  PID   RSS COMMAND
 9347   844 sleep
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

RAM do container:

```bash
PID=$(docker inspect workshop-container | jq -r '.[0].State.Pid')
ps -o pid,rss,comm -p $PID
```

Namespaces isolados:

```bash
lsns -t pid | grep $PID
```

O container é só mais um processo na tabela do host. O kernel só isola o que cada namespace enxerga.

```cheatsheet
curl -LO https://dl-cdn.alpinelinux.org/alpine/v3.23/releases/x86_64/alpine-virt-3.23.4-x86_64.iso | Baixar Alpine (63 MB)
qemu-img create -f qcow2 alpine-test.qcow2 2G | Criar disco da VM
time qemu-system-x86_64 -enable-kvm -m 512 -smp 1 -cdrom alpine-virt-3.23.4-x86_64.iso -drive file=alpine-test.qcow2,if=virtio -nographic -net none | Subir VM com KVM e medir boot
time docker run -d --name workshop-container alpine:3.23 sleep infinity | Subir container Alpine
docker inspect workshop-container | jq '.[0].State.Pid' | Ver PID real do container
ps -o pid,rss,comm -p $PID | Medir RAM do container
lsns -t pid | grep $PID | Listar namespaces do container
```

## O que container NÃO é

- Container não é mais seguro que VM. Compartilham kernel do host. Um bug no kernel afeta todos. VM isola até o kernel.
- Container não substitui VM pra tudo. Precisa de kernel diferente (Windows no Linux, driver legado)? Ainda é VM.

---

No próximo capítulo: como o kernel implementa isolamento com **namespaces**. Container na mão, sem Docker, dois terminais, chamadas de sistema.
