## O problema

Namespaces isolam o que um processo vê. Mas e o que ele usa? Se você executa 10 containers no mesmo host e um deles decide alocar 7 GB de RAM, os outros 9 vão pro espaço. Namespace não resolve isso.

Pra limitar recursos, o kernel tem outro mecanismo: cgroups (control groups). Existem desde 2007 (kernel 2.6.24, mesma época dos namespaces) e permitem dizer: "esse grupo de processos só pode usar 50% de CPU e 512 MB de RAM". Se passar, o kernel intervém: throttla CPU ou mata o processo.

## Como cgroups funcionam

Cgroups organizam processos em hierarquia. Cada grupo tem limites de CPU, memória, I/O, PIDs. O kernel expõe tudo como arquivos em `/sys/fs/cgroup/`. Você lê e escreve nesses arquivos pra configurar limites.

Duas versões: cgroup v1 (hierarquia por subsistema) e cgroup v2 (hierarquia unificada). A maioria das distros modernas usa v2, que é o que vamos usar.

Pra ver em qual cgroup seu processo está:

```bash
echo $(</proc/self/cgroup)
```

```text
0::/user.slice/user-1000.slice/user@1000.service/app.slice/hermes-gateway.service
```

O systemd já organiza processos em cgroups automaticamente. Mas a gente quer criar os nossos.

## Mão na massa

Você só precisa do pacote `stress` (gerador de carga) instalado no seu sistema.

No Fedora/RHEL:

```bash
sudo dnf install stress
```

No Ubuntu/Debian:

```bash
sudo apt install stress
```

No NixOS:

```bash
nix-shell -p stress
```

### Criar um cgroup e limitar CPU

Utilizando o `systemd-run`, criamos um escopo temporário e aplicamos o limite de CPU diretamente. Vamos limitar o processo a usar no máximo 50% de um core (CPUQuota=50%):

```bash
systemd-run --user --scope -p CPUQuota="50%" --unit=workshop-cpu \
  stress --cpu 1 --timeout 10 & \
  sleep 1; top -d 0.5 -c -p $(pgrep -d ',' -f stress)
```

```text
Running as unit: run-rc9e3bf7836a34a3ebd3e1071ef7050c9.scope; invocation ID: 9998d5f56c4b4db68f848cc2635a910f
stress: info: [60681] dispatching hogs: 1 cpu, 0 io, 0 vm, 0 hdd
stress: info: [60681] successful run completed in 5s
```

O stress executou por 5 segundos, mas o kernel limitou ele a 50% de um core. Se você executar `top` em outro terminal enquanto o stress roda, vai ver o processo cravado em \~50% de CPU, nunca 100%.

> Note: Se estiver em uma sessão SSH, o `--user` do systemd-run não funciona (sem user bus). Use `sudo systemd-run` sem `--user` como nos exemplos acima.

### Limitar memória

Agora o teste mais dramático: limite de 50 MB, mas o stress tenta alocar 100 MB.

Define o limite de memória:

```bash
sudo systemd-run --scope -p MemoryMax="50M" -p MemorySwapMax="0" stress --vm 1 --vm-bytes 100M --vm-keep
```

```text
Running as unit: run-p109310-i109610.scope; invocation ID: 194c53091ed04393b07d9f1ab1fd4273
stress: info: [109310] dispatching hogs: 0 cpu, 0 io, 15 vm, 0 hdd
stress: FAIL: [109310] (425) <-- worker 109326 got signal 9
stress: WARN: [109310] (427) now reaping child worker processes
stress: FAIL: [109310] (461) failed run completed in 0s
```

O `stress` tentou alocar 100 MB, mas o kernel aplicou o teto de 50 MB. Você pode verificar o consumo real lendo `memory.current` dentro do cgroup (`/sys/fs/cgroup/system.slice/run-*.scope/memory.current`). Se a alocação exceder o limite e o kernel não conseguir liberar páginas, o processo recebe OOM kill.

## Como o Docker usa cgroups

Quando você passa `--memory 128m` no `docker run`, o Docker escreve `134217728` (128 * 1024 * 1024) no arquivo `memory.max` do cgroup do container. Você pode verificar:

```bash
docker run -d --name limited --memory 128m alpine:3.23 sleep infinity
echo $(</sys/fs/cgroup/system.slice/docker-$(docker inspect limited --format '{{.Id}}').scope/memory.max)
```

```text
134217728
```

Mesmo mecanismo. O Docker só escreve no arquivo por você.

---

No próximo capítulo: Union Filesystems. Como imagens Docker funcionam com camadas readonly + copy-on-write.
