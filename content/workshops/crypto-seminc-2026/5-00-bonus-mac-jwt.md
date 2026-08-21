+++
date = 2026-01-01
title = "Bônus: MAC, HMAC e JWT: integridade de mensagens"
weight = 500
[extra]
part = 5
section = 0
read_time_minutes = 10
hands_on_minutes = 18
+++

## Isto é bônus

Se o tempo apertou, pare aqui. O workshop principal já te levou da captura em texto simples (Módulo 1) até gestão profissional de segredos e identidade (Módulos 3 e 4), e isso já é o conteúdo que importa. Este módulo é o primeiro candidato a ser cortado se o relógio não colaborar, e ninguém vai avaliar sua nota pelo que vem daqui pra baixo.

Se sobrou tempo, o cenário é este: o time de segurança do HoloNet quer um canal de mensageria interna leve, serviço a serviço, dentro do próprio datacenter, e precisa confiar que uma mensagem que chega não foi adulterada no caminho. Não é sobre esconder o conteúdo (isso já é resolvido por TLS, Módulo 1); é sobre garantir que o que chegou é, byte a byte, o que foi enviado, e que foi um remetente legítimo que enviou.

## Missão

Construir a versão mínima viável desse canal.

**Critério de sucesso:** você adultera uma mensagem em trânsito e observa ela ser rejeitada, e consegue explicar, em uma frase, por que um hash simples não teria pego essa adulteração.

## O problema

A intuição comum é: "se eu mandar a mensagem junto com o `SHA256(mensagem)`, quem receber pode recalcular o hash e comparar; se bater, nada mudou". Isso é verdade contra corrupção acidental (um bit invertido no disco, um erro de transmissão). Contra um atacante ativo, é inútil.

O motivo é que um hash puro não tem segredo nenhum. Se um atacante consegue adulterar a mensagem no caminho, ele também consegue adulterar o hash que viaja ao lado dela: só precisa recalcular `SHA256(mensagem_forjada)` e colar o resultado novo no lugar do antigo. Nada no protocolo distingue "hash calculado pelo remetente legítimo" de "hash calculado pelo atacante". A verificação passa, porque o hash está, de fato, correto, só que para a mensagem errada.

O que falta é uma chave secreta compartilhada que só remetente e destinatário conhecem: um MAC (Message Authentication Code). Em vez de `H(M)`, você calcula `MAC(K, M)`, onde `K` é um segredo que o atacante não tem. Sem `K`, ele não consegue produzir um MAC válido para a mensagem forjada, mesmo que ele veja o MAC da mensagem original passar pela rede.

### Mas calma

A forma ingênua de construir isso, concatenar a chave com a mensagem e jogar num hash, `H(K || M)`, parece razoável, mas é vulnerável a um ataque chamado length-extension, presente em qualquer hash de construção Merkle-Damgård (MD5, SHA-1, SHA-256).

O motivo é que um hash Merkle-Damgård processa a entrada em blocos, mantendo um estado interno, e o valor final do hash é esse estado interno no último bloco. Se um atacante conhece `H(K || M)` mas não `K`, ele ainda pode retomar o processamento a partir daquele estado, como se soubesse exatamente onde o hash "parou", e continuar alimentando blocos adicionais. O resultado é que ele consegue calcular `H(K || M || padding || extra)` para qualquer `extra` de sua escolha, sem nunca saber `K`. Ele forjou um MAC válido para uma mensagem estendida.

HMAC evita isso aninhando o hash duas vezes, com a chave (derivada) misturada em ambas as camadas:

```
HMAC(K, m) = H( (K' ⊕ opad) || H( (K' ⊕ ipad) || m ) )
```

onde `K'` é a chave normalizada ao tamanho de bloco do hash, e `ipad`/`opad` são constantes fixas diferentes entre si. O ponto central: um atacante nunca vê um estado de hash que corresponda só a `K || m`. O que ele observa é a saída do hash *externo*, que já é o resultado de hashear outra coisa (o hash interno) por cima. Não há estado intermediário exposto para estender.

### Proteção contra timing attacks

Quando você verifica um MAC, a tentação natural é comparar byte a byte com `==` e parar no primeiro byte diferente. Mas isso leva a um vazamento de timing. Ou seja, um atacante que consegue medir quanto tempo a verificação levou consegue inferir quantos bytes iniciais ele acertou, e forjar o MAC correto byte a byte, uma tentativa por vez, ao longo de muitas requisições.

A defesa é comparar em tempo constante, sempre percorrendo o array inteiro, independente de onde a primeira diferença aparece: `hmac.compare_digest` em Python, `hash_equals()` em PHP, `subtle.ConstantTimeCompare` em Go. Nunca `==` para isso.

## Onde o MAC entra num JWT

Um JWT (JSON Web Token) é três partes separadas por ponto: `header.payload.signature`, cada uma codificada em Base64URL. O header declara o algoritmo (`alg`) e o tipo; o payload carrega as claims, os dados da mensagem.

Quando o header diz `"alg": "HS256"`, a "assinatura" não é uma assinatura digital assimétrica, mas sim um HMAC-SHA256 calculado sobre a concatenação `base64url(header) + "." + base64url(payload)`, usando uma chave simétrica compartilhada. A mesma chave que assina também verifica. Isso importa porque qualquer serviço capaz de verificar um token HS256 também é capaz de forjar um token HS256 válido, porque ele precisa conhecer a mesma chave. Compare com `RS256` ou `ES256`, assimétricos, onde só quem detém a chave privada consegue assinar, e qualquer um com a chave pública (inclusive um atacante) consegue só verificar, nunca forjar.

## Rodando: a flag

Gere e verifique uma mensagem sua, qualquer conteúdo:

```python
token = create_signed_message(
    sender="seu-nome-ou-email",
    content="qualquer coisa",
)
print("Token gerado:", token)

msg = verify_and_read_message(token)
print("Mensagem recebida com sucesso:", msg["msg"])
```

Verificar localmente prova que o token que você construiu é válido, mas a flag não mora em nenhum lugar deste texto: ela vive num serviço ao vivo, que **[https://seminc2026-hmac.bortoli.phd](https://seminc2026-hmac.bortoli.phd)** expõe:

```bash
curl -X POST https://seminc2026-hmac.bortoli.phd/verify \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$token\"}"
```

O serviço roda exatamente o mesmo `verify_and_read_message` proposto, contra a senha `minha_chave_secreta_super_segura_seminc_2026`. Qualquer token seu que passe a verificação, com qualquer conteúdo, dentro da janela de 5 minutos, ganha a flag na resposta.
