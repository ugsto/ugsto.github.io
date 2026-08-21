+++
date = 2026-01-01
title = "Módulo 1: Fundamentos: Conexões, Sniffing e Criptografia em Trânsito"
weight = 100
[extra]
part = 1
section = 0
read_time_minutes = 15
hands_on_minutes = 30
+++

## Prefácio

Este módulo não pede pra você provar uma alegação sobre o HoloNet Bank. Ele dá o vocabulário e a intuição que os módulos seguintes vão assumir que você já tem. Antes de atacar qualquer coisa, você precisa entender exatamente o que está sendo transmitido, como, e quem consegue ver.

A ordem é: (1) o que é uma conexão e um socket, (2) o que significa "sniffar" tráfego, (3) uma demonstração ilustrativa da diferença entre texto simples e TLS, e só então (4) o desafio real deste módulo, que já usa tudo isso na prática contra um serviço de verdade.

## O que é uma conexão, o que é um socket

Dois processos que querem trocar dados por rede precisam de um endereço endereçável em cada ponta. Esse endereço é o **socket**: a combinação de um IP e uma porta, mais o protocolo de transporte (TCP, no nosso caso). O sistema operacional expõe essa abstração, "abra uma conexão para IP:porta", e a partir daí você tem um canal bidirecional de bytes.

Uma conexão TCP se estabelece com um handshake de três passos:

![three way handshake diagram](/images/seminc2026/3wayhandshake.webp)

