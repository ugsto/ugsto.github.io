+++
date = 2026-01-01
title = "AES-256-ECB com chave fixa: cifrado não é protegido"
weight = 201
[extra]
part = 2
section = 1
read_time_minutes = 9
hands_on_minutes = 14
+++

## Recapitulando

`users_plain`, do capítulo anterior, é a base de comparação: senha em texto simples, nenhuma proteção, qualquer leitura da tabela é a senha final. A partir daqui, cada tabela tenta fechar essa porta de um jeito diferente. A pergunta deste capítulo é se "cifrado" já resolve o problema.

## A tabela `users_enc_sym`

Essa tabela guarda as senhas cifradas com **AES-256-ECB**, usando uma chave estática embutida direto no código-fonte do backend, em `backend/main.py`, numa variável chamada `STATIC_AES_KEY_B64`. Uma chave fixa dentro do código é, na prática, uma chave pública para qualquer pessoa com acesso ao repositório, a um dump de bytecode, ou, como você vai ver, a um easter egg deixado na própria página.

Os blobs cifrados guardados nessa tabela vêm em base64url (o app usa `-`/`_` no lugar de `+`/`/`), então qualquer ferramenta de decodificação padrão vai exigir uma conversão antes de funcionar.

### O caminho pretendido pra achar a chave

Vá até a página `/login/enc-sym` e espere. Depois de uns 10 segundos parado sem interagir, aparece um popup estilo "pin de recado", assinado por um "funcionário anônimo e insatisfeito", revelando a chave em texto claro. É o caminho intencional do laboratório: literalmente alguém de dentro do HoloNet decidiu que a chave hardcoded merecia ser denunciada. Inspecionar o código-fonte funciona também, mas é o caminho de fallback, não o pretendido.

**Mão na massa.** Aponte a mesma técnica de injeção que você usou no capítulo anterior contra `users_enc_sym` em vez de `users_plain`. Antes de sair decifrando qualquer coisa, compare os blobs que voltarem: eles têm todos o mesmo tamanho? Se dois usuários tivessem a mesma senha, o que você esperaria ver nos blobs correspondentes, sabendo que ECB cifra cada bloco de 16 bytes de forma independente? Depois de achar a chave (esperando o popup ou lendo o código-fonte) e ajustar a codificação pro formato certo, você tem tudo que precisa pra decifrar os 4 blobs reais de volta às senhas originais. Em seguida, aplique exatamente o mesmo processo ao blob de `holonet-ci`.

## O que vem a seguir

O próximo esquema abandona criptografia reversível e vai para hash, unidirecional por definição. Mas hash sem cuidado extra tem seu próprio problema, e é isso que o capítulo 2.2 mostra.

<details>
<summary>Se travar de verdade: a solução (não abra antes de tentar)</summary>

Dump da tabela, reaproveitando a mesma injeção do capítulo anterior:

```text
' UNION SELECT user, pass FROM users_enc_sym --
```

A chave revelada pelo popup (ou pelo código-fonte):

```text
v-L5N62D2v0y88mX2a-3v3kI0gNqL2y7-U-37rQ5K4M=
```

Ela está em base64 padrão, mas os blobs estão em base64url. Convertendo a chave pra hex:

```bash
KEY_B64="v-L5N62D2v0y88mX2a-3v3kI0gNqL2y7-U-37rQ5K4M="
KEY_HEX="$(printf '%s' "$KEY_B64" | tr '_-' '/+' | base64 -d | od -An -tx1 | tr -d ' \n')"
```

```text
bfe2f937ad83dafd32f3c997d9afb7bf7908d2036a2f6cbbf94fb7eeb4392b83
```

64 caracteres hex = 32 bytes = 256 bits, confirmando o "256" do nome do algoritmo. Decifrando um blob (convertendo de base64url pra base64 padrão antes):

```bash
BLOB="B24Yxl26hYXQ-jcpAFGdhg=="
printf '%s' "$BLOB" | tr '_-' '/+' | base64 -d | openssl enc -aes-256-ecb -d -K "$KEY_HEX"
```

Esse blob é o de `admin`, e decifra para `admin`. O mesmo comando, trocando `BLOB` pelo valor da linha de `holonet-ci`, decifra pra flag do capítulo. O valor que sai dali, e só dali, é a flag.

</details>
