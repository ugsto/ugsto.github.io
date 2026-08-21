+++
date = 2026-01-01
title = "Hide, Seek & Crack, um Minicurso de Criptografia Aplicada"
weight = 0
[extra]
part = 0
section = 0
read_time_minutes = 4
hands_on_minutes = 0
+++

## Proposta do minicurso

Este é o material de apoio do minicurso **"Hide, Seek & Crack, um Minicurso de Criptografia Aplicada"**, apresentado na SEMINC 2026 (UNIOESTE).

## Ementa

Este minicurso apresenta os fundamentos de criptografia aplicada por meio de exercícios práticos de ataque e defesa. Partindo de conceitos básicos e do item A04 do OWASP Top Ten 2025, os participantes exploram diferentes cenários em que a criptografia se faz necessária.

A primeira parte demonstra a importância da criptografia em trânsito por meio da captura de pacotes com Wireshark, comparando uma comunicação em texto simples via `netcat` com o mesmo cenário protegido por OpenSSL, e apresenta os algoritmos recomendados para os casos mais comuns de uso: criptografia simétrica, criptografia assimétrica e hash criptográfico.

A segunda parte explora a criptografia em repouso: um sistema de login propositalmente vulnerável a SQL Injection, com uma sequência evolutiva de armazenamento de senha (texto simples, criptografia simétrica, MD5, MD5 com salt, Argon2id) atacada com rainbow tables e wordlists.

A terceira parte cobre soluções profissionais de gerenciamento de credenciais: HashiCorp Vault e Keycloak. A parte final aborda protocolos de autenticação, usando um proxy para interceptar requisições e acompanhando na prática fluxos de OAuth2, OIDC e DPoP.

Como conteúdo bônus, caso o tempo permita, é apresentado um sistema de mensageria simples que utiliza MAC para autenticar mensagens com tokens JWT.

## Como usar este material

Os capítulos a seguir seguem a ordem em que o minicurso é apresentado ao vivo. O próximo capítulo, "Introdução", estabelece o cenário e a mecânica de flags usada em todos os laboratórios. Comece por ali.
