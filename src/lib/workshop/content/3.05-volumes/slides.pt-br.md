## Volumes

Filesystem do container é efêmero. Volume resolve compartilhamento e persistência.

## emptyDir: compartilhar entre containers do mesmo Pod

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

```bash
kubectl exec emptydir-demo -c reader -- cat /shared/data.txt
```

```output
escrito-por-writer
```

- Dois containers enxergam o mesmo diretório
- Morre com o Pod (não sobrevive a delete)
- Sobrevive a restart de container (não de Pod)
- `medium: Memory` monta em tmpfs

## hostPath: montar disco do nó no container

Escreve no nó worker:

```bash
ssh ip-172-31-34-6 'echo "dado-do-disco" | sudo tee /tmp/k8s-demo/demo.txt'
```

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

```bash
kubectl logs hostpath-demo
```

```output
dado-do-disco
```

- Amarra o Pod ao nó (usa `nodeName`)
- Bom para DaemonSets (fluentd, node-exporter)
- Ruim para dados de produção multi-node
- `type`: DirectoryOrCreate, File, Socket, etc.

## PV e PVC: desacoplar provisionamento de consumo

Admin cria PV. Dev cria PVC. Kubernetes faz o binding.

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

```bash
kubectl get pv,pvc
```

```output
NAME                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM
persistentvolume/pv-demo   100Mi      RWO            Retain           Bound    default/pvc-demo

NAME                             STATUS   VOLUME    CAPACITY   ACCESS MODES
persistentvolumeclaim/pvc-demo   Bound    pv-demo   100Mi      RWO
```

Pod usa PVC via `persistentVolumeClaim.claimName`:

```yaml
volumes:
- name: pvc-storage
  persistentVolumeClaim:
    claimName: pvc-demo
```

## Access Modes

| Mode | Significado |
|---|---|
| RWO (ReadWriteOnce) | 1 nó rw |
| ROX (ReadOnlyMany) | N nós ro |
| RWX (ReadWriteMany) | N nós rw (NFS, Ceph) |
| RWOP (ReadWriteOncePod) | 1 Pod rw (K8s 1.22+) |

## Reclaim Policy

| Policy | Comportamento |
|---|---|
| Retain | PV fica Released, admin limpa |
| Delete | PV e storage deletados |

## StorageClass: provisionamento dinâmico

Admin define classe. Dev referencia no PVC. PV é criado automaticamente.

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp3
reclaimPolicy: Delete
```

## Cheatsheet

```cheatsheet
Listar PVs e PVCs
kubectl get pv,pvc

Ver detalhes de um PV
kubectl describe pv <nome>

Ver detalhes de um PVC
kubectl describe pvc <nome> -n <namespace>

Criar PVC com StorageClass específica
kubectl apply -f pvc.yaml

Listar StorageClasses
kubectl get storageclass

Ver reclaim policy de um PV
kubectl get pv <nome> -o jsonpath='{.spec.persistentVolumeReclaimPolicy}'
```
