# Documentos motorista

`driver_documents`: CNH, CRLV, antecedentes…

Status: `PENDENTE|APROVADO|REJEITADO|VENCIDO`

Convite pela empresa cria stubs CNH/CRLV `PENDENTE`.

Se todos `APROVADO` → driver pode ir `ATIVO` (`DriverApprovalService::reviewDocument`).

Aprovação de vínculo empresa (`approve`) é **independente** dos docs (empresa pode liberar frota antes).

## API

`POST /motoristas/{driver}/documents/{document}/review` body `{ "status": "APROVADO" }`

## UI

`DriverApprovalModal` em `/motoristas`

## Relaciona

- Overview → [overview.md](overview.md)
- Convite → [convite.md](convite.md)
