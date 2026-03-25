# MVP de Cardapio Digital e Delivery Proprio

## Objetivo

Evoluir o backend NestJS + Prisma atual para suportar:

- cardapio publico por unidade
- checkout publico com TAKEAWAY e DELIVERY
- taxa de entrega calculada no servidor
- criacao idempotente de pedido publico
- tracking publico de status
- painel administrativo de delivery
- configuracao operacional de horario, cobertura e disponibilidade

## Fluxo Publico

1. Front abre `GET /public/stores/:unitSlug/menu` para montar o cardapio digital.
2. Front envia o carrinho para `POST /public/stores/:unitSlug/cart/quote`.
3. Backend recalcula produtos, variantes, opcionais, subtotal, taxa e total.
4. Front confirma e envia `POST /public/stores/:unitSlug/orders` com `Idempotency-Key`.
5. Backend cria/atualiza cliente, endereco, pedido e pagamento pendente dentro de transacao.
6. Front acompanha o pedido em `GET /public/orders/:publicToken/status`.

## Fluxo Administrativo

1. Backoffice ajusta regras operacionais em `GET/PATCH /settings/unit/ordering`.
2. Backoffice administra disponibilidade de produto pelos endpoints existentes de `products`.
3. Operacao acompanha o kanban de entrega em `GET /orders/delivery/board`.
4. Mudanca de status continua em `PATCH /orders/:id/status`.

## Endpoints Entregues

### Publicos

- `GET /public/stores/:unitSlug/menu`
- `POST /public/stores/:unitSlug/cart/quote`
- `POST /public/stores/:unitSlug/orders`
  - requer header `Idempotency-Key`
- `GET /public/orders/:publicToken/status`

### Administrativos

- `GET /settings/unit/ordering`
- `PATCH /settings/unit/ordering`
- `GET /orders/delivery/board`
- `POST /products`
- `PATCH /products/:id`
- `GET /products/:id`

## Contrato de API

### `POST /public/stores/:unitSlug/cart/quote`

Request:

```json
{
  "type": "DELIVERY",
  "customer": {
    "name": "Maria Oliveira",
    "phone": "34999998888",
    "email": "maria@email.com"
  },
  "address": {
    "street": "Rua das Flores",
    "number": "123",
    "neighborhood": "Centro",
    "city": "Uberlandia",
    "state": "MG",
    "zipCode": "38400100",
    "reference": "Portao azul"
  },
  "items": [
    {
      "productId": "uuid-do-produto",
      "quantity": 2,
      "options": [
        {
          "productOptionId": "uuid-do-adicional",
          "quantity": 1
        }
      ]
    }
  ],
  "paymentMethod": "PIX"
}
```

Response:

```json
{
  "type": "DELIVERY",
  "subtotal": 50,
  "deliveryFee": 8,
  "total": 58,
  "delivery": {
    "zoneId": "uuid-da-zona",
    "zoneName": "Centro",
    "distanceKm": null
  }
}
```

### `POST /public/stores/:unitSlug/orders`

Request: mesmo payload do quote.

Response:

```json
{
  "publicToken": "token-publico",
  "code": 1042,
  "channel": "PUBLIC_CATALOG",
  "type": "DELIVERY",
  "status": "PENDING",
  "subtotal": 50,
  "deliveryFee": 8,
  "total": 58
}
```

### `PATCH /settings/unit/ordering`

Payload resumido:

```json
{
  "publicDescription": "Hamburguer artesanal com retirada e delivery proprio.",
  "orderingTimeZone": "America/Sao_Paulo",
  "publicMenuEnabled": true,
  "publicOrderingEnabled": true,
  "takeawayEnabled": true,
  "deliveryEnabled": true,
  "pickupLeadTimeMinutes": 20,
  "deliveryLeadTimeMinutes": 45,
  "latitude": -18.9141,
  "longitude": -48.2749,
  "operatingHours": [
    {
      "fulfillmentType": "TAKEAWAY",
      "dayOfWeek": 1,
      "opensAtMinutes": 660,
      "closesAtMinutes": 1380
    }
  ],
  "deliveryZones": [
    {
      "name": "Centro",
      "coverageRules": [
        {
          "zipCodePrefix": "38400"
        }
      ],
      "feeRules": [
        {
          "fee": 8,
          "minimumOrder": 0
        }
      ]
    }
  ]
}
```

### `POST /products` e `PATCH /products/:id`

Campos novos relevantes:

- `isAvailableForTakeaway`
- `isAvailableForDelivery`
- `availabilityWindows`

## Garantias de Seguranca e Performance

- rotas publicas com rate limit por IP
- criacao de pedido com `Idempotency-Key`
- telefone, CEP e estado sanitizados no DTO
- quote e criacao recalculados no servidor
- pedido recusado para produto inativo ou indisponivel
- rotas publicas separadas das rotas autenticadas
- catalogo publico com cache em memoria de curta duracao
- checkout dentro de transacao Prisma
- logging estruturado para falhas de quote/pedido

## Testes Cobertos

- quote recalculando subtotal, taxa e total
- recusa de produto indisponivel para delivery
- reutilizacao idempotente com mesmo payload
- criacao de pedido publico com total calculado no servidor e pagamento pendente

## Pronto

- cardapio publico com categorias, produtos, variantes e adicionais
- checkout publico TAKEAWAY/DELIVERY
- taxa por zona com regras e opcionalmente por distancia quando houver coordenadas
- tracking publico de pedido
- board administrativo de delivery
- configuracao de horario da unidade
- configuracao de cobertura e taxa de entrega
- disponibilidade por produto no catalogo/admin
- canal do pedido preparado para integracao externa futura

## Fora do Escopo

- iFood, WhatsApp e outros marketplaces
- gateway de pagamento, PIX copia-e-cola ou captura online
- roteirizacao de entregador
- geocodificacao automatica de endereco
- notificacoes push/SMS/email
- vitrine publica multiunidade
- cupom, promocao e fidelidade
