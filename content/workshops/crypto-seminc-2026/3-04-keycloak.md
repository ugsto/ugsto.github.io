+++
date = 2026-01-01
title = "Keycloak: identidade humana, centralizada"
weight = 304
[extra]
part = 3
section = 4
read_time_minutes = 6
hands_on_minutes = 8
+++

## Missão

O Vault resolve segredo que pertence a máquinas e serviços: chaves de criptografia, certificados, credenciais de banco. Senha de usuário humano é um problema diferente, e é aí que entra o Keycloak, um servidor de Identity and Access Management (IAM) que fala OpenID Connect (OIDC) por cima de OAuth2.

O instrutor mantém uma instância em `https://seminc2026-keycloak.bortoli.phd`, com um realm `seminc2026` e um client público chamado `holonet-audit-app`, configurado só para Authorization Code com PKCE, sem implicit flow, sem grant direto de senha. É a configuração que qualquer client OIDC público deveria usar hoje.

## Faça login

Abra a página de login do realm em uma aba de navegador comum, sem proxy, sem interceptação (isso é assunto do próximo módulo). Use uma das credenciais de demonstração:

- `anakin` / `younglingslayer9000`
- `obiwan` / `sabinelover123`
- `ahsoka` / `notajedi`

São as mesmas credenciais que você quebrou na Parte 2, só que agora você loga de verdade com elas, do outro lado do balcão.

Durante o redirecionamento de volta pra aplicação, observe a barra de endereço: por menos de um segundo, ela carrega um parâmetro `code` antes de cair na página de callback. Guarde essa observação pro próximo módulo, é o jogo inteiro dele.

O que importa reter aqui é o que **não** aconteceu: o código do HoloNet nunca viu uma senha nesse fluxo. Quem autenticou `obiwan` contra `sabinelover123` foi o Keycloak, isolado, com seu próprio banco Postgres e sua própria política de hash.

Essa mesma instância de Keycloak carrega uma flag escondida dentro de uma claim do seu token. Decodificar esse token, e revelar a flag, é trabalho do próximo módulo, quando você inspeciona o que o Authorization Code vira depois de trocado.

## Vault e Keycloak não competem

Os dois resolvem problemas ortogonais, por isso um stack maduro roda os dois ao mesmo tempo, não um no lugar do outro. O Vault resolve como serviços e infraestrutura guardam e giram segredos sem que ninguém precise possuí-los permanentemente. O Keycloak resolve como usuários humanos provam quem são, uma vez, de forma centralizada, sem que cada aplicação reinvente sua própria tela de login e seu próprio armazenamento de senha. O `users_enc_sym` da Parte 2 tentava fazer, sozinho e mal, um pedaço do trabalho de cada um dos dois. Agora você viu como as duas metades desse trabalho são feitas de verdade.

## O que vem a seguir

Assim como com o Vault, ver o Keycloak do instrutor funcionando não é a mesma coisa que saber configurar um do zero. O próximo capítulo sobe uma instância sua e cria, à mão, exatamente o tipo de client que você acabou de usar como caixa preta.
