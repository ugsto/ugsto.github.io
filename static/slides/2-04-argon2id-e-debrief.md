## `users_argon2id`: hash caro de computar

- Mesma injeção UNION de sempre, agora com 3 colunas: `user`, `pass`, `note`
- `pass` real: string Argon2id completa, formato `$argon2id$v=19$m=65536,t=3,p=4$<salt>$<hash>`
- Parâmetros confirmados: `m=65536` KiB (64 MB), `t=3`, `p=4`

---

## Mão na massa

- Reaplica a injeção que você já sabe fazer, pedindo as 3 colunas desta tabela
- Roda o mesmo ataque de força bruta do capítulo anterior, agora contra Argon2id (`-m 34000`)
- Compara o ETA com o que apareceu contra MD5

---

## Por que o gap é tão grande

- Argon2id é memory-hard: cada tentativa exige 64 MB de memória
- GPU tem muitos núcleos, mas banda de memória compartilhada
- MD5: dezenas de bilhões de H/s numa GPU
- Argon2id: ~1.700 H/s (GPU), ~92 H/s (CPU) (gap de 8 a 11 ordens de magnitude)
- Contra rockyou.txt (14,3M entradas) a ~1.700 H/s: ~2,3h pra exaurir um hash, cenário otimista
