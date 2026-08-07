# Ciclo de vida

1. **create** — `resolveCompanyId` (prefs + modelo) · status inicial · split · logs
2. **accept** — driver ATIVO na company · sem `provider_switch_pending` · `ACEITA`
3. **start** — `EM_ANDAMENTO` + `started_at`
4. **finish** — `FINALIZADA` · tx financeira · totais client/driver
5. **cancel** — `CANCELADA` · financial `ESTORNADO`
6. **reassign** — troca driver · `ACEITA`
7. **transfer-partner** — set `partner_company_id`

Código: `app/Services/Ride/RideService.php`

## Relaciona

- Resolução → [resolucao-fornecedor.md](resolucao-fornecedor.md)
- Status → [status.md](status.md)
