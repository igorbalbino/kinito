# Resolução de fornecedor na criação

`RideService::resolveCompanyId` (sempre chamado em `create`, mesmo com `company_id` no body).

## Regras

| Situação | Company resultante |
|----------|-------------------|
| Prefs `ALL` | `company_id` explícito (obrigatório na UI) |
| Prefs `COMPANY` + `scheduled_date` | `default_company_id` (principal) |
| Prefs `COMPANY` + instantâneo + modelo principal `INSTANTANEAS`/`AMBOS` | principal (ou explícito ≠ principal se enviado) |
| Prefs `COMPANY` + instantâneo + modelo principal `AGENDAMENTO` | outra empresa marketplace elegível |
| Sem primary e sem explícito | falha 422 |

## Marketplace elegível (instantâneo)

- `is_provider` · `is_active` · subscription com acesso
- `modelo_corridas` ∈ `INSTANTANEAS` \| `AMBOS`
- `id ≠` principal
- Ordenação: mais motoristas ATIVOS no pivot · nome  
- **Sem GPS** (geo fora de escopo)

## Aceite motorista

Bloqueado se `provider_switch_pending` ou sem pivot `ATIVO` na `ride.company_id`.

## Relaciona

- Modelo → [../02-empresas/modelo-corridas.md](../02-empresas/modelo-corridas.md)
- Prefs cliente → [../03-clientes/fornecedor-padrao.md](../03-clientes/fornecedor-padrao.md)
- Motorista fornecedor → [../04-motoristas/fornecedor.md](../04-motoristas/fornecedor.md)
