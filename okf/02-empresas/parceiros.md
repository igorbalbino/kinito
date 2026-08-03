# Parcerias

`company_partnerships`: company ↔ partner_company · status `PENDING|ACTIVE|REJECTED|SUSPENDED`

## API

- `POST /empresas/{id}/partnerships`
- `PATCH /empresas/{id}/partnerships/{partnership}`

## Uso em corridas

`rides.partner_company_id` = empresa que executa/recebe repasse.
Transfer: `POST /corridas/{id}/transfer-partner`

## Relatórios

- recebidas = sou `partner_company_id`
- repassadas = sou `company_id` + partner preenchido
→ [../07-relatorios](../07-relatorios/)
