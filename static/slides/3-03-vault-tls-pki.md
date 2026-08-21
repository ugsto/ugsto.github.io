## Missão

- Fechar o Módulo 1: TLS no próprio Vault
- Abrir uma capacidade nova: Vault como autoridade certificadora

---

## Gerando o certificado

```bash
openssl req -x509 -newkey rsa:2048 -keyout vault.key -out vault.crt \
  -days 30 -nodes -subj "/CN=vault.local"
chmod 644 vault.key
```

---

## Listener com TLS

```hcl
listener "tcp" {
  address       = "0.0.0.0:8200"
  tls_cert_file = "/vault/config/vault.crt"
  tls_key_file  = "/vault/config/vault.key"
}
```

- `tls_cert_file`/`tls_key_file` no lugar de `tls_disable`

---

## Confirmando os dois lados

```bash
curl -sk https://127.0.0.1:8200/v1/sys/health   # responde
curl -s  http://127.0.0.1:8200/v1/sys/health    # 400
```

- Listener só fala TLS agora: texto puro nem é interpretado

---

## PKI: Vault como CA

```bash
vault secrets enable pki
vault secrets tune -max-lease-ttl=87600h pki
vault write -field=certificate pki/root/generate/internal \
  common_name="HoloNet Root CA" ttl=87600h
```

- Chave privada da CA nunca sai do storage do Vault

---

## Emitindo um certificado

```bash
vault write pki/roles/holonet-internal \
  allowed_domains="holonet.internal" allow_subdomains=true max_ttl=72h

vault write -format=json pki/issue/holonet-internal \
  common_name="api.holonet.internal"
```

- Certificado de vida curta (máx. 72h), emitido sob demanda
- Compare com `users_enc_sym`: chave estática, nunca girada, pra sempre

---

## O raio de impacto

- TLS: mesmo problema do Módulo 1, agora no próprio cofre
- PKI: reduz o estrago de um certificado vazado, pois ele expira rápido por design

Próximo: a outra metade do problema de identidade (Keycloak).
