+++
date = 2026-01-01
title = "MD5 sem salt: uma tabela pré-computada resolve tudo"
weight = 202
[extra]
part = 2
section = 2
read_time_minutes = 8
hands_on_minutes = 11
+++

## Recapitulando

`users_enc_sym` mostrou que criptografia simétrica não serve pra guardar senha e por isso que usamos hashes, funções unidirecionais, nas quais não existe "decifrar", só recomputar e comparar. `users_md5` é a primeira tentativa do HoloNet nessa direção, e a primeira lição é que "unidirecional" não é sinônimo de "seguro".

## O alvo: `users_md5`

A mesma técnica de injeção do capítulo 2.0 continua funcionando aqui, sem nenhuma mudança de abordagem. Basta trocar o nome da tabela. `data` retorna os hashes MD5 dos 4 usuários reais, sem sal, mais uma quinta linha, de uma conta chamada `holonet-ci`, cujo valor na coluna `pass` não se parece nada com um MD5 de 32 caracteres hex.

```json
[
  {"user": "admin", "pass": "21232f297a57a5a743894a0e4a801fc3"},
  {"user": "anakin", "pass": "1f13ea67f34279faa3d0c51a7c58c03a"},
  {"user": "obiwan", "pass": "42540af7f12be790c3a167bc9f443a84"},
  {"user": "ahsoka", "pass": "1e728382fce8b32c8ec82369d26cd46e"}
]
```

**Mão na massa.** Repete a mesma injeção do capítulo 2.0 contra esta tabela. Se lembra do formato do `UNION SELECT` que já funcionou uma vez? Ele funciona de novo aqui, só muda o nome da tabela no final. Depois de conseguir o dump completo, repara na quinta linha antes de seguir: o que tem na coluna `pass` de `holonet-ci` não bate com o padrão das outras quatro. Guarda essa observação, ela é a flag deste capítulo. Esse valor exato só existe pra quem chegou até essa linha.

## A ferramenta: um "pseudo rainbow table"

MD5 é rápido de computar (bilhões por segundo numa GPU comum), o que por si só já é ruim pra hash de senha. Mas o ataque mais direto contra MD5 sem salt não precisa nem computar nada em tempo real: usa uma tabela pré-computada.

Pra este módulo, existe uma ferramenta hospedada especificamente pra isso:

**[https://seminc2026-rainbowtable.bortoli.phd](https://seminc2026-rainbowtable.bortoli.phd)**

É um índice MD5 → senha, construído a partir da wordlist `rockyou.txt` completa (14,3 milhões de entradas, o mesmo corpus referenciado em outros pontos do workshop), com as senhas deste desafio específico forçadas dentro do índice mesmo não sendo palavras naturalmente comuns. Tem um formulário em `/` pra colar um hash, e uma rota programática, `GET /api/lookup?hash=<md5>`.

**Mão na massa.** Pega cada um dos 4 hashes reais que você já tem no dump e testa contra o serviço acima, pelo formulário ou pela rota de API. Observe a velocidade da resposta e pense no que isso implica: nenhuma GPU rodando, nenhuma espera, comparado com o que seria necessário pra atacar isso por força bruta. É essa diferença entre consulta de índice e computação ao vivo que define o raio de impacto deste esquema.

## O que vem a seguir

E se cada usuário tivesse um valor aleatório extra somado à senha antes do hash? Essa é a pergunta que o próximo capítulo responde, e a resposta tem uma reviravolta que faz esse módulo valer a pena parar e prestar atenção.

<details>
<summary>Se travar de verdade: a solução (não abra antes de tentar)</summary>

O `UNION SELECT` é exatamente o mesmo do capítulo 2.0, só com a tabela trocada:

```text
' UNION SELECT user, pass FROM users_md5 --
```

Isso te dá o dump completo, incluindo a linha de `holonet-ci`.

A parte de submeter os 4 hashes reais ao serviço de rainbow table é basicamente colar um hash no formulário (ou chamar `GET /api/lookup?hash=<md5>`) e ver o que volta é o próprio exercício desta seção, e é rápido de fazer sozinho.

</details>
