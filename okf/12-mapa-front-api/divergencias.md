# Divergências conhecidas

| Tema | Front | Backend | Notas |
|------|-------|---------|-------|
| Ride status | 5 valores PT | 7 enums | mapeados em `mappers.ts` |
| Payment / financial status | subset | 6 FinancialStatus | map parcial |
| Driver status | `em_aprovacao` | `PENDENTE` | map ok |
| Geolocalização | flag UI | sem lat/lng motorista | marketplace fallback sem GPS |
| Feature flags config | local store | `GET/PUT /config` admin | frota não persiste flags no back |
| Financial mode Stripe/manual | store + bootstrap | `payment_provider` config | simulação operacional |

Já alinhados (não são mais gap):

- Register empresa separado + verificação e-mail
- Fornecedor cliente/motorista (`/fornecedores`)
- Modelo de corridas na config
- Convites sem senha antecipada
- WhatsApp sem select de empresa
- Indicações no PlanBilling

Resources camelCase ↔ types front via `normalize.ts`.
