## Módulo 1: Fundamentos

- Este módulo é um prefácio

---

## O que é uma conexão TCP

- Dois processos, dois **sockets** (IP + porta + protocolo)
- Handshake de 3 passos: SYN, SYN-ACK, ACK
- Depois disso: um canal bidirecional de **bytes**, sem estrutura, sem proteção

---

## `nc` é o socket, nada mais

```bash
nc -lvp 4444        # servidor
nc 127.0.0.1 4444   # cliente
```

- O que você digita numa ponta sai igual na outra
- Nenhuma estrutura, nenhuma proteção, só o socket

---

## O conceito de sniffing

- Qualquer byte no link pode ser observado por quem está posicionado nele
- Port mirror
- ARP spoofing
- Roteador comprometido
- Wi-Fi malicioso

---

## Demonstração: texto simples (ilustrativo)

```bash
nc -lvp 4444                                          # servidor
tshark -i lo -f "tcp port 4444" -Y "tcp.payload" -V   # captura
nc 127.0.0.1 4444                                     # cliente
```

Digite `USER admin` / `PASS senha-de-teste-qualquer`. Follow TCP Stream mostra tudo em texto simples.

---

## Demonstração: agora com TLS

```bash
openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.crt -days 365 -nodes -subj "/CN=localhost"
openssl s_server -key server.key -cert server.crt -accept 4443 -quiet
openssl s_client -connect 127.0.0.1:4443 -quiet
```

- Handshake (`ClientHello`/`ServerHello`) continua visível
- Payload agora é só `Application Data` opaco

---

## O gotcha do certificado

- `openssl s_client`: `verify error:num=18:self-signed certificate` ... e segue de qualquer forma
- Um navegador bloquearia com tela de erro
- "Audita e segue" contra "recusa por padrão" = CWE-296, item da A04

---

## Contexto: OWASP A04:2025

- CWE-319: texto simples em trânsito
- CWE-327: algoritmo quebrado/arriscado
- CWE-296: validação de certificado
- CWE-321: chave fixa no código
- CWE-916: hash de senha fraco (próximo módulo)

---

## Desafio: Um Cartão Postal Chamado Bearer

- `seminc2026-pingpong.bortoli.phd`: socket HTTP puro, sem TLS
- Um agente de monitoramento manda `Bearer <token>` a cada poucos segundos
- Token certo → `pong`. Token errado → `ping?`

---

## Baixe e rode o agente

```bash
curl -O http://seminc2026-pingpong.bortoli.phd/agent.tar.gz
docker load < agent.tar.gz
docker run --rm holonet-monitor-agent
```

---

## Capture: na sua interface de verdade

```bash
tshark -i <sua-interface> -f "tcp port 80 and host seminc2026-pingpong.bortoli.phd" -Y http -O http
```

- Desta vez o tráfego sai de verdade pela sua rede
- Ache `GET /ping`, leia o cabeçalho `Authorization`
- Esse valor (sem `Bearer `) é a flag

---

## Confirme

```bash
curl -H "Authorization: Bearer <token>" http://seminc2026-pingpong.bortoli.phd/ping
# {"message":"pong"}
```
