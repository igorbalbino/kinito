# Fornecedor principal (motorista)

Motorista **não** tem modo `ALL` — só empresa específica.

## Cadastro pela empresa

Já entra com `primary_company_id` + pivot `ATIVO` (recebe corridas).

## Troca (`POST /motoristas/{id}/switch-provider`)

1. Guarda `previous_primary_company_id`
2. Nova empresa: pivot `PENDENTE`
3. `primary_company_id` = nova · `provider_switch_pending=true`
4. **Suspenso** de aceitar corridas (`Driver::canAcceptRides` / `RideService::accept`)
5. E-mail à nova empresa

## Aceite (`POST .../approve`)

Pivot `ATIVO` · se era o target do switch → limpa pending · motorista volta a receber.

## Reverter (`POST .../revert-provider`)

- Primary volta para `previous_primary_company_id`
- Detach da pendente
- `provider_switch_pending=false`
- Pivot ATIVO da anterior intacto → volta a receber dela

## UI

`/fornecedores` (sem “Todos”) · badge aguardando aceite · botão reverter · Config `?sec=fornecedor`

## Service

`ProviderPreferenceService::switchDriverProvider` · `revertDriverProvider` · `completeDriverSwitchOnApprove`

## Relaciona

- E-mail → [../09-notificacoes/email.md](../09-notificacoes/email.md)
- Aceite corrida → [../05-corridas/overview.md](../05-corridas/overview.md)
