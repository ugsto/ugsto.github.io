+++
date = 2026-01-01
title = "Vault em modo dev: rápido, descartável, nunca em produção"
weight = 301
[extra]
part = 3
section = 1
read_time_minutes = 6
hands_on_minutes = 10
+++

## Missão

O Vault do capítulo anterior já estava no ar, provisionado por alguém. Agora você sobe o seu, na sua própria máquina, e entende exatamente quais atalhos o modo mais simples de rodar Vault toma, e por que cada um deles é inaceitável fora de um laboratório.

## Suba o seu

```bash
docker run -d --rm --name vault-dev -p 8200:8200 --cap-add=IPC_LOCK \
  -e VAULT_DEV_ROOT_TOKEN_ID=root \
  hashicorp/vault:2.0.4 server -dev -dev-listen-address=0.0.0.0:8200
```

```bash
docker logs vault-dev
```

Na saída, duas linhas importam:

```text
Unseal Key: <uma chave qualquer>
Root Token: root
```

Configure o cliente:

```bash
export VAULT_ADDR=http://127.0.0.1:8200
export VAULT_TOKEN=root
vault status
```

`Sealed: false`, sem você ter feito nada além de subir o container. Compare com o Vault do capítulo anterior, que alguém já tinha inicializado e desselado antes de você chegar.

## O que "dev mode" tira, uma por uma

**Armazenamento em memória, não em disco.** Escreva algo:

```bash
vault kv put secret/teste valor=alguma-coisa
docker restart vault-dev
vault kv get secret/teste
```

O segundo comando falha, ou devolve um Vault reinicializado do zero. Nada sobreviveu ao restart, porque não existe storage real: é tudo RAM. Em produção, isso é inaceitável por razão óbvia: qualquer reinício de container apaga o cofre inteiro.

**Uma única chave de unseal.** O modo dev usa 1 compartilhamento com threshold 1: a "chave" que apareceu no log já é suficiente, sozinha, pra desselar. Isso não é Shamir secret sharing de verdade, é decoração. O próximo capítulo mostra o esquema real, com múltiplas chaves e um threshold maior que 1.

**TLS desabilitado.** `VAULT_ADDR=http://...`, sem `s`. Todo o tráfego entre você e o Vault, incluindo o root token, viaja em texto puro. Aceitável em loopback, num laptop, pra um teste de 5 minutos, mas não em qualquer coisa que atravesse uma rede real.

**Root token fixo e previsível.** Você escolheu o valor (`root`) na hora de subir o container. Em produção, o root token nasce aleatório, é usado uma única vez pra provisionar as policies corretas, e depois é revogado.

## O raio de impacto

Nenhum desses atalhos é um bug: são o propósito do modo dev, que existe pra iterar rápido em desenvolvimento local, não pra guardar segredo de verdade. O problema é usá-lo fora desse contexto. Se você já viu um `docker run ... vault server -dev` num README de produção, ou um tutorial que nunca menciona storage persistente, agora você sabe exatamente o que está faltando.

## O que vem a seguir

O próximo capítulo sobe um Vault de verdade: múltiplos nós, storage em disco, Shamir com mais de uma chave, consenso via raft. É o Vault que aguenta um nó caindo no meio da tarde sem ninguém notar.

```bash
docker rm -f vault-dev
```
