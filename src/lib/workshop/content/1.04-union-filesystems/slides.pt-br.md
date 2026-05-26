## O problema

- Namespaces + cgroups + filesystem = container
- OverlayFS: empilha diretórios em camadas, copy-on-write

## Como funciona

- lowerdir: camada(s) readonly (imagem base)
- upperdir: camada writable (container layer)
- workdir: interno do overlay
- merged: união de tudo. O que o container vê

## Mão na massa

### Montar overlay

```bash
mkdir -p /tmp/ov/{lower,upper,work,merged}
echo 'layer 1' > /tmp/ov/lower/file1.txt
echo 'layer 1 shared' > /tmp/ov/lower/shared.txt
echo 'layer 2' > /tmp/ov/upper/file2.txt
echo 'layer 2 modified' > /tmp/ov/upper/shared.txt

sudo mount -t overlay overlay \
  -o lowerdir=/tmp/ov/lower,upperdir=/tmp/ov/upper,workdir=/tmp/ov/work \
  /tmp/ov/merged

ls /tmp/ov/merged/
```

```
file1.txt  file2.txt  shared.txt
```

`shared.txt` mostra a versão do upper. Camada superior tem precedência:

```bash
echo $(< /tmp/ov/merged/shared.txt)
```

```
layer 2 modified
```

### Copy-on-write

```bash
echo 'mod' >> /tmp/ov/merged/file1.txt
```

O lower continua intacto:

```bash
echo $(< /tmp/ov/lower/file1.txt)
```

```
layer 1
```

Mas o merged mostra a modificação:

```bash
echo $(< /tmp/ov/merged/file1.txt)
```

```
layer 1
mod
```

Kernel copiou arquivo do lower pro upper, aplicou modificação lá. Lower readonly = imutável.

### Múltiplas camadas

```bash
mkdir /tmp/ov/lower2
echo 'layer 3' > /tmp/ov/lower2/file3.txt
echo 'layer 3 shared' > /tmp/ov/lower2/shared.txt

sudo mount -t overlay overlay \
  -o lowerdir=/tmp/ov/lower2:/tmp/ov/lower,upperdir=/tmp/ov/upper,workdir=/tmp/ov/work \
  /tmp/ov/merged

echo $(< /tmp/ov/merged/shared.txt)
```

```
layer 3 shared
```

lower2 tem precedência sobre lower. Cada `RUN` no Dockerfile = uma layer. A última layer vence.

## Docker + OverlayFS

```bash
mount | grep overlay
```

```
overlay on /var/lib/docker/overlay2/<id>/merged type overlay
  (lowerdir=<layer1>:<layer2>, upperdir=<id>/diff, workdir=<id>/work)
```

Imagem = múltiplas camadas readonly. Container = upperdir writable no topo. Removeu container → upperdir some, layers da imagem intactas.

```cheatsheet
sudo mount -t overlay overlay -o lowerdir=L,upperdir=U,workdir=W /mnt | Montar overlay
ls /mnt | Ver união
sudo umount /mnt | Desmontar
mount | grep overlay | Ver overlays ativos
docker inspect <id> | jq '.[0].GraphDriver.Data' | Ver camadas overlay de container
```

---

Próximo: juntar namespaces + cgroups + overlay = container artesanal, sem Docker.
