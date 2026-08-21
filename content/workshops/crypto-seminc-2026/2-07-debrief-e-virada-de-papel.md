+++
date = 2026-01-01
title = "Debrief do módulo e a virada de papel"
weight = 207
[extra]
part = 2
section = 7
read_time_minutes = 4
hands_on_minutes = 8
+++

## Antes de virar a página

Preenche mentalmente (ou literalmente, se estiver acompanhando ao vivo) uma tabela de 5 linhas, uma por esquema de senha, com o raio de impacto de cada um e o que de fato o impediu. Aqui está a resposta completa, pra quem está lendo de forma assíncrona:

| Esquema | Raio de impacto | O que realmente impediu o ataque |
|---|---|---|
| `users_plain` | Nada protegido | Nada. A senha crua é a senha crua. |
| `users_enc_sym` (AES-256-ECB, chave fixa) | Trivialmente reversível | Nada de fato: é criptografia reversível por design, com a chave ao alcance no próprio código. |
| `users_md5` | Instantaneamente quebrável | Nada, pra qualquer senha já presente em algum vazamento conhecido, pois uma tabela pré-computada resolve sem custo de computação na hora. |
| `users_md5_salt` | Quebrável com esforço | O salt impediu reaproveitamento de pré-computação, forçando um ataque de dicionário ao vivo por usuário, mas não impediu a velocidade bruta do MD5 em si. |
| `users_argon2id` | Efetivamente seguro (contra este ataque específico) | O custo de memória por tentativa (64 MB) estrangula o paralelismo de GPU, tornando força bruta impraticável em escala de tempo razoável. |

Nenhuma linha dessa tabela, sozinha, teria impedido a flag de sair, porque a flag nunca dependeu de quebrar hash nenhum. Ela saiu do mesmo `UNION SELECT` em todas as 5 tabelas.

O sistema de contas do capítulo anterior é uma lição diferente, mas com a mesma forma: nenhuma senha foi quebrada, nenhuma chave foi descoberta. Um `path traversal`, um upload sem verificação, e um modo de cifra sem autenticação bastaram pra mover R$ 5 trilhões de uma conta pra outra.

## A virada de papel

Você é o auditor que acabou de encontrar tudo isso. O HoloNet Bank agora contratou você para corrigir (como engenheiro(a), não mais como auditor(a)). O que vem a seguir é o que você de fato colocaria em produção.
