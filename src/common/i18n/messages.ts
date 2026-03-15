export const Messages = {
  // Auth / token scope
  INVALID_CREDENTIALS: 'Credenciais inválidas.',
  TENANT_CONTEXT_REQUIRED:
    'Contexto do tenant ausente no token. Faça login novamente.',
  UNIT_HEADER_REQUIRED:
    'O cabeçalho x-unit-id é obrigatório e deve ser um UUID válido.',
  UNIT_ACCESS_DENIED: 'Você não tem acesso à unidade solicitada neste tenant.',
  NO_PERMISSION: 'Você não possui permissão para realizar esta ação.',

  // Common
  FIELD_REQUIRED: (field: string) => `O campo ${field} é obrigatório.`,

  // Orders
  ORDER_NOT_FOUND: 'Pedido não encontrado nesta unidade.',
  ORDER_MUST_HAVE_ITEMS: 'O pedido deve conter ao menos um item.',
  DINE_IN_REQUIRES_TABLE: 'Pedidos no local exigem uma mesa.',
  PRODUCTS_INVALID_FOR_UNIT:
    'Um ou mais produtos são inválidos para esta unidade.',
  PRODUCT_INACTIVE: 'Produtos inativos não podem ser pedidos.',
  VARIANT_INVALID: 'Variante inválida para o produto selecionado.',
  OPTION_INVALID: 'Opção inválida para o produto selecionado.',
  CANCELLED_ORDER_UPDATE: 'Pedidos cancelados não podem ser atualizados.',
  CANCELLED_ORDER_STATUS: 'Pedidos cancelados não podem ter o status alterado.',

  // Tables
  TABLE_NOT_FOUND: 'Mesa não encontrada nesta unidade.',
  TABLE_SESSION_ALREADY_OPEN: 'Esta mesa já possui uma sessão aberta.',
  RESERVATION_END_BEFORE_START:
    'O horário de término deve ser posterior ao início.',
  RESERVATION_CONFLICT:
    'Esta mesa já possui uma reserva conflitante neste período.',

  // Products
  PRODUCT_NOT_FOUND: 'Produto não encontrado nesta unidade.',
  CATEGORY_NOT_FOUND: 'Categoria não encontrada nesta unidade.',

  // Payments
  ORDER_CANCELLED_PAYMENT: 'Pedidos cancelados não podem receber pagamentos.',
  PAYMENT_EXCEEDS_REMAINING:
    'O valor do pagamento excede o saldo restante do pedido.',
  PAYMENT_LOAD_ERROR: 'Erro ao carregar o pagamento após a criação.',

  // Cash register
  CASH_REGISTER_NOT_OPEN: 'Nenhum caixa aberto encontrado para esta unidade.',
  CASH_REGISTER_NEGATIVE_CLOSING:
    'O valor de fechamento não pode ser negativo.',

  // Staff
  STAFF_INACTIVE_EMAIL:
    'Já existe um usuário inativo com este e-mail. Reative a conta antes de vincular.',
  STAFF_ROLE_ALREADY_EXISTS:
    'Colaborador já possui este perfil no contexto informado.',
  INVITE_PENDING_EXISTS:
    'Já existe um convite pendente para este colaborador no contexto informado.',
  INVITE_NOT_FOUND: 'Convite não encontrado.',
  INVITE_NOT_PENDING: 'Este convite não está pendente para aceite.',
  INVITE_EXPIRED: 'Convite expirado.',
  INVITE_INACTIVE_EMAIL:
    'Já existe um usuário inativo com este e-mail. Reative a conta antes de aceitar o convite.',
  INVITE_NEW_USER_REQUIRES_NAME:
    'O nome é obrigatório para aceitar o convite de um novo colaborador.',
  STAFF_NOT_FOUND: 'Colaborador não encontrado neste tenant.',
  STAFF_ALREADY_ACTIVE: 'O colaborador já está ativo.',
  STAFF_ALREADY_INACTIVE: 'O colaborador já está inativo.',
  STAFF_SELF_DEACTIVATION_FORBIDDEN:
    'Você não pode desativar sua própria conta.',
  STAFF_OWNER_STATUS_FORBIDDEN:
    'Somente um owner pode alterar o status de outro owner.',
  ROLE_ASSIGNMENT_FORBIDDEN:
    'Você não possui permissão para atribuir este perfil.',
  ASSIGNABLE_ROLES_REQUIRED:
    'Você não possui permissão para gerenciar colaboradores neste tenant.',
  TENANT_CONTEXT_MISSING:
    'Contexto de tenant ausente. Realize o login novamente.',
  UNIT_NOT_IN_TENANT: 'Unidade não encontrada ou não pertence a este tenant.',
} as const;
