## Módulo 3: Vault: transit engine, cifra como serviço

- Manhã: você quebrou o `users_enc_sym` (chave AES fixa em `main.py`)
- Tarde: você conserta, usando as ferramentas que empresas reais usam
- Missão: cifrar/decifrar via Vault sem ver a chave; logar via Keycloak sem a app tocar em senha

---

## Vault: transit engine

- "Criptografia como serviço"

---

## Configurando o acesso

```bash
export VAULT_ADDR=https://seminc2026-vault.bortoli.phd
export VAULT_TOKEN=<token fornecido pelo instrutor>
```

- Token sob policy `student`: só `transit/encrypt/workshop` e `transit/decrypt/workshop`
- Qualquer outra operação → `403 permission denied` (verificado ao vivo)

---

## Menor privilégio na prática

```bash
vault secrets enable -path=qualquer-coisa kv
```

```text
Code: 403. Errors:
* permission denied
```

- É o modelo de menor privilégio funcionando
- Você tem a chave certa pro cadeado certo, e nenhuma outra

---

## Cifrando

```bash
vault write transit/encrypt/workshop plaintext=$(base64 <<< "test message")
```

```text
ciphertext    vault:v1:...
```

- `vault:v1:` = versão da chave usada

---

## Decifrando

```bash
vault write transit/decrypt/workshop ciphertext=<colar o ciphertext>
```

- Retorna o plaintext original em base64
- Em nenhum momento você viu a chave AES

---

## Rotação transparente

```bash
vault write -f transit/keys/workshop/rotate
```

- Ciphertexts novos usam a versão nova da chave
- Ciphertexts antigos continuam decifrando: o prefixo `vault:vN:` diz qual versão usar
- A aplicação nunca sabe que uma rotação aconteceu

---

## Flag do Lab 3.1

Ciphertext entregue pelo instrutor:

```text
vault:v1:HMN74d0JMa42c4gQCzI2Wo/W8PlbwLP1CteW2cLTAHlaGqzHi2Uf96WTkpNCjRVHh01Q0evqyDtzs7ML0pu7SeXojQ==
```

```bash
vault write transit/decrypt/workshop ciphertext=vault:v1:HMN74d0JMa42c4gQCzI2Wo/W8PlbwLP1CteW2cLTAHlaGqzHi2Uf96WTkpNCjRVHh01Q0evqyDtzs7ML0pu7SeXojQ==
```

Decodificado de base64: a flag, no formato `SEMINC2026{...}`

- Isso é o que a chave hardcoded do módulo anterior deveria ter sido desde o início

---

## O que vem a seguir

- Esse Vault foi provisionado pelo instrutor: engine já habilitada, policy já escrita
- Os próximos capítulos invertem isso: você sobe seu próprio Vault
- Primeiro do jeito descartável, depois do jeito que vai pra produção
- Só depois disso o módulo segue pro Keycloak
