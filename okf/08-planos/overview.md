# Planos SaaS

`plans` (starter/pro/enterprise) · `subscriptions` por company.

## API

`GET /plans` · CRUD admin · `POST /empresas/{id}/subscribe` (`mode=trial|checkout|auto`)  
`GET /empresas/{id}/subscription` — inclui bloco **referral**

Status sub: `TRIALING|ACTIVE|PAST_DUE|CANCELED|EXPIRED`

## Front

Config `?sec=plano` · `PlanBillingPanel` (assinatura + indicações)

## Relaciona

- Indicações empresa → [indicacoes.md](indicacoes.md)
- Cadastro / trial → [../02-empresas/cadastro.md](../02-empresas/cadastro.md)
- Billing → [../06-financeiro/stripe.md](../06-financeiro/stripe.md)
