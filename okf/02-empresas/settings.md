# Company settings

Tabela `company_settings` 1:1 company.

| Campo | Valores / efeito |
|-------|------------------|
| `modelo_corridas` | `INSTANTANEAS` \| `AGENDAMENTO` \| `AMBOS` — ver [modelo-corridas.md](modelo-corridas.md) |
| `accept_instant_rides` | sync automático ao salvar modelo |
| `allow_scheduling` | sync automático ao salvar modelo |
| `stripe_enabled` | bool local empresa |
| `allow_partners` | habilita transfer |
| `notifications_enabled` | bool |

## Sync ao salvar `modelo_corridas`

| Modelo | accept_instant | allow_scheduling |
|--------|----------------|------------------|
| `INSTANTANEAS` | true | false |
| `AGENDAMENTO` | false | true |
| `AMBOS` | true | true |

## API

`PUT /empresas/{id}/settings` · body snake_case

## Front

Config → `?sec=modelo` · `RideModelPanel` · `updateCompanySettings`

## Afeta

Resolução de corrida → [../05-corridas/resolucao-fornecedor.md](../05-corridas/resolucao-fornecedor.md)
