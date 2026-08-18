# Indicações entre empresas

Só `Company` → `Company`. Prêmio: **+1 vigência** (mês ou ano conforme `billing_period` do plano do indicador) no 1º pagamento da indicada.

## Matriz por plano

| Plano do indicador | Pode indicar planos |
|--------------------|---------------------|
| **starter** | starter |
| **pro** | pro, starter |
| **enterprise** | enterprise, pro, starter |

Tier configurável em `config/kinito.php` → `referral.plan_tiers`.

## Dados

- `companies.referral_code` (único, gerado no register)
- `company_referrals`: referrer · referred (unique) · code · `pending|rewarded` · `referred_plan_id` · `referrer_plan_id` snapshot

## Fluxo

```
Register com ?ref=CODIGO → pending
POST subscribe (escolher plano) → valida tier → trial + grava referred_plan_id
activatePaid (1ª vez ACTIVE) → ReferralService::rewardOnFirstPaid
  → estende trial_ends_at ou ends_at do referrer (+1 mês ou +1 ano)
  → status rewarded (idempotente)
```

Trial **não** gera prêmio. Renovações posteriores **não** geram de novo.

## Anti-abuso

Sem auto-indicação · código inválido = cadastro normal · 1 referral por indicada · plano acima do tier = 422 no subscribe · reward idempotente

## Front

`/register/empresa?ref=` · `/escolher-plano` filtra planos se veio de indicação · PlanBilling: código, planos permitidos, vigências ganhas

## Service

`ReferralService` · `PlanTier` · hook em `PlanController::subscribe` e `SubscriptionLifecycleService::activatePaid`

## Relaciona

- Cadastro empresa → [../02-empresas/cadastro.md](../02-empresas/cadastro.md)
- Planos → [overview.md](overview.md)
