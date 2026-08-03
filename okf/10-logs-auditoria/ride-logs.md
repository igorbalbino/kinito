# Ride logs

| Tabela | Conteúdo | Retenção |
|--------|----------|----------|
| `ride_logs` | resumo: cliente, motorista, origem, destino, status | permanente |
| `ride_detail_logs` | JSON eventos/rota/changes | **90 dias** job `PurgeExpiredRideDetailLogs` |

## API

`GET /logs/rides` · `GET /logs/rides/details` (ADMIN/EMPRESA)

Escritos em toda mutação de `RideService`.
