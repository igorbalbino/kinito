# Kinito — Checkup de Segurança e Integridade

Auditoria estática do backend (API Laravel). Escopo: apontar falhas; correções de código ficam para um passo seguinte (exceto fail-soft de e-mail já aplicado).

## Crítico / Alto

| # | Achado | Onde | Risco | Mitigação sugerida |
|---|--------|------|-------|--------------------|
| 1 | Webhook Stripe sem verificação real de assinatura | [`app/Http/Controllers/Api/StripeWebhookController.php`](../app/Http/Controllers/Api/StripeWebhookController.php) | Qualquer cliente pode POST forjado (`payment_intent.succeeded`) e marcar corrida como paga | Usar `Stripe\Webhook::constructEvent` com `STRIPE_WEBHOOK_SECRET`; rejeitar se secret ausente em produção |
| 2 | `rideLogs` sem escopo de tenant | [`LogController::rideLogs`](../app/Http/Controllers/Api/LogController.php) | Qualquer usuário autenticado lista logs de todas as corridas | Filtrar por company/driver/client do user; exigir role EMPRESA/ADMIN como em `rideDetailLogs` |
| 3 | Motorista vê qualquer cliente | [`ClientPolicy::view`](../app/Policies/ClientPolicy.php) (`return hasRole(MOTORISTA)`) | IDOR / vazamento de PII | Restringir a clientes vinculados à mesma empresa do motorista (ou criados por ele) |
| 4 | Senha temporária no JSON da API | [`ClientController::store`](../app/Http/Controllers/Api/ClientController.php) `temporary_password` | Vazamento em logs de proxy, browser history, APM | Enviar só por e-mail; não retornar senha no body (ou flag só em ambiente local) |
| 5 | Relatórios / Financeiro só com `auth:sanctum` | [`ReportController`](../app/Http/Controllers/Api/ReportController.php), [`FinanceController`](../app/Http/Controllers/Api/FinanceController.php) | Sem `authorize()`; filtro interno fácil de regredir e abrir IDOR | Policies + `abort_unless` role EMPRESA/ADMIN; testes de tenant |

## Médio

| # | Achado | Risco | Mitigação sugerida |
|---|--------|-------|--------------------|
| 6 | `MustVerifyEmail` sem middleware `verified` nas rotas | Conta não verificada usa a API inteira | Aplicar `verified` (ou equivalente API) após registro, com allowlist de rotas de verificação |
| 7 | Multi-role sem “role ativo” | User `CLIENTE`+`EMPRESA` herda poderes EMPRESA em qualquer request | Header/claim `X-Active-Role` validado + policies checam o role ativo |
| 8 | `transfer-partner` sem partnership ACTIVE | Repasse para empresa sem parceria | Validar `company_partnerships.status = ACTIVE` nos dois sentidos |
| 9 | Finish cria `FinancialTransaction` sem unique `(ride_id, type)` | Race duplica faturamento | Unique index parcial + `firstOrCreate` / lock na corrida |
| 10 | Aprovar motorista com `company_id` arbitrário | Empresa A pode tentar aprovar vínculo em B se policy frouxa | Exigir que actor pertença ao `company_id` informado |
| 11 | CORS `supports_credentials` + `statefulApi` | Superfície CSRF se SPA misturar cookie + token | Preferir Bearer puro na API; restringir origins; CSRF só se cookie session |

## Integridade de dados

| # | Achado | Risco | Mitigação sugerida |
|---|--------|-------|--------------------|
| 12 | Totais `total_rides` / `total_spent` / `total_earnings` incrementais | Drift em cancel/reprocess/manual | Job de reconciliação a partir de `rides` finalizadas |
| 13 | Override financeiro manual sem trilha obrigatória forte | Split vs lançamentos divergem | Sempre gravar audit + detail_log; opcionalmente recriar tx |
| 14 | Sem lock otimista em transição de status | Dois accepts/finish concorrentes | `lockForUpdate()` na transição ou coluna `version` |
| 15 | CNPJ só `unique`, sem dígitos verificadores | Cadastro com documento inválido | Rule de validação de CNPJ no Form Request |

## Já em bom estado

- Senhas com hash (`casts` hashed); tokens Sanctum
- Throttle em login/register/forgot/reset e criação de corrida
- Policies em Ride / Company / Driver (cobertura parcial)
- `NotificationController::markRead` checa `user_id`
- `NotificationService` não quebra a API se SMTP falhar / não configurado
- Signed URL para verificação de e-mail (`verification.verify`)

## Prioridade recomendada de correção

1. Webhook Stripe (#1)  
2. IDOR logs + clientes (#2, #3)  
3. Remover senha do response (#4)  
4. Authorize em reports/finance (#5)  
5. Unique financeiro + lock de status (#9, #14)

## Referências

- API: [`docs/API.md`](API.md)
- SMTP: [`README.md`](../README.md#e-mail-smtp)
- OKF: [`okf/`](../okf/)
