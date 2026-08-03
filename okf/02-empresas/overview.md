# Empresas

Tenant operacional. Possui motoristas, clientes, corridas, settings, subscription.

## Campos-chave

`owner_user_id` · `cnpj` · `commission_rate` · flags `is_distributor` `is_provider` `is_partner_enabled`

## API

`GET/PATCH /empresas/{id}` · `PUT .../settings` · partnerships · subscribe

## Tela

`/empresas` → `EmpresasView` (tier badge = plan slug)

## Relaciona

- Cadastro → [cadastro.md](cadastro.md)
- Settings → [settings.md](settings.md)
- Parceiros → [parceiros.md](parceiros.md)
- Planos → [../08-planos](../08-planos/)
- Corridas (responsável) → [../05-corridas](../05-corridas/)
