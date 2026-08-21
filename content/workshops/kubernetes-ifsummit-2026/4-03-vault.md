+++
date = 2026-01-01
title = "Vault: gestão de secrets"
weight = 403
[extra]
part = 4
section = 3
read_time_minutes = 6
hands_on_minutes = 10
+++



## Vault: gestão de secrets

Kubernetes Secrets são codificados em base64. Isso não é criptografia: qualquer um com acesso ao `kubectl` ou ao etcd consegue decodificar. O Vault resolve isso com criptografia real, políticas de acesso granulares e rotação automática de credenciais.

### O problema dos Secrets do Kubernetes

Crie um Secret e veja como ele é armazenado:

```bash
kubectl create secret generic minha-senha --from-literal=password=123456
kubectl get secret minha-senha -o jsonpath='{.data.password}'
```

```text
MTIzNDU2
```

```bash
echo 'MTIzNDU2' | base64 -d
```

```text
123456
```

Base64 não é proteção. É encoding. O Secret viaja em texto plano dentro do etcd (a menos que você configure encryption at rest, o que poucos fazem). E qualquer pessoa com `kubectl` no namespace consegue ler.

O Vault resolve isso: secrets são criptografados em disco, o acesso é controlado por políticas e tudo é auditável.

### Instalando o Vault

O Vault é um binário único, sem dependências. Instale no Ubuntu/Debian:

```bash
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update
sudo apt install vault
```

No Fedora/RHEL:

```bash
sudo dnf install -y dnf-plugins-core
sudo dnf config-manager --add-repo https://rpm.releases.hashicorp.com/fedora/hashicorp.repo
sudo dnf install vault
```

Verifique a instalação:

```bash
vault version
```

```text
Vault v1.19.0 (abcd123...), built 2026-03-13T12:00:00Z
```

### Modo dev: para aprender

O Vault em produção é um sistema distribuído com unseal manual, múltiplos servidores e backend de armazenamento (Consul, Raft). Para aprender, existe o modo dev: um servidor único, sem persistência, que já inicia desbloqueado.

```bash
vault server -dev -dev-listen-address=0.0.0.0:8200
```

A saída inclui o token root (anote, você vai precisar dele):

```text
==> Vault server configuration:
             Api Address: http://0.0.0.0:8200
                     Cgo: disabled
         Cluster Address: https://0.0.0.0:8201
              Go Version: go1.24.1
              Listener 1: tcp (addr: "0.0.0.0:8200", cluster address: "0.0.0.0:8201")
               Log Level: info
                   Mlock: supported: false, enabled: false
           Recovery Mode: false
                 Storage: inmem
                 Version: Vault v1.19.0

==> Vault server started! Log data will stream in below:

WARNING! dev mode is enabled! In this mode, Vault runs entirely in-memory
and starts unsealed with a single unseal key. The root token is already
authenticated to the CLI, so you can immediately begin using Vault.

You may need to set the following environment variables:

    $ export VAULT_ADDR='http://0.0.0.0:8200'

The unseal key and root token are displayed below in case you want to
seal/unseal the Vault or re-authenticate.

Unseal Key: ZOIvK7kXsAM7dXtHCtQ...
Root Token: hvs.1dx0yCj0tN0uD...

Development mode should NOT be used in production installations!
```

Em outro terminal, configure a variável de ambiente e verifique o status:

```bash
export VAULT_ADDR='http://127.0.0.1:8200'
vault status
```

```text
Key             Value
---             -----
Seal Type       shamir
Initialized     true
Sealed          false
Total Shares    1
Threshold       1
Version         1.19.0
Cluster Name    vault-cluster-abc123
Cluster ID      1234-5678-90ab
HA Enabled      false
```

### Lendo e escrevendo secrets

O Vault organiza secrets em engines. A engine padrão é `kv` (key-value), versão 2. Para escrever um secret:

```bash
vault kv put secret/workshop/db password=supersecreta
```

```text
=== Secret Path ===
secret/data/workshop/db

======= Metadata =======
Key                Value
---                -----
created_time       2026-05-25T03:00:00.123456Z
custom_metadata    <nil>
deletion_time      n/a
destroyed          false
version            1
```

Para ler:

```bash
vault kv get secret/workshop/db
```

```text
=== Secret Path ===
secret/data/workshop/db

======= Metadata =======
Key                Value
---                -----
created_time       2026-05-25T03:00:00.123456Z
version            1

====== Data ======
Key         Value
---         -----
password    supersecreta
```

Só o campo:

```bash
vault kv get -field=password secret/workshop/db
```

```text
supersecreta
```

Para deletar:

```bash
vault kv delete secret/workshop/db
```

```text
Success! Data deleted (if it existed) at: secret/workshop/db
```

### Vault + Kubernetes

O Vault tem um agente (sidecar ou init container) que injeta secrets diretamente nos Pods. O fluxo é:

1. O Pod autentica no Vault usando sua ServiceAccount do Kubernetes
2. O Vault valida a ServiceAccount contra o cluster
3. Se autorizado, o Vault entrega os secrets no filesystem do Pod

Isso elimina Secrets do Kubernetes completamente: os secrets nunca passam pela API do K8s, nunca são armazenados no etcd. O ciclo de vida (criação, rotação, revogação) é gerenciado pelo Vault.

A integração completa (Vault Agent Injector) foge do escopo deste workshop, mas você sabe que existe e resolve o problema real: secrets criptografados, com políticas e auditoria.

### Cheatsheet

```cheatsheet
vault server -dev | Iniciar servidor em modo dev
export VAULT_ADDR='http://127.0.0.1:8200' | Configurar endereço
vault status | Verificar status do servidor
vault kv put secret/<path> key=value | Escrever secret
vault kv get secret/<path> | Ler secret
vault kv get -field=<key> secret/<path> | Ler campo específico
vault kv list secret/ | Listar secrets
vault kv delete secret/<path> | Deletar secret (soft delete)
vault kv destroy secret/<path> | Destruir permanentemente
```

O Vault é a última peça do ecossistema. Você tem observabilidade (Prometheus+Grafana), GitOps (ArgoCD), gestão de secrets (Vault) e roteamento (Kong). Um cluster Kubernetes completo, da infraestrutura até a aplicação.
