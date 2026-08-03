# Documentos motorista

`driver_documents`: CNH, CRLV, antecedentes…

Status: `PENDENTE|APROVADO|REJEITADO|VENCIDO`

Se todos `APROVADO` → driver pode ir `ATIVO` (`DriverApprovalService::reviewDocument`).

## API

`POST /motoristas/{driver}/documents/{document}/review` body `{ "status": "APROVADO" }`
