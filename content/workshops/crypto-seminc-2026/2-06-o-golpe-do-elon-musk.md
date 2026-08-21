+++
date = 2026-01-01
title = "O golpe do Elon Musk: o preço de blocos independentes"
weight = 206
[extra]
part = 2
section = 6
read_time_minutes = 6
hands_on_minutes = 20
+++

## Missão

O HoloNet Bank também roda um sistema de contas, separado do login: `seminc2026-accounts.bortoli.phd`. Ele guarda saldo cifrado com o mesmo AES-256-ECB do capítulo `2-01`, usando a mesma chave estática que o HoloNet nunca trocou. Sua missão é fazer sua própria conta acreditar que tem o mesmo saldo que a conta de "Elon Musk", sem nunca saber a chave e sem nunca decifrar o saldo dele diretamente.

**Critério de sucesso:** o botão "Comprar flag" (R$ 300,00) libera a flag, e você consegue explicar, em uma frase, por que bastou mover um único bloco de 16 bytes, e nenhum a mais.

## O que a página mostra

Abra `https://seminc2026-accounts.bortoli.phd`. Sua conta comum: nome, saldo, botão pra baixar seu extrato, botão pra restaurar um backup, botão pra comprar a flag. Sua conta começa com R$ 299,99. A flag custa R$ 300,00.

A página também tem um "ledger" público: uma lista de outras contas do banco, cada uma mostrando seus bytes cifrados crus. Você pode ver essas contas. Você não pode comprar a flag por nenhuma delas: só pela sua.

Nenhum dos dois endpoints por trás dessa página (o de restaurar seu extrato, em especial) se comporta como você esperaria de quem estivesse defendendo este sistema.

**Mão na massa.** Olhe o ledger com atenção. Depois, descubra como mover dinheiro de uma conta pra outra sem nunca ter a chave e sem decifrar nada, e sem que o servidor perceba que o que você mandou de volta não é genuíno.

## Fechando o módulo

Você já viu os 5 esquemas de senha do login, viu ECB falhar de relance no capítulo `2-01`, e agora viu esse mesmo modo cair de verdade contra o sistema de contas. O próximo capítulo fecha o módulo e faz a virada de papel: você deixa de ser quem encontra os problemas e passa a ser quem os corrige.

<details>
<summary>Se travar de verdade: a solução completa (não abra antes de tentar)</summary>

**O formato do arquivo:** cada conta é 32 bytes, dois blocos de 16, sem IV (ECB não usa):

```text
[0:16)   bloco 0: nome de usuário, cifrado
[16:32)  bloco 1: saldo (string ASCII em centavos, com padding PKCS#7), cifrado
```

Em ECB, cada bloco é cifrado de forma independente: `C_i = E(P_i)`. Não existe encadeamento nenhum entre blocos, então decifrar o bloco 1 não depende do bloco 0.

**O que o ledger revela:** três contas (`han`, `chewbacca`, `yoda`) têm exatamente o mesmo saldo. Como ECB sempre produz o mesmo ciphertext pro mesmo plaintext, sob a mesma chave, os últimos 16 bytes dessas três contas no ledger são **byte-idênticos**, algo visível direto na página, sem decifrar nada. Isso confirma duas coisas: qual posição de bloco é o saldo, e que contas diferentes, cifradas com a mesma chave, produzem blocos comparáveis.

**O ataque:**

```bash
# baixa seu extrato (uso legítimo)
curl -s -c cookies.txt -b cookies.txt 'https://seminc2026-accounts.bortoli.phd/receipt' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data'])"
# copia o bloco de saldo do Elon a partir do /ledger (é público, não precisa de nenhum bug pra ler)
```

```python
import binascii

me = binascii.unhexlify(ME_HEX)      # 32 bytes: [meu username][meu saldo]
elon = binascii.unhexlify(ELON_HEX)  # 32 bytes: [username do Elon][saldo do Elon]

# mantém seu próprio bloco 0 (nome de usuário); troca só o bloco 1 (saldo)
tampered = me[:16] + elon[16:32]

with open("tampered.bin", "wb") as f:
    f.write(tampered)
```

```bash
curl -s -c cookies.txt -b cookies.txt -F "file=@tampered.bin" \
  'https://seminc2026-accounts.bortoli.phd/restore'
```

Recarregue a página: seu saldo agora é o saldo real do Elon, e o botão "Comprar flag" libera a flag. Chegar até essa tela é a prova; não há razão pra copiar o valor aqui.

**Por que só um bloco, diferente do que aconteceria em CBC:** em ECB não existe dependência entre blocos, então trocar só o bloco do saldo não corrompe nada ao redor, ao contrário de um modo encadeado, onde decifrar um bloco depende do bloco cifrado anterior. É exatamente essa ausência de encadeamento, mais a ausência total de autenticação (nada verifica se o arquivo restaurado é genuíno), que torna esse golpe possível sem nunca tocar na chave.

</details>
