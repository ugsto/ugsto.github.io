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
sudo systemd-run --scope -p MemoryMax="50M" -p MemorySwapMax="0" stress --vm 15 --vm-bytes 100M --vm-keep
```

```
Running as unit: run-p109310-i109610.scope; invocation ID: 194c53091ed04393b07d9f1ab1fd4273
stress: info: [109310] dispatching hogs: 0 cpu, 0 io, 15 vm, 0 hdd
stress: FAIL: [109310] (425) <-- worker 109326 got signal 9
stress: WARN: [109310] (427) now reaping child worker processes
stress: FAIL: [109310] (461) failed run completed in 0s
```

Como o processo tentou solicitar mais memória do que lhe era permitido, ele sofre um assassinato diretamente do kernel (OOM)

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

---

Próximo: UnionFS. Como imagens funcionam com camadas.
