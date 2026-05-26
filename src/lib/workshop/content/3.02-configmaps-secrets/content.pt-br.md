## ConfigMaps e Secrets: configurando aplicações sem recompilar

Aplicação em produção precisa de configuração. URL do banco, nível de log, credenciais. Se você bota isso no código, precisa recompilar a imagem a cada mudança. Se bota no Dockerfile, vaza no layer de build. A solução no Kubernetes é desacoplar: aplicação no container, configuração no cluster.

ConfigMaps para dados não sensíveis. Secrets para senhas, tokens, certificados. Ambos viram env vars ou arquivos montados no Pod.

## ConfigMaps: criando a partir de literais

A forma mais rápida é passar chave=valor direto no comando:

```bash
kubectl create configmap app-config \
  --from-literal=APP_ENV=production \
  --from-literal=LOG_LEVEL=info \
  --from-literal=DB_HOST=postgres.default.svc
```

```yaml
apiVersion: v1
data:
  APP_ENV: production
  DB_HOST: postgres.default.svc
  LOG_LEVEL: info
kind: ConfigMap
metadata:
  name: app-config
```

```bash
kubectl get configmap app-config
```

```
NAME         DATA   AGE
app-config   3      5m4s
```

Para ver o conteúdo completo:

```bash
kubectl get configmap app-config -o yaml
```

```yaml
apiVersion: v1
data:
  APP_ENV: production
  DB_HOST: postgres.default.svc
  LOG_LEVEL: info
kind: ConfigMap
metadata:
  creationTimestamp: "2026-05-24T23:52:13Z"
  name: app-config
  namespace: default
  resourceVersion: "13324"
  uid: 8f4ef739-b191-4832-86d4-f58c28578cb6
```

Três chaves no `data`. Simples, sem segredo.

## ConfigMap a partir de arquivo

Dá para criar um ConfigMap com o conteúdo de um arquivo. Útil para arquivos de configuração tipo nginx.conf, php.ini, prometheus.yml.

Cria o arquivo e sobe como ConfigMap:

```bash
kubectl create configmap nginx-config --from-file=nginx.conf
```

```yaml
apiVersion: v1
data:
  nginx.conf: |
    server { listen 80; server_name example.com; }
kind: ConfigMap
metadata:
  name: nginx-config
```

O nome do arquivo vira a chave. O conteúdo vira o valor. O `|` no YAML indica bloco de texto literal.

Para criar a partir de um diretório inteiro, use `--from-file=./configs/`. Cada arquivo vira uma chave.

## Montando ConfigMap como env vars

O caso mais comum: injetar valores de ConfigMap como variáveis de ambiente no container.

```bash
kubectl apply -f - <<YAML
apiVersion: v1
kind: Pod
metadata:
  name: cm-env-demo
spec:
  containers:
  - name: busybox
    image: busybox:1.36
    command: ["sleep", "3600"]
    envFrom:
    - configMapRef:
        name: app-config
YAML
```

O `envFrom` com `configMapRef` injeta todas as chaves do ConfigMap como env vars de uma vez. Para selecionar chaves específicas, use `env` com `valueFrom.configMapKeyRef`.

Verifica se as variáveis chegaram:

```bash
kubectl exec cm-env-demo -- env | sort
```

```
APP_ENV=production
DB_HOST=postgres.default.svc
LOG_LEVEL=info
... outras env vars do sistema ...
```

As três chaves do ConfigMap aparecem no ambiente do container.

## Montando ConfigMap como volume

Alternativa: montar o ConfigMap como diretório dentro do container. Cada chave vira um arquivo. Cada valor vira o conteúdo do arquivo. Ideal para aplicações que leem arquivos de config em vez de env vars.

```bash
kubectl apply -f - <<YAML
apiVersion: v1
kind: Pod
metadata:
  name: cm-volume-demo
spec:
  containers:
  - name: busybox
    image: busybox:1.36
    command: ["sleep", "3600"]
    volumeMounts:
    - name: config-volume
      mountPath: /etc/config
  volumes:
  - name: config-volume
    configMap:
      name: app-config
YAML
```

Lista o que foi montado:

```bash
kubectl exec cm-volume-demo -- ls -la /etc/config
```

```
total 12
drwxrwxrwx    3 root     root          4096 May 24 23:52 .
drwxr-xr-x    1 root     root          4096 May 24 23:52 ..
drwxr-xr-x    2 root     root          4096 May 24 23:52 ..2026_05_24_23_52_41.2256757396
lrwxrwxrwx    1 root     root            32 May 24 23:52 ..data -> ..2026_05_24_23_52_41.2256757396
lrwxrwxrwx    1 root     root            14 May 24 23:52 APP_ENV -> ..data/APP_ENV
lrwxrwxrwx    1 root     root            14 May 24 23:52 DB_HOST -> ..data/DB_HOST
lrwxrwxrwx    1 root     root            16 May 24 23:52 LOG_LEVEL -> ..data/LOG_LEVEL
```

Repare no esquema de symlinks. O Kubernetes usa `..data` como symlink atômico. Quando você atualiza o ConfigMap, o kubelet troca o destino do `..data` no próximo sync (em até ~60s). O container vê os arquivos atualizados sem restart.

Lendo o conteúdo dos arquivos:

```bash
kubectl exec cm-volume-demo -- head -c 20 /etc/config/..data/APP_ENV
```

```
production
```

```bash
kubectl exec cm-volume-demo -- head -c 20 /etc/config/..data/DB_HOST
```

```
postgres.default.svc
```

Cada chave do ConfigMap virou um arquivo com o valor correspondente.

### Update de ConfigMap em volume

