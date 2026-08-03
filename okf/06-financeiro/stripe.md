# Stripe (preparado)

SDK `stripe/stripe-php` instalado. Hoje: **stubs**.

| Peça | Status |
|------|--------|
| PaymentIntent | `FinanceService::createPaymentIntentStub` |
| Webhook | `StripeWebhookController` (signature stub) |
| Customers | campo `companies.stripe_customer_id` |
| Billing planos | `plans.stripe_price_id` / `subscriptions.stripe_subscription_id` futuro |

Eventos tratados no stub: `payment_intent.succeeded|payment_failed` · `charge.refunded`
