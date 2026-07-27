+++
date = 2026-01-01
title = "Linux Namespaces: o isolamento que faz containers funcionarem"
weight = 102
path = "3"
[extra]
part = 1
section = 2
read_time_minutes = 8
hands_on_minutes = 15
+++



## O problema

No capítulo anterior a gente viu que container sobe em 0.4 segundos enquanto VM leva 17. A pergunta natural é: como o kernel faz isso?

A resposta está num mecanismo de 2008 chamado namespaces. Antes do Docker, antes do LXC. O kernel Linux já sabia isolar processos. O Docker só empacotou.

## Cada aba do navegador é um namespace

Abre três abas no Chrome. Cada uma é um processo separado. Se uma trava, as outras continuam. Como?

O Chrome usa PID namespaces. Cada aba acha que é a única executando. Vê PID 1 como ela mesma. O kernel mente pra cada aba dizendo "você é o único processo no sistema".

É exatamente isso que um container faz. Um namespace é uma mentira que o kernel conta pra um processo sobre o que existe no sistema.

O kernel tem 8 tipos de namespace. Os 5 que importam pra container:

- PID: controla quais processos são visíveis. Dentro do namespace, seu processo é PID 1, mesmo sendo PID 8765 no host
- Network: isola interfaces de rede. Dentro, só loopback. Fora, eth0, wlan0, docker0
- Mount: controla filesystems montados. O container vê a imagem overlay como `/`, não o disco do host
- UTS: isola hostname e domain name. Cada container pode chamar como quiser
- IPC: isola System V IPC e POSIX message queues

## Mão na massa

Você vai criar namespaces com `unshare`. Precisa de root (sudo). Sem Docker, sem container. Só o kernel.

### 1. PID namespace: "eu sou o processo 1"

```bash
sudo unshare --pid --fork --mount-proc /bin/sh -c 'echo $$; ps; :'
```

```
1
    PID TTY          TIME CMD
      1 ?        00:00:00 sh
      2 ?        00:00:00 ps
```

Dentro do namespace, o shell é PID 1. Só existem 2 processos: o shell e o `ps`. Fora, o sistema tem centenas. O kernel simplesmente escondeu o resto.

O `--mount-proc` é essencial: sem ele, `/proc` ainda mostra os processos do host. Com ele, o kernel monta um `/proc` que só expõe os processos do namespace.

### 2. Network namespace: "não tem rede aqui"

```bash
sudo unshare --net /bin/sh -c "ip link show"
```

```
1: lo: <LOOPBACK> mtu 65536 qdisc noop state DOWN mode DEFAULT group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
```

Apenas loopback. Sem eth0, wlan0, ou docker0. É como se a máquina não tivesse placa de rede. Pra conectar esse namespace ao mundo externo, você cria um par veth (uma ponta no namespace, outra no host). Docker faz isso automaticamente.

### 3. UTS namespace: "meu nome é outro"

```bash
sudo unshare --uts /bin/sh -c "hostname isolated-box; hostname"
```

```
isolated-box
```

O hostname mudou só dentro do namespace. Fora, continua o original. Parece simples, mas isso é o que permite dois containers terem hostnames diferentes no mesmo host.

### 4. Tudo junto

Agora junta todos os namespaces que um container usa:

```bash
sudo unshare --pid --fork --mount-proc --uts --net --mount --ipc /bin/sh -c '
echo "PID: $$"
hostname container-primitivo
echo "Hostname: $(hostname)"
echo "Interfaces:
$(ip link show)"
echo "Processos: $(ps aux | wc -l)"
'
```

```
PID: 1
Hostname: container-primitivo
Interfaces:
1: lo: <LOOPBACK> mtu 65536 qdisc noop state DOWN mode DEFAULT group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
Processos: 5
```

Isso é um container primitivo. PID 1, hostname isolado, rede vazia, filesystem montado independente. Adiciona um overlay (capítulo 1.04) e limites de recurso (1.03) e você tem o que o Docker chama de container.

A diferença entre esse `unshare` e um `docker run` é que o Docker cria um cgroup, monta um overlay, configura um par veth pra rede e gerencia o ciclo de vida. Mas o mecanismo de isolamento é exatamente o mesmo.

## Como o Docker usa namespaces

Sobe um container e olha os namespaces dele:

```bash
docker run -d --name demo alpine:3.23 sleep infinity
sudo lsns -p $(docker inspect demo --format '{{.State.Pid}}')
```

```text
        NS TYPE   NPROCS   PID USER COMMAND
4026531834 time      124     1 root /sbin/init
4026531837 user      124     1 root /sbin/init
4026532376 mnt         1 60350 root sleep infinity
4026532377 uts         1 60350 root sleep infinity
4026532378 ipc         1 60350 root sleep infinity
4026532379 pid         1 60350 root sleep infinity
4026532380 cgroup      1 60350 root sleep infinity
4026532381 net         1 60350 root sleep infinity
```

O Docker criou 5 namespaces separados pra esse container. Cada um com um inode diferente do host. Isso significa que o `sleep` está completamente isolado: não vê outros processos, não vê a rede do host, não vê o filesystem do host, tem o próprio hostname.

Se você der `lsns` sem filtrar por PID, vai ver centenas de namespaces. Um pra cada container, mais os do systemd, mais os do snap, mais os do Chrome. Toda tecnologia de isolamento no Linux moderno usa namespaces.

## Por que isso importa

Cada namespace é uma mentira! Mentira pequena: "você é o único que vê essa interface de rede". Mentira média: "você é o processo 1". Mentira grande: "você está sozinho no sistema".

Junta 5 ou 6 mentiras e você convenceu um processo de que ele é a única coisa executando numa máquina que não existe. Isso é container.

---

No próximo capítulo: cgroups. Como limitar CPU e memória. Namespaces isolam o que o processo **vê**, cgroups limitam o que ele **usa**.
