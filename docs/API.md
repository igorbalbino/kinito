# Kinito API — Documentação inicial

Base URL: `/api/v1`  
Auth: Laravel Sanctum Bearer Token  
Formato: JSON

## Roles

`ADMIN` · `EMPRESA` · `MOTORISTA` · `CLIENTE`

Um usuário pode ter múltiplos roles (Spatie Permission).

## Status — Corridas (operacional)

| Valor | Descrição |
|-------|-----------|
| `CRIADA` | Criada, ainda não disponibilizada |
| `AGENDADA` | Agendamento futuro |
| `DISPONIVEL` | Aberta para aceite |
| `ACEITA` | Motorista atribuído |
| `EM_ANDAMENTO` | Em execução |
| `FINALIZADA` | Concluída |
| `CANCELADA` | Cancelada |

### Mapeamento futuro → frontend mock

| API | Front (`types/index.ts`) |
|-----|--------------------------|
| `DISPONIVEL` / `CRIADA` | `pendente` |
| `ACEITA` / `AGENDADA` | `atribuida` |
| `EM_ANDAMENTO` | `em_andamento` |
| `FINALIZADA` | `concluida` |
| `CANCELADA` | `cancelada` |

## Status — Financeiro

`INCOMPLETO` · `PENDENTE` · `PAGO` · `RECEBIDO` · `REPASSADO` · `ESTORNADO`

## Auth

| Método | Endpoint | Auth |
|--------|----------|------|
| POST | `/auth/register` | Público (role: `CLIENTE`\|`MOTORISTA`) |
| POST | `/auth/login` | Público |
| POST | `/auth/logout` | Bearer |
| GET | `/auth/me` | Bearer |
| PATCH | `/auth/me` | Bearer |
| POST | `/auth/forgot-password` | Público |
| POST | `/auth/reset-password` | Público |
| POST | `/auth/email/verification-notification` | Bearer |
| GET | `/auth/email/verify/{id}/{hash}` | Signed URL |

### Exemplo — registro cliente

```json
POST /api/v1/auth/register
{
  "name": "João",
  "email": "joao@email.com",
  "password": "password",
  "password_confirmation": "password",
  "role": "CLIENTE",
  "phone": "11999999999"
}
```

### Exemplo — registro motorista

```json
{
  "name": "Pedro",
  "email": "pedro@email.com",
  "password": "password",
  "password_confirmation": "password",
  "role": "MOTORISTA",
  "vehicle_model": "Corolla",
  "vehicle_plate": "ABC1D23",
  "city": "São Paulo",
  "company_id": 1
}
```

## Empresas

| Método | Endpoint |
|--------|----------|
| POST | `/empresas/register` (público, fluxo separado) |
| GET | `/empresas` |
| GET | `/empresas/{id}` |
| PATCH | `/empresas/{id}` |
| PUT | `/empresas/{id}/settings` |
| POST | `/empresas/{id}/partnerships` |
| PATCH | `/empresas/{id}/partnerships/{partnership}` |
| POST | `/empresas/{id}/subscribe` |
| GET | `/empresas/{id}/whatsapp` |
| POST | `/empresas/{id}/whatsapp/connect` |
| DELETE | `/empresas/{id}/whatsapp` |

### WhatsApp (Baileys sidecar)

- `GET` — status + QR (se aguardando scan)
- `POST .../connect` — inicia sessão (`manage` policy: owner/admin)
- `DELETE` — desconecta e limpa sessão no gateway
- Webhooks públicos: `POST /webhooks/whatsapp`, `POST /webhooks/whatsapp/tick`

### Settings relevantes

```json
{
  "modelo_corridas": "AMBOS",
  "accept_instant_rides": true,
  "allow_scheduling": true,
  "stripe_enabled": false,
  "notifications_enabled": true,
  "allow_partners": true,
  "whatsappEnabled": false,
  "whatsappConnected": false,
  "whatsappPhone": null
}
```

