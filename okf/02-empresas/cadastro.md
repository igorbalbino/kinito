# Cadastro empresa

`POST /api/v1/empresas/register` (público, separado do `/auth/register`)

## Cria

1. User + role `EMPRESA`
2. Company + attach dono (`company_user.role=dono`)
3. `company_settings` default `modelo_corridas=AMBOS`
4. Se `plan_id` informado → trial 14 dias nesse plano (`SubscriptionLifecycleService::startTrial`)

Sem `plan_id`: empresa escolhe o plano depois em `POST /empresas/{id}/subscribe` (`mode=trial|checkout|auto`).

## Trial / suspensão

- 1 trial por empresa (`companies.trial_used_at`)
- Cron: `subscriptions:expire-trials` (hourly)
- Expirado → `EXPIRED`, `is_active=false`, some do `GET /fornecedores`, clientes liberados para marketplace
- Pagamento → `BillingGateway` (mock/Stripe) → `ACTIVE` + restaura fornecedor padrão

## Service

`CompanyService::register` · `SubscriptionLifecycleService`

## Front

Configurações → painel **Plano e período de teste**.
