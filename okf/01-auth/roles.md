# Roles e permissões

| Role | Faz |
|------|-----|
| ADMIN | Tudo + config/plans |
| EMPRESA | Frota, clientes, corridas, financeiro, parceiros |
| MOTORISTA | Aceitar/executar corridas; pode cadastrar cliente |
| CLIENTE | Criar/ver próprias corridas |

## Código

- Enum: `app/Enums/UserRole.php`
- Middleware alias: `role`, `permission` (Spatie) em `bootstrap/app.php`
- Policies: Ride/Company/Driver/Client

## UI

Front simula role via Zustand `activeRole` (Sidebar/Login) — ainda não lê `/auth/me`.
