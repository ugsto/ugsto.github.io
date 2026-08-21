## Missão

- Vault resolve segredo de máquina. Senha humana é outro problema.
- Keycloak: IAM que fala OIDC sobre OAuth2
- Realm `seminc2026`, client público `holonet-audit-app`
- Authorization Code + PKCE apenas, sem implicit, sem grant direto de senha

---

## Fazendo login

- Abra a página de login do realm em uma aba comum (sem proxy ainda)
- Credenciais de demonstração:
  - `anakin` / `younglingslayer9000`
  - `obiwan` / `sabinelover123`
  - `ahsoka` / `notajedi`
- As mesmas credenciais que vocês quebraram no módulo anterior

---

## O que você viu (e o que não viu)

- Por meio segundo, um parâmetro `code` passa na barra de endereço
- Esse `code` é o foco do próximo módulo
- O que importa agora: o código do HoloNet nunca viu uma senha
- Quem autenticou foi o Keycloak, nunca o backend do HoloNet Bank
- Esta instância guarda uma flag numa claim do token; decodificar o token é trabalho do módulo 4

---

## Vault x Keycloak: problemas ortogonais

- **Vault**: como serviços guardam e giram segredos sem que ninguém precise possuí-los
- **Keycloak**: como humanos provam quem são, uma vez, sem cada app reinventar login
- Um stack maduro roda os dois
- `users_enc_sym` tentava fazer mal um pedaço do trabalho de cada um

---

## O que vem a seguir

- Ver o Keycloak do instrutor funcionando não é saber configurar um do zero
- Próximo capítulo: sua própria instância, seu próprio client
