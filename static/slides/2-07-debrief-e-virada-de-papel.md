## Debrief: as 5 tabelas de senha

| Esquema | Raio de impacto | O que impediu |
|---|---|---|
| `users_plain` | Nada protegido | Nada |
| `users_enc_sym` | Trivialmente reversível | Nada (cifra reversível, chave no código) |
| `users_md5` | Instantaneamente quebrável | Nada (tabela pré-computada) |
| `users_md5_salt` | Quebrável com esforço | Só a pré-computação, não a velocidade |
| `users_argon2id` | Efetivamente seguro | Custo de memória por tentativa |

- A flag saiu do mesmo `UNION SELECT` em todas as 5

---

## E o sistema de contas?

- Nenhuma senha quebrada, nenhuma chave descoberta
- Path traversal + upload sem verificação + CBC sem MAC
- R$ 5 trilhões movidos sem nunca decifrar o saldo real primeiro

---

## A virada de papel

- Você é o auditor que achou tudo isso
- Agora o HoloNet te contratou pra corrigir como engenheiro(a), não mais como auditor(a)
- O que vem a seguir é o que você de fato colocaria em produção
