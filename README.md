# Kinito — Backend API

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

## E-mail (SMTP)

Mesmos nomes do Odara — pode copiar as credenciais:

```env
MAIL_MAILER=smtp
MAIL_FROM_ADDRESS=noreply@seu-dominio.com
MAIL_FROM_NAME=Kinito

SMTP_HOST=smtp.seu-provedor.com
SMTP_PORT=587
SMTP_USER=seu-usuario
SMTP_PASS=sua-senha
SMTP_CRYPTO=tls
```

- Sem `SMTP_HOST`: use `MAIL_MAILER=log` (e-mails só no log; API não quebra).
- `SMTP_CRYPTO=tls` (porta 587) ou `ssl`/`smtps` (porta 465).
- Fallback Laravel: `MAIL_HOST` / `MAIL_USERNAME` / `MAIL_PASSWORD` / `MAIL_PORT`.
- Alias Odara: `MAIL_FROM` sobrescreve `MAIL_FROM_ADDRESS`.

Teste rápido (com SMTP preenchido):

```bash
php artisan tinker
>>> app(\App\Services\Notification\NotificationService::class)->sendEmail(
...   \App\Models\User::first(),
...   'Teste SMTP',
...   'Se você leu isto, o SMTP do Kinito está ok.'
... );
```

## Planos, trial e billing

- Empresa escolhe o plano → **14 dias de trial** (`POST /empresas/{id}/subscribe` com `mode=trial` ou `plan_id` no register).
- Após o trial: assina via `BillingGateway` (**Stripe** se `STRIPE_SECRET`, senão **mock**) ou fica suspensa (some do marketplace).
- Cron: `php artisan subscriptions:expire-trials` (agendado hourly).
- Interface: `App\Contracts\Billing\BillingGateway` — troque o driver sem mudar o lifecycle.

```env
BILLING_DRIVER=auto
STRIPE_SECRET=           # vazio = mock
STRIPE_WEBHOOK_SECRET=
```

## WhatsApp (providers)

Troca de driver só por `.env` — código de negócio usa `WhatsAppManager`.  
Provisório: sidecar Baileys em `whatsapp-gateway/` (até Meta Cloud API).

| `WHATSAPP_PROVIDER` | Uso |
|---------------------|-----|
| `log` | Simula envio no log (default / dev) |
| `baileys` | Sidecar `whatsapp-gateway/` (`WHATSAPP_GATEWAY_*`) |
| `meta` | Meta Cloud API (`WHATSAPP_META_TOKEN` + `PHONE_NUMBER_ID`) |

```env
WHATSAPP_ENABLED=true
WHATSAPP_PROVIDER=baileys
WHATSAPP_GATEWAY_URL=http://127.0.0.1:3001
WHATSAPP_GATEWAY_API_KEY=kinito-gateway-dev
```

Subir o gateway:

```bash
cd whatsapp-gateway
cp .env.example .env   # GATEWAY_API_KEY = mesmo do Laravel
npm install && npm start
```

Conectar QR: painel **Configurações → WhatsApp** (ou `POST /api/v1/empresas/{id}/whatsapp/connect`).  
Session do gateway = `company.id` (apenas dígitos).

Interface: `App\Contracts\WhatsApp\WhatsAppGateway`  
Drivers: `app/Services/WhatsApp/Drivers/*`

## Segurança

Checkup de riscos e integridade: [`docs/SECURITY.md`](docs/SECURITY.md).

## Autenticação

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"login\":\"admin@kinito.test\",\"password\":\"password\"}"
```

Login aceita e-mail ou telefone (`login`). Use o header: `Authorization: Bearer {token}`

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
