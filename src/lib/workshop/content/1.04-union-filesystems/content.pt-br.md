## O problema

Você já tem namespaces (isolamento de visão) e cgroups (isolamento de recursos). Falta a terceira peça: **filesystem**. Um container precisa de um sistema de arquivos que:

- Seja leve (não 5 GB por container)
- Compartilhe camadas entre containers (10 containers Alpine = 1 cópia do Alpine em disco)
- Permita escrita sem modificar a imagem base (copy-on-write)

A solução do kernel é OverlayFS: um filesystem que empilha diretórios em camadas.

## Como OverlayFS funciona

OverlayFS combina dois (ou mais) diretórios:

- lowerdir: camada(s) readonly. Pode ser múltipla. `lowerdir=layer3:layer2:layer1`. A primeira da lista tem precedência
- upperdir: camada writable. Toda modificação vai pra cá
- workdir: diretório interno de trabalho do overlay (precisa estar vazio)
- merged: ponto de montagem. O resultado final

O processo olha pro `merged` e vê a união de todas as camadas. Se um arquivo existe em duas camadas, a versão da camada mais alta vence.

## Mão na massa

### Criar camadas e montar overlay

A camada base (lower) é readonly. É a "imagem". A camada superior (upper) é writable. É a "container layer".

```bash
mkdir -p /tmp/overlay/{lower,upper,work,merged}

echo 'layer 1' > /tmp/overlay/lower/file1.txt
echo 'layer 1 shared' > /tmp/overlay/lower/shared.txt

echo 'layer 2' > /tmp/overlay/upper/file2.txt
echo 'layer 2 modified' > /tmp/overlay/upper/shared.txt

sudo mount -t overlay overlay \
  -o lowerdir=/tmp/overlay/lower,upperdir=/tmp/overlay/upper,workdir=/tmp/overlay/work \
  /tmp/overlay/merged
```

O que tem no `merged`?

```bash
ls /tmp/overlay/merged/
```

```
file1.txt  file2.txt  shared.txt
```

```bash
echo $(< /tmp/overlay/merged/file1.txt)
```

```
layer 1
```

```bash
echo $(< /tmp/overlay/merged/file2.txt)
```

```
layer 2
```

```bash
echo $(< /tmp/overlay/merged/shared.txt)
```

```
layer 2 modified
```

Três arquivos, combinados das duas camadas. O `shared.txt` mostra a versão do upper. Camada superior tem precedência.

### Copy-on-write

E se você modificar um arquivo que está no lower (readonly)?

```bash
echo 'modificação via merged' >> /tmp/overlay/merged/file1.txt
```

O lower continua intacto. Mas o merged mostra a modificação. O kernel copiou o arquivo pro upper:

```bash
echo $(< /tmp/overlay/lower/file1.txt)
```

```
layer 1
```

```bash
echo $(< /tmp/overlay/merged/file1.txt)
```

```text
layer 1 modificação via merged
```

```bash
echo $(< /tmp/overlay/upper/file1.txt)
```

```text
layer 1 modificação via merged
```

Isso é **copy-on-write**: o kernel não modifica o lower (que é readonly). Em vez disso, copia o arquivo pro upper e aplica a modificação lá. O original fica intacto. Toda imagem Docker funciona assim.

### Criar arquivo novo

```bash
echo 'novo arquivo' > /tmp/overlay/merged/novo.txt
```

O lower não tem esse arquivo. O upper foi quem recebeu:

```bash
ls /tmp/overlay/lower/novo.txt
echo $(< /tmp/overlay/upper/novo.txt)
```

```text
ls: cannot access '/tmp/overlay/lower/novo.txt': No such file or directory
novo arquivo
```

Arquivos novos sempre vão pro upper. O lower permanece imutável.

### Múltiplas camadas

Imagens Docker têm várias camadas (cada `RUN`, `COPY`, `ADD` no Dockerfile gera uma). O overlay suporta isso:

```bash
mkdir /tmp/overlay/lower2
echo 'layer 3' > /tmp/overlay/lower2/file3.txt
echo 'layer 3 shared' > /tmp/overlay/lower2/shared.txt

sudo mount -t overlay overlay \
  -o lowerdir=/tmp/overlay/lower2:/tmp/overlay/lower,upperdir=/tmp/overlay/upper,workdir=/tmp/overlay/work \
  /tmp/overlay/merged

echo $(< /tmp/overlay/merged/shared.txt)
```

```text
layer 2 modified
```

O resultado é `layer 2 modified`; a versão do upperdir, não do lower2. O `upperdir` sempre tem precedência sobre **todos** os lowerdirs. O `lower2` tem precedência sobre `lower` **apenas quando o arquivo não existe no upper**. É assim que funciona: uma layer `RUN apt install` sobrepõe a layer `FROM ubuntu`, mas se você já escreveu no container (upper), sua versão vence.

## Como o Docker usa OverlayFS

Quando você executa `docker run alpine`:

1. Docker baixa a imagem Alpine: cada layer é extraída como um diretório readonly em `/var/lib/docker/overlay2/`
2. Cria dois diretórios vazios: `upper` (writable container layer) e `work`
3. Monta o overlay: `lowerdir=<todas as layers da imagem>,upperdir=<container layer>,workdir=<work>`
4. O container vê o merged como seu root filesystem

Dá pra ver isso direto no host:

```bash
mount | grep overlay
```

```text
overlay on /var/lib/docker/rootfs/overlayfs/fee98d... type overlay (rw,relatime,lowerdir=/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/110/fs:/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/4/fs,upperdir=/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/111/fs,workdir=/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/111/work)
overlay on /tmp/overlay/merged type overlay (rw,relatime,lowerdir=/tmp/overlay/lower2:/tmp/overlay/lower,upperdir=/tmp/overlay/upper,workdir=/tmp/overlay/work)
```

Toda modificação que o container faz (logs, arquivos temporários, `apt install`) vai pro `upperdir`. Quando você remove o container, o `upperdir` é deletado. As layers da imagem permanecem intactas pra reuso.

```cheatsheet
mkdir -p /tmp/ov/{lower,upper,work,merged} | Criar estrutura overlay
sudo mount -t overlay overlay -o lowerdir=/tmp/ov/lower,upperdir=/tmp/ov/upper,workdir=/tmp/ov/work /tmp/ov/merged | Montar overlay
ls /tmp/ov/merged | Ver união das camadas
sudo umount /tmp/ov/merged | Desmontar
mount | grep overlay | Ver overlays ativos no sistema
docker inspect <id> | jq '.[0].GraphDriver.Data' | Ver camadas overlay de um container
```

---

No próximo capítulo: Container manual. Juntar namespaces + cgroups + overlay e criar um container artesanal. Sem Docker, sem containerd, só syscalls.
