# Arquitetura backend

```
routes/api.php
  → Controllers/Api
  → FormRequests | Policies
  → Services (Ride, Finance, Company, Client, Driver, Audit, Notification)
  → Models/Enums | Resources (camelCase)
```

## Pastas-chave

| Path | Uso |
|------|-----|
| `app/Enums` | Status domínio |
| `app/Services/*` | Regras de negócio |
| `app/Policies` | Multi-tenant |
| `config/kinito.php` | Stripe/taxas/provider |
| `database/seeders` | Dados demo |

## Jobs

`PurgeExpiredRideDetailLogs` — diário, 90d → [../10-logs-auditoria](../10-logs-auditoria/)
