# Sistema KINITO

SaaS de gestão de corridas: **clientes** ↔ **motoristas** ↔ **empresas** (frota / prestadora / parceira).

## Stack

- Front: `front/` React+TS — consome API Sanctum (`VITE_API_URL`)
- Back: Laravel root, API `/api/v1`
- E-mail: PHPMailer via `SmtpMailService` + templates HTML (`MailService` / `EmailTemplates`)
- WhatsApp: gateway pluggable (log | baileys | meta)
- DB: SQLite local / MySQL prod · Redis opcional

## Fluxo mental

```
User (N roles, e-mail verificado) → Company / Driver / Client
Cliente cria Ride → resolve Company (prefs + modelo) → Driver ATIVO aceita
Finance split → Logs/Audit → Reports
```

## Papéis

`ADMIN` `EMPRESA` `MOTORISTA` `CLIENTE` — multi-role no mesmo user.

## Relaciona

- Auth → [../01-auth](../01-auth/)
- Fornecedor / modelo → [../02-empresas/modelo-corridas.md](../02-empresas/modelo-corridas.md) · [../03-clientes/fornecedor-padrao.md](../03-clientes/fornecedor-padrao.md)
- Mapa telas/API → [../12-mapa-front-api](../12-mapa-front-api/)
- Docs API → [`docs/API.md`](../../docs/API.md)
