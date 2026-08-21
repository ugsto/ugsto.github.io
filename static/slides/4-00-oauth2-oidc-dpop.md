## Missão

- Delegar login ao Keycloak: seguro de fato, ou "confie no fornecedor"?
- Critério: apontar, num request capturado por você, o header/parâmetro que impede reuso de token roubado.
- Dois clients no realm `seminc2026`: `holonet-audit-app` e `holonet-audit-app-dpop`.
- Ambos: Standard Flow + PKCE (`S256`) obrigatório, clients públicos, sem secret.

## Execução com Docker

```bash
docker run --rm -it \
  --name mitmproxy \
  -p 8080:8080 \
  -p 8081:8081 \
  -v ~/.mitmproxy:/home/mitmproxy/.mitmproxy \
  mitmproxy/mitmproxy mitmweb --web-host 0.0.0.0
```

* **`8080`**: Porta do proxy HTTP/HTTPS.
* **`8081`**: Interface visual interativa para inspecionar os requests/tokens (`[http://127.0.0.1:8081](http://127.0.0.1:8081)`).
* **`-v ~/.mitmproxy:...`**: Persiste a autoridade certificadora (CA) gerada no primeiro boot para não invalidar o certificado no navegador toda vez que o container reiniciar.

## Configuração do Navegador & CA

1. Configure o navegador/sistema para usar o proxy HTTP/HTTPS em `127.0.0.1:8080` (usando o token apresentado na tela).
2. Execute o navegador informando a autoridade certificadora do `mitmproxy`: `chromium --proxy-server="http://127.0.0.1:8080" --user-data-dir="/tmp/chrome-mitm"`
2. Acesse [http://mitm.it](http://mitm.it) para validar a conexão
4. Acesse [http://127.0.0.1:8081](http://127.0.0.1:8081) (usando o link apresentado na tela) para acompanhar em tempo real o fluxo dos endpoints `/auth`, `/token` e os headers `DPoP`.

## PKCE: o que resolve

- Client público não guarda segredo
- `code_verifier` aleatório
- Authorization request carrega só o `code_challenge`
- Token exchange revela o `code_verifier` → Keycloak reaplica SHA-256 e compara
- SHA-256 não é reversível: quem via só o challenge não reconstrói o verifier

## Lab 4.1: Os 5 passos no proxy

0. Login em `https://seminc2026-oauthclient.bortoli.phd` (client `holonet-audit-app`)
1. `GET /auth?...&code_challenge=...&code_challenge_method=S256`
2. `POST` do form de login, na página do Keycloaknão do HoloNet.
3. Redirect: `?code=...&state=...&session_state=...&iss=...`
4. `POST /token` com `code_verifier` em texto simples no body: o payoff do lab.
5. JSON: `access_token`, `expires_in`, `refresh_token`, `token_type`, `id_token`, `scope`, `session_state`, `not-before-policy`.

---

## Lab 4.1: Nota sobre o passo 4

- `code_verifier` exposto no POST body é esperado, não é falha.
- Por quê: (a) essa troca acontece sobre TLS; (b) o `code_challenge` já provou posse antes.
- Revelar o verifier agora não desfaz a prova feita no passo 1.

## Lab 4.2: A diferença do OIDC

- `id_token` no response do passo 5: OAuth2 puro não teria isso.
- `access_token` = autorização. `id_token` = identidade, assinada pelo emissor.
- Header do `id_token`: `{"alg":"RS256","typ":"JWT","kid":"<id>"}`.
- Payload: `iss`, `sub`, `aud`, `exp` + claims de perfil.

## Lab 4.2: Verificando a assinatura

- `GET /realms/seminc2026/.well-known/openid-configuration` → campo `jwks_uri`.
- `GET /realms/seminc2026/protocol/openid-connect/certs` → JWK Set.
- `kid` do token deve casar com um `kid` do JWK Set.
- Assim qualquer resource server verifica sem "confiar de boca" no HoloNet.

## Lab 4.2: Flag

- Tente decodificar o `id_token` / `access_token`

---

## Lab 4.3: O problema do bearer token

- `access_token` comum = bearer: quem tem a string, usa. Ponto.
- Vazou (XSS, log, proxy mal configurado)? Reproduzível por qualquer um.
- DPoP (RFC 9449): amarra o token a um par de chaves que o client mantém.

## Lab 4.3: Como funciona

- Client assina uma prova JWT curta a cada requisição:
  - header `typ: dpop+jwt`
  - `htm` (método), `htu` (URL), `jti` (único), `iat`
- Assinada com a chave **privada** do client.
- Resource server confere a chave pública embutida contra `cnf.jkt` do token.

## Lab 4.3: No proxy

- Login pelo client `holonet-audit-app-dpop`.
- Dois headers novos em cada requisição autenticada:

```
Authorization: DPoP <access_token>
DPoP: <prova JWT assinada>
```

- Scheme é `DPoP`, não `Bearer`: não é cosmético.

## Lab 4.3: O ponto mais importante do módulo

- Token emitido com `token_type: DPoP`.
- `Authorization: Bearer <token>` sem header `DPoP:` → **401 imediato, sem meio-termo**.
- Reenviar a mesma prova (mesmo `jti`) → **401**: Keycloak detecta reuse.
- Não é "replay mais difícil". É: **token roubado sem a chave privada = inutilizável**.
- Contraste direto com o Lab 4.1, onde o token roubado funcionaria para qualquer um.

## Lab 4.3: A claim `cnf`

```json
"cnf": { "jkt": "<thumbprint>", "kc-jkt-type": "DPoP" }
```

- `jkt` = thumbprint da chave pública exigida em toda prova futura.
- Vínculo criptográfico entre token e chave: vale screenshot.

## Lab 4.3: Flag

- Claim `dpop_flag`, exclusiva deste client (não aparece no client normal), no mesmo formato `SEMINC2026{...}`.

## O que ficou provado

- Lab 4.1: token roubado = passe livre até expirar.
- Lab 4.3: token roubado = papel sem a chave que o ativa.
- OIDC: assinatura verificável por qualquer resource server.
- DPoP: muda a pergunta de "quem tem essa string" para "quem tem essa chave privada".
