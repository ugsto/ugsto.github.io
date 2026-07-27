+++
date = 2026-01-01
title = "Dockerfile: construindo imagens"
weight = 106
path = "7"
[extra]
part = 1
section = 7
read_time_minutes = 7
hands_on_minutes = 10
+++



## O problema

Até agora você usou imagens prontas: `alpine:3.23`, `nginx:alpine`. Mas container só é útil quando você empacota **sua** aplicação.

O Dockerfile é a receita. Um arquivo de texto que descreve como construir uma imagem: sistema base, dependências, código, configuração. Com `docker build`, ele vira uma imagem que executa igual em qualquer lugar.

## A estrutura de um Dockerfile

Cada instrução gera uma **camada** (layer). As camadas são readonly e empilhadas via overlay. Isso significa que:

- Camadas são cacheadas: se você mudar só a linha 10, as primeiras 9 não são reconstruídas
- Quanto mais cedo uma camada muda, mais camadas são reconstruídas depois dela
- A ordem importa: dependências primeiro, código depois

### Exemplo mínimo: app Python

```dockerfile
FROM python:3.13-alpine
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "app.py"]
```

O que cada linha faz:

- `FROM` define a imagem base (Python 3.13 em Alpine)
- `WORKDIR` cria e entra no diretório `/app`
- O primeiro `COPY` traz `requirements.txt`. Só ele. Se as dependências não mudaram, essa camada vem do cache
- `RUN pip install` instala as dependências. Camada cacheável porque `requirements.txt` raramente muda
- O segundo `COPY . .` traz o código da aplicação. Essa camada muda a cada deploy
- `EXPOSE 8000` documenta a porta (não publica; isso é no `docker run -p`)
- `CMD` define o comando padrão quando o container iniciar

Se você mudar `app.py`, só a camada do `COPY . .` é reconstruída. As camadas 1-4 vêm do cache. Se você colocasse `COPY . .` antes do `pip install`, toda mudança de código rebaixaria as dependências e o cache seria inútil.

## Instruções principais

- FROM: imagem base. `FROM python:3.13-alpine`, `FROM node:22-alpine`
- RUN: executa comando durante o build. `RUN apt update && apt install -y curl`
- COPY: copia arquivo do host pra imagem. `COPY . /app`
- WORKDIR: define o diretório de trabalho. Equivale a `cd /app`
- EXPOSE: documenta porta (não publica; isso é no `docker run -p`)
- CMD: comando padrão quando o container iniciar
- ENTRYPOINT: similar a CMD mas mais rígido (não é sobrescrito por argumentos do `docker run`)
- ENV: variáveis de ambiente. `ENV NODE_ENV=production`

## Multi-stage builds

Problema: você precisa de compilador pra buildar, mas não quer ele na imagem final (imagem maior, superfície de ataque). Solução: múltiplos `FROM` no mesmo Dockerfile.

Stage 1 compila o binário:

```dockerfile
FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o server .
```

Stage 2 é a imagem final, sem Go, sem toolchain:

```dockerfile
FROM alpine:3.23
COPY --from=builder /app/server /server
EXPOSE 8080
CMD ["/server"]
```

A imagem final tem só o binário compilado + Alpine. De 900 MB pra 10 MB.

## Boas práticas

- Dependências antes do código: maximiza cache de layers
- Multi-stage: separa build de runtime
- `.dockerignore`: evita copiar `node_modules`, `.git`, `build/`
- Imagens alpine/slim: reduz tamanho e superfície de ataque
- Tags específicas: `python:3.13-alpine`, não `python:latest`
- Um processo por container: não bota nginx + redis + app no mesmo container. Use Compose
