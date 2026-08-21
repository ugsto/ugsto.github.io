## Missão: fique tão rico quanto o Elon

- `seminc2026-accounts.bortoli.phd`: saldo cifrado em AES-256-ECB, mesma chave estática do `2-01`
- Você começa com R$ 299,99. A flag custa R$ 300,00.
- Objetivo: fazer sua conta acreditar que tem o saldo do Elon, sem saber a chave e sem decifrar nada dele

---

## O que a página mostra

- Sua conta: nome, saldo, botão de extrato, botão de restaurar backup, botão de comprar a flag
- Um "ledger" público: outras contas do banco, bytes cifrados crus, visíveis pra qualquer um
- Você só compra a flag pela sua própria conta

---

## Mão na massa

- Olhe o ledger com atenção
- Descubra como mover dinheiro de uma conta pra outra sem nunca ter a chave e sem decifrar nada
- E sem que o servidor perceba que o que você mandou de volta não é genuíno

---

## Depois de ter a flag

- Em ECB, cada bloco é cifrado de forma independente: o que isso te deixou mover sem tocar em nada além disso?
- Bastou um bloco de 16 bytes, não dois. Por quê?
- O que teria mudado se o formato tivesse encadeamento entre blocos?
