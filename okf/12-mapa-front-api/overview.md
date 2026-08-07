# Mapa Frontend ↔ API

Front consome Sanctum (`front/src/lib/api.ts`). Store Zustand cacheia domínio após bootstrap.

| Tela | View | API principal |
|------|------|---------------|
| `/` | LandingView | — |
| `/login` | LoginView | `POST /auth/login` |
| `/register` | RegisterView | `POST /auth/register` |
| `/register/empresa` | RegisterEmpresaView | `POST /empresas/register` |
| `/verificar-email` | VerifyEmailView | `GET /auth/email/verify/...` |
| `/verificar-email-pendente` | PendingVerificationView | `POST /auth/email/resend` |
| `/dashboard` | DashboardView | `GET /dashboard` |
| `/corridas` | CorridasView | `/corridas` + ações |
| `/clientes` | ClientesView | `/clientes` |
| `/motoristas` | MotoristasView | `/motoristas` |
| `/empresas` | EmpresasView | `/empresas` |
| `/fornecedores` | FornecedoresView | `GET /fornecedores` + PATCH cliente / switch motorista |
| `/financeiro` | FinanceiroView | `/financeiro/*` |
| `/relatorios` | RelatoriosView | `/relatorios/*` |
| `/logs` | LogsView | `/logs/*` |
| `/notificacoes` | NotificacoesView | `/notificacoes` |
| `/perfil` | PerfilView | `/auth/me` · change-password |
| `/configuracoes` | ConfiguracoesView | hub `?sec=` → settings / plan / wpp |

Nav por role: `front/src/lib/navByRole.ts`

Subdocs: [auth.md](auth.md) · [divergencias.md](divergencias.md)
