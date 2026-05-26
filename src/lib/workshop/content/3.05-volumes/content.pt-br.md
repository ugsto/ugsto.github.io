## Volumes: compartilhando dados entre containers e persistindo além do Pod

Cada container tem seu próprio filesystem. Mas esse filesystem é efêmero: quando o container morre, os dados somem. Se você precisa compartilhar dados entre containers do mesmo Pod, ou persistir dados que sobrevivam ao ciclo de vida do Pod, você precisa de volumes.

O Kubernetes oferece vários tipos de volume. Neste capítulo vamos ver três casos práticos: emptyDir para compartilhar entre containers do mesmo Pod, hostPath para acessar o disco do nó, e PV/PVC para desacoplar o provisionamento de storage do consumo.

## emptyDir: compartilhando dados entre containers

O tipo mais simples é emptyDir. Ele cria um diretório vazio no nó e monta em todos os containers do Pod que declararem o volume. O diretório existe enquanto o Pod existir. Se o Pod for removido, o emptyDir é deletado.

Vamos criar um Pod com dois containers: um writer que escreve um arquivo e um reader que lê:

```bash
kubectl apply -f - <<YAML
apiVersion: v1
kind: Pod
metadata:
  name: emptydir-demo
spec:
  containers:
  - name: writer
    image: busybox:1.36
    command: ["sh", "-c", "echo escrito-por-writer > /shared/data.txt && sleep 3600"]
    volumeMounts:
    - name: shared-data
      mountPath: /shared
  - name: reader
    image: busybox:1.36
    command: ["sh", "-c", "sleep 3600"]
    volumeMounts:
    - name: shared-data
      mountPath: /shared
  volumes:
  - name: shared-data
    emptyDir: {}
YAML
```

```output
pod/emptydir-demo created
```

Agora verificamos que o reader consegue ler o arquivo que o writer criou:

```bash
kubectl exec emptydir-demo -c reader -- cat /shared/data.txt
```

```output
escrito-por-writer
```

O writer também vê o mesmo arquivo (óbvio, já que ele escreveu):

```bash
kubectl exec emptydir-demo -c writer -- cat /shared/data.txt
```

```output
escrito-por-writer
```

O ponto importante: dois containers independentes, cada um com seu próprio filesystem, compartilham um mesmo diretório via emptyDir. Isso é útil para sidecars que processam logs, proxies que leem arquivos de configuração gerados por outro container, ou pipelines onde um container gera e outro consome.

Características do emptyDir:
- O storage é efêmero: se o Pod é deletado, os dados somem.
- Se um container morre e é reiniciado, os dados continuam lá (o volume sobrevive ao restart do container, mas não ao restart do Pod).
- O emptyDir é criado no disco do nó (ou em tmpfs se você usar `medium: Memory`).

## hostPath: acessando o disco do nó

hostPath monta um diretório ou arquivo do filesystem do nó diretamente no container. É como um bind mount do Docker. Útil para casos específicos como acessar logs do sistema, sockets do Docker, ou diretórios de dados locais.

Importante: hostPath amarra o Pod ao nó. Se o Pod for reagendado em outro nó, ele não vai encontrar os mesmos dados.

Vamos criar um diretório no nó worker e um Pod que lê esse diretório:

No nó worker, criamos o arquivo no disco:

```bash
ssh ip-172-31-34-6 'echo "dado-direto-do-disco-do-worker" | sudo tee /tmp/k8s-demo/demo.txt'
```

```output
dado-direto-do-disco-do-worker
```

Agora criamos um Pod com `nodeName` fixo no worker e volume hostPath apontando para `/tmp/k8s-demo`:

```bash
kubectl apply -f - <<YAML
apiVersion: v1
kind: Pod
metadata:
  name: hostpath-demo
spec:
  nodeName: ip-172-31-34-6
  containers:
  - name: busybox
    image: busybox:1.36
    command: ["sh", "-c", "cat /host-data/demo.txt && sleep 3600"]
    volumeMounts:
    - name: host-volume
      mountPath: /host-data
  volumes:
  - name: host-volume
    hostPath:
      path: /tmp/k8s-demo
      type: DirectoryOrCreate
YAML
```

```output
pod/hostpath-demo created
```

Verificamos que o Pod consegue ler o arquivo do disco do nó:

```bash
kubectl logs hostpath-demo
```

```output
dado-direto-do-disco-do-worker
```

O container leu o arquivo que existe no disco físico do nó worker. O `type: DirectoryOrCreate` garante que o diretório será criado se não existir.

Quando usar hostPath:
- DaemonSets que precisam acessar logs do nó (como fluentd lendo `/var/log/containers`)
- Acesso a sockets Unix do nó (`/var/run/docker.sock`)
- Ambientes de teste ou single-node onde você não tem storage externo

Quando não usar:
- Pods que podem ser reagendados em outro nó
- Dados que precisam de alta disponibilidade
- Produção com múltiplos nós (use PV/PVC com storage provisionado)

