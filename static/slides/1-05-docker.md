## O que o Docker faz

`docker run alpine echo ok` executa 6 passos:

1. Baixa imagem (layers)
2. Overlay: lowerdir=layers, upperdir=vazio
3. Namespaces: unshare PID+net+mount+UTS+IPC
4. Cgroups: limites de CPU/RAM
5. Rede: veth pair + bridge docker0
6. chroot + executa comando

Tudo que fizemos na mão, mas automatizado.

## Inspecionar

```bash
docker run -d --name demo alpine:3.23 sleep infinity
```

```bash
docker inspect demo --format '{{.State.Pid}}'
```

```
39255
```

```bash
sudo lsns -p 39255
```

```
        NS TYPE   NPROCS   PID USER COMMAND
4026531834 time      127     1 root /usr/lib/systemd/systemd
4026532276 mnt         1 39255 root sleep infinity
4026532277 uts         1 39255 root sleep infinity
4026532278 ipc         1 39255 root sleep infinity
4026532279 pid         1 39255 root sleep infinity
4026532280 cgroup      1 39255 root sleep infinity
4026532281 net         1 39255 root sleep infinity
```

Container = processo normal com namespaces próprios.

## Limites viram cgroups

```bash
docker run -d --memory 128m --cpus 0.5 alpine sleep infinity
echo $(< /sys/fs/cgroup/system.slice/docker-$(docker inspect limited --format '{{.Id}}').scope/memory.max)
```

```
134217728
```

128 MB → o Docker escreveu no cgroup.

## Camadas

```bash
docker image inspect alpine:3.23 --format '{{.RootFS.Layers}}'
```

```
[sha256:da2ec29bfb526f209062de392fba5357c4e614cbbaa14b84aa229876b64c60b0]
```

Cada hash = uma camada overlay.

## Rede

```bash
docker inspect demo --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
```

```
172.17.0.2
```

Veth pair: host ↔ container.
