# Meu Assistente WhatsApp

Bot pessoal para WhatsApp normal usando Baileys, Node.js e PostgreSQL.

## Funções da V1

- Lista de compras
- Lembretes
- Mensagens programadas
- Menu de comandos
- PostgreSQL
- Reconexão automática

## Requisitos

- Node.js 20+
- Uma conta normal do WhatsApp
- PostgreSQL
- Railway para hospedagem

## Variáveis do Railway

Configure:

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
TZ=America/Manaus
AUTH_DIR=/data/auth_info
```

## Deploy no Railway

1. Crie um projeto no Railway.
2. Faça deploy deste repositório pelo GitHub.
3. Adicione um serviço PostgreSQL ao mesmo projeto.
4. No serviço do bot, configure `DATABASE_URL=${{Postgres.DATABASE_URL}}`.
5. Configure `TZ=America/Manaus`.
6. Adicione um Volume ao serviço e monte em `/data`.
7. Configure `AUTH_DIR=/data/auth_info`.
8. Gere um domínio para o serviço.
9. Veja os logs do serviço.
10. O QR Code aparecerá nos logs na primeira conexão.
11. No WhatsApp: Configurações > Aparelhos conectados > Conectar aparelho.
12. Escaneie o QR Code.

Depois da autenticação, a sessão fica salva no volume e o bot poderá reconectar sem pedir QR novamente.

## Teste

Envie para o próprio número conectado:

```text
/menu
```

Depois:

```text
/compras adicionar arroz
/compras adicionar feijão
/compras lista
```

Lembrete:

```text
/lembrete 2026-08-16 08:00 pagar conta
```

Mensagem automática:

```text
/mensagem 2026-08-16 09:00 Bom dia!
```

## Observações

- Não publique a pasta `auth_info` no GitHub.
- Não compartilhe os arquivos de sessão.
- Use o bot somente para automações pessoais e mensagens legítimas.
- Mensagens automáticas em massa/spam podem violar regras do WhatsApp.
