# Fornecedor padrão (cliente)

`client_preferences`:

| Mode | Efeito |
|------|--------|
| `COMPANY` | principal = `default_company_id`; resolução de corrida usa modelo dessa empresa |
| `ALL` | marketplace: cliente escolhe `company_id` (ou UI obriga escolher) |

Cliente criado por empresa → `COMPANY` + essa empresa (visível em Config / Fornecedores).

## UI

- Config `?sec=fornecedor` — resumo + CTA
- `/fornecedores` — lista `GET /fornecedores` · escolher empresa **ou** Todos/marketplace

## Troca para empresa específica

1. `PATCH /clientes/{id}` via `ProviderPreferenceService::updateClientProvider`
2. `client_company` sync (`origin=self`, `is_active`)
3. E-mail aos donos/colaboradores da empresa escolhida

Mode `ALL` → não dispara e-mail de seleção.

## Suspensão da empresa (assinatura)

1. Empresa some do marketplace
2. Clientes com principal = essa empresa → `ALL` + snapshot `extra.provider_restore`
3. Ao pagar de novo → restaura `COMPANY` + `default_company_id`

## Service

`ProviderPreferenceService` · `RideService::resolveCompanyId` · `SubscriptionLifecycleService`

## Relaciona

- Modelo empresa → [../02-empresas/modelo-corridas.md](../02-empresas/modelo-corridas.md)
- Resolução corrida → [../05-corridas/resolucao-fornecedor.md](../05-corridas/resolucao-fornecedor.md)
- E-mail → [../09-notificacoes/email.md](../09-notificacoes/email.md)
