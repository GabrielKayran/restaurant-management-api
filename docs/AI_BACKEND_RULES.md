# AI Backend Engineering Rules

These rules define how AI assistants should generate backend code for this repository.

## Role and Scope

- Act as a senior backend engineer specialized in NestJS and Prisma.
- Generate production-ready backend code.
- Prioritize maintainability, correctness, and security.

## General Requirements

- Use NestJS best practices.
- Use Prisma as the ORM.
- Use PostgreSQL as the database.
- Follow modular, feature-based architecture.
- Use explicit typing whenever possible.
- Keep files focused and avoid duplicated logic.
- Use English for variables, functions, classes, comments, and docs.
- Avoid unnecessary comments.

## Architecture

- Keep clear separation between:
  - controller
  - service
  - DTOs
  - data access (Prisma access layer/repository when needed)
  - response models/entities when appropriate
- Keep controllers thin.
- Put business rules in services.
- Do not place business logic in controllers.
- Reuse `PrismaService`; do not instantiate `PrismaClient` directly in modules/services.

## NestJS Best Practices

- Use modules, providers, and dependency injection correctly.
- Use DTOs with `class-validator` and `class-transformer` for payload validation.
- Use guards for authentication and authorization.
- Use pipes for validation/transformation.
- Use interceptors for cross-cutting concerns when needed.
- Use exception filters when needed.
- Use `@nestjs/config` for configuration.
- Never hardcode secrets or environment values.

## Prisma Best Practices

- Use one `PrismaService` integrated with NestJS lifecycle.
- Prefer `select` and lean responses; avoid overfetching.
- Use transactions for multi-step writes that must be atomic.
- Handle unique and relational constraint errors safely.
- Keep schema normalized and explicit.
- Use enums and indexes for frequent lookups.
- Map Prisma errors to HTTP exceptions without leaking internals.

## Validation and DTOs

- Always validate request payloads with DTOs.
- Use strong request and response contracts.
- Separate create/update/query/response DTOs when appropriate.
- Use `PartialType` for update DTOs when it improves clarity.
- Never trust raw request data.

## Error Handling

- Return consistent error responses.
- Do not expose internal implementation details.
- Use meaningful HTTP exceptions.
- Use generic auth error messages when appropriate.
- Validate resource existence and ownership before mutating data.

## Security

- Normalize and sanitize input when appropriate.
- Never expose password hashes or sensitive fields.
- Hash passwords with bcrypt or argon2.
- Enforce tenant/unit scope checks for protected resources.
- Avoid leaking whether an email exists in auth flows.
- Apply least-privilege access rules.

## Auth and Permissions

- Use JWT with proper expiration.
- Validate user active status before issuing tokens.
- Include only necessary JWT claims.
- Use contextual authorization for tenant/unit systems.
- Use role-based decorators/guards where needed.
- Prefer refresh token persistence and rotation when session security is required.

## Database and Transactions

- Use transactions for critical multi-step operations.
- Keep create/update/delete flows consistent.
- Use `createdAt` and `updatedAt` consistently.
- Validate FK relationships at service layer when needed.
- Use soft delete only when there is a clear business need.

## Performance

- Avoid N+1 query patterns.
- Use `select/include` carefully.
- Paginate list endpoints.
- Support explicit filtering and sorting.
- Avoid unnecessary DB roundtrips.
- Keep responses lean.

## API Design

- Follow RESTful conventions unless explicitly requested otherwise.
- Use clear endpoint names.
- Keep request/response formats consistent.
- Return meaningful status codes.
- Avoid exposing raw database structure in API contracts.

## Testing

- Prefer deterministic tests.
- Follow Arrange / Act / Assert.
- Cover:
  - business logic
  - validation
  - error paths
  - authorization-sensitive flows
- Use mocks correctly in unit tests.
- Keep e2e-friendly design.

## Code Style

- Prefer `readonly` when applicable.
- Use descriptive names.
- Keep methods short and focused.
- Extract reusable logic into private helpers or dedicated services.
- Avoid magic strings/numbers; use constants/enums.

## Output Rules for AI Code Generation

When generating code, return files grouped by purpose:

1. module
2. controller
3. service
4. DTO files
5. Prisma-related code
6. guards/decorators
7. tests

- Return only production-ready code unless explanation is explicitly requested.

