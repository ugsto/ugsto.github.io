+++
date = 2026-01-01
title = "Módulo 2: Auditoria: Criptografia em Repouso"
weight = 200
[extra]
part = 2
section = 0
read_time_minutes = 7
hands_on_minutes = 9
+++

## Missão

O banco de dados do HoloNet Bank acabou de "vazar". Na prática, você vai explorar o mesmo bug de SQL Injection que um atacante real usaria. Seu trabalho é determinar, para cada um dos 5 esquemas de armazenamento de senha que o HoloNet já tentou, exatamente o que um atacante ganha, e comprovar isso com uma senha recuperada ou decifrada, não um palpite.

**Critério de sucesso:** para cada uma das 5 iterações, afirme o raio de impacto concreto (nada protegido, trivialmente reversível, instantaneamente quebrável, quebrável com esforço, ou efetivamente seguro) e comprove as quatro primeiras com uma senha em texto simples de fato recuperada.

Este é o módulo principal do minicurso: 5 capítulos, um por esquema, cada um reaproveitando a mesma injeção contra uma tabela diferente.

## O alvo

O sistema de login do HoloNet Bank está no ar em:

**[https://seminc2026-login.bortoli.phd](https://seminc2026-login.bortoli.phd)**

Ele guarda 5 tabelas, uma por iteração de "melhoria" de segurança que o time do HoloNet tentou ao longo do tempo: `users_plain`, `users_enc_sym`, `users_md5`, `users_md5_salt`, `users_argon2id`. Cada tabela tem os mesmos 4 usuários de teste (`admin`/`admin`, `anakin`/`younglingslayer9000`, `obiwan`/`sabinelover123`, `ahsoka`/`notajedi`), protegidos de um jeito diferente em cada uma.

Cada endpoint de login é um `POST` com campos de formulário `user` e `pass`. A resposta JSON sempre inclui `query_executed` (a query SQL crua, já interpolada, que o backend efetivamente rodou) e `data` (as linhas retornadas por ela). Sempre, independente de `status` dizer `"success"` ou `"fail"`. O HoloNet deixou um painel de debug ligado em produção sem perceber, e `data` é o artefato de prova em todo este módulo, não `status`. Você vai ver requisições que retornam `status: fail` e mesmo assim despejam a tabela inteira em `data`.

## O que você tem pra trabalhar

O formulário de login recebe `user` e `pass`, e a resposta sempre inclui `query_executed`: a query SQL crua, já com o que você digitou colado dentro dela. Isso é tudo que você precisa saber antes de tentar qualquer coisa. Se o seu input vira parte literal do texto da query, e não um valor tratado separadamente, existe uma classe inteira de ataque disponível, e o nome dela você provavelmente já ouviu.

**Mão na massa.** Tente logar. Tente algo que não seja uma senha normal. Observe o que `query_executed` mostra a cada tentativa, e deixe isso guiar a próxima. O objetivo, nesta primeira rodada: entrar sem saber a senha de ninguém. Na segunda rodada, mais ambiciosa: fazer a resposta devolver linhas da tabela que você nunca deveria ver.

## O raio de impacto de `users_plain`

Depois de conseguir ler a tabela: o que você encontra lá é a senha exatamente como o usuário digitou, sem proteção nenhuma. Qualquer leitura da tabela (via este bug, via um backup mal protegido ou via um DBA malicioso) é a senha final, sem nenhuma etapa intermediária.

Uma das linhas que aparece na tabela pertence a uma conta chamada `holonet-ci`, um resquício de automação que nunca devia ter ido pra produção. O valor que está no lugar da senha dela, nessa tabela especificamente, é a flag deste capítulo, e a única forma de ler o valor real é você mesmo(a) ter chegado até essa linha.

## O que vem a seguir

O mesmo caminho de ataque que abriu essa tabela continua funcionando contra as outras 4 abaixo; o que muda é só o que você ganha ao vencer. `users_enc_sym`, no próximo capítulo, troca "nada protegido" por "cifrado com uma chave que também está ao seu alcance". Depois vêm dois esquemas de hash, cada um fechando uma porta diferente que o anterior deixava aberta.

<details>
<summary>Se travar de verdade: a solução (não abra antes de tentar)</summary>

O bypass clássico, no campo `user`:

```text
' OR '1'='1' --
```

`'1'='1'` é sempre verdadeiro, e `--` comenta o resto da linha, então a comparação de senha nunca é avaliada. Qualquer coisa no campo `pass` funciona.

Para ler a tabela inteira, SQL permite concatenar duas queries `SELECT` com `UNION`, desde que as duas devolvam o **mesmo número de colunas**. A query original seleciona `user, pass` (duas colunas), então:

```text
' UNION SELECT user, pass FROM users_plain --
```

Isso devolve as 4 contas reais em texto simples, mais a linha de `holonet-ci` com a flag no lugar da senha.

</details>
