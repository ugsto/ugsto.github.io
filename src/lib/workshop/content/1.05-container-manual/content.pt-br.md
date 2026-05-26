## O problema

Você já viu namespaces (isolam visão), cgroups (limitam recursos) e overlay (sistema de arquivos em camadas). Separados, são mecanismos de kernel. Juntos, são um container.

A gente vai juntar as três peças e criar um container artesanal. Sem Docker, sem containerd, sem runc. Só syscalls e um shell script.

## Receita do container

Um container mínimo é:

1. Rootfs: um diretório com binários. A gente extrai de uma imagem Alpine via `docker export`
2. Overlay: montar o rootfs como lowerdir + upperdir vazio (camada writable)
3. Namespaces: `unshare` com PID, network, mount, UTS, IPC
4. Cgroups: limites de CPU e memória
5. chroot: trocar a raiz do processo pro overlay merged

Opcional mas recomendado: `mount -t proc proc /proc` e `mount -t tmpfs tmpfs /tmp` dentro do container.

## Mão na massa

### Passo 1: Preparar o rootfs

Extrai o rootfs de uma imagem Alpine:

```bash
CID=$(sudo docker create alpine:3.23)
sudo docker export $CID | tar -C /tmp/container-lab -x
sudo docker rm $CID
```

Conferindo:

```bash
ls /tmp/container-lab/bin/
```

```text
arch           ash            base64         bbconfig       busybox
cat            chattr         chgrp          chmod          chown
```

82 binários no total. Isso te dá um sistema de arquivos Alpine completo: binários, bibliotecas, `/etc/`, tudo. São cerca de 7 MB.

### Passo 2: Montar o overlay

```bash
mkdir -p /tmp/container-lab/{upper,work,merged}

sudo mount -t overlay overlay \
  -o lowerdir=/tmp/container-lab,upperdir=/tmp/container-lab/upper,workdir=/tmp/container-lab/work \
  /tmp/container-lab/merged
```

Agora `merged/` contém a união do rootfs Alpine (readonly) com uma camada writable vazia no topo.

Para os comandos cgcreate e cgexec, instale o pacote cgroup-tools:

No Ubuntu/Debian:

```bash
sudo apt install cgroup-tools
```

No Fedora/RHEL:

```bash
sudo dnf install libcgroup-tools
```

### Passo 3: Criar cgroup

```bash
sudo cgcreate -g cpu,memory:/container-demo
echo "50000 100000" | sudo tee /sys/fs/cgroup/container-demo/cpu.max
echo "50M" | sudo tee /sys/fs/cgroup/container-demo/memory.max
```

```text
50000 100000
50M
```

No cgroup v2, os arquivos `cpu.max` e `memory.max` ficam diretamente em `/sys/fs/cgroup/container-demo/`. O `cgcreate` cria o grupo no local correto automaticamente.

50% de um core, 50 MB de RAM.

### Passo 4: Executar o container

```bash
sudo cgexec -g cpu,memory:/container-demo \
  unshare --pid --fork --mount-proc --uts --net --mount --ipc \
  chroot /tmp/container-lab/merged /bin/sh
```

E dentro:

```text
PID: 1
Hostname: container-artesanal
Processos:
PID   USER     TIME  COMMAND
```

O `ps` do BusyBox lista apenas o cabeçalho dentro de um PID namespace com mount de `/proc` incompleto. Para ver os processos, use `ls /proc` ou `echo $(< /proc/1/cmdline)`.

Dentro do container, crie um arquivo para testar o copy-on-write:

```bash
echo criado-dentro > /tmp/teste.txt
```

Fora do container, o arquivo aparece no upper (copy-on-write):

```bash
echo $(< /tmp/container-lab/upper/tmp/teste.txt)
```

```
criado-dentro
```

O rootfs original (lower) permaneceu intocado. Exatamente como Docker funciona.

### Passo 5: Limpar

Dentro do container, saia com `exit`. Depois, fora dele:

```bash
sudo umount /tmp/container-lab/merged
sudo cgdelete -g cpu,memory:/container-demo
sudo rm -rf /tmp/container-lab
```

## O que está faltando?

Esse container é funcional mas mínimo. Comparado com um container Docker real, faltam:

- Rede: interface veth conectando o namespace de rede a uma bridge no host
- PID file: o Docker escreve o PID do container pra poder gerenciar
- TTY: alocar um terminal pro container
- Imagem em camadas: nosso lowerdir é um flat tar export, não múltiplas layers

Ferramentas como `runc` e `containerd` implementam exatamente essas partes. Mas o núcleo (namespaces + cgroups + overlay + chroot) é o que você acabou de fazer na mão.

```cheatsheet
sudo docker create alpine:3.23 | Criar container (sem executar)
sudo docker export <id> | tar -C /tmp/rootfs -x | Extrair rootfs
sudo mount -t overlay overlay -o lowerdir=/tmp/rootfs,upperdir=/tmp/up,workdir=/tmp/wk /tmp/merged | Montar overlay
sudo cgcreate -g cpu,memory:/demo && echo "50M" > /sys/fs/cgroup/demo/memory.max | Criar cgroup
sudo cgexec -g cpu,memory:/demo unshare --pid --fork --mount-proc --uts --net --mount --ipc chroot /tmp/merged /bin/sh | Container artesanal
sudo umount /tmp/merged && sudo cgdelete -g cpu,memory:/demo | Limpar
```

---

No próximo capítulo: Docker. A camada de conveniência. Mesmo que você entenda os mecanismos, o Docker empacota tudo com uma API que não exige `sudo unshare --pid --fork` a cada container.