Quando você atualiza um ConfigMap montado como volume, o kubelet sincroniza os arquivos automaticamente. Não precisa restartar o Pod. Mas o sync não é instantâneo: leva até o kubeletSyncPeriod (padrão 1 minuto) + TTL do cache.

Para env vars, não tem atualização automática. O container pega o valor no startup e pronto. Se precisa de hot reload, monte como volume.

## Secrets: dados sensíveis no cluster

Secret é igual a ConfigMap, mas com três diferenças:

1. Dados em base64 (não criptografado, só encoding)
2. Armazenado em tmpfs (não vai pro disco)
3. Só enviado para nós que precisam (node onde o Pod executa)

Atenção: base64 não é criptografia. Qualquer um com acesso ao cluster (`kubectl get secret -o yaml`) lê o valor e decodifica. Para criptografia real, use etcd encryption at rest ou um operador como Sealed Secrets, External Secrets Operator ou Vault.

### Criando um Secret opaque

```bash
kubectl create secret generic db-creds \
  --from-literal=DB_USER=postgres \
  --from-literal=DB_PASS=s3cr3tP@ss! \
  --from-literal=DB_NAME=workshop
```

```bash
kubectl get secret db-creds
```

```
NAME       TYPE     DATA   AGE
db-creds   Opaque   3      3m42s
```

O tipo `Opaque` é o secret genérico, para dados arbitrários. Outros tipos: `kubernetes.io/tls`, `kubernetes.io/dockerconfigjson`, `kubernetes.io/basic-auth`.

`kubectl get secret` não mostra os dados por padrão:

```yaml
apiVersion: v1
data:
  DB_NAME: d29ya3Nob3A=
  DB_PASS: czNjcjN0UEBzcyE=
  DB_USER: cG9zdGdyZXM=
kind: Secret
metadata:
  name: db-creds
type: Opaque
```

Os valores estão em base64. Para decodificar, use `kubectl get secret -o jsonpath`:

```bash
kubectl get secret db-creds -o jsonpath="{.data.DB_USER}" | base64 -d
```

```
postgres
```

```bash
kubectl get secret db-creds -o jsonpath="{.data.DB_PASS}" | base64 -d
```

```
s3cr3tP@ss!
```

```bash
kubectl get secret db-creds -o jsonpath="{.data.DB_NAME}" | base64 -d
```

```
workshop
```

O `jsonpath` extrai um campo específico do JSON. Pipe no `base64 -d` decodifica.

### Montando Secret como env vars

Igual ao ConfigMap, mas com `secretRef`:

```bash
kubectl apply -f - <<YAML
apiVersion: v1
kind: Pod
metadata:
  name: secret-env-demo
spec:
  containers:
  - name: busybox
    image: busybox:1.36
    command: ["sleep", "3600"]
    envFrom:
    - secretRef:
        name: db-creds
YAML
```

```bash
kubectl exec secret-env-demo -- env | grep DB_
```

```
DB_NAME=workshop
DB_PASS=s3cr3tP@ss!
DB_USER=postgres
```

O Kubernetes decodifica o base64 automaticamente antes de injetar no container. A aplicação não precisa saber que veio de um Secret.

### Montando Secret como volume

```bash
kubectl apply -f - <<YAML
apiVersion: v1
kind: Pod
metadata:
  name: secret-volume-demo
spec:
  containers:
  - name: busybox
    image: busybox:1.36
    command: ["sleep", "3600"]
    volumeMounts:
    - name: secret-volume
      mountPath: /etc/secrets
      readOnly: true
  volumes:
  - name: secret-volume
    secret:
      secretName: db-creds
YAML
```

```bash
kubectl exec secret-volume-demo -- ls -la /etc/secrets
```

```
total 4
drwxrwxrwt    3 root     root           140 May 24 23:54 .
drwxr-xr-x    1 root     root          4096 May 24 23:54 ..
drwxr-xr-x    2 root     root           100 May 24 23:54 ..2026_05_24_23_54_04.2243376319
lrwxrwxrwx    1 root     root            32 May 24 23:54 ..data -> ..2026_05_24_23_54_04.2243376319
lrwxrwxrwx    1 root     root            14 May 24 23:54 DB_NAME -> ..data/DB_NAME
lrwxrwxrwx    1 root     root            14 May 24 23:54 DB_PASS -> ..data/DB_PASS
lrwxrwxrwx    1 root     root            14 May 24 23:54 DB_USER -> ..data/DB_USER
```

```bash
kubectl exec secret-volume-demo -- head -c 20 /etc/secrets/..data/DB_PASS
```

```
s3cr3tP@ss!
```

Montagem como volume com `readOnly: true` é a prática recomendada. A aplicação lê o arquivo do disco, sem expor o valor no `/proc/<pid>/environ` (que qualquer processo no mesmo PID namespace pode ler).

## Resumo do capítulo

- ConfigMaps: dados de configuração não sensíveis. Crie com `--from-literal` ou `--from-file`. Monte como env vars (`envFrom.configMapRef`) ou como volume.
- Secrets: dados sensíveis (senhas, tokens). Mesma API, mas armazenado em tmpfs e com encoding base64. Crie com `--from-literal` ou `--from-file`.
- `kubectl get cm/secret -o yaml` mostra o conteúdo. `kubectl get secret -o jsonpath="{.data.KEY}" | base64 -d` decodifica.
- Volumes com ConfigMap/Secret são atualizados automaticamente pelo kubelet (symlink atômico). Env vars não atualizam.
- Secret como volume com `readOnly: true` é mais seguro que env var: não aparece no `/proc/<pid>/environ`.

No próximo capítulo: health checks. Liveness, readiness e startup probes.
