# Auth front ↔ API

## Login

`POST /auth/login` → token + user · companyId da sessão.  
Não verificado → `/verificar-email-pendente?email=`.  
OK → `/dashboard`.

## Register pessoa

`POST /auth/register` (CLIENTE|MOTORISTA) → **sem** sessão · `/verificar-email-pendente`.

## Register empresa

`POST /empresas/register` (+ `referral_code` opcional) → sem sessão · pendente verificação.

## Verify

Query params do e-mail → `verifyEmailApi` → signed GET API.

## Forgot password

`POST /auth/forgot-password` · link `FRONTEND_URL/reset-password?...`

## Force password

`must_change_password` → `ForcePasswordModal` · `POST /auth/change-password`

## Relaciona

- [../01-auth/verificacao-email.md](../01-auth/verificacao-email.md)
