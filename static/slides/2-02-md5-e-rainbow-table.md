## `users_md5`: hash unidirecional, sem sal

- Mesma injeção do capítulo 2.0

## O pseudo rainbow table

`https://seminc2026-rainbowtable.bortoli.phd`

- Índice MD5 → senha, construído sobre `rockyou.txt` (14,3M entradas)
- Senhas do desafio forçadas dentro do índice
- Form em `/`, ou `GET /api/lookup?hash=<md5>`
- Nenhuma computação na consulta: trade-off tempo-memória clássico

## Mão na massa

`https://bortoli.phd/seminc2026-login/md5`

- Repete o `UNION SELECT` do capítulo 2.0 contra `users_md5`
- O que tem na coluna `pass` da linha `holonet-ci`?
- Testa os 4 hashes reais contra o serviço de lookup: quanto tempo leva a resposta?
- O que essa velocidade te diz sobre o que a ferramenta está fazendo por debaixo?

## Raio de impacto: `users_md5`

- O que muda entre "quebrar por força bruta" e "consultar um índice já pronto"?
- Pra quantas senhas do mundo real essa diferença já deixou de existir?

Próximo: e se cada senha tivesse um sal aleatório?
