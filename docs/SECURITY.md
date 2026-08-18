# Kinito — Checkup de Segurança e Integridade

Situação após o alinhamento de cadastro, escopo e recibos. Itens abaixo que já foram tratados no código não devem ser relidos como bugs abertos.

## Corrigido neste alinhamento

- Login exige e-mail verificado; convite não devolve senha no JSON
- `verified.api` + `password.changed` no grupo autenticado
- Escopo de clientes do motorista = próprio perfil (não a frota)
- `approve` / `block` / `reviewDocument` só EMPRESA/ADMIN (`manageFleet`)
- IDOR `client_id` na criação de corrida; reassign exige motorista ATIVO na empresa
- Relatórios só empresa/admin no papel atuante; financeiro por papel
- `GET /fornecedores` só id/nome/modelo; `GET /config` reduzido para não-admin
- Recibos de corrida por e-mail (cliente + motorista) no finish
- Header `X-Kinito-Role` para troca de perfil

## Ainda observar

| # | Achado | Onde | Notas |
|---|--------|------|-------|
| 1 | Webhook Stripe mock aceita payload sem assinatura | `StripeWebhookController` | Só com `STRIPE_SECRET` ausente (dev) |
| 8 | `transfer-partner` sem partnership ACTIVE | `RideService::transferToPartner` | Validar parceria quando fechar parcerias |
| 9 | Finish cria `FinancialTransaction` sem unique `(ride_id, type)` | finance | Unique + lock |
| 14 | Sem lock otimista em transição de status | `RideService::transition` | `lockForUpdate` |

## Já em bom estado

- Senhas com hash; tokens Sanctum
- Throttle em login/register/forgot/reset e criação de corrida
- Policies Ride / Company / Driver / Client com papel atuante
- `NotificationController::markRead` checa `user_id`
- SMTP fail-soft; signed URL de verificação

## Referências

- API: [`docs/API.md`](API.md)
- SMTP: [`README.md`](../README.md#e-mail-smtp)
- OKF: [`okf/`](../okf/)
