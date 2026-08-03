# Notificações

Tabela app: `app_notifications` (não confundir com `notifications` Laravel).

Canais: `email` · `whatsapp` · `push` (stub).

## WhatsApp (pluggable)

```
NotificationService → WhatsAppManager → Gateway (log|baileys|meta)
```

| Env | Efeito |
|-----|--------|
| `WHATSAPP_ENABLED` | liga/desliga |
| `WHATSAPP_PROVIDER` | `log` / `baileys` / `meta` |
| `WHATSAPP_GATEWAY_URL` | sidecar Baileys (`whatsapp-gateway/`) |
| `WHATSAPP_GATEWAY_API_KEY` | = `GATEWAY_API_KEY` do sidecar |

- Contract: `App\Contracts\WhatsApp\WhatsAppGateway`
- Manager: `App\Services\WhatsApp\WhatsAppManager`
- Drivers: `Drivers/Log|Baileys|MetaWhatsAppGateway`

Trocar provider = mudar `.env`, sem alterar services de negócio.

## API

`GET /notificacoes` · `POST .../{id}/read` · `POST .../read-all`

## Tela

`/notificacoes`

## Disparos atuais

Onboarding cliente (email + whatsapp se phone + enabled) · aprovação motorista

Service: `NotificationService` · `notifyChannels([...])`
