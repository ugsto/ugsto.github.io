## O HoloNet Bank

Você audita o login do HoloNet Bank antes do lançamento.

Construído às pressas por um estagiário. Usuários de teste: `admin`, `anakin`, `obiwan`, `ahsoka`.

---

## A mecânica das flags

Cada laboratório esconde uma flag `SEMINC2026{...}`.

Placar: **seminc2026-ctf.bortoli.phd** (registro aberto)

- Criptografia em Trânsito: 1 flag
- Criptografia em Repouso: 5 flags
- Gestão de Credenciais: 1 flag
- Protocolos de Autenticação: 2 flags
- Bônus: 1 flag

Achar a flag **é** a prova.

## Roteiro: Parte 1 (Auditoria)

Criptografia em Trânsito

- netcat puro vs OpenSSL, capturado no Wireshark
- Algoritmos recomendados: simétrica, assimétrica, hash

## Roteiro: Parte 2 (Auditoria, módulo principal)

Criptografia em Repouso, SQL Injection contra 5 esquemas:

1. Texto simples
2. AES-256-ECB com chave fixa
3. MD5 sem salt
4. MD5 com salt
5. Argon2id

---

## Virada de papel

Você foi contratado como engenheiro(a) de segurança do HoloNet Bank.

Agora o trabalho é corrigir.

## Roteiro: Parte 3 (Correção)

Gestão de Credenciais

- HashiCorp Vault (transit engine)
- Keycloak (IAM)

## Roteiro: Parte 4 (Correção)

Protocolos de Autenticação

- OAuth2 com PKCE
- OIDC
- DPoP
- Observados via proxy de interceptação

## Bônus (se der tempo)

Mensageria autenticada com MAC (HMAC-SHA256) sobre tokens JWT.

---

## Ferramentas necessárias

- nc / ncat
- openssl
- Wireshark ou tshark
- hashcat ou John the Ripper
- Proxy (mitmproxy ou Burp Suite Community)
- Navegador

Token do Vault e credenciais do Keycloak: entregues ao vivo pelo instrutor.

## A infraestrutura

- seminc2026-login.bortoli.phd: login vulnerável do HoloNet Bank
- seminc2026-rainbowtable.bortoli.phd: rainbow table auto-hospedada
- seminc2026-vault.bortoli.phd: HashiCorp Vault
- seminc2026-keycloak.bortoli.phd: Keycloak
- seminc2026-ctf.bortoli.phd: placar de flags
