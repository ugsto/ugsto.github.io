+++
date = 2026-01-01
title = "Vault em HA: Shamir, raft e o problema de quem guarda a chave"
weight = 302
[extra]
part = 3
section = 2
read_time_minutes = 10
hands_on_minutes = 20
+++

## Missão

Subir um cluster de 3 nós de verdade, com storage em disco, e entender dois mecanismos que o modo dev escondia por trás de um atalho: como o Vault divide a responsabilidade de desselar entre várias pessoas (Shamir), e como 3 nós concordam sobre qual deles está no comando (raft).

## O problema que o Shamir resolve

Um Vault de produção guarda, na prática, a chave mestra que decifra tudo. Se essa chave existisse como um único arquivo, ou uma única pessoa soubesse ela de cabeça, o Vault inteiro teria exatamente a segurança dessa pessoa ou desse arquivo. Assim, voltamos ao mesmo problema do `users_enc_sym` da Parte 2, só que numa escala maior.

Shamir Secret Sharing corta a chave mestra em `N` pedaços (compartilhamentos), de forma que qualquer `K` deles, com `K <= N`, reconstrói a chave, mas `K-1` pedaços não revelam **nada** sobre ela, matematicamente, não apenas "seria difícil". Isso é o parâmetro `-key-threshold` que você vai usar abaixo. A ideia prática: distribua os `N` compartilhamentos entre pessoas diferentes da equipe, e nenhuma delas, sozinha, nem em conluio de menos de `K`, consegue desselar o Vault.

## Suba os 3 nós

Três arquivos de configuração, um por nó, cada um com seu próprio `node_id` e apontando pros outros dois via `retry_join`:

```hcl
# node1.hcl (repita para node2.hcl e node3.hcl, trocando "node1"/"vault1" pelo nó correspondente)
storage "raft" {
  path    = "/vault/data"
  node_id = "node1"

  retry_join { leader_api_addr = "http://vault1:8200" }
  retry_join { leader_api_addr = "http://vault2:8200" }
  retry_join { leader_api_addr = "http://vault3:8200" }
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = true
}

api_addr      = "http://vault1:8200"
cluster_addr  = "http://vault1:8201"
disable_mlock = true
```

`compose.yaml`, um serviço por nó:

```yaml
name: vault-ha

services:
  vault1:
    image: hashicorp/vault:2.0.4
    cap_add: [IPC_LOCK]
    volumes:
      - ./node1.hcl:/vault/config/vault.hcl:ro
      - node1-data:/vault/data
    command: ["server"]
    ports: ["18201:8200"]
    networks:
      vaultnet: { aliases: [vault1] }

  vault2:
    image: hashicorp/vault:2.0.4
    cap_add: [IPC_LOCK]
    volumes:
      - ./node2.hcl:/vault/config/vault.hcl:ro
      - node2-data:/vault/data
    command: ["server"]
    ports: ["18202:8200"]
    networks:
      vaultnet: { aliases: [vault2] }

  vault3:
    image: hashicorp/vault:2.0.4
    cap_add: [IPC_LOCK]
    volumes:
      - ./node3.hcl:/vault/config/vault.hcl:ro
      - node3-data:/vault/data
    command: ["server"]
    ports: ["18203:8200"]
    networks:
      vaultnet: { aliases: [vault3] }

volumes:
  node1-data:
  node2-data:
  node3-data:

networks:
  vaultnet:
```

```bash
docker compose up -d
```

## Inicialize com 5 compartilhamentos, threshold 3

```bash
export VAULT_ADDR=http://127.0.0.1:18201
vault operator init -key-shares=5 -key-threshold=3
```

A saída traz 5 chaves e 1 root token. Guarde as 5, você vai usar 3 delas já.

## Dessele com 2 chaves. Depois com a 3ª

```bash
vault operator unseal <chave 1>
vault operator unseal <chave 2>
```

`Sealed: true` ainda, `Unseal Progress: 2/3`. Duas chaves corretas, e o Vault continua tão fechado quanto com zero. Isso não é uma barra de progresso arbitrária: matematicamente, 2 pontos não determinam o polinômio que o Shamir usa por baixo, então esses 2 compartilhamentos não vazam nenhuma informação sobre a chave mestra, nem parcial.

```bash
vault operator unseal <chave 3>
```

`Sealed: false`. A 3ª chave completou o threshold, e só a partir dela o Vault reconstrói a chave mestra.

## Dessele os outros 2 nós, olhe o cluster

Cada nó do cluster precisa ser desselado individualmente (o storage raft é replicado, o estado "selado" não é):

```bash
export VAULT_ADDR=http://127.0.0.1:18202
vault operator unseal <chave 1>
vault operator unseal <chave 2>
vault operator unseal <chave 3>

export VAULT_ADDR=http://127.0.0.1:18203
vault operator unseal <chave 1>
vault operator unseal <chave 2>
vault operator unseal <chave 3>
```

Com os 3 nós desselados:

```bash
export VAULT_ADDR=http://127.0.0.1:18201
export VAULT_TOKEN=<root token>
vault operator raft list-peers
```

```text
Node     Address        State       Voter
----     -------        -----       -----
node1    vault1:8201    leader      true
node2    vault2:8201    follower    true
node3    vault3:8201    follower    true
```

Um líder, dois seguidores. É consenso via raft: o líder replica cada escrita pros seguidores antes de confirmar a operação, e se o líder cair, os seguidores votam entre si um novo líder. Isso é o que "alta disponibilidade" significa aqui, na prática, não só no nome: o cluster sobrevive à perda de um nó, contanto que a maioria continue de pé.

## O raio de impacto

Nenhuma chave sozinha, nem `K-1` chaves juntas, reconstrói o segredo mestre. Nenhum nó sozinho decide o estado do cluster. As duas defesas são independentes: Shamir protege contra uma pessoa (ou um vazamento) comprometer o cofre inteiro; raft protege contra um nó (ou uma zona de disponibilidade) cair e levar o serviço junto.

## O que vem a seguir

Esse cluster ainda está com `tls_disable = true` entre você e ele, e ainda não emitiu um único certificado pra ninguém. O próximo capítulo fecha essas duas pontas.
