# Stripe e billing SaaS

SDK `stripe/stripe-php` instalado.

## Split de corridas (ride payments)

Auto (igual planos): `STRIPE_SECRET` preenchido → Stripe real; senão → mock.

| Peça | Comportamento |
|------|----------------|
| PaymentIntent | `FinanceService::createPaymentIntent` — Stripe SDK ou `pi_stub_*` |
| Webhook `POST /webhooks/stripe` | Stripe: `Webhook::constructEvent` (fail closed). Mock: só `pi_stub_*` já gravado em `payments` |
| Customers | `companies.stripe_customer_id` |

## Assinatura de planos (SaaS)

Interface: `App\Contracts\Billing\BillingGateway`  
Drivers: `MockBillingGateway` | `StripeBillingGateway` via `BillingManager`

| Env | Efeito |
|-----|--------|
| `BILLING_DRIVER=auto` | Stripe se `STRIPE_SECRET`, senão mock |
| `STRIPE_SECRET` + `plans.stripe_price_id` | Checkout real |
| `STRIPE_PRICE_STARTER` / `PRO` / `ENTERPRISE` | Sincronizados no seeder para os 3 planos |
| `KINITO_TRIAL_DAYS` | Dias de trial (padrão 14) |
| Sem secret | Mock: URL assinada `/api/v1/billing/mock/complete` |

Webhook SaaS: `POST /api/v1/webhooks/billing`  
Lifecycle: `SubscriptionLifecycleService` (trial → expire → checkout → ACTIVE)

## Fluxo empresa

1. Cadastro **sem** plano (`is_active=false`, `is_provider=false`)
2. Após login → `/escolher-plano` → `POST /empresas/{id}/subscribe` mode `trial`
3. Trial 14 dias → cron `subscriptions:expire-trials` (trials + `ACTIVE` com `ends_at` vencido)
4. Sem pagamento: middleware `company.subscription` bloqueia API empresa; clientes e motoristas afiliados vão para modo `ALL`
5. Mock checkout ou Stripe → `ACTIVE` → restaura fornecedor `COMPANY`

`GET /config` expõe `billingDriver` (`mock`|`stripe`) e `trialDays` para o front.

## Relaciona

- Empresas / trial → [../02-empresas/cadastro.md](../02-empresas/cadastro.md)
- Fornecedor padrão → [../03-clientes/fornecedor-padrao.md](../03-clientes/fornecedor-padrao.md)
