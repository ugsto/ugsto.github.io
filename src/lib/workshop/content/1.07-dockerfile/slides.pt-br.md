## Dockerfile = receita

Cada instrução = uma camada overlay. Camadas cacheadas. Ordem importa.

Dependências primeiro, código depois:

```dockerfile
FROM python:3.13-alpine
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "app.py"]
```

Mudou `app.py`? Só a última camada reconstrói.

## Multi-stage

Separa build de runtime:

Stage 1 compila:

```dockerfile
FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o server .
```

Stage 2 é a imagem final:

```dockerfile
FROM alpine:3.23
COPY --from=builder /app/server /server
EXPOSE 8080
CMD ["/server"]
```

Imagem final: só binário + Alpine. 900 MB → 10 MB.

## Boas práticas

- Dependências antes do código (cache)
- Multi-stage (build ≠ runtime)
- `.dockerignore` (não copia lixo)
- Alpine/slim (imagens menores)
- Tags fixas: `3.13-alpine`, não `latest`

```cheatsheet
docker build -t app . | Buildar
docker build --target builder -t build-only . | Buildar um stage
.dockerignore | Evitar node_modules, .git, build/
```
