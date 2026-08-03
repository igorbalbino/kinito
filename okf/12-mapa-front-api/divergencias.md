# Divergências conhecidas

| Tema | Front mock | Backend |
|------------------|---------|
| Ride status | 5 valores PT simples | 7 enums ricos |
| Payment status | pago/pendente/estornado/falhou | FinancialStatus 6 valores |
| Driver status | em_aprovacao | PENDENTE |
| Register empresa | na mesma tela | endpoint separado |
| Planos | `tier` string | `plans`+`subscriptions` |
| Parceiros/fornecedor | quase ausente | modelado |
| HTTP | nenhum | Sanctum completo |

Integração: Resources camelCase já próximos dos types; ajustar enums no front ou mapear na camada API client.
