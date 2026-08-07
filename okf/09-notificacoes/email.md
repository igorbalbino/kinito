# E-mail (SMTP + HTML)

Padrão estilo MedFlow: templates HTML + ponto único de envio.

```
NotificationService / ProviderPreferenceService
  → MailService (tipos tipados)
  → EmailTemplates (HTML layout)
  → SmtpMailService (PHPMailer, SMTP_* / MAIL_*)
```

## Por quê PHPMailer

Independente de `MAIL_MAILER=log`. Se SMTP não configurado → log de aviso, API não quebra.

## Env típico (Hostinger)

`SMTP_HOST` · `SMTP_PORT=587` · `SMTP_CRYPTO=tls` · `SMTP_USER` = e-mail completo · `SMTP_PASS` · `MAIL_FROM_ADDRESS` = mesmo user

Auth fail comum: user/from divergentes ou senha errada.

## Tipos (`MailService`)

`verification` · `registration` · `client_invite` · `driver_invite` · `invite_credentials` · `password_reset` · `notification` · `provider_selected_client` · `provider_selected_driver`

## Links no e-mail

Verificação → `{FRONTEND_URL}/verificar-email?...` (não APP_URL da API)

## Relaciona

- Verificação → [../01-auth/verificacao-email.md](../01-auth/verificacao-email.md)
- Convites → [../03-clientes/convite.md](../03-clientes/convite.md) · [../04-motoristas/convite.md](../04-motoristas/convite.md)
