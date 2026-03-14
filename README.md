# 🍽️ Restaurant Management API

API REST para gestão de restaurantes, desenvolvida com **NestJS**, **Prisma** e **PostgreSQL**.

O projeto já possui a base de autenticação multi-tenant funcionando e um **schema Prisma completo** para operação de restaurante, incluindo catálogo, mesas, pedidos, delivery, estoque, receitas, pagamentos e caixa.

> Status atual: a API expõe endpoints de onboarding/autenticação e health check. Os demais módulos do domínio já estão modelados no banco e prontos para evolução na camada HTTP.

---

## ✅ Visão geral

Este repositório foi reorganizado para ser a base de um sistema de restaurante com foco em:

- **multi-tenant** por grupo/restaurante
- **multiunidade** por loja/filial
- **autenticação JWT** com access token e refresh token
- **onboarding de tenant + unidade inicial**
- **modelagem pronta** para operação de salão, balcão e delivery
- **documentação Swagger**
- **integração com PostgreSQL via Prisma**

---

## 🚀 Stack

- **Node.js 18+**
- **NestJS 10**
- **TypeScript**
- **Prisma ORM**
- **PostgreSQL 15**
- **JWT**
- **Swagger / OpenAPI**
- **Docker Compose**

---

## 🧩 Domínio modelado no banco

O arquivo `prisma/schema.prisma` já cobre as principais entidades de um sistema de gestão de restaurante:

### Estrutura organizacional
- `Tenant`
- `RestaurantUnit`
- `User`
- `UserTenantRole`
- `UserUnitRole`

### Catálogo e cardápio
- `Category`
- `Product`
- `ProductVariant`
- `ProductOptionGroup`
- `ProductOption`
- `ProductPrice`

### Atendimento e pedidos
- `Customer`
- `Address`
- `RestaurantTable`
- `TableSession`
- `Order`
- `OrderItem`
- `OrderItemOption`
- `OrderStatusHistory`
- `Courier`
- `DeliveryZone`
- `DeliveryFeeRule`
- `Payment`

### Estoque e produção
- `Ingredient`
- `StockItem`
- `StockMovement`
- `Recipe`
- `RecipeItem`
- `Supplier`

### Financeiro
- `CashRegister`
- `CashMovement`
- `Expense`

Também já existem enums para perfis de acesso, tipo/status do pedido, status de pagamento, movimentações de estoque e caixa.

---

## 📌 Funcionalidades já implementadas

### 🔐 Autenticação e onboarding
- cadastro do usuário proprietário (`OWNER`)
- criação automática do `Tenant`
- criação automática da primeira `RestaurantUnit`
- associação de papéis do usuário no tenant e na unidade
- login com JWT
- refresh token
- endpoint autenticado para consultar o usuário atual

### ❤️ Observabilidade básica
- endpoint `GET /health`
- Swagger habilitado em `/api`
- validação global com `ValidationPipe`
- filtro global para exceções do Prisma
- CORS habilitado

---

## 🛣️ Roadmap natural do projeto

Com base no schema atual, a evolução esperada da API inclui módulos como:

- gestão de categorias e produtos
- configuração de variantes e opcionais
- cadastro de clientes e endereços
- gestão de mesas e sessões de mesa
- criação e acompanhamento de pedidos
- fluxo de delivery e entregadores
- controle de estoque e fichas técnicas
- pagamentos, caixa e despesas
- permissões por tenant e unidade

---

## 📂 Estrutura atual do projeto

```text
src/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
│   ├── password.service.ts
│   ├── decorators/
│   ├── dto/
│   ├── guards/
│   └── models/
├── common/
│   ├── configs/
│   ├── filters/
│   └── pagination/
├── app.controller.ts
├── app.module.ts
├── main.ts
└── metadata.ts

prisma/
├── schema.prisma
├── seed.ts
└── migrations/
```

---

## ⚙️ Como rodar localmente

### 1. Clonar o repositório

```bash
git clone https://github.com/GabrielKayran/restaurant-management-api
cd restaurant-management-api
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Criar o arquivo `.env`

Exemplo mínimo:

```env
POSTGRES_USER=prisma
POSTGRES_PASSWORD=prisma
POSTGRES_DB=restaurant_management

