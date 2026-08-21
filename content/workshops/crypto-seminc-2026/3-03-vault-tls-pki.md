+++
date = 2026-01-01
title = "Vault em trânsito e como autoridade certificadora: TLS e PKI"
weight = 303
[extra]
part = 3
section = 3
read_time_minutes = 8
hands_on_minutes = 15
+++

## Missão

O cluster do capítulo anterior ainda conversa com você em texto puro, e ainda não emitiu um único certificado. Duas pontas soltas, uma que fecha o Módulo 1 (criptografia em trânsito, agora aplicada ao próprio Vault) e outra que abre uma capacidade nova: usar o Vault como autoridade certificadora.

## Fechando o Módulo 1: TLS no próprio Vault

O `tls_disable = true` que você usou até aqui é aceitável em loopback, num laboratório. Um Vault real nunca roda assim, porque cada requisição, incluindo tokens de autenticação, viajaria em texto puro pra quem estivesse posicionado na rede (exatamente o cenário do Módulo 1).

Gere um certificado (auto-assinado serve pra este exercício; em produção seria emitido por uma CA de confiança, ou, como você vai ver na próxima seção, pelo próprio Vault):

```bash
openssl req -x509 -newkey rsa:2048 -keyout vault.key -out vault.crt -days 30 -nodes -subj "/CN=vault.local"
chmod 644 vault.key
```

Configuração do listener, agora com `tls_cert_file`/`tls_key_file` no lugar de `tls_disable`:

```hcl
storage "raft" {
  path    = "/vault/data"
  node_id = "tls-node"
}

listener "tcp" {
  address       = "0.0.0.0:8200"
  tls_cert_file = "/vault/config/vault.crt"
  tls_key_file  = "/vault/config/vault.key"
}

api_addr      = "https://127.0.0.1:8200"
cluster_addr  = "https://127.0.0.1:8201"
disable_mlock = true
```

```bash
docker run -v $(pwd)/vault.crt:/vault/config/vault.crt:ro \
  -v $(pwd)/vault.key:/vault/config/vault.key:ro \
  -v $(pwd)/vault-tls.hcl:/vault/config/vault.hcl:ro \
  -v vault-tls-data:/vault/data \
  -p 8200:8200 --cap-add=IPC_LOCK -d --name vault-tls hashicorp/vault:2.0.4 server
```

Confirme os dois lados:

```bash
curl -sk https://127.0.0.1:8200/v1/sys/health
curl -s http://127.0.0.1:8200/v1/sys/health
```

O primeiro responde de verdade, negociando TLS (`-k` só porque o certificado é auto-assinado, o navegador de um usuário real recusaria por padrão, exatamente como no Módulo 1). O segundo recebe `400`: o listener nem tenta interpretar texto puro como requisição HTTP, porque ele só fala TLS agora. `VAULT_ADDR` sem `https://` simplesmente não conecta.

## Vault como autoridade certificadora: a engine PKI

Além de guardar segredo, o Vault pode ser a própria fonte de certificados de curta duração pra outros serviços, com a engine `pki`. A ideia central: em vez de um certificado estático de longa duração (o clássico "válido por 2 anos", perdido em algum lugar se vazar), cada serviço pede um certificado novo, de vida curta, sempre que precisa, e o Vault assina.

```bash
vault secrets enable pki
vault secrets tune -max-lease-ttl=87600h pki
```

Gere uma CA raiz, dentro do próprio Vault, sem que a chave privada dela jamais saia do storage:

```bash
vault write -field=certificate pki/root/generate/internal \
  common_name="HoloNet Root CA" ttl=87600h > root_ca.pem
```

Crie uma role, que define o que pode ser pedido (quais domínios, por quanto tempo):

```bash
vault write pki/roles/holonet-internal \
  allowed_domains="holonet.internal" \
  allow_subdomains=true \
  max_ttl=72h
```

Peça um certificado de fato, pra um serviço fictício:

```bash
vault write -format=json pki/issue/holonet-internal \
  common_name="api.holonet.internal" | tee cert.json
```

A resposta traz `certificate`, `private_key` e `ca_chain`, prontos pra usar, com TTL de no máximo 72 horas (o que a role permite). Compare com `users_enc_sym`, da Parte 2: lá, uma chave estática, escrita uma vez, nunca girada, sentada no código-fonte pra sempre. Aqui, um certificado de vida curta, emitido sob demanda, que expira sozinho mesmo se ninguém revogar nada.

## O raio de impacto

TLS no listener resolve o mesmo problema do Módulo 1, agora aplicado ao próprio cofre: sem ele, o tráfego mais sensível de toda a infraestrutura, tokens e segredos, estaria exposto a qualquer um posicionado na rede. A engine PKI resolve outro problema, adjacente: reduz o estrago de um certificado vazado, porque ele expira rápido por design, em vez de ficar válido por anos até alguém lembrar de revogar.

## O que vem a seguir

Você fechou o arco do Vault: segredo como serviço (`transit`), modo dev vs produção, alta disponibilidade com Shamir e raft, TLS, e Vault como CA. Falta a outra metade do problema de identidade que este módulo promete resolver.
