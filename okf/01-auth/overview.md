# Auth

## Regras

- Sanctum Bearer token
- E-mail **obrigatório** antes do painel (`verified.api` + login bloqueia não verificados)
- Cadastro público pessoa: `CLIENTE` | `MOTORISTA` — **sem token**; vai para “confira o e-mail”
- Empresa: [../02-empresas/cadastro.md](../02-empresas/cadastro.md)
- Multi-role via Spatie
- `must_change_password` → força troca no 1º acesso (convites)

## API

| Método | Path | Notas |
|--------|------|--------|
| POST | `/auth/register` | sem token; dispara e-mail verificação |
| POST | `/auth/login` | 422 + `email_unverified` se não confirmou |
| POST | `/auth/logout` | |
| GET/PATCH | `/auth/me` | fora do gate verified (junto com change-password) |
| POST | `/auth/change-password` | |
| POST | `/auth/forgot-password` | |
| POST | `/auth/reset-password` | |
| GET | `/auth/email/verify/{id}/{hash}` | signed; chamado pelo front |
| POST | `/auth/email/verification-notification` | auth |
| POST | `/auth/email/resend` | público (página pendente) |

## Telas front

`/login` · `/register` · `/register/empresa` · `/verificar-email` · `/verificar-email-pendente` · pós-login `/dashboard`

## Seed

`admin@kinito.test` / `password` (e-mails seed já verificados)

## Relaciona

- Verificação detalhada → [verificacao-email.md](verificacao-email.md)
- Roles → [roles.md](roles.md)
- Front mapa → [../12-mapa-front-api/auth.md](../12-mapa-front-api/auth.md)