DATABASE_URL=postgresql://prisma:prisma@localhost:5432/restaurant_management?schema=public

JWT_ACCESS_SECRET=dev_access_secret
JWT_REFRESH_SECRET=dev_refresh_secret

JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

PORT=3000
```

### 4. Subir o banco com Docker Compose

```bash
docker compose -f docker-compose.db.yml up -d
```

### 5. Aplicar o schema e popular dados iniciais

```bash
npx prisma db push
npm run seed
```

### 6. Iniciar a API

```bash
npm run start:dev
```

---

## 📚 Swagger

Com a aplicação rodando, acesse:

- `http://localhost:3000/api`

Para testar rotas protegidas:

1. faça login em `POST /auth/login`
2. copie o `accessToken`
3. clique em **Authorize**
4. informe o token como `Bearer SEU_TOKEN`

---

## 📡 Endpoints disponíveis hoje

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/health` | Health check da aplicação |
| `POST` | `/auth/signup` | Cria usuário owner + tenant + unidade inicial |
| `POST` | `/auth/login` | Autentica usuário e retorna `accessToken` e `refreshToken` |
| `POST` | `/auth/refresh` | Gera novo par de tokens a partir do refresh token |
| `GET` | `/auth/me` | Retorna o usuário autenticado |
| `POST` | `/staff` | Cadastra colaborador interno (OWNER/MANAGER) |
| `POST` | `/staff/invite` | Gera convite para colaborador (OWNER/MANAGER) |
| `POST` | `/staff/accept-invite` | Aceita convite e ativa vínculo do colaborador |
| `GET` | `/staff` | Lista colaboradores do tenant atual |
| `PATCH` | `/staff/:userId/status` | Ativa/desativa colaborador do tenant |

---

## 🧪 Exemplos de payload

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

### `POST /auth/login`

```json
{
  "email": "joao@restaurante.com",
  "password": "123456"
}
```

### `POST /auth/refresh`

```json
{
  "refreshToken": "SEU_REFRESH_TOKEN"
}
```

### `POST /staff/invite`

```json
{
  "email": "atendente@restaurante.com",
  "role": "ATTENDANT",
  "unitId": "uuid-da-unidade",
  "expiresInHours": 72
}
```

### `POST /staff/accept-invite`

```json
{
  "token": "TOKEN_DE_CONVITE",
  "password": "123456",
  "name": "Carlos Lima"
}
```

---

## 🌱 Seed disponível

O arquivo `prisma/seed.ts` cria uma base inicial com:

- tenant `Grupo Sabor Mineiro`
- unidades `Loja Centro` e `Loja Shopping`
- categorias `Burgers` e `Bebidas`
- produtos com variantes e opcionais
- cliente com endereço
- mesa e sessão de mesa
- pedido com item, histórico e pagamento

Usuários criados no seed:

- `ana@sabormineiro.com`
- `carlos@sabormineiro.com`

Senha padrão:

```text
123456
```

---

## 🔐 Segurança e boas práticas já presentes

- hash de senha com `bcrypt`
- autenticação JWT com refresh token
- validação de DTOs com `class-validator`
- guards para rotas protegidas
- tratamento global de exceções do Prisma
- configuração centralizada
- separação entre controller, service e DTOs
- tipagem forte com TypeScript + Prisma Client

---

## 🛠️ Scripts úteis

```bash
npm run start:dev
npm run build
npm run prisma:generate
npm run prisma:studio
npm run seed
npm run docker:db
npm run docker
```

---

## 📎 Observações

- A documentação agora descreve corretamente o projeto como **sistema de restaurante**.
- O schema Prisma já representa uma operação realista de restaurante, mesmo que nem todos os módulos HTTP estejam implementados ainda.
- Os metadados exibidos no Swagger ainda podem estar genéricos internamente e podem ser refinados depois sem impactar a estrutura principal da API.
- Regras para geração de código por IA: `docs/AI_BACKEND_RULES.md`.
