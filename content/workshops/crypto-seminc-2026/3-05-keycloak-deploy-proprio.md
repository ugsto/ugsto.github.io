+++
date = 2026-01-01
title = "Keycloak: subindo o seu, configurando um client pra web auth"
weight = 305
[extra]
part = 3
section = 5
read_time_minutes = 8
hands_on_minutes = 15
+++

## Missão

Subir sua própria instância de Keycloak e configurar, à mão, exatamente o tipo de client OIDC que você usou como caixa preta no capítulo anterior: público, Authorization Code, PKCE obrigatório. No fim, você loga contra o seu próprio realm, não o do instrutor.

## Suba o seu

```bash
docker run -d --name keycloak-proprio -p 8080:8080 \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin-local \
  quay.io/keycloak/keycloak:26.4 start-dev
```

`start-dev` é o equivalente do `-dev` do Vault: banco H2 embutido, sem TLS, feito pra iterar rápido, nunca pra produção (a contrapartida de produção seria `start`, com um Postgres real e certificado próprio, o mesmo tipo de escolha que você já viu no Vault, dev mode contra HA). Espere uns 30 segundos e confirme que subiu:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8080/
```

## Pegue um token de administrador

Todo o resto desta seção usa a Admin REST API do Keycloak, autenticada com o usuário bootstrap que você acabou de criar:

```bash
ADMIN_TOKEN=$(curl -s -d 'client_id=admin-cli' -d 'grant_type=password' \
  -d 'username=admin' -d 'password=admin-local' \
  http://localhost:8080/realms/master/protocol/openid-connect/token \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
```

## Crie um realm

Um realm é um espaço isolado de usuários, clients e configuração: o `seminc2026` que você usou até aqui é um realm dentro da instância do instrutor, ao lado (provavelmente) de outros.

```bash
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"realm": "meurealm", "enabled": true}' \
  http://localhost:8080/admin/realms
```

## Crie o client, público, PKCE obrigatório

Esta é a parte que importa: reproduzir a configuração exata do `holonet-audit-app` que você vem usando desde o capítulo anterior.

```bash
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{
    "clientId": "meuapp",
    "publicClient": true,
    "standardFlowEnabled": true,
    "directAccessGrantsEnabled": false,
    "redirectUris": ["http://localhost:9000/*"],
    "webOrigins": ["+"],
    "attributes": {"pkce.code.challenge.method": "S256"}
  }' \
  http://localhost:8080/admin/realms/meurealm/clients
```

Quatro decisões, cada uma correspondendo a uma lição de um capítulo anterior:

- **`publicClient: true`**: sem client secret. Client público, do tipo SPA/CLI, o mesmo caso do `holonet-audit-app`.
- **`standardFlowEnabled: true`**, sem nenhum outro flow habilitado: só Authorization Code, nada de implicit, nada de grant direto de senha.
- **`directAccessGrantsEnabled: false`**: desliga o Resource Owner Password Grant, o "manda usuário e senha direto pro token endpoint". Sem isso desligado, um client público poderia contornar o browser inteiro, e junto com ele, o PKCE.
- **`pkce.code.challenge.method: "S256"`**: exige PKCE com SHA-256, não o método `plain` (que existe no RFC, mas não prova posse de nada, já que qualquer um que veja o `code_challenge` já tem o `code_verifier`, porque nesse método são a mesma string).

## Crie um usuário de teste

```bash
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{
    "username": "estudante",
    "enabled": true,
    "emailVerified": true,
    "credentials": [{"type": "password", "value": "senha123", "temporary": false}]
  }' \
  http://localhost:8080/admin/realms/meurealm/users
```

## Faça login, no navegador, contra o seu próprio realm

```text
http://localhost:8080/realms/meurealm/protocol/openid-connect/auth?
  response_type=code&
  client_id=meuapp&
  redirect_uri=http://localhost:9000/callback&
  scope=openid&
  code_challenge=<qualquer string de 43+ caracteres, por agora>&
  code_challenge_method=S256
```

Abra essa URL numa aba comum, logue com `estudante` / `senha123`, e observe o redirecionamento pra `localhost:9000` carregando um `code` na query string. Esse é exatamente o mesmo comportamento do client do instrutor, porque é exatamente a mesma configuração.

**Um detalhe que só aparece se você tentar automatizar isso via `curl` puro em vez de um navegador de verdade:** o Keycloak marca seus cookies de sessão como `Secure` e `SameSite=None`, mesmo em `start-dev`, mesmo sem TLS. Um `SameSite=None` sem `Secure` é rejeitado por qualquer navegador moderno, então o Keycloak não tem escolha: ou marca `Secure`, ou o cookie de sessão simplesmente não sobrevive ao redirecionamento entre o Keycloak e sua aplicação. Um script HTTP simples, sem os privilégios especiais que navegadores dão a `localhost`, recebe de volta "Restart login cookie not found" e para ali. Um navegador de verdade, apontado para `http://localhost:...` (não `127.0.0.1`), funciona sem esse atrito. Essa é uma razão concreta, não uma curiosidade, pela qual login OIDC em produção não roda sem HTTPS: o próprio mecanismo de cookie que protege o fluxo contra alguns ataques exige isso.

## O raio de impacto

Você reproduziu, com 4 decisões de configuração explícitas, a mesma superfície que vinha sendo uma caixa preta: por que o client é público, por que só Authorization Code, por que PKCE é obrigatório e por que o método precisa ser `S256`. Nenhuma dessas decisões é o padrão de fábrica de qualquer client OIDC. Cada uma delas é uma escolha que alguém, algum dia, teve que tomar corretamente, do mesmo jeito que você acabou de tomar agora.

## O que vem a seguir

Encerra a Parte 3. Na Parte 4, você intercepta esse mesmo protocolo com um proxy, e vê PKCE, OIDC e DPoP em bytes reais.

```bash
docker rm -f keycloak-proprio
```