`modelo_corridas`: `INSTANTANEAS` | `AGENDAMENTO` | `AMBOS`
## Motoristas

| Método | Endpoint |
|--------|----------|
| GET | `/motoristas` |
| GET | `/motoristas/{id}` |
| PATCH | `/motoristas/{id}` |
| POST | `/motoristas/{id}/approve` |
| POST | `/motoristas/{id}/block` |
| POST | `/motoristas/{id}/link-company` |
| POST | `/motoristas/{id}/documents/{document}/review` |

Status: `PENDENTE` → (aprovação) → `ATIVO` · também `BLOQUEADO` · `INDISPONIVEL`

## Clientes

| Método | Endpoint |
|--------|----------|
| GET | `/clientes` |
| POST | `/clientes` (empresa/motorista — vínculo + email de acesso) |
| GET | `/clientes/{id}` |
| PATCH | `/clientes/{id}` |

Fornecedor padrão (`client_preferences`):

- `default_provider_mode`: `COMPANY` | `ALL`
- `default_company_id`: usado quando mode = `COMPANY`

## Corridas

| Método | Endpoint |
|--------|----------|
| GET | `/corridas` |
| POST | `/corridas` |
| GET | `/corridas/{id}` |
| POST | `/corridas/{id}/accept` |
| POST | `/corridas/{id}/start` |
| POST | `/corridas/{id}/finish` |
| POST | `/corridas/{id}/cancel` |
| POST | `/corridas/{id}/reassign` |
| POST | `/corridas/{id}/transfer-partner` |
| PATCH | `/corridas/{id}/finance` |
| POST | `/corridas/{id}/payment-intent` |

### Filtros GET `/corridas`

`status`, `financial_status`, `company_id`, `driver_id`, `client_id`, `from`, `to`, `search`, `per_page`

### Criar corrida

```json
{
  "client_id": 1,
  "company_id": 1,
  "origin": { "address": "...", "lat": -23.5, "lng": -46.6, "city": "SP", "neighborhood": "Centro" },
  "destination": { "address": "...", "lat": -23.6, "lng": -46.7, "city": "SP", "neighborhood": "Pinheiros" },
  "distance_km": 12,
  "payment_method": "pix",
  "scheduled_date": "2026-08-10",
  "scheduled_time": "14:30",
  "notes": "Portaria 2"
}
```

## Financeiro

| Método | Endpoint |
|--------|----------|
| GET | `/financeiro/transactions` |
| GET | `/financeiro/summary` |
| POST | `/webhooks/stripe` (público) |

### Split (Stripe ativo)

```
bruto - taxa Stripe - comissão plataforma - comissão empresa = líquido motorista
```

Com `PAYMENT_PROVIDER=manual`, valores podem ficar `INCOMPLETO`/`PENDENTE` e não contam como faturamento confirmado até finalização/ajuste.

## Relatórios

| Método | Endpoint | Conteúdo |
|--------|----------|----------|
| GET | `/relatorios/own` | Corridas próprias |
| GET | `/relatorios/received` | Recebidas de parceiros |
| GET | `/relatorios/forwarded` | Repassadas a parceiros |
| GET | `/relatorios/consolidated` | Soma geral |

Filtros: `from`, `to`, `driver_id`, `client_id`, `company_id`, `status`

## Outros

| Método | Endpoint |
|--------|----------|
| GET | `/dashboard` |
| GET | `/notificacoes` |
| POST | `/notificacoes/{id}/read` |
| POST | `/notificacoes/read-all` |
| GET | `/logs/rides` |
| GET | `/logs/rides/details` |
| GET | `/logs/audits` |
| GET | `/config` |
| PUT | `/config` (admin) |
| GET | `/plans` |
| POST | `/plans` (admin) |
| PATCH | `/plans/{id}` (admin) |

## Resources (camelCase)

As responses usam camelCase alinhado ao frontend (`grossValue`, `companyId`, `paymentMethod`, etc.).
