# Financeiro

Provider global: `PAYMENT_PROVIDER=manual|stripe` (`config/kinito.php`).

## Split

```
bruto - taxa_stripe - comissão_plataforma - comissão_empresa = líquido_motorista
```

Defaults: Stripe 3.9%+0.50 · plataforma 15% · empresa `companies.commission_rate` (fallback 10%)

## Modo manual

Valores opcionais; status `INCOMPLETO`/`PENDENTE`; sem faturamento confirmado até finish/ajuste.

## API

`GET /financeiro/transactions|summary` · `PATCH /corridas/{id}/finance` · `POST .../payment-intent` · webhook `POST /webhooks/stripe`

## Tela

`/financeiro` · toggle modo em `/configuracoes`

## Relaciona

- Stripe → [stripe.md](stripe.md)
- Corridas → [../05-corridas](../05-corridas/)
- Relatórios $ → [../07-relatorios](../07-relatorios/)
