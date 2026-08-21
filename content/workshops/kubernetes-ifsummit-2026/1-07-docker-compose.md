+++
date = 2026-01-01
title = "Docker Compose: múltiplos containers"
weight = 107
[extra]
part = 1
section = 8
read_time_minutes = 5
hands_on_minutes = 8
+++



## O problema

Você já sabe subir um container. Mas aplicação real raramente é um container só. Um app web típico tem:

- Aplicação (Python/Node/Go)
- Banco de dados (PostgreSQL, Redis)
- Talvez um worker, um proxy reverso, um message broker

Subir cada um na mão com `docker run --network --volume --link` é possível, mas depois de 3 containers vira bagunça. O Docker Compose resolve isso: você descreve todos os containers num arquivo YAML e sobe tudo com `docker compose up`.

## Exemplo: Flask + Redis

Vamos criar um contador de visitas: Flask serve a página, Redis armazena o contador.

### Estrutura do projeto

```
compose-demo/
├── docker-compose.yml
├── app/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app.py
```

### app.py

```python
from flask import Flask
import redis
import os

app = Flask(__name__)
r = redis.Redis(host=os.environ.get('REDIS_HOST', 'redis'), port=6379)

@app.route('/')
def home():
    visits = r.incr('visits')
    return f'Visitas: {visits}'
```

### requirements.txt

```
flask
redis
```

### Dockerfile

```dockerfile
FROM python:3.13-alpine
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
EXPOSE 5000
CMD ["flask", "run", "--host=0.0.0.0"]
```

### docker-compose.yml

```yaml
services:
  web:
    build: ./app
    ports:
      - "5000:5000"
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

Antes, verifique que o plugin do Docker Compose está instalado:

No Ubuntu/Debian:
```bash
sudo apt install docker-compose-v2
```

No Fedora/RHEL:
```bash
sudo dnf install docker-compose
```

```bash
docker compose up --build -d
```

```text
 Container compose-demo-web-1 Recreate
 Container compose-demo-web-1 Recreated
 Container compose-demo-redis-1 Starting
 Container compose-demo-redis-1 Started
 Container compose-demo-web-1 Starting
 Container compose-demo-web-1 Started
```

```bash
curl http://localhost:5000
```

```text
Visitas: 1
```

```bash
curl http://localhost:5000
```

```text
Visitas: 2
```

Dois comandos e tudo está executando: Flask na porta 5000, Redis isolado, volume persistente pra não perder dados, rede interna entre os containers.

---

Parte 1 concluída. Você entendeu o que é um container da syscall até o Docker Compose. Na Parte 2: o problema de escala e como o Kubernetes resolve.
