# Clientes

Perfil `clients` 1:1 `users` + role `CLIENTE`.

## Como nasce

1. Self: `POST /auth/register` role CLIENTE → prefs `ALL`
2. Por empresa/motorista: `POST /clientes` → vínculo + email senha temp + prefs `COMPANY`

## API

`GET/POST /clientes` · `GET/PATCH /clientes/{id}`

## Tela

`/clientes` · modal `ClientModal`

## Relaciona

- Fornecedor padrão → [fornecedor-padrao.md](fornecedor-padrao.md)
- Corridas → [../05-corridas](../05-corridas/)
