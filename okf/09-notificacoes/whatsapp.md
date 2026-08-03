# WhatsApp providers

## Fluxo

```
Business code
  → NotificationService::notify(..., channel: whatsapp)
  → WhatsAppManager::sendToUser (+ company_id)
  → BaileysWhatsAppGateway → whatsapp-gateway (session = company.id)
```

Conexão por empresa (QR):

```
Configurações (front)
  → POST /empresas/{id}/whatsapp/connect
  → CompanyWhatsAppService → gateway /sessions/{id}/connect
  → QR no status até connected
```

## Drivers

| Provider | Config mínima |
|----------|----------------|
| `log` | nenhuma |
| `baileys` | `WHATSAPP_GATEWAY_URL` + `WHATSAPP_GATEWAY_API_KEY` + sidecar `whatsapp-gateway/` |
| `meta` | `WHATSAPP_META_TOKEN` + `WHATSAPP_META_PHONE_NUMBER_ID` |

## Sidecar

Pasta `whatsapp-gateway/`. No Laravel:

```env
WHATSAPP_ENABLED=true
WHATSAPP_PROVIDER=baileys
WHATSAPP_GATEWAY_URL=http://127.0.0.1:3001
WHATSAPP_GATEWAY_API_KEY=kinito-gateway-dev
```

No gateway (`.env`):

```env
GATEWAY_API_KEY=kinito-gateway-dev
LARAVEL_WEBHOOK_URL=http://127.0.0.1:8000/api/v1/webhooks/whatsapp
```

## API empresa

| Método | Endpoint |
|--------|----------|
| GET | `/empresas/{id}/whatsapp` |
| POST | `/empresas/{id}/whatsapp/connect` |
| DELETE | `/empresas/{id}/whatsapp` |
| POST | `/webhooks/whatsapp` (gateway → Laravel) |
| POST | `/webhooks/whatsapp/tick` |

## Relaciona

- Notificações → [overview.md](overview.md)
- Onboarding cliente → [../03-clientes/overview.md](../03-clientes/overview.md)
