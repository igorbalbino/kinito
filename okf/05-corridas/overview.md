# Corridas

Núcleo do produto. Model `rides` · Service `RideService`.

## Atores

- `client_id` quem pede
- `company_id` responsável (resolvido por prefs + modelo — ver [resolucao-fornecedor.md](resolucao-fornecedor.md))
- `partner_company_id?` parceira
- `driver_id?` executor (só se pivot ATIVO na company e sem switch pending)

## API ações

`POST /corridas` · accept · start · finish · cancel · reassign · transfer-partner · `PATCH .../finance`

## Tela

`/corridas` · `NewRideModal` (cliente: agendar data/hora; empresa: despacho) · `RideDetailsModal`

## Relaciona

- Resolução fornecedor → [resolucao-fornecedor.md](resolucao-fornecedor.md)
- Status → [status.md](status.md)
- Ciclo → [ciclo-vida.md](ciclo-vida.md)
- Financeiro → [../06-financeiro](../06-financeiro/)
- Logs → [../10-logs-auditoria/ride-logs.md](../10-logs-auditoria/ride-logs.md)
