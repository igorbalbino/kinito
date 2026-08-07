# Status operacional (API)

`CRIADA` → `AGENDADA`|`DISPONIVEL` → `ACEITA` → `EM_ANDAMENTO` → `FINALIZADA`  
Qualquer ativo → `CANCELADA` (`RideStatus::canTransitionTo`)

## Inicial (`RideService::initialStatus`)

| Modelo company | + schedule | Status |
|----------------|------------|--------|
| AGENDAMENTO / AMBOS | sim | `AGENDADA` |
| INSTANTANEAS / AMBOS | não | `DISPONIVEL` |
| AGENDAMENTO | sem schedule | `CRIADA` (fallback) |

## Financeiro separado

`INCOMPLETO|PENDENTE|PAGO|RECEBIDO|REPASSADO|ESTORNADO`

## Mapa → front

| API | Front |
|-----|-------|
| DISPONIVEL/CRIADA | pendente |
| ACEITA/AGENDADA | atribuida |
| EM_ANDAMENTO | em_andamento |
| FINALIZADA | concluida |
| CANCELADA | cancelada |
