# Corridas

Núcleo do produto. Model `rides` · Service `RideService`.

## Atores

- `client_id` quem pede
- `company_id` responsável
- `partner_company_id?` parceira
- `driver_id?` executor

## API ações

`POST /corridas` · accept · start · finish · cancel · reassign · transfer-partner · `PATCH .../finance`

## Tela

`/corridas` · modals `NewRideModal` `RideDetailsModal` · dashboard também lista

## Relaciona

- Status → [status.md](status.md)
- Ciclo → [ciclo-vida.md](ciclo-vida.md)
- Financeiro embutido → [../06-financeiro](../06-financeiro/)
- Logs → [../10-logs-auditoria/ride-logs.md](../10-logs-auditoria/ride-logs.md)
