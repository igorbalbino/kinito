# Auth

## Regras

- Sanctum Bearer token
- Cadastro público: só `CLIENTE` | `MOTORISTA`
- Empresa: fluxo separado → [../02-empresas/cadastro.md](../02-empresas/cadastro.md)
- Multi-role via Spatie

## API

| Método | Path |
|--------|------|
| POST | `/auth/register` |
| POST | `/auth/login` |
| POST | `/auth/logout` |
| GET/PATCH | `/auth/me` |
| POST | `/auth/forgot-password` |
| POST | `/auth/reset-password` |
| GET | `/auth/email/verify/{id}/{hash}` signed |
| POST | `/auth/email/verification-notification` |

## Telas front

`/` landing · `/login` · `/register` (mock ainda oferece empresa — back não)

## Seed

`admin@kinito.test` / `password`

## Relaciona

- Roles → [roles.md](roles.md)
- Front mapa → [../12-mapa-front-api/auth.md](../12-mapa-front-api/auth.md)
