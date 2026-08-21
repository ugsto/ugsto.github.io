+++
date = 2026-01-01
title = "Introdução: o HoloNet Bank e a virada de papel"
weight = 1
[extra]
part = 0
section = 1
read_time_minutes = 5
hands_on_minutes = 0
+++

## O cenário

Você foi contratado para auditar o sistema de login do **HoloNet Bank** antes do lançamento. Ele foi construído às pressas por um estagiário, e os usuários de teste ainda estão no banco: `admin`, `anakin`, `obiwan`, `ahsoka`.

Nesta manhã, você é o auditor externo. Seu trabalho é descobrir exatamente o quão grave é a situação e **provar isso**, do mesmo jeito que um relatório de pentest real precisa provar um achado, não apenas alegar que ele existe.

Depois do almoço, o HoloNet te contrata definitivamente como engenheiro(a) de segurança, e o seu papel se inverte: corrigir o que você mesmo encontrou pela manhã, usando as ferramentas que empresas reais usam de fato: Vault, Keycloak, OAuth2/OIDC. Você vai entender exatamente o que cada uma resolve em relação ao que veio antes, porque foi você que abriu o buraco.

Manhã de ataque, tarde de defesa. O mesmo sistema, os dois lados da mesa.

## Capture de Flag

Cada laboratório deste minicurso esconde uma flag no formato `SEMINC2026{...}`. Você a encontra explorando a vulnerabilidade ou operando a ferramenta do módulo, e a submete no placar do CTF:

**[https://seminc2026-ctf.bortoli.phd](https://seminc2026-ctf.bortoli.phd)**

O registro está aberto. Qualquer pessoa pode criar uma conta e competir.

São 11 flags distribuídas em 5 categorias:

- **Criptografia em Trânsito**: 1 flag
- **Criptografia em Repouso**: 6 flags (5 por esquema de armazenamento de senha, 1 pelo golpe do CBC contra o sistema de contas)
- **Gestão de Credenciais**: 1 flag
- **Protocolos de Autenticação**: 2 flags
- **Bônus**: 1 flag

Cada módulo tem um único trabalho: provar uma afirmação. Um relatório de pentest não vale nada se disser apenas "a senha provavelmente é fraca": ele precisa mostrar a senha em texto claro. Uma decisão de engenharia não vale nada se disser apenas "isso deveria ser mais seguro agora": ela precisa mostrar o que quebrou quando alguém tentou o mesmo ataque de novo. Achar a flag **é** a prova.

## Roteiro

### Parte 1 (Auditoria): Criptografia em Trânsito

Captura de pacotes com `netcat` puro comparada ao mesmo tráfego protegido por OpenSSL, observados no Wireshark. Em seguida, uma visão rápida dos algoritmos recomendados para os casos de uso mais comuns: criptografia simétrica, assimétrica e hash criptográfico.

### Parte 2 (Auditoria, o módulo principal): Criptografia em Repouso

SQL Injection contra o login do HoloNet Bank, evoluindo por 5 esquemas de armazenamento de senha, cada um mais resistente que o anterior:

1. Texto Simples
2. Criptografia simétrica (AES-256-ECB com chave fixa)
3. MD5 sem salt
4. MD5 com salt
5. Argon2id

Em seguida, os modos de operação de cifra de bloco (ECB, CBC, CTR, GCM) e um golpe real contra o sistema de contas do HoloNet, explorando a maleabilidade do CBC sem nunca descobrir a chave.

### Virada de papel

Você foi contratado como engenheiro(a) de segurança do HoloNet Bank. A partir daqui, o trabalho é corrigir.

### Parte 3 (Correção): Gestão de Credenciais

HashiCorp Vault (transit engine, depois deploy próprio em dev mode, HA com Shamir e raft, TLS e PKI) e Keycloak (IAM, depois deploy próprio com um client configurado à mão) como as soluções profissionais para os problemas que você acabou de explorar.

### Parte 4 (Correção): Protocolos de Autenticação

OAuth2 com PKCE, OIDC e DPoP, observados na prática por meio de um proxy de interceptação.

### Bônus (se der tempo)

Mensageria autenticada com MAC (HMAC-SHA256) sobre tokens JWT.

## Antes de começar

Ferramentas necessárias:

- `nc` / `ncat`
- `openssl`
- Wireshark ou `tshark`
- `hashcat` ou John the Ripper
- Um proxy de interceptação (mitmproxy ou Burp Suite Community)
- Acesso a um navegador

O token do Vault e as credenciais do usuário de demonstração no Keycloak **não precisam ser preparados com antecedência**: são entregues ao vivo pelo instrutor, no momento de cada módulo.

## A infraestrutura que você vai usar

Todos os laboratórios apontam para uma infraestrutura já provisionada:

- **seminc2026-login.bortoli.phd**: o sistema de login vulnerável do HoloNet Bank
- **seminc2026-accounts.bortoli.phd**: o sistema de contas do HoloNet Bank, alvo do golpe de CBC
- **seminc2026-rainbowtable.bortoli.phd**: uma pseudo rainbow table auto-hospedada, usada no módulo de MD5
- **seminc2026-vault.bortoli.phd**: HashiCorp Vault
- **seminc2026-keycloak.bortoli.phd**: Keycloak
- **seminc2026-hmac.bortoli.phd**: serviço de verificação HMAC/JWT, usado no módulo bônus
- **seminc2026-ctf.bortoli.phd**: o placar de flags

Nenhuma dessas URLs exige nada além do que for entregue durante o próprio módulo. Cadastre-se no CTF agora e vamos começar.
