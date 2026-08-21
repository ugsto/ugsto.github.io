+++
date = 2026-01-01
title = "Argon2id resiste à força bruta e não importa"
weight = 204
[extra]
part = 2
section = 4
read_time_minutes = 10
hands_on_minutes = 18
+++

## Recapitulando

`users_md5_salt` ensinou uma técnica para evitar rainbow tables pré calculadas, mas não faz nada contra a velocidade por tentativa de um algoritmo intrinsecamente rápido como MD5. Ficou a pergunta: e se, além do salt, o hash em si fosse caro de computar? `users_argon2id` é a resposta do HoloNet, e a primeira tabela deste módulo onde os 4 usuários reais resistem de fato ao ataque que quebrou tudo antes.

## O alvo: `users_argon2id`

Mesma técnica de UNION que já abriu as quatro tabelas anteriores, agora contra uma tabela com uma coluna extra: `user`, `pass`, `note`. As linhas dos 4 usuários reais trazem, na coluna `pass`, strings Argon2id completas, no formato:

```text
$argon2id$v=19$m=65536,t=3,p=4$<salt>$<hash>
```

Os parâmetros são idênticos em todo hash desta tabela: `m=65536` (custo de memória em KiB, 64 MB por tentativa), `t=3` (3 iterações), `p=4` (paralelismo de 4 lanes). Salt e hash mudam por usuário, embutidos na própria string, mas os três parâmetros de custo são os mesmos pra todo mundo.

Mão na massa. Reaplica a mesma injeção de UNION que você já usa desde `2-00`, agora pedindo as três colunas desta tabela. Depois, roda o mesmo ataque de força bruta do capítulo `2-03` contra os hashes reais que aparecerem (mesma wordlist, mesmas regras), só que agora contra Argon2id (modo `-m 34000` no hashcat real) em vez de MD5. Não espera terminar: observa a estimativa de ETA que o hashcat imprime antes de começar a rodar de verdade, e compara com o que apareceu no capítulo anterior contra MD5.

## Por que a diferença é tão grande

Argon2id é memory-hard por design: cada tentativa de hash não é só algumas operações aritméticas rápidas como no MD5, ela exige alocar um bloco de memória (aqui, 64 MB) e trabalhar dentro dele repetidamente. Uma GPU tem milhares de núcleos, mas toda essa frota compartilha a mesma banda de memória. Rodar 10 mil tentativas de Argon2id em paralelo significa competir por 10 mil × 64 MB de memória simultaneamente, o que estrangula exatamente o paralelismo massivo e barato que faz GPU ser boa em quebrar MD5. MD5 não tem esse custo: cada tentativa usa quase nenhuma memória, então a GPU escala livre.

## A flag mora em outro lugar

A linha de `holonet-ci` nesta tabela é diferente de todas as anteriores: a coluna `pass` dela é um hash Argon2id real e não craqueado de uma string aleatória descartável. Não tem nada pra quebrar ali, de propósito. Se você atacasse aquele hash especificamente, ele resistiria como qualquer Argon2id bem configurado resiste.

Mas a mesma injeção de 3 colunas que você já rodou também projeta a coluna `note`, e é ali, em texto claro, que mora a flag deste capítulo. Ela não vem de decifrar hash nenhum: vem só de terminar de rodar a mesma injeção que você já sabe fazer.

A lição é explícita: Argon2id genuinamente resiste a força bruta aqui, os números acima são reais, não teatro. Mas a SQL Injection já tinha ganho independente disso, porque a vulnerabilidade nunca foi sobre o hash. O conserto de verdade nunca foi "faz o hash mais difícil", é "para de concatenar entrada de usuário dentro de SQL". Um algoritmo de hash perfeito guardando senha numa tabela que qualquer um lê via injeção é uma fechadura de cofre instalada numa parede de papel.

<details>
<summary>Se travar de verdade: a solução (não abra antes de tentar)</summary>

Mesmo bypass de sempre no campo `user`, agora pedindo as três colunas de `users_argon2id`:

```text
' UNION SELECT user, pass, note FROM users_argon2id --
```

Isso devolve os 4 hashes Argon2id reais, mais a linha de `holonet-ci`, cuja coluna `note` carrega a flag deste capítulo em texto claro.

</details>
