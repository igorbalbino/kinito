# Motoristas

Perfil `drivers` 1:1 user · N:N companies (`driver_company`) · docs.

## Status

`PENDENTE` → empresa aprova → `ATIVO` · também `BLOQUEADO` `INDISPONIVEL`

## API

`GET/PATCH /motoristas/{id}` · `approve` · `block` · `link-company` · `documents/{id}/review`

## Tela

`/motoristas` · `DriverApprovalModal`

## Cadastro público

`POST /auth/register` role `MOTORISTA` (+ veículo/docs stub)

## Relaciona

- Corridas accept/start/finish → [../05-corridas](../05-corridas/)
- Finance líquido → [../06-financeiro](../06-financeiro/)
