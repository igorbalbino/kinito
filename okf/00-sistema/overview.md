# Sistema KINITO

SaaS de gestão de corridas: **clientes** ↔ **motoristas** ↔ **empresas** (distribuidora / prestadora / parceira).

## Stack

- Front: `front/` React+TS (mock Zustand; sem HTTP ainda)
- Back: Laravel 13 root, API Sanctum `/api/v1`
- DB: SQLite local / MySQL prod · Redis opcional (queue/cache)

## Fluxo mental

```
User (N roles) → Company/Driver/Client profiles
Client cria Ride → Company responsável (± partner) → Driver aceita
Finance split → Logs/Audit → Reports
```

## Papéis

`ADMIN` `EMPRESA` `MOTORISTA` `CLIENTE` — multi-role no mesmo user.

## Relaciona

- Auth → [../01-auth](../01-auth/)
- Mapa telas/API → [../12-mapa-front-api](../12-mapa-front-api/)
- Docs API → [`docs/API.md`](../../docs/API.md)
