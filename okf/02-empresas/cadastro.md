# Cadastro empresa

`POST /api/v1/empresas/register` (público, separado do `/auth/register`)

## Cria

1. User + role `EMPRESA`
2. Company + attach dono (`company_user.role=dono`)
3. `company_settings` default `modelo_corridas=AMBOS`
4. Subscription trial plano `starter` (14d)

## Service

`CompanyService::register`

## Front

`/register` ainda mostra opção empresa (mock) — integrar depois neste endpoint, não em `/auth/register`.
