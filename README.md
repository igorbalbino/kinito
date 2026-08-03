# KINITO — Backend API

Plataforma SaaS de gestão de corridas (Laravel 13 + Sanctum + Spatie Permission).

O frontend React permanece em [`front/`](front/) e **não é alterado** por este backend. A API está pronta para integração futura.

## Requisitos

- PHP 8.3+
- Composer 2
- MySQL 8+ **ou** SQLite (padrão local)
- Redis (opcional, recomendado para filas/cache em produção)

## Instalação

```bash
composer install
cp .env.example .env
php artisan key:generate
```

### Banco

**SQLite (rápido para local):**

```bash
# .env já vem com DB_CONNECTION=sqlite
# garanta o arquivo:
# Windows PowerShell:
New-Item -ItemType File -Force database/database.sqlite
```

**MySQL:**

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=kinito
DB_USERNAME=root
DB_PASSWORD=
```

### Migrar e popular

```bash
php artisan migrate --seed
```

### Filas

```bash
# database (padrão) ou redis
php artisan queue:work
```

### Servidor

```bash
php artisan serve
# API: http://localhost:8000/api/v1
```

## Contas seed

| Perfil | Email | Senha |
|--------|-------|-------|
| Admin | `admin@kinito.test` | `password` |
| Empresa 1 | `empresa1@kinito.test` | `password` |
| Empresa 2 | `empresa2@kinito.test` | `password` |
| Empresa 3 | `empresa3@kinito.test` | `password` |
| Motorista | `motorista1@kinito.test` … `motorista8@kinito.test` | `password` |
| Cliente | `cliente1@kinito.test` … `cliente10@kinito.test` | `password` |

## Configuração importante (`.env`)

| Variável | Descrição |
|----------|-----------|
| `PAYMENT_PROVIDER` | `manual` ou `stripe` |
| `STRIPE_KEY` / `STRIPE_SECRET` / `STRIPE_WEBHOOK_SECRET` | Stripe (opcional) |
| `PLATFORM_COMMISSION_PERCENT` | Comissão da plataforma (default 15) |
| `COMPANY_COMMISSION_PERCENT` | Comissão empresa (default 10) |
| `FRONTEND_URL` | CORS / links (default `http://localhost:3000`) |
| `QUEUE_CONNECTION` | `database` ou `redis` |
| `CACHE_STORE` | `database` ou `redis` |

## Autenticação

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@kinito.test\",\"password\":\"password\"}"
```

Use o header: `Authorization: Bearer {token}`

## Documentação da API

Veja [`docs/API.md`](docs/API.md).

## Estrutura

```
app/
  Enums/           # Status e papéis do domínio
  Http/Controllers/Api/
  Http/Requests/
  Http/Resources/
  Models/
  Policies/
  Services/        # Ride, Finance, Company, Client, Driver, Audit, Notification
  Jobs/            # Purge de ride_detail_logs (90 dias)
routes/api.php     # /api/v1/*
config/kinito.php
```

## Cadastro

- Público: **CLIENTE** ou **MOTORISTA** → `POST /api/v1/auth/register`
- Empresa (fluxo separado): `POST /api/v1/empresas/register`

## Testes

```bash
php artisan test
```

## Scheduler

O job `PurgeExpiredRideDetailLogs` roda diariamente (detalhes de corrida expiram em 90 dias).

```bash
php artisan schedule:work
```
