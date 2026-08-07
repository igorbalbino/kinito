# Convite de cliente (empresa/motorista)

`POST /clientes` → `ClientOnboardingService::createByActor`

## Novo usuário

1. User com senha placeholder · `must_change_password=true` · `email_verified_at=null`
2. Client + vínculo `client_company` + prefs `COMPANY`
3. E-mail de **confirmação** (sem senha) — HTML
4. Resposta API: `invite_pending=true` (sem `temporary_password`)
5. UI: “Aguardando confirmação de e-mail”

## Após verify

`AuthController::verifyEmail` gera senha temp → e-mail credenciais → login + troca senha.

## Usuário já existente

Só vincula à empresa; sem novo convite se já verificado.

## Relaciona

- Verificação → [../01-auth/verificacao-email.md](../01-auth/verificacao-email.md)
- Fornecedor → [fornecedor-padrao.md](fornecedor-padrao.md)
