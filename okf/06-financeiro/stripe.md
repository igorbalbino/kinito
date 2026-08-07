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
| Sem secret | Mock: URL assinada `/api/v1/billing/mock/complete` |

Webhook SaaS: `POST /api/v1/webhooks/billing`  
Lifecycle: `SubscriptionLifecycleService` (trial 14d → expire → checkout → ACTIVE)

## Relaciona

- Empresas / trial → [../02-empresas/cadastro.md](../02-empresas/cadastro.md)
- Fornecedor padrão → [../03-clientes/fornecedor-padrao.md](../03-clientes/fornecedor-padrao.md)
