# Indicações entre empresas

Só `Company` → `Company`. Prêmio: **+30 dias** acumuláveis no 1º pagamento da indicada.

## Dados

- `companies.referral_code` (único, gerado no register)
- `company_referrals`: referrer · referred (unique) · code snapshot · `pending|rewarded|cancelled` · `reward_days=30`

## Fluxo

```
Register com ?ref=CODIGO → pending
activatePaid (1ª vez ACTIVE) → ReferralService::rewardOnFirstPaid
  → estende trial_ends_at ou ends_at do referrer (+30d)
  → status rewarded (idempotente)
```

Trial **não** gera prêmio. Renovações posteriores **não** geram de novo.

## Anti-abuso

Sem auto-indicação · código inválido = cadastro normal · 1 referral por indicada · reward idempotente

## Front

`/register/empresa?ref=` · PlanBilling: código, copiar link, contagens pending/rewarded

## Service

`ReferralService` · hook em `SubscriptionLifecycleService::activatePaid` · audit `REFERRAL_*`

## Relaciona

- Cadastro empresa → [../02-empresas/cadastro.md](../02-empresas/cadastro.md)
- Planos → [overview.md](overview.md)
