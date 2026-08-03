# Company settings

Tabela `company_settings` 1:1 company.

| Campo | Valores / efeito |
|-------|------------------|
| `modelo_corridas` | `INSTANTANEAS` → DISPONIVEL · `AGENDAMENTO` → AGENDADA · `AMBOS` |
| `accept_instant_rides` | bool |
| `allow_scheduling` | bool |
| `stripe_enabled` | bool local empresa |
| `allow_partners` | habilita transfer |
| `notifications_enabled` | bool |

## API

`PUT /empresas/{id}/settings`

## Afeta

Criação de corrida → [../05-corridas/status.md](../05-corridas/status.md)
