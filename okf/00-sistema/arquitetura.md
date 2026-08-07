# Arquitetura backend

```
routes/api.php
  → Controllers/Api
  → FormRequests | Policies
  → Services (domínio)
  → Models/Enums | Resources (camelCase)
```

## Services principais

| Path | Uso |
|------|-----|
| `Ride/` | criar, status, resolução de company |
| `Client/` | self-register, createByActor (convite) |
| `Driver/` | self-register, createByCompany, approve |
| `Provider/` | prefs cliente + switch/revert motorista |
| `Company/` | register, settings (+ sync modelo) |
| `Referral/` | attach + reward +30d |
| `Subscription/` | trial, activatePaid, liberar fornecedor |
| `Mail/` | MailService + SmtpMailService |
| `Notification/` | orquestra canais |
| `WhatsApp/` | manager + drivers |
| `Finance/` · `Billing/` · `Audit/` | split, stripe/mock, audit |

## Pastas-chave

| Path | Uso |
|------|-----|
| `app/Enums` | Status domínio |
| `app/Support/EmailTemplates` | HTML e-mail |
| `app/Policies` | Multi-tenant |
| `config/kinito.php` | frontend_url, taxas, provider |
| `database/seeders` | Dados demo |

## Jobs / commands

`PurgeExpiredRideDetailLogs` · `subscriptions:expire-trials`
