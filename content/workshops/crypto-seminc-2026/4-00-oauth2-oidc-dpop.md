+++
date = 2026-01-01
title = "Módulo 4: Identidade: OAuth2, OIDC e DPoP"
weight = 400
[extra]
part = 4
section = 0
read_time_minutes = 13
hands_on_minutes = 35
+++

## Missão

Observe os bytes de verdade, não a documentação, e entenda por que o HoloNet delegar o login ao Keycloak deixa o sistema mais seguro contra roubo de token. "Confie no fornecedor" não é a resposta certa.

Nos capítulos anteriores você configurou o Vault, de dev mode a HA, TLS e PKI, deu uma primeira olhada no Keycloak do HoloNet e subiu sua própria instância, com seu próprio client. Agora você vai colocar um proxy entre o seu navegador e o Keycloak e assistir ao protocolo inteiro, Authorization Code, PKCE, OIDC, DPoP, acontecer em texto legível, byte a byte.

## O ambiente

O realm `seminc2026` já está no ar em:

**[https://seminc2026-keycloak.bortoli.phd](https://seminc2026-keycloak.bortoli.phd)**

Dentro dele existem dois clients OIDC públicos, ambos configurados como Standard Flow + PKCE (método `S256`), sem client secret: nenhum dos dois pode guardar segredo, são clients públicos, tipo SPA.

- `holonet-audit-app`: o client "normal", usado no Lab 4.1 e no Lab 4.2.
- `holonet-audit-app-dpop`: configuração idêntica, com uma diferença: `dpop.bound.access.tokens=true`. É o client do Lab 4.3.

Os usuários de demonstração são os mesmos do módulo de auditoria: `anakin`/`younglingslayer9000`, `obiwan`/`sabinelover123`, `ahsoka`/`notajedi`.

## Setup: interceptando seu próprio tráfego HTTPS

Ferramenta recomendada: **mitmproxy**. Funciona também com Burp Community, mas o mitmproxy não tem os limites de modificação de resposta da edição gratuita do Burp, e a distribuição do certificado de CA local é mais simples. Suba via Docker, não via instalação local:

```bash
docker run --rm -it \
  --name mitmproxy \
  -p 8080:8080 \
  -p 8081:8081 \
  -v ~/.mitmproxy:/home/mitmproxy/.mitmproxy \
  mitmproxy/mitmproxy mitmweb --web-host 0.0.0.0
```

Duas portas, dois papéis: `8080` é o proxy HTTP/HTTPS de fato, o que o navegador vai apontar pra ele; `8081` é a interface web do `mitmweb`, onde você acompanha as requisições em tempo real, num navegador separado, sem precisar ler log de terminal. O volume `~/.mitmproxy:...` persiste a autoridade certificadora que o mitmproxy gera no primeiro boot. Sem ele, cada `docker run` novo gera uma CA diferente, e o certificado que você instalou no passo anterior vira inválido a cada restart do container.

Abra `http://127.0.0.1:8081` (o token de acesso aparece no log do container) pra acompanhar o fluxo em tempo real.

Para o navegador, use um perfil isolado, apontado direto pro proxy, em vez do seu perfil comum:

```bash
chromium --proxy-server="http://127.0.0.1:8080" --user-data-dir="/tmp/chrome-mitm"
```

`--user-data-dir` aponta pra um perfil descartável, sem seus cookies, extensões ou certificados de confiança de sempre. Isso evita dois problemas: instalar a CA do mitmproxy no seu perfil principal (que você teria que lembrar de remover depois), e qualquer configuração antiga desse perfil (proxy diferente, extensão que reescreve requisição) interferir na captura.

Com o Chromium aberto assim, acesse `http://mitm.it` e instale o certificado de CA do mitmproxy. Sem isso o navegador rejeita a conexão TLS com o Keycloak, porque o mitmproxy está fazendo um MITM na sua própria sessão para exibir o conteúdo.

Com o proxy no ar e o certificado confiável, abra, através do navegador configurado:

**[https://seminc2026-oauthclient.bortoli.phd](https://seminc2026-oauthclient.bortoli.phd)**
É um client de demonstração, hospedado pelo próprio HoloNet: dois botões, um por client OIDC (`holonet-audit-app` e `holonet-audit-app-dpop`). Clique no primeiro pra este lab.

## Lab 4.1: Authorization Code + PKCE

### O que o PKCE resolve

PKCE (Proof Key for Code Exchange, RFC 7636) existe porque o Authorization Code Flow, por si só, tem um buraco em clients públicos: qualquer app que não guarda segredo (SPA, app mobile, CLI) não tem como provar, no momento da troca do `code` por um token, que é o mesmo client que iniciou o fluxo. Um `code` interceptado no meio do caminho, por exemplo por outro app instalado no mesmo dispositivo que registra o mesmo `redirect_uri` custom scheme, poderia ser trocado por outra parte.

O PKCE fecha esse buraco assim:

1. O client gera um `code_verifier` aleatório (uma string de alta entropia).
2. Deriva `code_challenge = base64url(SHA256(code_verifier))`.
3. Na requisição de autorização, envia só o `code_challenge`. O `code_verifier` nunca sai do client nessa etapa.
4. Na troca do `code` por token, o client finalmente revela o `code_verifier` original.
5. O Keycloak reaplica SHA-256 sobre esse `code_verifier` e compara o resultado com o `code_challenge` recebido no passo 1. Se não bater, a troca é recusada.

Quem interceptasse só a requisição de autorização (passo 1) teria o `code_challenge`, mas SHA-256 não é reversível: não dá pra reconstruir o `code_verifier` a partir dele. Quem interceptasse só o `code` de redirecionamento, sem ter visto o `code_verifier` original, também não consegue completar a troca. A prova de posse fica dividida em duas metades, e só o client legítimo tem as duas.

### Os 5 passos que você vai encontrar no proxy

Com o mitmproxy capturando, refaça o login pelo link do `holonet-audit-app`. No log de requisições, procure por estes 5 momentos, na ordem:

**1. Requisição de autorização**

```
GET /realms/seminc2026/protocol/openid-connect/auth?
  response_type=code&
  client_id=holonet-audit-app&
  redirect_uri=https://seminc2026-oauthclient.bortoli.phd/callback.html&
  code_challenge=<hash>&
  code_challenge_method=S256&
  state=...&
  scope=openid
```

Repare nos dois parâmetros que o PKCE adiciona: `code_challenge` e `code_challenge_method=S256`. Sem eles, um client público estaria fazendo Authorization Code puro, algo que o Keycloak nem aceita nesse realm, porque PKCE é obrigatório nos dois clients.

**2. Envio do formulário de login**

Um `POST` para a própria página de login do Keycloak, não é o HoloNet que hospeda essa tela. Esse é o ponto central da delegação de identidade: a senha do usuário nunca passa pelo backend do HoloNet, só pelo Keycloak.

**3. Redirecionamento de volta ao `redirect_uri`**

```
GET https://seminc2026-oauthclient.bortoli.phd/callback.html?
  code=<código de autorização>&
  state=...&
  session_state=...&
  iss=https://seminc2026-keycloak.bortoli.phd/realms/seminc2026
```

O `state` deve bater exatamente com o que foi enviado no passo 1, proteção contra CSRF no fluxo de login. O `iss` confirma qual realm emitiu a resposta.

**4. Troca do código por token, o momento de virada do lab**

```
POST /realms/seminc2026/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=<código do passo 3>&
redirect_uri=https://seminc2026-oauthclient.bortoli.phd/callback.html&
client_id=holonet-audit-app&
code_verifier=<verifier em texto simples>
```

Ali está: o `code_verifier` inteiro, em texto simples, no corpo do POST. É o valor que, via SHA-256, gerou o `code_challenge` do passo 1, agora totalmente exposto no proxy.

Isso não é uma falha do fluxo, é esperado e é seguro por dois motivos. Primeiro, essa troca inteira acontece sobre TLS, só está visível pra você porque é o seu próprio proxy, com seu próprio certificado, na sua própria máquina. Segundo, o `code_challenge` do passo 1 já cumpriu o papel dele, provar posse, antes mesmo do `code_verifier` ser revelado. Revelar o verifier agora não desfaz a prova feita antes.

**5. Resposta com os tokens**

```json
{
  "access_token": "...",
  "expires_in": 300,
  "refresh_expires_in": 1800,
  "refresh_token": "...",
  "token_type": "Bearer",
  "id_token": "...",
  "not-before-policy": 0,
  "session_state": "...",
  "scope": "openid profile email"
}
```

Encontre os 5 passos no seu próprio log antes de seguir. É a base de tudo o que vem depois neste módulo.

## Lab 4.2: A diferença do OIDC

Repare de novo na resposta do passo 5: tem um campo `id_token` ali que um fluxo OAuth2 puro, sem a camada OIDC, simplesmente não teria. `access_token` é sobre autorização, o que o portador pode fazer. `id_token` é sobre identidade, quem o usuário é, assinado pelo emissor. Essa diferença separa "OAuth2" de "OpenID Connect": OIDC é OAuth2 mais uma camada de identidade federada em cima.

Decodifique o `id_token` (jwt.io, ou qualquer decodificador de linha de comando: é só um JWT, três partes separadas por `.`, header e payload em base64url). A própria página de callback já mostra os dois tokens decodificados na tela, como conferência, mas o exercício de decodificar por conta própria é o que importa aqui. O header:

```json
{ "alg": "RS256", "typ": "JWT", "kid": "<algum id>" }
```

O payload traz `iss`, `sub`, `aud`, `exp`, e claims de perfil do usuário logado.

Vá até o discovery document do realm:

```
GET /realms/seminc2026/.well-known/openid-configuration
```

Localize o campo `jwks_uri` na resposta, que aponta para:

```
GET /realms/seminc2026/protocol/openid-connect/certs
```

Essa segunda URL devolve o JWK Set: as chaves públicas do realm. Confira que o `kid` do header do seu `id_token` aparece como o `kid` de uma das entradas desse JWK Set. É assim que a verificação de assinatura funciona de fato: qualquer resource server pode buscar essa lista de chaves públicas e confirmar que o token foi mesmo assinado pela chave privada correspondente do Keycloak, sem nunca precisar confiar "de boca" no HoloNet.

## Lab 4.3: DPoP (RFC 9449)

### O problema que ficou aberto

Todo `access_token` que você viu até aqui é um **bearer token**: quem tiver a string, usa. Ponto. Se ele vazar, um XSS que lê `localStorage`, um log que capturou o header `Authorization` por engano, um proxy mal configurado, quem pegou o token pode simplesmente reproduzi-lo em outra requisição e o resource server aceita, porque não tem como distinguir "o client legítimo" de "alguém com uma cópia da string".

DPoP (Demonstrating Proof of Possession, RFC 9449) resolve isso amarrando o token a um par de chaves assimétrico que o client mantém. A cada requisição, o client:

1. Gera (ou reusa) um par de chaves.
2. Monta um JWT de prova curto, com header `typ: dpop+jwt`, contendo `htm` (o método HTTP da requisição), `htu` (a URL de destino), `jti` (um identificador único, de uso único) e `iat`.
3. Assina essa prova com a chave **privada**.
4. Envia a prova no header `DPoP:` junto com a requisição.

O resource server valida a assinatura da prova com a chave pública embutida nela, e confere essa chave pública contra um thumbprint (`cnf.jkt`) cravado no `access_token` no momento da emissão. Só bate se for a mesma chave.

### Repetindo o fluxo no client DPoP

Na mesma página, clique agora no segundo botão, o do `holonet-audit-app-dpop`, por meio do mesmo proxy, e repita o login. No log, ao lado de cada requisição autenticada, você vai encontrar dois headers novos:

```
Authorization: DPoP <access_token>
DPoP: <prova JWT assinada>
```

Note o nome do scheme: é `DPoP`, não `Bearer`. Isso não é cosmético.

A conclusão correta não é "DPoP torna o replay mais difícil". É ainda mais forte que isso: um token DPoP roubado é **inutilizável** sem a chave privada que assinou a prova original (pelo menos até os computadores quanticos ficarem viáveis...). No Lab 4.1, um `access_token` roubado funcionaria para qualquer um que o pegasse, sem exceção. Aqui, não.

Decodifique o `access_token` deste client e localize a claim `cnf`:

```json
"cnf": { "jkt": "<thumbprint>", "kc-jkt-type": "DPoP" }
```

Esse `jkt` é o thumbprint da chave pública que o Keycloak vai exigir em toda prova DPoP futura para este token: é o vínculo criptográfico entre o token e a chave. Vale um screenshot.

Este client também carrega sua própria claim de flag, separada da do Lab 4.2. `dpop_flag` só aparece nos tokens (e no userinfo) do client DPoP, não no client normal, e traz a flag deste laboratório no mesmo formato `SEMINC2026{...}`.
