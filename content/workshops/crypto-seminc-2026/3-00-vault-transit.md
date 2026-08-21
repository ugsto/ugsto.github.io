+++
date = 2026-01-01
title = "Módulo 3: Vault: transit engine, cifra como serviço"
weight = 300
[extra]
part = 3
section = 0
read_time_minutes = 8
hands_on_minutes = 12
+++

## A virada de papel

A manhã acabou: você não é mais o auditor externo caçando falha no login do HoloNet Bank, agora você foi contratado e o buraco que abriu na Parte 2 é seu problema pra resolver.

`users_enc_sym`, a tabela com AES-256-ECB e chave fixa direto no `main.py`, tinha um problema simples: quem lia o código-fonte lia a chave. Não existe segredo ali, só a ilusão de um.

## Missão

Mover a gestão de senhas e segredos do HoloNet do jeito que um time de segurança real faria: a aplicação nunca guarda uma chave de criptografia bruta, nem faz ela mesma a comparação de hash de senha.

**Critério de sucesso:** cifre e decifre um valor pelo Vault sem nunca ver a chave, e complete um login contra o Keycloak sem que o código do HoloNet toque em uma senha.

## Lab 3.1: Vault, transit engine

Vault tem várias secrets engines. A que resolve o problema do `main.py` é a `transit`: funciona como "criptografia como serviço", a aplicação manda o texto simples e recebe o texto cifrado de volta (ou o inverso, na decifragem), e a chave AES nunca sai do armazenamento do Vault. Nenhum processo da aplicação chega a carregá-la na memória, muito menos fixá-la no código-fonte. No esquema 2 da Parte 2, a chave era uma constante em `main.py`, disponível pra qualquer pessoa com `git clone`. Aqui a chave fica no cofre; a aplicação só fala com uma API.

O instrutor já provisionou uma instância com a engine `transit` habilitada e uma chave chamada `workshop`. Ele vai te entregar, ao vivo, um endereço e um token.

### Configure o ambiente

```bash
export VAULT_ADDR=https://seminc2026-vault.bortoli.phd
export VAULT_TOKEN=<token fornecido pelo instrutor>
```

Esse token é emitido sob uma policy chamada `student`, que autoriza **somente** duas operações: `transit/encrypt/workshop` e `transit/decrypt/workshop`. Tente qualquer outra coisa e o Vault nega:

```bash
vault secrets enable -path=qualquer-coisa kv
```

```text
Error enabling: Error making API request.

URL: POST https://seminc2026-vault.bortoli.phd/v1/sys/mounts/qualquer-coisa
Code: 403. Errors:

* permission denied
```

É o modelo de menor privilégio funcionando exatamente como deveria: você recebeu a chave certa pro cadeado certo, e nenhuma outra.

### Cifre um valor

```bash
vault write transit/encrypt/workshop plaintext=$(base64 <<< "test message")
```

```text
Key           Value
---           -----
ciphertext    vault:v1:HMN74d0JMa42c4gQCzI2Wo/W8PlbwLP1CteW2cLTAHlaGqzHi2Uf96WTkpNCjRVHh01Q0evqyDtzs7ML0pu7SeXojQ==
```

O prefixo `vault:v1:` identifica a versão da chave usada na cifragem. Ele importa no próximo passo.

### Decifre de volta

```bash
vault write transit/decrypt/workshop ciphertext=<colar o ciphertext>
```

O Vault devolve o texto original, ainda em base64, porque foi em base64 que você entregou o plaintext originalmente. Em nenhum momento desse ciclo você viu a chave AES que fez o trabalho: ela existe, é usada, e é inacessível.

### Rotação transparente

O instrutor pode girar a chave `workshop` ao vivo:

```bash
vault write -f transit/keys/workshop/rotate
```

Depois da rotação, cifrados novos usam a versão nova da chave, mas cifrados antigos, gerados antes da rotação, continuam decifrando corretamente. O Vault guarda todas as versões da chave e escolhe a certa a partir do prefixo `vault:v1:`, `vault:v2:` etc. embutido no próprio ciphertext. A aplicação nunca precisa saber que uma rotação aconteceu.

### A flag deste laboratório

O instrutor entrega um ciphertext já pronto:

```text
vault:v1:HMN74d0JMa42c4gQCzI2Wo/W8PlbwLP1CteW2cLTAHlaGqzHi2Uf96WTkpNCjRVHh01Q0evqyDtzs7ML0pu7SeXojQ==
```

Decifre-o com o seu próprio token, usando o mesmo comando de antes:

```bash
vault write transit/decrypt/workshop ciphertext=vault:v1:HMN74d0JMa42c4gQCzI2Wo/W8PlbwLP1CteW2cLTAHlaGqzHi2Uf96WTkpNCjRVHh01Q0evqyDtzs7ML0pu7SeXojQ==
```

O resultado, decodificado de base64, é a flag deste laboratório, no formato `SEMINC2026{...}`.

Essa decifragem é o passo de obtenção da flag deste módulo, sem etapa escondida além dessa. Vale a comparação direta: isso é o que a chave hardcoded do módulo anterior deveria ter sido desde o início.

## O que vem a seguir

Esse laboratório usou uma instância de Vault que o instrutor já provisionou, com uma engine já habilitada e uma policy já escrita. Os próximos capítulos invertem isso: você mesmo sobe um Vault, primeiro do jeito rápido e descartável, depois do jeito que realmente vai pra produção, com múltiplos nós, Shamir e certificado próprio. Só depois disso o módulo segue pro Keycloak.
