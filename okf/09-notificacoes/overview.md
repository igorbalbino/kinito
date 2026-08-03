# Notificações

Tabela app: `app_notifications` (não confundir com `notifications` Laravel).

Canais: `email` (implementado via Mail) · `whatsapp`/`push` stubs.

## API

`GET /notificacoes` · `POST .../{id}/read` · `POST .../read-all`

## Tela

`/notificacoes`

## Disparos atuais

Onboarding cliente · aprovação motorista · (extensível em services)

Service: `NotificationService`
