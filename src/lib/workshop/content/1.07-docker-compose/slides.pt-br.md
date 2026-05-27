## Aplicação real = múltiplos containers

Flask + Redis. Compose sobe tudo com 1 comando.

### docker-compose.yml

```yaml
services:
  web:
    build: ./app
    ports: ["5000:5000"]
    environment:
      - REDIS_HOST=redis
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

### Subir

```bash
docker compose up --build
[+] Running 2/2
 ✔ redis  Started
 ✔ web    Started

curl localhost:5000
Visitas: 1
```

---

Parte 1 concluída. Da syscall ao Compose.
