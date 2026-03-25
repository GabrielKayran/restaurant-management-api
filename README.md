# Restaurant Management API

API REST para gestao de restaurante com NestJS, Prisma e PostgreSQL.

Estado atual do projeto:
- onboarding e autenticacao com JWT
- operacao single-unit first sem remover multiunidade do schema
- equipe, catalogo, clientes, mesas, pedidos, pagamentos, caixa e dashboard
- schema pronto para evolucao futura de delivery, estoque e integracoes

## Stack

- Node.js 18+
- NestJS 10
- TypeScript
- Prisma ORM
- PostgreSQL 15
- Swagger / OpenAPI

## Foco do MVP atual

O sistema esta sendo conduzido para um MVP vendavel de restaurante/hamburgueria com:
- uma unidade principal
- resolucao automatica de unidade quando o usuario possui acesso a somente uma unidade ativa
- catalogo com categorias, variantes, opcionais e precos agendados
- operacao de salao, balcao e retirada
- caixa com abertura e fechamento
- dashboard operacional

## Modulos HTTP disponiveis

- `GET /health`
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/me`
- `GET /settings/restaurant`
- `PATCH /settings/restaurant`
- `GET /settings/unit`
- `PATCH /settings/unit`
- `POST /staff`
- `POST /staff/invite`
- `POST /staff/accept-invite`
- `GET /staff`
- `PATCH /staff/:userId/status`
- `GET /products`
- `GET /products/:id`
- `POST /products`
- `PATCH /products/:id`
- `DELETE /products/:id`
- `GET /products/categories`
- `GET /products/categories/:id`
- `POST /products/categories`
- `PATCH /products/categories/:id`
- `DELETE /products/categories/:id`
- `GET /products/categories/summary`
- `GET /customers`
- `GET /customers/:id`
- `POST /customers`
- `PATCH /customers/:id`
- `GET /tables`
- `GET /tables/summary`
- `GET /tables/:id`
- `POST /tables/:id/open-session`
- `POST /tables/:id/open-order`
- `POST /tables/:id/reserve`
- `GET /orders`
- `GET /orders/:id`
- `POST /orders`
- `PATCH /orders/:id`
- `PATCH /orders/:id/status`
- `POST /orders/:id/cancel`
- `GET /payments`
- `POST /payments`
- `POST /cash-register/open`
- `GET /cash-register/summary`
- `GET /cash-register/payment-methods-summary`
- `GET /cash-register/transactions`
- `POST /cash-register/close`
- `GET /dashboard/summary`
- `GET /dashboard/sales-overview`
- `GET /dashboard/orders-by-status`
- `GET /dashboard/payments-by-method`
- `GET /dashboard/sales-by-hour`
- `GET /dashboard/preparation-time-trend`
- `GET /dashboard/top-products`
- `GET /dashboard/recent-orders`

## Regras importantes de escopo

- Rotas operacionais usam JWT.
- O header `x-unit-id` continua suportado.
- Quando o usuario possui acesso a somente uma unidade ativa, o backend resolve a unidade automaticamente.
- Quando o usuario possui mais de uma unidade ativa, a selecao explicita de unidade continua obrigatoria.

## Regras de seguranca do MVP

- `POST /auth/signup` possui rate limit de `3` tentativas por `10` minutos por cliente.
- `POST /auth/login` possui rate limit de `5` tentativas por `1` minuto por cliente.
- `POST /auth/refresh` possui rate limit de `20` tentativas por `1` minuto por cliente.
- Respostas limitadas retornam status `429` com headers `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining` e `X-RateLimit-Reset`.
- Acoes sensiveis do MVP geram log de auditoria estruturado: configuracoes, equipe, pagamentos e caixa.

## Exemplos de payload

### `POST /auth/signup`

```json
{
  "name": "Joao Silva",
  "email": "joao@restaurante.com",
  "password": "123456",
  "tenantName": "Grupo Sabor Mineiro",
  "unitName": "Loja Centro",
  "phone": "3433310001"
}
```

### `POST /products`

```json
{
  "name": "Burger Bacon",
  "categoryId": "uuid-da-categoria",
  "description": "Blend 180g com queijo e bacon",
  "basePrice": 29.9,
  "costPrice": 13.5,
  "variants": [
    {
      "name": "Duplo",
      "priceDelta": 8,
      "isDefault": true
    }
  ],
  "optionGroups": [
    {
      "name": "Adicionais",
      "minSelect": 0,
      "maxSelect": 3,
      "options": [
        {
          "name": "Bacon extra",
          "priceDelta": 4
        }
      ]
    }
  ],
  "prices": [
    {
      "name": "Promocao almoco",
      "price": 27.9,
      "startsAt": "2026-03-23T11:00:00.000Z",
      "endsAt": "2026-03-23T15:00:00.000Z"
    }
  ]
}
```

### `POST /customers`

```json
{
  "name": "Maria Oliveira",
  "phone": "34999998888",
  "email": "maria@email.com",
  "address": {
    "street": "Rua Afonso Pena",
    "number": "123",
    "city": "Uberlandia",
    "state": "MG",
    "zipCode": "38400100"
  }
}
```

### `PATCH /settings/restaurant`

```json
{
  "name": "Hamburgueria Central",
  "phone": "34999990000",
  "document": "12345678000199"
}
```

### `PATCH /settings/unit`

```json
{
  "name": "Unidade Centro",
  "phone": "34999991111"
}
```

### `POST /cash-register/open`

```json
{
  "openingFloat": 150
}
```

## Como rodar

1. Instale as dependencias:

```bash
npm install
```

2. Configure o `.env`:

```env
DATABASE_URL=postgresql://prisma:prisma@localhost:5432/restaurant_management?schema=public
JWT_ACCESS_SECRET=dev_access_secret
JWT_REFRESH_SECRET=dev_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3000
```

3. Suba o banco:

```bash
docker compose -f docker-compose.db.yml up -d
```

4. Aplique schema e seed:

```bash
npx prisma db push
npm run seed
```

5. Inicie a API:

```bash
npm run start:dev
```

## Swagger

Com a aplicacao rodando:
- `http://localhost:3000/api`

## Testes

```bash
npx jest --runInBand
```
