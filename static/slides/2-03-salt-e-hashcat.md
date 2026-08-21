## `users_md5_salt`

- O estagiário aprendeu sobre rainbowtables e decidiu fazer algo sobre

## Dump

```json
{"user": "admin", "pass": "1c30a3032a6e5e95995d3c86773a6f36", "salt": "fe4fe322223cf66a"}
{"user": "anakin", "pass": "755f52b82df6507c0f9f9721c59895b5", "salt": "bf7623b44fff488c"}
{"user": "obiwan", "pass": "1ad936f857de169fffaefbec7b551713", "salt": "951569bca6a72998"}
{"user": "ahsoka", "pass": "22d61ef01983a39b400340c1360cc755", "salt": "ec4d44ff1b67cd51"}
```

Mais uma 5ª linha, `holonet-ci`, que se comporta diferente.

## Testa a ferramenta do capítulo anterior

Cola o hash do admin no `seminc2026-rainbowtable.bortoli.phd`

## Mão na massa

`curl -O http://seminc2026-pingpong.bortoli.phd/wordlist.txt`

- `md5(senha + salt)` ou `md5(salt + senha)`? Hashcat tem um modo numérico pra cada ordem
- Modo errado = zero resultado, sem erro nenhum avisando
- Monta o arquivo `hash:salt` a partir do dump e roda um ataque de dicionário contra `rockyou.txt`
- Como você confirma qual dos dois modos é o certo?

## Raio de impacto: `users_md5_salt`

- Salt resolve o problema de reaproveitamento de pré-computação. Resolve o problema de velocidade por tentativa?
- Se a senha já está em `rockyou.txt`, o que o salt realmente comprou pro usuário?

Próximo: e se o hash em si fosse caro de computar?