## PV e PVC: desacoplando provisionamento de consumo

emptyDir e hostPath resolvem casos simples. Mas em produção você quer desacoplar quem provisiona storage (admin do cluster) de quem consome storage (desenvolvedor que sobe a aplicação). O Kubernetes faz isso com PersistentVolume (PV) e PersistentVolumeClaim (PVC).

O fluxo é:
1. O admin cria um PV (um pedaço de storage disponível no cluster).
2. O dev cria um PVC (um pedido de storage: "quero 50 MiB com acesso ReadWriteOnce").
3. O Kubernetes faz o binding: encontra um PV que atenda os requisitos do PVC e os liga.
4. O Pod referencia o PVC no campo `volumes`.

Vamos criar um PV com hostPath (simulando storage local) e um PVC que consome parte dele:

```bash
kubectl apply -f - <<YAML
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-demo
spec:
  capacity:
    storage: 100Mi
  accessModes:
  - ReadWriteOnce
  hostPath:
    path: /tmp/pv-demo
  persistentVolumeReclaimPolicy: Retain
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-demo
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 50Mi
YAML
```

```output
persistentvolume/pv-demo created
persistentvolumeclaim/pvc-demo created
```

Conferimos o status do PV e PVC:

```bash
kubectl get pv,pvc
```

```output
NAME                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM              STORAGECLASS   VOLUMEATTRIBUTESCLASS   REASON   AGE
persistentvolume/pv-demo   100Mi      RWO            Retain           Bound    default/pvc-demo                  <unset>                          6s

NAME                             STATUS   VOLUME    CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
persistentvolumeclaim/pvc-demo   Bound    pv-demo   100Mi      RWO                           <unset>                 6s
```

O PV está `Bound` ao PVC. O PVC está `Bound` ao PV. O PVC pediu 50 MiB mas o PV tem 100 MiB. O Kubernetes fez o binding porque o PV é o menor PV disponível que atende o request.

Agora criamos um Pod que usa o PVC:

```bash
kubectl apply -f - <<YAML
apiVersion: v1
kind: Pod
metadata:
  name: pvc-demo-pod
spec:
  containers:
  - name: busybox
    image: busybox:1.36
    command: ["sh", "-c", "echo persistido-via-pvc > /data/persist.txt && cat /data/persist.txt && sleep 3600"]
    volumeMounts:
    - name: pvc-storage
      mountPath: /data
  volumes:
  - name: pvc-storage
    persistentVolumeClaim:
      claimName: pvc-demo
YAML
```

```output
pod/pvc-demo-pod created
```

Verificamos que o Pod escreve e lê no volume:

```bash
kubectl logs pvc-demo-pod
```

```output
persistido-via-pvc
```

## Access Modes e Reclaim Policy

Access modes definem como o volume pode ser montado:

- `ReadWriteOnce` (RWO): um único nó pode montar como leitura/escrita.
- `ReadOnlyMany` (ROX): múltiplos nós podem montar como somente leitura.
- `ReadWriteMany` (RWX): múltiplos nós podem montar como leitura/escrita (depende do storage backend, ex: NFS, CephFS).
- `ReadWriteOncePod` (RWOP): um único Pod pode montar como leitura/escrita (Kubernetes 1.22+).

A reclaim policy define o que acontece com o PV quando o PVC é deletado:

- `Retain`: o PV fica em estado `Released`. O admin precisa limpar manualmente.
- `Delete`: o PV e o storage associado são deletados automaticamente (depende do provisioner).
- `Recycle`: deprecated. Fazia `rm -rf` no volume (não seguro, removido em versões recentes).

## StorageClasses: provisionamento dinâmico

Criar PV manualmente não escala. Em produção você usa StorageClasses: o admin define classes de storage (ex: "ssd", "hdd", "nfs") e quando o dev cria um PVC com uma StorageClass, o cluster automaticamente provisiona o PV.

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp3
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
```

Com isso, o PVC só precisa referenciar `storageClassName: fast-ssd` e o PV é criado automaticamente pelo provisioner.

## Resumo do capítulo

- Volumes existem porque o filesystem do container é efêmero. Dados precisam sobreviver a restarts e ser compartilhados entre containers.
- emptyDir: diretório efêmero compartilhado entre containers do mesmo Pod. Morre com o Pod.
- hostPath: monta um diretório do nó no container. Amarra o Pod ao nó. Não use para dados de produção multi-node.
- PV: pedaço de storage provisionado pelo admin. PVC: pedido de storage feito pelo dev. Kubernetes faz o binding automático.
- `kubectl get pv,pvc` mostra o status do binding. STATUS `Bound` significa que deu match.
- Access modes: RWO (single node rw), ROX (multi node ro), RWX (multi node rw).
- Reclaim policy: Retain (manual cleanup), Delete (automático).
- StorageClasses permitem provisionamento dinâmico: o PVC dispara a criação automática do PV.

No próximo capítulo: namespaces e RBAC. Como isolar ambientes e controlar quem pode fazer o quê no cluster.