Fonte: [geeksforgeeks](https://www.geeksforgeeks.org/computer-networks/tcp-3-way-handshake-process/)

Depois do handshake, os dois lados podem escrever e ler bytes livremente. TCP garante ordem e entrega, mas **não garante nada sobre o conteúdo**: não existe estrutura, não existe proteção embutida. Um socket TCP puro não sabe se está transportando HTTP, um protocolo binário proprietário, ou uma senha em texto simples; ele só sabe transportar bytes.

`nc` (netcat) é a ferramenta mínima que expõe esse conceito sem nenhuma camada por cima: `nc -lvp 4444` abre um socket ouvindo na porta 4444, `nc 127.0.0.1 4444` conecta a ele, e o que você digita numa ponta sai exatamente igual na outra. Nenhuma estrutura, nenhuma proteção, só o socket.

## O conceito de sniffing

Qualquer byte que atravessa um link pode ser observado por qualquer coisa posicionada para ver esse link. É uma propriedade física de como redes funcionam, não uma falha específica de um protocolo. As posições clássicas de onde um atacante consegue sniffar:

- Um switch com port mirroring mal configurado, ou um hub (raro hoje, mas ainda existe).
- ARP spoofing numa rede local: o atacante convence os outros hosts a mandar o tráfego por ele antes de seguir para o destino real.
- Um roteador comprometido, ou um Wi-Fi público malicioso.
- **A própria máquina de origem**, antes do pacote sair pela interface de rede. O loopback (`lo`) é mecanicamente o mesmo tipo de captura que qualquer uma das opções acima, só que na distância mais curta possível.

Sniffar não exige exploração de vulnerabilidade nenhuma, exige apenas visibilidade sobre o link. Se o conteúdo não está protegido, ver o link é o bastante.

## Demonstração: veja com seus próprios olhos (ilustrativo)

Esta parte usa seu próprio loopback como substituto direto para qualquer uma das posições de rede descritas acima, mecanicamente idêntico ao que um atacante posicionado num segmento de rede real veria. Não há flag aqui: o objetivo é só fixar a intuição antes do desafio de verdade.

### Suba o listener

Terminal 1, o "servidor" (só precisa aceitar a conexão e devolver echo do que chegar):

```bash
nc -lvp 4444
```

### Comece a capturar

Terminal 2, antes de qualquer coisa passar pela rede:

```bash
tshark -i lo -f "tcp port 4444" -Y "tcp.payload" -V
```

Sem `tshark` instalado, abra o Wireshark e aplique o mesmo filtro de captura (`tcp port 4444`) na interface `lo`. O resultado é o mesmo, só a ferramenta muda.

### Conecte como cliente e digite algo

Terminal 3:

```bash
nc 127.0.0.1 4444
```

Digite, linha a linha:

```text
USER admin
PASS senha-de-teste-qualquer
```

### Leia o payload capturado

De volta ao terminal 2, o `tshark` já deve ter impresso os pacotes com o payload TCP em ASCII e em hex. Se estiver usando o Wireshark, clique com o botão direito em qualquer pacote da conversa e escolha **Follow → TCP Stream**: ele reconstrói a sessão completa e mostra `USER admin` e `PASS senha-de-teste-qualquer` em texto simples, sem decodificação nenhuma da sua parte.

Essa é a diferença entre criptografia mal feita e nenhuma criptografia: não existe chave errada pra tentar, não existe cifra pra quebrar. O dado já chega pronto pra leitura.

### O que muda com TLS

Mesmo exercício, agora dentro de um túnel TLS.

```bash
openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.crt -days 365 -nodes -subj "/CN=localhost"
```

Terminal 1:

```bash
openssl s_server -key server.key -cert server.crt -accept 4443 -quiet
```

Terminal 2:

```bash
openssl s_client -connect 127.0.0.1:4443 -quiet
```

Digite o mesmo `USER`/`PASS` de antes. Ajuste o filtro do `tshark` (ou do Wireshark) pra `tcp port 4443`. O handshake (`ClientHello`, `ServerHello`, negociação de cipher suite) continua completamente visível em texto claro, porque isso precisa ser negociado antes de qualquer chave existir. Mas o payload da aplicação some: os pacotes de dados aparecem só como `Application Data`, sem nenhum `USER`/`PASS` legível. A metadata é visível, o conteúdo não é.

Repare também na saída do `openssl s_client`: ele imprime um aviso do tipo `verify error:num=18:self-signed certificate` e continua a conexão de qualquer forma (`verify return:1`). A ferramenta avisa explicitamente que o certificado não é confiável, mas segue adiante mesmo assim. Um navegador, no mesmo cenário, bloquearia a conexão com uma tela de erro. Essa diferença de comportamento, "audita e segue" contra "recusa por padrão", é exatamente por que validação de cadeia de certificado (CWE-296) é um item da lista A04 do OWASP, não um detalhe de implementação.

## Contexto: OWASP A04

O OWASP Top 10 2025 dedica a categoria A04 a "Cryptographic Failures". O foco é a ausência de criptografia, ou o uso de algo fraco demais pra contar, não a implementação mal feita de algo forte. Os CWEs que você vai encontrar de novo neste módulo e no próximo:

- **CWE-319**: transmissão de dados sensíveis em texto simples (o que você acabou de ver)
- **CWE-327**: uso de algoritmo criptográfico quebrado ou arriscado
- **CWE-296**: validação incorreta de cadeia de certificado
- **CWE-321**: chave de criptografia fixa no código
- **CWE-916**: hash de senha fraco (assunto do próximo módulo)

## Desafio: um cartão postal chamado Bearer

O HoloNet Bank tem um socket de heartbeat interno, `seminc2026-pingpong.bortoli.phd`, rodando **HTTP puro, sem TLS**. Um agente de monitoramento faz ping nele periodicamente, autenticando com um Bearer token: se o token estiver certo, o socket responde `pong`; se não, um `ping?` genérico.

Você não recebe o token diretamente. Você recebe o agente:

### Baixe e rode o agente

```bash
curl -O http://seminc2026-pingpong.bortoli.phd/agent.tar.gz
docker load < agent.tar.gz
docker run --rm holonet-monitor-agent
```

Ele começa a mandar `GET /ping` para `seminc2026-pingpong.bortoli.phd` a cada poucos segundos, com um cabeçalho `Authorization: Bearer <algo>` que você ainda não conhece.

### Capture o tráfego na sua própria interface, de verdade

Diferente da demonstração anterior, agora o tráfego sai de fato da sua máquina em direção a um servidor remoto pela internet. Capture na sua interface de rede real (não `lo`) enquanto o agente roda:

```bash
tshark -i <sua-interface> -f "tcp port 80 and host seminc2026-pingpong.bortoli.phd" -Y http -O http
```

(Troque `<sua-interface>` pelo nome real: `eth0`, `wlan0`, o que aparecer em `ip link` ou no seletor de interface do Wireshark.)

Encontre a requisição `GET /ping` capturada e olhe o cabeçalho `Authorization`. Esse valor, sem o prefixo `Bearer `, é a flag deste módulo.

### Confirme manualmente, se quiser

Depois de recuperar o token, você pode confirmar contra o próprio socket:

```bash
curl -H "Authorization: Bearer <token que você capturou>" http://seminc2026-pingpong.bortoli.phd/ping
# {"message":"pong"}
```

Se a resposta for `pong`, o token está certo. É exatamente assim que o agente prova sua identidade a cada heartbeat: mandando o mesmo "cartão postal" em texto simples, de novo e de novo, para qualquer um no caminho ler.

---

Próximo módulo: hash de senha e por que SHA-256 puro é a escolha errada pra guardar credenciais.
