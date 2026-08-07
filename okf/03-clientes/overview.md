# Clientes

Perfil `clients` 1:1 `users` + role `CLIENTE`.

## Como nasce

1. Self: `POST /auth/register` role CLIENTE → prefs `ALL` · e-mail verificação · sem token
2. Por empresa/motorista: `POST /clientes` → vínculo + prefs `COMPANY` + **convite** (confirma e-mail → senha) → [convite.md](convite.md)

## API

`GET/POST /clientes` · `GET/PATCH /clientes/{id}` (prefs: `default_provider_mode`, `default_company_id`)

## Telas

`/clientes` · `ClientModal` · `/fornecedores` · Config `?sec=fornecedor`

## Relaciona

- Fornecedor padrão → [fornecedor-padrao.md](fornecedor-padrao.md)
- Convite → [convite.md](convite.md)
- Corridas → [../05-corridas](../05-corridas/)
