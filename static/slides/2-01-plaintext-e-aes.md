## `users_enc_sym`: AES-256-ECB, chave fixa

- O estagiário ouviu dizer que a cifra AES-256 era uma das mais recomendadas hoje em dia. Será que uma implementação assim está segura?

---

## Mão na massa

`https://bortoli.phd/seminc2026-login/enc-sym`

- Reaproveite a técnica de injeção do capítulo anterior contra `users_enc_sym`
- Antes de decifrar: os blobs têm todos o mesmo tamanho? O que isso já te diz?
- ECB cifra cada bloco de 16 bytes de forma independente: o que isso implicaria se dois usuários tivessem a mesma senha?
- Depois de achar a chave: qual ferramenta decifra AES-256-ECB com uma chave crua?

---

## Raio de impacto: `users_enc_sym`

- Reversível por design, chave hardcoded, e um terceiro problema: o que ECB deixa escapar mesmo sem decifrar nada
- "Cifrado" parece mais seguro que texto simples. É?

Próximo: O staff notou a implementação do estagiário e recomendou que ele usasse hash...
