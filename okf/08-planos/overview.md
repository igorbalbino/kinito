# Planos SaaS

`plans` (starter/pro/enterprise) · `subscriptions` por company.

## API

`GET /plans` · CRUD admin · `POST /empresas/{id}/subscribe`

Status sub: `TRIALING|ACTIVE|PAST_DUE|CANCELED|EXPIRED`

## Front

Só `Company.tier` badge — mapear para `plan.slug` do Resource.

## Futuro

Stripe Billing via `stripe_price_id` / `stripe_subscription_id`.
