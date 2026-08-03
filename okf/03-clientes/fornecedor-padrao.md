# Fornecedor padrão

`client_preferences`:

| Mode | Efeito na criação de corrida |
|------|------------------------------|
| `COMPANY` | usa `default_company_id` se `company_id` omitido |
| `ALL` | precisa `company_id` ou vínculo ativo; fica disponível a empresas habilitadas |

Cliente criado por empresa → mode `COMPANY` + essa empresa.

## Service

`ClientOnboardingService` · resolução em `RideService::resolveCompanyId`

## Front

Campo dedicado ainda não existe; só `companyId` opcional no mock.
