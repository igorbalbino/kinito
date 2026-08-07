# Cadastro empresa

`POST /api/v1/empresas/register` (público)

## Cria

1. User + role `EMPRESA` (`email_verified_at=null`)
2. Company + attach dono + `referral_code` único
3. `company_settings` default `modelo_corridas=AMBOS`
4. Se veio `referral_code` válido → row `company_referrals` `pending` (não auto-indicação)
5. Se `plan_id` → trial 14d

**Resposta sem token.** Front → `/verificar-email-pendente`.

## Trial / suspensão

- 1 trial por empresa (`trial_used_at`)
- Cron: `subscriptions:expire-trials`
- Expirado → some do marketplace; clientes liberados (`ALL` + `provider_restore`)
- 1º pagamento (`activatePaid`) → recompensa indicação (+30d ao referrer) → [../08-planos/indicacoes.md](../08-planos/indicacoes.md)

## Front

`/register/empresa?ref=CODIGO` · campo opcional indicação · após submit: confira e-mail (não `/configuracoes`)

## Service

`CompanyService::register` · `ReferralService::attachOnRegister` · `SubscriptionLifecycleService`
