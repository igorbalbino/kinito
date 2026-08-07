# Motoristas

Perfil `drivers` 1:1 user · N:N companies (`driver_company`) · docs · fornecedor principal explícito.

## Campos de fornecedor

| Campo | Uso |
|-------|-----|
| `primary_company_id` | fornecedor atual |
| `previous_primary_company_id` | para reverter troca |
| `provider_switch_pending` | true → **não aceita corridas** |

## Status global

`PENDENTE` → `ATIVO` · `BLOQUEADO` · `INDISPONIVEL`

Pivot `driver_company.status`: `PENDENTE` (aguardando aceite) · `ATIVO` · `BLOQUEADO`

## API

`GET/POST /motoristas` · `PATCH` · `approve` · `block` · `link-company` · `switch-provider` · `revert-provider` · docs review

## Telas

`/motoristas` · `DriverCreateModal` · `DriverApprovalModal` · `/fornecedores` · Config `?sec=fornecedor`

## Relaciona

- Convite pela empresa → [convite.md](convite.md)
- Troca de fornecedor → [fornecedor.md](fornecedor.md)
- Documentos → [documentos.md](documentos.md)
- Corridas accept → [../05-corridas](../05-corridas/)
