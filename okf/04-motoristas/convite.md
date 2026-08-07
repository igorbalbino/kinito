# Convite de motorista (empresa)

`POST /motoristas` → `DriverApprovalService::createByCompany`

## Novo usuário

1. User placeholder + `must_change_password` · não verificado
2. Driver `ATIVO` + pivot empresa `ATIVO` + `primary_company_id` = empresa
3. Docs stub CNH/CRLV pendentes
4. E-mail convite (confirmação, sem senha)
5. `invite_pending=true` na resposta

## Após verify

Mesmo fluxo de credenciais que cliente → [../01-auth/verificacao-email.md](../01-auth/verificacao-email.md)

## Já existente

Vincula/atualiza veículo; se sem primary, seta a empresa criadora.

## Relaciona

- Fornecedor / troca → [fornecedor.md](fornecedor.md)
- Aprovação docs → [documentos.md](documentos.md)
