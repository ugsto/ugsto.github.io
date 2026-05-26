## Cada aba do navegador é um namespace

- Chrome isola abas com PID namespaces. Se uma trava, as outras continuam.
- Namespace = mentira que o kernel conta pro processo sobre o que existe
- 8 tipos no kernel. 5 essenciais pra container: PID, net, mount, UTS, IPC

## Mão na massa: unshare

### 1. PID: "eu sou o processo 1"

```bash
sudo unshare --pid --fork --mount-proc /bin/sh -c 'echo $$; ps; :'
```

```
1
    PID TTY          TIME CMD
      1 ?        00:00:00 sh
      2 ?        00:00:00 ps
```

Só 2 processos. Lá fora tem centenas. O kernel escondeu o resto.

### 2. Network: "não tem rede aqui"

```bash
sudo unshare --net /bin/sh -c "ip link show"
1: lo: <LOOPBACK> mtu 65536 qdisc noop state DOWN mode DEFAULT group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
```

Só loopback. Sem eth0 ou wifi. Container nasce sem rede. Docker adiciona com veth pair.

### 3. UTS: "meu nome é outro"

```bash
sudo unshare --uts /bin/sh -c "hostname isolated-box; hostname"
isolated-box
```

Hostname isolado. Fora, continua o original.

### 4. Tudo junto

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

Isso é um container primitivo. Adiciona overlay + cgroups = Docker.

## Docker usa a mesma coisa

```bash
docker run -d --name demo alpine:3.23 sleep infinity
sudo lsns -p $(docker inspect demo --format '{{.State.Pid}}')
```

```
        NS TYPE   NPROCS    PID USER COMMAND
4026531834 time      388      1 root /run/current-system/systemd/lib/systemd/systemd
4026531837 user      299      1 root /run/current-system/systemd/lib/systemd/systemd
4026538551 mnt         1 869941 root sleep infinity
4026538552 uts         1 869941 root sleep infinity
4026538553 ipc         1 869941 root sleep infinity
4026538554 pid         1 869941 root sleep infinity
4026538555 cgroup      1 869941 root sleep infinity
4026538556 net         1 869941 root sleep infinity
```

5 namespaces isolados. Container = processo com mentiras do kernel.

```cheatsheet
sudo unshare --pid --fork --mount-proc /bin/sh -c 'echo $$; ps; :' | PID namespace: ver PID 1
sudo unshare --net /bin/sh -c "ip link show" | Network: só loopback
sudo unshare --uts /bin/sh -c "hostname X; hostname" | UTS: hostname isolado
sudo unshare --pid --fork --mount-proc --uts --net --mount --ipc /bin/sh | Todos juntos = container primitivo
docker run -d --name demo alpine:3.23 sleep infinity | Container de teste
sudo lsns -p $(docker inspect demo --format '{{.State.Pid}}') | Namespaces do container
```

---

Próximo: cgroups. Namespaces isolam o que o processo **vê**, cgroups limitam o que ele **usa**.
