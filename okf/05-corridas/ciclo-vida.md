# Ciclo de vida

1. **create** — resolve empresa (prefs cliente) · calcula split · escreve ride_log + detail
2. **accept** — set driver · `ACEITA`
3. **start** — `EM_ANDAMENTO` + `started_at`
4. **finish** — `FINALIZADA` · tx financeira · incrementa totais client/driver
5. **cancel** — `CANCELADA` · financial `ESTORNADO`
6. **reassign** — troca driver · volta `ACEITA`
7. **transfer-partner** — set `partner_company_id`

Código: `app/Services/Ride/RideService.php`
