## ConfigMaps: configuração desacoplada

- Separam configuração da imagem. Muda a config sem recompilar.
- Dados em texto puro. Chave=valor ou arquivo completo.
- Monta como env vars (`envFrom.configMapRef`) ou volume (`volumes[].configMap`).
- Update de volume é atômico (symlink `..data`). Env vars não atualizam sem restart.

```bash
kubectl create configmap app-config \
  --from-literal=APP_ENV=production \
  --from-literal=LOG_LEVEL=info

kubectl create configmap nginx-config \
  --from-file=nginx.conf

kubectl get configmap app-config -o yaml
```

## ConfigMap como env vars

```bash
kubectl apply -f - <<YAML
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: app
    image: busybox:1.36
    envFrom:
    - configMapRef:
        name: app-config
YAML
```

- `envFrom.configMapRef`: injeta todas as chaves de uma vez.
- `env[].valueFrom.configMapKeyRef`: seleciona chaves específicas.

## ConfigMap como volume

```bash
kubectl apply -f - <<YAML
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: app
    image: busybox:1.36
    volumeMounts:
    - name: config
      mountPath: /etc/config
  volumes:
  - name: config
    configMap:
      name: app-config
YAML
```

- Cada chave vira um arquivo no diretório montado.
- Symlinks atômicos: `..data → ..2026_05_24_.../` com link por chave.
- Update automático pelo kubelet (~60s). Não precisa restart.

## Secrets: dados sensíveis

- Igual a ConfigMap mas com base64 encoding (não criptografia).
- Armazenado em tmpfs (não vai pro disco).
- Só enviado para nós que executam Pods que referenciam o Secret.
- Para criptografia real: etcd encryption at rest, Sealed Secrets, External Secrets Operator.

```bash
kubectl create secret generic db-creds \
  --from-literal=DB_USER=postgres \
  --from-literal=DB_PASS=s3cr3tP@ss!

kubectl get secret db-creds -o yaml
kubectl get secret db-creds -o jsonpath="{.data.DB_USER}" | base64 -d
```

## Secret como env vars

```bash
kubectl apply -f - <<YAML
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: app
    image: busybox:1.36
    envFrom:
    - secretRef:
        name: db-creds
YAML
```

- Kubernetes decodifica o base64 automaticamente ao injetar no container.
- Aplicação lê env var normal: `process.env.DB_PASS`.

## Secret como volume (recomendado)

```bash
kubectl apply -f - <<YAML
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: app
    image: busybox:1.36
    volumeMounts:
    - name: secrets
      mountPath: /etc/secrets
      readOnly: true
  volumes:
  - name: secrets
    secret:
      secretName: db-creds
YAML
```

- Cada chave vira um arquivo. Conteúdo decodificado automaticamente.
- `readOnly: true` é obrigatório para Secrets em volume.
- Mais seguro que env vars: não expõe em `/proc/<pid>/environ`.

## Cheatsheet

```cheatsheet
Criar ConfigMap
kubectl create configmap <nome> --from-literal=KEY=value
kubectl create configmap <nome> --from-file=arquivo.conf
kubectl create configmap <nome> --from-file=key=caminho/arquivo

Criar Secret
kubectl create secret generic <nome> --from-literal=KEY=value
kubectl create secret generic <nome> --from-file=arquivo
kubectl create secret tls <nome> --cert=cert.pem --key=key.pem

Ver conteúdo
kubectl get configmap <nome> -o yaml
kubectl get secret <nome> -o yaml
kubectl get secret <nome> -o jsonpath="{.data.KEY}" | base64 -d

Montar como env vars
envFrom:
- configMapRef:            # todas as chaves do ConfigMap
    name: app-config
- secretRef:               # todas as chaves do Secret
    name: db-creds

Montar como volume
volumes:
- name: config
  configMap:
    name: app-config
volumeMounts:
- name: config
  mountPath: /etc/config

Montar Secret como volume
volumes:
- name: secrets
  secret:
    secretName: db-creds
volumeMounts:
- name: secrets
  mountPath: /etc/secrets
  readOnly: true
```
