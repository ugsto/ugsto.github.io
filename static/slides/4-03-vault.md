## Vault: gestão de secrets

- Kubernetes Secrets são base64, não criptografados
- Vault resolve: criptografia real, políticas, auditoria, rotação

### Instalação

- Ubuntu: repo HashiCorp → `apt install vault`
- Fedora: repo HashiCorp → `dnf install vault`
- Binário único, sem dependências

### Modo dev

- `vault server -dev` → servidor em memória, já desbloqueado
- Token root na saída do comando
- Para aprendizado apenas (nunca em produção)

### Lendo e escrevendo

- `vault kv put secret/db password=x` → escrever
- `vault kv get secret/db` → ler
- `vault kv get -field=password secret/db` → campo específico
- `vault kv delete secret/db` → deletar

### Vault + Kubernetes

- Vault Agent Injector: sidecar que injeta secrets nos Pods
- Autenticação via ServiceAccount do K8s
- Secrets nunca passam pela API do Kubernetes

### Cheatsheet

```cheatsheet
vault server -dev | Iniciar servidor modo dev
export VAULT_ADDR='http://127.0.0.1:8200' | Configurar endereço
vault status | Verificar status
vault kv put secret/<path> key=value | Escrever secret
vault kv get secret/<path> | Ler secret
vault kv get -field=<key> secret/<path> | Ler campo específico
vault kv delete secret/<path> | Deletar secret
```

Próximo: conclusão do workshop.
