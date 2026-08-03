# Relatórios empresa

| Endpoint | Significado |
|----------|-------------|
| `GET /relatorios/own` | company_id = eu, sem partner |
| `GET /relatorios/received` | partner_company_id = eu |
| `GET /relatorios/forwarded` | company_id = eu + partner set |
| `GET /relatorios/consolidated` | soma dos 3 |

Filtros: `from` `to` `driver_id` `client_id` `company_id` `status`

## Tela

`/relatorios` — mock exporta CSV (receita/motoristas/clientes); API acima é a fonte real.

## Relaciona

Parceiros → [../02-empresas/parceiros.md](../02-empresas/parceiros.md)
