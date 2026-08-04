# Fornecedor padrão

`client_preferences`:

| Mode | Efeito na criação de corrida |
|------|------------------------------|
| `COMPANY` | usa `default_company_id` se `company_id` omitido |
| `ALL` | cliente deve escolher fornecedor (`GET /fornecedores`); marketplace só empresas com acesso (trial/ACTIVE) |

Cliente criado por empresa → mode `COMPANY` + essa empresa.

## Suspensão da empresa

Quando o trial/assinatura expira:

1. Empresa `is_active=false` some do marketplace
2. Clientes com fornecedor padrão = essa empresa → mode `ALL` + snapshot em `extra.provider_restore`
3. Ao pagar de novo → restaura `COMPANY` + `default_company_id`

## Convite

Cliente criado por empresa recebe mensagem fixa (e-mail/WhatsApp) com link, login e senha temporária.  
`users.must_change_password=true` até `POST /auth/change-password`.

## Service

`ClientOnboardingService` · resolução em `RideService::resolveCompanyId` · `SubscriptionLifecycleService`
