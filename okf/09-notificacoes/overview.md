# Notificações

Tabela app: `app_notifications` (≠ `notifications` Laravel).

Canais: `email` · `whatsapp` · `in_app` · `push` (stub).

## Entrada de negócio

`NotificationService` — orquestra in-app + canais.

E-mail transacional → [email.md](email.md)  
WhatsApp → [whatsapp.md](whatsapp.md)

## API

`GET /notificacoes` · `POST .../{id}/read` · `POST .../read-all`

## Tela

`/notificacoes`

## Disparos relevantes

| Evento | Canal |
|--------|--------|
| Cadastro / verificação / convite | e-mail HTML |
| Credenciais pós-verify (convite) | e-mail |
| Cliente/motorista escolhe fornecedor | e-mail para empresa |
| Aprovação motorista | in-app (+ e-mail genérico se notify email) |
| Troca fornecedor pendente (motorista) | in-app |
