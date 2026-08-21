## Bônus (opcional)

Primeiro item a ser cortado se faltar tempo.

Cenário: mensageria interna do HoloNet precisa de integridade, provar que a mensagem não foi adulterada no caminho.

**Missão:** construir a versão mínima.

**Sucesso:** adulterar uma mensagem, ver ela ser rejeitada, e explicar por que hash simples não pegaria isso.

---

## Hash puro não basta

`SHA256(M)` só garante integridade se o hash viajar por canal confiável.

Se o atacante pode adulterar a mensagem, ele recalcula o hash novo. Nada o impede, não tem segredo envolvido.

**Falta:** uma chave secreta compartilhada `K`.

`MAC(K, M)`: sem `K`, atacante não forja um MAC válido.

---

## Por que HMAC não é `hash(chave + mensagem)`

`H(K || M)` é vulnerável a **length-extension** em hashes Merkle-Damgård (MD5, SHA-1, SHA-256).

O estado interno do hash, no fim do processamento, **é** o próprio output. Um atacante pode retomar dali e continuar hasheando blocos extras, sem saber `K`.

HMAC aninha o hash duas vezes, chave misturada nas duas camadas:

```
HMAC(K, m) = H((K'⊕opad) || H((K'⊕ipad) || m))
```

Nunca expõe um estado correspondente só a `K || m`.

---

## Comparação: sempre tempo constante

`==` byte a byte vaza timing: atacante infere quantos bytes acertou, forja o MAC aos poucos.

- Python: `hmac.compare_digest`
- PHP: `hash_equals()`
- Go: `subtle.ConstantTimeCompare`

Nunca `==`.

---

## JWT: onde o MAC mora

`header.payload.signature`, cada parte em Base64URL.

`alg: HS256` → a assinatura é um HMAC-SHA256 sobre `base64url(header) + "." + base64url(payload)`, com chave simétrica.

Quem verifica também pode forjar: mesma chave dos dois lados.

`RS256`/`ES256`: assimétrico, só quem tem a chave privada assina.

**Cuidado (fora de escopo hoje):** `alg: none`, e confusão RS256→HS256 (chave pública RSA usada como segredo HMAC). Correção: fixar o `alg` esperado no servidor, nunca confiar no header do token.

---

## Implementação: assinar e verificar

```python
def create_signed_message(sender: str, content: str) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "iss": sender, "msg": content,
        "iat": int(time.time()),
        "exp": int(time.time()) + 300,
    }
    signing_input = f"{b64(header)}.{b64(payload)}".encode()
    signature = hmac.new(SECRET_KEY, signing_input, hashlib.sha256).digest()
    return f"{b64(header)}.{b64(payload)}.{b64(signature)}"


def verify_and_read_message(jwt_token: str) -> dict:
    header, payload, signature = jwt_token.split(".")
    expected = hmac.new(SECRET_KEY, f"{header}.{payload}".encode(),
                         hashlib.sha256).digest()
    if not hmac.compare_digest(expected, decode(signature)):
        raise ValueError("ASSINATURA INVALIDA!")
    data = json.loads(decode_json(payload))
    if time.time() > data["exp"]:
        raise TimeoutError("MENSAGEM EXPIRADA!")
    return data
```

`iat`/`exp`: MAC prova quem assinou e que não foi alterada, não prova *quando* vale, nem se já foi vista. Sem expiração, mensagem capturada é replayável pra sempre.

Limitação conhecida: só tem expiração, não tem `jti`/nonce. Replay dentro da janela de 5 min não é detectado.

---

## A flag mora num serviço ao vivo

```python
token = create_signed_message(
    sender="seu-nome-ou-email",
    content="qualquer coisa",
)
```

```bash
curl -X POST https://seminc2026-hmac.bortoli.phd/verify \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$token\"}"
```

- Mesmo `verify_and_read_message`, mesma `SECRET_KEY`, do outro lado
- Qualquer token seu, validado dentro da janela de 5 min → flag na resposta
- Missão nunca foi adivinhar mensagem, mas sim construir um token que passe

---

## Adulterando e sendo pego

Antes de rodar: o que trocar pra forjar, e por que a assinatura pega isso?

```python
parts = token.split(".")
tampered_payload = base64url_encode(
    b'{"iss":"attacker","msg":"Transferir R$1000000",'
    b'"iat":1700000000,"exp":1900000000}'
)
tampered_token = f"{parts[0]}.{tampered_payload}.{parts[2]}"

try:
    verify_and_read_message(tampered_token)
except ValueError as e:
    print("Sucesso! Ataque bloqueado:", e)
    # ASSINATURA INVALIDA! A mensagem foi adulterada.
```

Payload trocado, assinatura antiga não bate mais. Sem `SECRET_KEY`, não dá pra recalcular.

Um hash puro não pegaria isso: sem segredo, o atacante recalcula e passa.

---

## Fechando o arco

Módulo 1: texto simples capturado sem TLS.
Módulo 2: hash de senha quebrado e corrigido.
Módulos 3 a 4: Vault, Keycloak, OIDC.
Bônus: integridade de mensagem, via MAC/HMAC/JWT.

Próximos primitivos pra explorar: assinatura assimétrica (Ed25519), AEAD (AES-256-GCM), derivação de chave de senha (Argon2id).
