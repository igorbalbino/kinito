# Auth front ↔ API

## Login

Mock: seta `activeRole` e navega.  
Alvo: guardar `token` + user de `POST /auth/login` · roles de `/auth/me`.

## Register

Mock roles: empresa|motorista|cliente.  
API pública: só motorista|cliente. Empresa → `POST /empresas/register`.

## Forgot password

Mock: `alert`. API: `POST /auth/forgot-password` (link → `FRONTEND_URL/reset-password?...`).
