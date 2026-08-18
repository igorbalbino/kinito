# Fornecedor principal (motorista)

Motorista pode operar em modo **COMPANY** (empresa específica) ou **ALL** (marketplace / todos).

## Modo COMPANY (padrão)

Cadastro pela empresa: `primary_company_id` + pivot `ATIVO` com `origin=empresa`.

## Modo ALL (marketplace)

- `PATCH /motoristas/{id}` com `provider_mode=ALL` (self-service)
- Vê corridas abertas de **qualquer** empresa com assinatura ativa
- `RideService::accept` não exige pivot ATIVO — só empresa com acesso ativo
- UI: botão **Todos / marketplace** em `/fornecedores`

## Troca para empresa (`POST /motoristas/{id}/switch-provider`)

1. Guarda `previous_primary_company_id`
2. Nova empresa: pivot `PENDENTE`
3. `primary_company_id` = nova · `provider_mode=COMPANY` · `provider_switch_pending=true`
4. **Suspenso** de aceitar corridas até aceite
5. E-mail à nova empresa

## Aceite (`POST .../approve`)

Pivot `ATIVO` · se era o target do switch → limpa pending · motorista volta a receber.

## Reverter (`POST .../revert-provider`)

Primary volta para `previous_primary_company_id` · detach da pendente · `provider_switch_pending=false`.

## Expiração da assinatura da empresa

Motoristas com pivot `origin=empresa` na empresa expirada → `provider_mode=ALL`, snapshot em `provider_restore`; restaurados ao pagar.

## UI

`/fornecedores` · opção **Todos** + lista de empresas · Config `?sec=fornecedor`

## Service

`ProviderPreferenceService::updateDriverProvider` · `switchDriverProvider` · `revertDriverProvider`

## Relaciona

- Cliente marketplace → [../03-clientes/fornecedor-padrao.md](../03-clientes/fornecedor-padrao.md)
- Aceite corrida → [../05-corridas/overview.md](../05-corridas/overview.md)
