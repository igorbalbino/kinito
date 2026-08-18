# Roles e permissões

| Role | Faz |
|------|-----|
| ADMIN | Tudo + config/plans |
| EMPRESA | Frota, clientes, corridas, financeiro, parceiros; troca para motorista/cliente |
| MOTORISTA | Aceitar/executar as próprias corridas; pode transitar para cliente |
| CLIENTE | Criar/ver próprias corridas (sem subir de papel) |

## Papel atuante

Header `X-Kinito-Role` (`ADMIN` \| `EMPRESA` \| `MOTORISTA` \| `CLIENTE`), só se o user tiver o Spatie role. Sem header, usa o maior: ADMIN → EMPRESA → MOTORISTA → CLIENTE.

Escopo de listagens segue o papel **atuante**.

Cadastro empresa cria também perfis motorista + cliente na mesma conta. Cadastro/convite motorista cria também cliente.

## Código

- Enum: `app/Enums/UserRole.php`
- `App\Support\ActingRole` · `User::actingRole()`
- Policies: Ride/Company/Driver/Client

## UI

Switcher (Sidebar/Topbar) envia o header e recarrega os dados da API.
