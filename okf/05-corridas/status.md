# Status operacional (API)

`CRIADA` → `AGENDADA`|`DISPONIVEL` → `ACEITA` → `EM_ANDAMENTO` → `FINALIZADA`
Qualquer ativo → `CANCELADA` (regras em `RideStatus::canTransitionTo`)

Inicial depende de `modelo_corridas` + schedule → [../02-empresas/settings.md](../02-empresas/settings.md)

## Financeiro separado

`INCOMPLETO|PENDENTE|PAGO|RECEBIDO|REPASSADO|ESTORNADO`

## Mapa → front mock

| API | Front |
|-----|-------|
| DISPONIVEL/CRIADA | pendente |
| ACEITA/AGENDADA | atribuida |
| EM_ANDAMENTO | em_andamento |
| FINALIZADA | concluida |
| CANCELADA | cancelada |
