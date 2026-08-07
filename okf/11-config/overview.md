# Configurações (hub UI)

Tela `/configuracoes` — menu por `?sec=` (não são rotas novas).

## Seções por role

| sec | Quem vê | Conteúdo |
|-----|---------|----------|
| `plano` | empresa/admin frota | `PlanBillingPanel` (assinatura + indicações) |
| `modelo` | frota | `RideModelPanel` — modelo de corridas |
| `whatsapp` | frota | `WhatsAppConnectPanel` (empresa da sessão, sem select) |
| `fornecedor` | cliente / motorista | resumo + link `/fornecedores` |
| `mao` | todos | mão dominante (local) |
| `financeiro` | frota | Stripe vs manual (store local / bootstrap) |
| `flags` | admin | feature flags locais |

Idioma: só na navbar (não duplicar na config).

## API plataforma (admin)

`GET/PUT /config` — payment provider · feature_flags · platform_settings

## Empresa settings

→ [../02-empresas/settings.md](../02-empresas/settings.md)

## Perfil

`/perfil` — senha / dados · `PATCH /auth/me` · change-password

## Relaciona

- Fornecedores page → [../03-clientes/fornecedor-padrao.md](../03-clientes/fornecedor-padrao.md) · [../04-motoristas/fornecedor.md](../04-motoristas/fornecedor.md)
- WhatsApp → [../09-notificacoes/whatsapp.md](../09-notificacoes/whatsapp.md)
