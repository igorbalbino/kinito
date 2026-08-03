# Mapa Frontend ↔ API

Front ainda **mock** (`useAppStore` + `mockData`). Abaixo = contrato alvo.

| Tela | View | API principal |
|------|------|---------------|
| `/` | LandingView | — |
| `/login` | LoginView | `POST /auth/login` |
| `/register` | RegisterView | `POST /auth/register` ou `/empresas/register` |
| `/dashboard` | DashboardView | `GET /dashboard` |
| `/corridas` | CorridasView | `GET/POST /corridas` + ações |
| `/clientes` | ClientesView | `/clientes` |
| `/motoristas` | MotoristasView | `/motoristas` |
| `/empresas` | EmpresasView | `/empresas` |
| `/financeiro` | FinanceiroView | `/financeiro/*` |
| `/relatorios` | RelatoriosView | `/relatorios/*` |
| `/logs` | LogsView | `/logs/*` |
| `/notificacoes` | NotificacoesView | `/notificacoes` |
| `/perfil` | PerfilView | `/auth/me` |
| `/configuracoes` | ConfiguracoesView | `/config` + settings empresa |

Subdocs: [auth.md](auth.md) · [divergencias.md](divergencias.md)
