## Missão

- Subir 3 nós reais: storage em disco, Shamir de verdade, raft
- Entender por que threshold-1 chaves não revelam nada

---

## Shamir: o problema que resolve

- Chave mestra cortada em N compartilhamentos
- Qualquer K reconstrói a chave. K-1 não revelam nada, matematicamente
- `-key-shares=N -key-threshold=K` no `vault operator init`

---

## 3 nós, raft, retry_join

```hcl
storage "raft" {
  path    = "/vault/data"
  node_id = "node1"
  retry_join { leader_api_addr = "http://vault1:8200" }
  retry_join { leader_api_addr = "http://vault2:8200" }
  retry_join { leader_api_addr = "http://vault3:8200" }
}
```

- Um `.hcl` por nó, cada um com seu `node_id`
- `docker compose up -d` sobe os 3 na mesma rede

---

## Inicializando

```bash
vault operator init -key-shares=5 -key-threshold=3
```

- 5 chaves, 1 root token na saída

---

## Desselando: 2 chaves não bastam

```bash
vault operator unseal <chave 1>
vault operator unseal <chave 2>
```

- `Unseal Progress: 2/3`, ainda `Sealed: true`
- 2 pontos não determinam o polinômio do Shamir (zero informação vaza)

---

## A 3ª chave completa o threshold

```bash
vault operator unseal <chave 3>
```

- `Sealed: false`
- Repita nos outros 2 nós (cada nó dessela individualmente)
- Nó recém-juntado pode levar alguns segundos pra sincronizar. Se aparecer selado, espere e confira de novo

---

## O cluster

```bash
vault operator raft list-peers
```

```text
node1    leader      true
node2    follower    true
node3    follower    true
```

- Líder replica escritas pros seguidores
- Líder cai → seguidores votam um novo líder

---

## O raio de impacto

- Shamir: nenhuma pessoa sozinha compromete o cofre
- Raft: nenhum nó sozinho decide o estado do cluster
- Duas defesas independentes

Próximo: TLS entre você e o cluster, e o Vault como autoridade certificadora.
