## Missão

- Suba seu próprio Vault, em modo dev
- Entenda o que cada atalho do modo dev sacrifica

---

## Suba o seu

```bash
docker run -d --rm --name vault-dev -p 8200:8200 --cap-add=IPC_LOCK \
  -e VAULT_DEV_ROOT_TOKEN_ID=root \
  hashicorp/vault:2.0.4 server -dev -dev-listen-address=0.0.0.0:8200
```

- `docker logs vault-dev` → Unseal Key + Root Token já impressos
- `vault status` → `Sealed: false`, sem fazer nada

---

## Armazenamento em memória

```bash
vault kv put secret/teste valor=alguma-coisa
docker restart vault-dev
vault kv get secret/teste
```

- Nada sobrevive ao restart: tudo em RAM, sem disco

---

## Uma única chave de unseal

- Modo dev: 1 compartilhamento, threshold 1
- Não é Shamir de verdade: é decoração
- Próximo capítulo: múltiplas chaves, threshold real

---

## TLS desabilitado + root token fixo

- `VAULT_ADDR=http://...`, sem `s`
- Root token escolhido por você na hora do `docker run`
- Aceitável em loopback por 5 minutos. Não em produção.

---

## O raio de impacto

- Nenhum atalho é bug: é o propósito do modo dev
- O erro é usá-lo fora de desenvolvimento local
- Próximo capítulo: Vault de verdade, múltiplos nós, Shamir, raft
