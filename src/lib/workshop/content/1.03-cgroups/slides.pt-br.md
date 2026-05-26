## O problema

Namespaces isolam o que o processo **vê**. Cgroups limitam o que ele **usa**.

Sem cgroups, um container monopoliza CPU/RAM e mata os outros.

## Como funciona

Hierarquia de grupos exposta como arquivos em `/sys/fs/cgroup/`. Lê e escreve nesses arquivos pra configurar. cgroup v2 (unificado) na maioria das distros.

## Mão na massa

Só precisa do `stress` instalado (`dnf install stress` / `apt install stress`).

### Limitar CPU com systemd-run

```bash
systemd-run --user --scope -p CPUQuota="50%" --unit=workshop-cpu \
  stress --cpu 1 --timeout 10 & \
  sleep 1; top -d 0.5 -c -p $(pgrep -d ',' -f stress)
```

50% de um core. `top` confirma cravado em ~50%, nunca 100%.

### Limitar memória

```bash
systemd-run --user --scope -p MemoryMax="50M" --unit=workshop-mem \
  stress --vm 1 --vm-bytes 100M --timeout 15 & \
  watch -n 0.2 "echo \$(< \"/sys/fs/cgroup/user.slice/user-$(id -u).slice/user@$(id -u).service/app.slice/workshop-mem.scope/memory.current\")"
```

```
52428800
```

Stress toppando no limite de 50M. Uma aplicação sem tratamento de OOM morreria aqui.

### Docker usa o mesmo mecanismo

```bash
docker run -d --name limited --memory 128m alpine:3.23 sleep infinity
CID=$(docker inspect limited --format '{{.Id}}')
echo $(< /sys/fs/cgroup/system.slice/docker-${CID}.scope/memory.max)
```

```
134217728
```

128 × 1024 × 1024. Docker só escreve no arquivo por você.

```cheatsheet
systemd-run --user --scope -p CPUQuota="50%" stress --cpu 1 | CPU 50%
systemd-run --user --scope -p MemoryMax="50M" stress --vm 1 --vm-bytes 100M | RAM 50 MB
echo $(< /sys/fs/cgroup/.../memory.current) | Memória atual do cgroup
echo $(< /sys/fs/cgroup/.../memory.events) | Eventos OOM
```

---

Próximo: UnionFS. Como imagens funcionam com camadas.
