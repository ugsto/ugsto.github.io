## Missão

- Subir seu próprio Keycloak
- Configurar um client igual ao `holonet-audit-app`
- Logar contra o seu próprio realm

---

## Suba o seu

```bash
docker run -d --name keycloak-proprio -p 8080:8080 \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin-local \
  quay.io/keycloak/keycloak:26.4 start-dev
```

- `start-dev` = o `-dev` do Vault: H2 embutido, sem TLS, nunca produção

---

## Token de admin + realm

```bash
ADMIN_TOKEN=$(curl -s -d 'client_id=admin-cli' -d 'grant_type=password' \
  -d 'username=admin' -d 'password=admin-local' \
  http://localhost:8080/realms/master/protocol/openid-connect/token \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"realm": "meurealm", "enabled": true}' \
  http://localhost:8080/admin/realms
```

---

## O client, 4 decisões

```json
{
  "publicClient": true,
  "standardFlowEnabled": true,
  "directAccessGrantsEnabled": false,
  "attributes": {"pkce.code.challenge.method": "S256"}
}
```

- `publicClient`: sem secret, tipo SPA
- só `standardFlow`: nada de implicit, nada de password grant
- `directAccessGrantsEnabled: false`: fecha o atalho que contornaria o PKCE
- `S256`, não `plain`: `plain` não prova posse de nada

---

## Login contra o seu realm

```text
http://localhost:8080/realms/meurealm/protocol/openid-connect/auth?
  response_type=code&client_id=meuapp&
  redirect_uri=http://localhost:9000/callback&
  scope=openid&code_challenge=...&code_challenge_method=S256
```

- Mesmo comportamento do client do instrutor: mesma configuração

---

## O gotcha: Secure + SameSite=None

- Keycloak marca cookies `Secure`/`SameSite=None`, mesmo em `start-dev`, sem TLS
- `SameSite=None` sem `Secure` é rejeitado por qualquer navegador moderno
- `curl` puro: "Restart login cookie not found"
- Navegador de verdade em `http://localhost`: funciona
- Por isso login OIDC em produção não roda sem HTTPS de verdade

---

## O raio de impacto

- 4 decisões explícitas reproduzem o que era caixa preta
- Nenhuma é padrão de fábrica: cada uma foi escolhida
- Próximo: Parte 4, o mesmo protocolo em bytes reais, via proxy
