+++
date = 2026-01-01
title = "Modos de operação: o que a cifra de bloco não resolve sozinha"
weight = 205
[extra]
part = 2
section = 5
read_time_minutes = 8
hands_on_minutes = 0
+++

## Isto é teoria, sem laboratório

Sem UNION, sem hashcat, sem flag. Você já viu AES falhar duas vezes neste módulo: `users_enc_sym` (chave fixa, reversível) e, se prestou atenção nos ciphertexts repetidos daquela tabela, ECB (o mesmo bloco de texto claro sempre produz o mesmo bloco cifrado). Antes do próximo capítulo, vale entender o quadro completo: o que um modo de operação resolve, o que ele não resolve, e por que "AES" sozinho não é uma resposta completa pra "como eu cifro isto?".

## O problema que todo modo de operação existe pra resolver

AES cifra um bloco de exatamente 16 bytes por vez. Ponto. Qualquer coisa maior que 16 bytes (como um nome de usuário, um JSON ou um arquivo inteiro) precisa ser cortada em blocos de 16 bytes e cifrada bloco a bloco. A pergunta que sobra é: **como esses blocos se relacionam entre si?** É essa relação, não o AES em si, que um modo de operação define.

## ECB: cada bloco, uma ilha

Electronic Codebook é o modo mais simples e, na prática, o único genuinamente errado pra quase todo uso real (cita ele quando alguém falar que não tem jeito errado): cada bloco de texto claro é cifrado independente dos outros, com a mesma chave, sem nenhuma informação cruzando de um bloco pro seguinte.

A consequência: o mesmo bloco de texto simples produz sempre o mesmo bloco cifrado, use a mesma chave quantas vezes quiser. Se dois usuários do HoloNet têm a mesma senha, os blocos cifrados dela são idênticos. Isso fica visível a olho nu, sem decifrar nada, só comparando os bytes. É essa propriedade que expôs a fragilidade de `users_enc_sym` no capítulo `2-01`.

CWE-329, "não usar um IV imprevisível", captura parte do problema, mas ECB é pior que isso: ele não usa IV nenhum. Não existe correção de configuração pra ECB. A correção é não usar ECB.

## CBC: cada bloco depende do anterior

Cipher Block Chaining resolve o problema mais óbvio do ECB introduzindo um encadeamento: antes de cifrar um bloco de texto claro, ele é XORado com o **bloco cifrado anterior**. O primeiro bloco da mensagem é XORado com um IV (vetor de inicialização), aleatório e, por exigência de segurança, imprevisível.

```text
C_i = E(P_i XOR C_{i-1})      // cifrar
P_i = D(C_i) XOR C_{i-1}      // decifrar
```

Isso mata o problema mais visível do ECB: dois blocos de texto claro idênticos agora produzem blocos cifrados diferentes, porque cada um foi XORado com um `C_{i-1}` diferente. Mas CBC resolve **só isso**. Ele não resolve, e nunca foi desenhado pra resolver, um problema totalmente separado: **integridade**.

CBC puro, sem nenhum mecanismo adicional, é **maleável**: um atacante que não sabe a chave ainda pode manipular blocos de texto cifrado inteiros, reordenar, duplicar ou recortar e colar blocos entre mensagens diferentes, e o resultado ainda decifra sem erro nenhum, produzindo texto claro alterado de forma previsível. Não é preciso quebrar a cifra pra isso: a fórmula de decifração acima usa o ciphertext do bloco anterior diretamente, então trocar esse ciphertext produz um efeito determinístico e conhecido sobre o texto claro resultante. O próximo capítulo explora exatamente essa maleabilidade contra um sistema real do HoloNet.

Um detalhe frequentemente esquecido: CBC também precisa de padding, porque a mensagem raramente é um múltiplo exato de 16 bytes. O padrão é PKCS#7. Implementações de CBC mal feitas que reportam "padding inválido" de forma diferenciada de "assinatura inválida" abrem a porta pra um ataque famoso, o **oráculo de padding** (fora do escopo de hoje, mas vale saber que existe).

## CTR: transforma um bloco em um stream

Counter mode não encadeia blocos entre si. Em vez disso, cifra um **contador** (nonce concatenado com um número sequencial) e usa o resultado como um keystream, XORado diretamente contra o texto claro, exatamente como uma cifra de stream.

```text
C_i = P_i XOR E(nonce || i)
```

A vantagem prática: cada bloco pode ser cifrado ou decifrado **de forma independente e paralela**, porque não existe dependência de `C_{i-1}` nenhuma. Ao contrário do CBC, que é inerentemente sequencial na decifração encadeada (embora a decifração do CBC também possa paralelizar, já que todos os `C_{i-1}` já estão disponíveis de antemão; é a *cifragem* do CBC que é estritamente sequencial). CTR também não precisa de padding, porque o texto claro nunca passa pelo bloco da cifra diretamente. Mas a mesma maleabilidade do CBC continua presente: CTR também não autentica nada. E CTR tem um requisito ainda mais rígido que CBC: **o par (chave, nonce) nunca pode se repetir**. Reusar um nonce com a mesma chave gera o mesmo keystream duas vezes, e XORar dois ciphertexts produzidos com o mesmo keystream cancela a cifra inteira, sobrando o XOR dos dois textos claros, que é recuperável com técnicas de criptoanálise de texto claro conhecido.

## ECB: CTR mais autenticação, no mesmo pacote

Galois/Counter Mode é o que a indústria realmente usa hoje pra cifrar dados novos: é CTR mode combinado com uma **tag de autenticação** (GMAC) calculada sobre o ciphertext inteiro. Isso resolve exatamente o buraco que CBC e CTR deixam abertos: qualquer alteração no ciphertext, de um único bit, faz a verificação da tag falhar, e a implementação se recusa a devolver texto claro nenhum.

Essa combinação de cifrar E autenticar no mesmo primitivo é o que a literatura chama de **AEAD** (Authenticated Encryption with Associated Data). ECB é o exemplo mais comum; ChaCha20-Poly1305 é a alternativa mais usada quando não há aceleração de hardware para AES (comum em dispositivos móveis mais antigos). Ambos aparecem no cartão de referência do Módulo 1.

## A tabela que resume tudo isso

| Modo | Blocos independentes? | Autentica integridade? | Paraleliza? | Uso recomendado hoje |
|---|---|---|---|---|
| ECB | Sim (por isso é ruim) | Não | Sim | Nunca |
| CBC | Não, encadeado | Não | Só na decifração | Legado; evite para código novo |
| CTR | Sim | Não | Sim | Só como base de um AEAD (ex.: dentro do ECB) |
| ECB | Sim (é CTR por dentro) | **Sim** | Sim | Padrão atual pra cifrar dados novos |

A régua de decisão prática, pra qualquer coisa que você for construir a partir de hoje: **se o modo não autentica, ele não é a resposta completa**, mesmo que a chave seja forte e a implementação da cifra em si esteja correta. "Cifrado" e "protegido contra adulteração" são propriedades diferentes, e só ECB (ou outro AEAD) entrega as duas ao mesmo tempo, no mesmo primitivo, sem exigir que você monte a combinação por conta própria.

## O que vem a seguir

O próximo capítulo explora, na prática, exatamente a primeira linha dessa tabela: um sistema do HoloNet ainda usando ECB, e o que a independência entre blocos permite fazer sem nunca precisar descobrir a chave.
