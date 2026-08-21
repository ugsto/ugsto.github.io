## Modos de operação: teoria, sem lab

- AES cifra 16 bytes por vez. Só isso.
- O que fazer com o resto? É isso que um modo de operação define
- Você já viu ECB falhar (`2-01`)

---

## ECB

```text
C_i = E(P_i)
P_i = D(C_i)
```

<img src="/images/seminc2026/ecb_enc.webp" alt="ECB encryption diagram" width="100%" />

<img src="/images/seminc2026/ecb_dec.webp" alt="ECB decryption diagram" width="100%" />

Fonte: [WikiPedia](https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation)

---

## CBC

```text
C_i = E(P_i XOR C_{i-1})
P_i = D(C_i) XOR C_{i-1}
```

<img src="/images/seminc2026/cbc_enc.webp" alt="CBC encryption diagram" width="100%" />

<img src="/images/seminc2026/cbc_dec.webp" alt="CBC decryption diagram" width="100%" />

Fonte: [WikiPedia](https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation)

---

## CTR

```text
C_i = P_i XOR E(nonce || i)
```

<img src="/images/seminc2026/ctr_enc.webp" alt="CTR encryption diagram" width="100%" />

<img src="/images/seminc2026/ctr_dec.webp" alt="CTR decryption diagram" width="100%" />

Fonte: [WikiPedia](https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation)

---

## GCM

Criptografia:

```text
C_i = P_i XOR E(nonce || (i + 1))
P_i = C_i XOR E(nonce || (i + 1))
```

Autenticação:

```text
H = E(0^128)
S = GHASH_H(AAD || C || len(AAD) || len(C))
T = S XOR E(nonce || 0)
```

- AEAD: cifra E autentica no mesmo primitivo
- Qualquer bit alterado → tag falha → nada é devolvido
- Padrão atual pra cifrar dado novo (AES-256-GCM / ChaCha20-Poly1305)

Fonte: [WikiPedia](https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation)

---

## A tabela

| Modo | Blocos independentes | Autentica | Uso hoje |
|---|---|---|---|
| ECB | Sim (por isso é ruim) | Não | Nunca |
| CBC | Não | Não | Legado |
| CTR | Sim | Não | Base de AEAD |
| GCM | Sim | **Sim** | Padrão atual |


---

## Próximo capítulo

- Um sistema real do HoloNet ainda cifrado em ECB
- O que a independência entre blocos permite fazer sem nunca saber a chave
