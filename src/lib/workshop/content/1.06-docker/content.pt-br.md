## O problema

Você passou os últimos 4 capítulos montando container na mão: `unshare`, `cgexec`, `mount overlay`, `chroot`. Funciona, mas ninguém quer digitar isso pra subir um WordPress.

O Docker apareceu em 2013 pra resolver exatamente isso. Ele não inventou namespaces, cgroups nem overlay. Só empacotou tudo com uma API limpa. Em vez de 5 comandos com sudo, você digita `docker run nginx`.

## O que o Docker faz

Quando você executa `docker run alpine echo ok`, o Docker:

1. Baixa a imagem (se não tiver em cache): layers da imagem Alpine
2. Cria um overlay: lowerdir = layers da imagem, upperdir = container layer vazia
3. Cria namespaces: `unshare --pid --net --mount --uts --ipc --cgroup`
4. Cria cgroups: limites de CPU/RAM que você passou (`--memory`, `--cpus`)
5. Configura rede: cria um par veth (uma ponta no container, outra na bridge `docker0`)
6. Executa o comando: `chroot` no overlay merged e executa o que você pediu

Tudo que a gente fez nos capítulos anteriores, mas automatizado.

## Mão na massa

### Subir um container e inspecionar

```bash
docker run -d --name demo alpine:3.23 sleep infinity
```

```text
080d112e5a06d4d185902a77aea0cd3f3e8847560bc860a269109f08a194d73b
```

Qual o PID real do container no host?

```bash
docker inspect demo --format '{{.State.Pid}}'
```

```text
61566
```

Quais namespaces ele está usando?

```bash
sudo lsns -p $(docker inspect demo --format '{{.State.Pid}}')
```

```text
        NS TYPE   NPROCS   PID USER COMMAND
4026531834 time      125     1 root /sbin/init
4026531837 user      125     1 root /sbin/init
4026532376 mnt         1 61566 root sleep infinity
4026532377 uts         1 61566 root sleep infinity
4026532378 ipc         1 61566 root sleep infinity
4026532379 pid         1 61566 root sleep infinity
4026532380 cgroup      1 61566 root sleep infinity
4026532381 net         1 61566 root sleep infinity
```

5 namespaces isolados (mnt, uts, ipc, pid, net) mais o cgroup. O `sleep infinity` é só mais um processo no host, mas com namespaces próprios. As entradas com PID 1 (time, user) são os namespaces raiz do sistema. Todo processo pertence a eles também.

### Limites de recursos

```bash
docker run -d --name limited --memory 128m --cpus 0.5 alpine:3.23 sleep infinity
```

O Docker converteu `--memory 128m` em cgroup. Confere:

```bash
CID=$(docker inspect limited --format '{{.Id}}')
echo $(< /sys/fs/cgroup/system.slice/docker-${CID}.scope/memory.max)
```

```text
134217728
```

128 × 1024 × 1024 = 134217728 bytes. O Docker escreveu isso no cgroup, igual a gente fez com `echo "50M" > memory.max`.

### Camadas da imagem

```bash
docker image inspect alpine:3.23 --format '{{.RootFS.Layers}}'
```

```text
[sha256:29df493baa13de438d6d2ece3a8333032e0b7b9b9d8cce4ee82194da255f61e1]
```

Cada hash é uma camada. O Docker monta todas como lowerdir do overlay.

### Rede

```bash
docker run -d --name web nginx:alpine
docker inspect web --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
```

```text
172.17.0.5
```

O Docker criou um par veth: uma ponta no container, outra no host. O container tem IP na rede bridge `docker0`.

```cheatsheet
sudo docker run -d --name demo alpine:3.23 sleep infinity | Subir container Alpine
sudo docker inspect demo --format '{{.State.Pid}}' | Ver PID real
sudo lsns -p $(sudo docker inspect demo --format '{{.State.Pid}}') | Ver namespaces
sudo docker run -d --memory 128m --cpus 0.5 alpine:3.23 sleep infinity | Container com limites
sudo docker image inspect alpine:3.23 --format '{{.RootFS.Layers}}' | Ver camadas da imagem
sudo docker inspect demo --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' | Ver IP do container
mount | grep overlay | grep docker | Ver overlays ativos
```

---

No próximo capítulo: Dockerfile. Como criar suas próprias imagens.
