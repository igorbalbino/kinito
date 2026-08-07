# Verificação de e-mail

## Por quê

Link no e-mail **não** aponta para a API (JSON). Aponta para o front; o front chama a rota signed.

## Fluxo

```
Cadastro / convite
  → MailService (HTML) com URL front
  → {FRONTEND_URL}/verificar-email?id&hash&expires&signature
  → GET /api/v1/auth/email/verify/{id}/{hash}?expires&signature
  → markEmailAsVerified
```

## Convite (cliente ou motorista criado pela empresa)

Se `must_change_password` e ainda não verificado:

1. Confirma e-mail
2. Gera senha temporária
3. Envia e-mail “Acesso Kinito” com senha + link `/login`

Self-register (já escolheu senha): só marca verificado.

## Gate API

Middleware `verified.api` no grupo autenticado (exceto `me`, change-password, resend autenticado, logout).

Login sem verificar → `422` + `email_unverified` + e-mail (front manda para `/verificar-email-pendente`).

## Código

- `NotificationService::verificationUrl`
- `AuthController::verifyEmail` / `resendVerificationPublic`
- `EnsureEmailIsVerified`
- Front: `VerifyEmailView` · `PendingVerificationView`

## Relaciona

- Convite cliente → [../03-clientes/convite.md](../03-clientes/convite.md)
- Convite motorista → [../04-motoristas/convite.md](../04-motoristas/convite.md)
- E-mail HTML → [../09-notificacoes/email.md](../09-notificacoes/email.md)
