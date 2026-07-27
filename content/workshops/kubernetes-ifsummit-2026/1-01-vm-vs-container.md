+++
date = 2026-01-01
title = "VM vs Container: por que containers não são 'VMs leves'"
weight = 101
path = "2"
[extra]
part = 1
section = 1
read_time_minutes = 5
hands_on_minutes = 10
+++



## O problema

Você já ouviu, eu também, o papagaio de estimação do time de DevOps também: "container é uma VM leve". E faz sentido, né? No papel, os dois isolam processos, os dois têm filesystem próprio, os dois permitem empacotar uma aplicação com suas dependências.

São tão parecidos que o Docker chegou a usar o mesmo formato de linha de comando do VirtualBox nos primeiros betas.

Mas container não é VM. Se fosse, a gente não conseguiria executar 200 containers numa máquina na qual cabem 4 VMs.

## A diferença

Uma VM virtualiza desde o hardware. Ou seja, você pega um pedaço de CPU, RAM e disco, instala um sistema operacional inteiro dentro: kernel, init system, systemd, cron, syslog e todo o resto; e executa sua aplicação lá. O hypervisor (KVM, VMware, VirtualBox) fica traduzindo cada chamada de hardware entre o SO convidado e o hardware real o tempo todo. Da pra perceber o custo disso eu suponho.

Já um container virtualiza "só" o sistema operacional. Todos os containers compartilham o mesmo kernel do host. Cada um "acha" que está sozinho no sistema, mas no final é só o kernel isolando processos com namespaces e limitando recursos com cgroups.

Para mostrar a diferença na prática executei um mini-benchmark sem repetição:

### Hardware da máquina de teste

* 2vCPU Intel Xeon (Icelake)
* 7.8 GB de RAM
* 38GB SSD
* Kernel Linux 6.8.0-117-generic

### Boot de VM (KVM, Alpine Linux 3.23, 512 MB RAM alocados)

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

5 segundos até o prompt de login. E isso no modo live CD, ou seja, sem systemd, rede, nem nada mais. Uma VM com SO instalado tem uma latência ainda maior.

### Boot de container (Docker, Alpine Linux 3.23)

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

0.2 segundos. O container não tem BIOS, não tem kernel pra iniciar, não tem hardware pra detectar, não tem init system. É um processo executando em um namespace isolado e só.

### RAM consumida

```bash
ps -o pid,rss,comm -p $(pgrep qemu-system)
```

```text
  PID   RSS COMMAND
95116 211792 .qemu-system-x8
```

```bash
ps -o pid,rss,comm -p $(docker inspect test | jq -r '.[0].State.Pid')
```

```text
  PID   RSS COMMAND
94349   848 sleep
```

A VM reserva 512 MB (o QEMU reporta \~197 MB porque a VM ainda não tocou em toda RAM alocada). O container ocupa 768 KB. Apesar da "conta de padaria", a diferença é de \~262x em RAM e \~46x em tempo de boot.

## O que acontece no kernel quando você sobe um container

Quando você executa `docker run alpine sleep infinity`, o kernel Linux cria:

1. Um conjunto novo de namespaces (PID, network, mount, UTS, IPC, cgroup)
2. Um cgroup pra limitar CPU e memória
3. Uma camada de filesystem (overlay) pra imagem do Alpine

É importante mencionar que nada disso é "Docker". São apenas funcionalidades nativas do kernel Linux desde 2008. Antes do Docker e do LXC existir. O Docker só empacotou isso com uma API que deixa tudo muito mais fácil de usar.

## Mão na massa

Você precisa de KVM e Docker instalados. Vamos criar uma VM e um container lado a lado na sua máquina e medir a diferença.

A demonstração com VM usa `virt-install`. Se quiser reproduzi-la, além dos pacotes abaixo, você precisa da ISO do Alpine (o download está na seção de demonstração acima):

No Ubuntu/Debian:
```bash
sudo apt install virtinst qemu-kvm
```

No Fedora/RHEL:
```bash
sudo dnf install virt-install qemu-kvm
```

O passo da VM é opcional; o importante é o container. Se preferir, pule para o Passo 2.

### Passo 1: Subir uma VM com KVM

```bash
time virt-install \
  --name workshop-vm \
  --ram 512 \
  --vcpus 1 \
  --disk size=5 \
  --cdrom alpine-virt-3.23.4-x86_64.iso \
  --noautoconsole
```

### Passo 2: Subir um container equivalente

```bash
time docker run -d --name workshop-container alpine:3.23 sleep infinity
```

### Passo 3: Comparar a RAM

RAM do QEMU (processo da VM):

```bash
ps -o pid,rss,comm -p $(pgrep qemu-system)
```

RAM do container:

```bash
PID=$(docker inspect workshop-container | jq -r '.[0].State.Pid')
ps -o pid,rss,comm -p $PID
```

```text
  PID   RSS COMMAND
59811   768 sleep
```

Namespaces isolados:

```bash
lsns -p $PID
```

```text
        NS TYPE   NPROCS   PID USER COMMAND
4026531834 time      122     1 root /sbin/init
4026531837 user      122     1 root /sbin/init
4026532376 mnt         1 59811 root sleep infinity
4026532377 uts         1 59811 root sleep infinity
4026532378 ipc         1 59811 root sleep infinity
4026532379 pid         1 59811 root sleep infinity
4026532380 cgroup      1 59811 root sleep infinity
4026532381 net         1 59811 root sleep infinity
```

Repare: o container aparece como um processo normal na tabela de processos do host. Como não tem kernel separado, ele é só mais um processo dentre tantos, mas que ocorre de estar sendo "mentido" para, já que o kernel controla todas as informações que vão para cada pedaço do sistema.

## O que isso significa na prática

* Na máquina de teste (7.8 GB de RAM), cabem (considerando apenas a RAM consumida em "blank slate") ~40 VMs de 512 MB (197MB) e mais de 9000 containeres (768 KB). Na prática, você bate em outros limites antes disso (PID, inodes, file descriptors), mas o ponto aqui é mostrar que tem uma diferença muito grande na escala das duas tecnologias.

* Subir um container é ordem de milissegundos. Subir uma VM é ordem de minutos. Isso pode não parecer grande coisa, mas num cluster Kubernetes com centenas de pods reiniciando o tempo todo, a diferença é importante.

* A imagem do container é uma camada readonly. Pra mudar algo, você gera uma imagem nova. Ou seja, isso força práticas de deploy mais seguras.

* Em ambos os casos, a imagem executa igual no seu computador, no servidor e no Kubernetes. O kernel do host pode ser diferente, mas o userspace é idêntico. Fim do "na minha máquina funciona".

## O que container NÃO é

Containers **não são** mais seguros que VMs. Eles compartilham o kernel do host. Um bug no kernel afeta todos os containers. Uma VM isola até o kernel, um bug no kernel do guest não afeta o host nem outras VMs (exceto em cenários de jailbreak). Se segurança por isolamento é requisito, você ainda precisa de VM, não de container.

Containers **não substituem** VMs para todos os casos. Se você precisa de um kernel diferente (Windows num host Linux, ou uma versão específica do kernel pra um driver legado) você ainda precisa de VM. Container não faz milagre.

---

No próximo capítulo, a gente vai abrir a caixa preta: como o kernel Linux implementa esse isolamento com **namespaces**. Você vai criar um container na mão, sem Docker, usando dois terminais e chamadas de sistema. É mais simples do que parece.
