import { I18nContext } from 'nestjs-i18n';

const MESSAGE_KEYS = {
  INVALID_CREDENTIALS: 'errors.auth.invalidCredentials',
  EMAIL_ALREADY_IN_USE: 'errors.auth.emailAlreadyInUse',
  TENANT_OR_UNIT_NAME_ALREADY_EXISTS:
    'errors.auth.tenantOrUnitNameAlreadyExists',
  IDENTITY_ALREADY_IN_USE: 'errors.auth.identityAlreadyInUse',
  TENANT_CONTEXT_REQUIRED: 'errors.auth.tenantContextRequired',
  TENANT_CONTEXT_MISSING: 'errors.auth.tenantContextMissing',
  UNIT_HEADER_REQUIRED: 'errors.scope.unitHeaderRequired',
  UNIT_SELECTION_REQUIRED: 'errors.scope.unitSelectionRequired',
  UNIT_ACCESS_DENIED: 'errors.scope.unitAccessDenied',
  UNIT_NOT_IN_TENANT: 'errors.scope.unitNotInTenant',
  NO_PERMISSION: 'errors.auth.noPermission',
  REQUEST_INVALID: 'errors.common.requestInvalid',
  FIELD_REQUIRED: 'errors.common.fieldRequired',
  ORDER_NOT_FOUND: 'errors.orders.notFound',
  ORDER_MUST_HAVE_ITEMS: 'errors.orders.mustHaveItems',
  DINE_IN_REQUIRES_TABLE: 'errors.orders.dineInRequiresTable',
  PRODUCTS_INVALID_FOR_UNIT: 'errors.orders.productsInvalidForUnit',
  PRODUCT_INACTIVE: 'errors.orders.productInactive',
  VARIANT_INVALID: 'errors.orders.variantInvalid',
  OPTION_INVALID: 'errors.orders.optionInvalid',
  CANCELLED_ORDER_UPDATE: 'errors.orders.cancelledOrderUpdate',
  CANCELLED_ORDER_STATUS: 'errors.orders.cancelledOrderStatus',
  TABLE_NOT_FOUND: 'errors.tables.notFound',
  TABLE_SESSION_ALREADY_OPEN: 'errors.tables.sessionAlreadyOpen',
  RESERVATION_END_BEFORE_START: 'errors.tables.reservationEndBeforeStart',
  RESERVATION_CONFLICT: 'errors.tables.reservationConflict',
  PRODUCT_NOT_FOUND: 'errors.products.notFound',
  CATEGORY_NOT_FOUND: 'errors.products.categoryNotFound',
  ORDER_CANCELLED_PAYMENT: 'errors.payments.orderCancelled',
  PAYMENT_EXCEEDS_REMAINING: 'errors.payments.paymentExceedsRemaining',
  PAYMENT_LOAD_ERROR: 'errors.payments.paymentLoadError',
  CASH_REGISTER_NOT_OPEN: 'errors.cashRegister.notOpen',
  CASH_REGISTER_ALREADY_OPEN: 'errors.cashRegister.alreadyOpen',
  CASH_REGISTER_NEGATIVE_CLOSING: 'errors.cashRegister.negativeClosing',
  STAFF_INACTIVE_EMAIL: 'errors.staff.inactiveEmail',
  STAFF_ROLE_ALREADY_EXISTS: 'errors.staff.roleAlreadyExists',
  INVITE_PENDING_EXISTS: 'errors.staff.invitePendingExists',
  INVITE_NOT_FOUND: 'errors.staff.inviteNotFound',
  INVITE_NOT_PENDING: 'errors.staff.inviteNotPending',
  INVITE_EXPIRED: 'errors.staff.inviteExpired',
  INVITE_INACTIVE_EMAIL: 'errors.staff.inviteInactiveEmail',
  INVITE_NEW_USER_REQUIRES_NAME: 'errors.staff.inviteNewUserRequiresName',
  STAFF_NOT_FOUND: 'errors.staff.notFound',
  STAFF_ALREADY_ACTIVE: 'errors.staff.alreadyActive',
  STAFF_ALREADY_INACTIVE: 'errors.staff.alreadyInactive',
  STAFF_SELF_DEACTIVATION_FORBIDDEN: 'errors.staff.selfDeactivationForbidden',
  STAFF_OWNER_STATUS_FORBIDDEN: 'errors.staff.ownerStatusForbidden',
  ROLE_ASSIGNMENT_FORBIDDEN: 'errors.staff.roleAssignmentForbidden',
  ASSIGNABLE_ROLES_REQUIRED: 'errors.staff.assignableRolesRequired',
  DB_UNIQUE_CONSTRAINT: 'errors.database.uniqueConstraint',
  DB_FOREIGN_KEY: 'errors.database.foreignKey',
  DB_RECORD_NOT_FOUND: 'errors.database.recordNotFound',
  DB_RELATION_CONSTRAINT: 'errors.database.relationConstraint',
  DB_INTERNAL: 'errors.database.internal',
  ORDER_CREATED: 'messages.orders.created',
  ORDER_CREATED_FROM_TABLE: 'messages.orders.createdFromTable',
  PAYMENT_DESCRIPTION_FOR_ORDER: 'messages.payments.descriptionForOrder',
} as const;

type MessageKey = (typeof MESSAGE_KEYS)[keyof typeof MESSAGE_KEYS];

const PT_BR_FALLBACK: Record<MessageKey, string> = {
  'errors.auth.invalidCredentials': 'Credenciais invalidas.',
  'errors.auth.emailAlreadyInUse': 'Este email ja esta em uso.',
  'errors.auth.tenantOrUnitNameAlreadyExists':
    'Ja existe um tenant ou unidade com este nome. Escolha um nome diferente para o tenant ou unidade.',
  'errors.auth.identityAlreadyInUse':
    'Email ou identificador do tenant/unidade ja esta em uso.',
  'errors.auth.tenantContextRequired':
    'Contexto do tenant ausente no token. Faca login novamente.',
  'errors.auth.tenantContextMissing':
    'Contexto de tenant ausente. Realize o login novamente.',
  'errors.scope.unitHeaderRequired':
    'O cabecalho x-unit-id e obrigatorio e deve ser um UUID valido.',
  'errors.scope.unitSelectionRequired': 'Selecione uma unidade para continuar.',
  'errors.scope.unitAccessDenied':
    'Voce nao tem acesso a unidade solicitada neste tenant.',
  'errors.scope.unitNotInTenant':
    'Unidade nao encontrada ou nao pertence a este tenant.',
  'errors.auth.noPermission':
    'Voce nao possui permissao para realizar esta acao.',
  'errors.common.requestInvalid': 'Requisicao invalida',
  'errors.common.fieldRequired': 'O campo {{field}} e obrigatorio.',
  'errors.orders.notFound': 'Pedido nao encontrado nesta unidade.',
  'errors.orders.mustHaveItems': 'O pedido deve conter ao menos um item.',
  'errors.orders.dineInRequiresTable': 'Pedidos no local exigem uma mesa.',
  'errors.orders.productsInvalidForUnit':
    'Um ou mais produtos sao invalidos para esta unidade.',
  'errors.orders.productInactive': 'Produtos inativos nao podem ser pedidos.',
  'errors.orders.variantInvalid':
    'Variante invalida para o produto selecionado.',
  'errors.orders.optionInvalid': 'Opcao invalida para o produto selecionado.',
  'errors.orders.cancelledOrderUpdate':
    'Pedidos cancelados nao podem ser atualizados.',
  'errors.orders.cancelledOrderStatus':
    'Pedidos cancelados nao podem ter o status alterado.',
  'errors.tables.notFound': 'Mesa nao encontrada nesta unidade.',
  'errors.tables.sessionAlreadyOpen': 'Esta mesa ja possui uma sessao aberta.',
  'errors.tables.reservationEndBeforeStart':
    'O horario de termino deve ser posterior ao inicio.',
  'errors.tables.reservationConflict':
    'Esta mesa ja possui uma reserva conflitante neste periodo.',
  'errors.products.notFound': 'Produto nao encontrado nesta unidade.',
  'errors.products.categoryNotFound': 'Categoria nao encontrada nesta unidade.',
  'errors.payments.orderCancelled':
    'Pedidos cancelados nao podem receber pagamentos.',
  'errors.payments.paymentExceedsRemaining':
    'O valor do pagamento excede o saldo restante do pedido.',
  'errors.payments.paymentLoadError':
    'Erro ao carregar o pagamento apos a criacao.',
  'errors.cashRegister.notOpen':
    'Nenhum caixa aberto encontrado para esta unidade.',
  'errors.cashRegister.alreadyOpen':
    'Ja existe um caixa aberto para esta unidade.',
  'errors.cashRegister.negativeClosing':
    'O valor de fechamento nao pode ser negativo.',
  'errors.staff.inactiveEmail':
    'Ja existe um usuario inativo com este e-mail. Reative a conta antes de vincular.',
  'errors.staff.roleAlreadyExists':
    'Colaborador ja possui este perfil no contexto informado.',
  'errors.staff.invitePendingExists':
    'Ja existe um convite pendente para este colaborador no contexto informado.',
  'errors.staff.inviteNotFound': 'Convite nao encontrado.',
  'errors.staff.inviteNotPending':
    'Este convite nao esta pendente para aceite.',
  'errors.staff.inviteExpired': 'Convite expirado.',
  'errors.staff.inviteInactiveEmail':
    'Ja existe um usuario inativo com este e-mail. Reative a conta antes de aceitar o convite.',
  'errors.staff.inviteNewUserRequiresName':
    'O nome e obrigatorio para aceitar o convite de um novo colaborador.',
  'errors.staff.notFound': 'Colaborador nao encontrado neste tenant.',
  'errors.staff.alreadyActive': 'O colaborador ja esta ativo.',
  'errors.staff.alreadyInactive': 'O colaborador ja esta inativo.',
  'errors.staff.selfDeactivationForbidden':
    'Voce nao pode desativar sua propria conta.',
  'errors.staff.ownerStatusForbidden':
    'Somente um owner pode alterar o status de outro owner.',
  'errors.staff.roleAssignmentForbidden':
    'Voce nao possui permissao para atribuir este perfil.',
  'errors.staff.assignableRolesRequired':
    'Voce nao possui permissao para gerenciar colaboradores neste tenant.',
  'errors.database.uniqueConstraint':
    'Ja existe um registro com este valor unico.',
  'errors.database.foreignKey':
    'Operacao invalida: referencia a um registro inexistente.',
  'errors.database.recordNotFound': 'Registro nao encontrado.',
  'errors.database.relationConstraint':
    'Nao e possivel realizar esta operacao pois existem registros relacionados.',
  'errors.database.internal': 'Erro interno no banco de dados.',
  'messages.orders.created': 'Pedido criado.',
  'messages.orders.createdFromTable': 'Pedido criado a partir da mesa.',
  'messages.payments.descriptionForOrder': 'Pagamento do pedido #{{orderCode}}',
};

function interpolate(
  template: string,
  args?: Record<string, string | number | boolean>,
): string {
  if (!args) {
    return template;
  }

  return template.replace(/\{\{\s*(\w+)\s*}}/g, (_, key: string) => {
    const value = args[key];
    return value === undefined ? '' : String(value);
  });
}

function translate(
  key: MessageKey,
  args?: Record<string, string | number | boolean>,
): string {
  const translated = I18nContext.current()?.t(key, {
    args,
    defaultValue: '',
  });

  if (typeof translated === 'string' && translated !== key) {
    return translated;
  }

  return interpolate(PT_BR_FALLBACK[key], args);
}

function translateRaw(
  key: string,
  args?: Record<string, string | number | boolean>,
): string {
  const translated = I18nContext.current()?.t(key, {
    args,
    defaultValue: key,
  });

  return typeof translated === 'string' ? translated : key;
}

export class Messages {
  static translate(
    key: string,
    args?: Record<string, string | number | boolean>,
  ): string {
    return translateRaw(key, args);
  }

  static get REQUEST_INVALID(): string {
    return translate(MESSAGE_KEYS.REQUEST_INVALID);
  }

  static get ORDER_NOT_FOUND(): string {
    return translate(MESSAGE_KEYS.ORDER_NOT_FOUND);
  }

  static get ORDER_MUST_HAVE_ITEMS(): string {
    return translate(MESSAGE_KEYS.ORDER_MUST_HAVE_ITEMS);
  }

  static get DINE_IN_REQUIRES_TABLE(): string {
    return translate(MESSAGE_KEYS.DINE_IN_REQUIRES_TABLE);
  }

  static get PRODUCTS_INVALID_FOR_UNIT(): string {
    return translate(MESSAGE_KEYS.PRODUCTS_INVALID_FOR_UNIT);
  }

  static get PRODUCT_INACTIVE(): string {
    return translate(MESSAGE_KEYS.PRODUCT_INACTIVE);
  }

  static get VARIANT_INVALID(): string {
    return translate(MESSAGE_KEYS.VARIANT_INVALID);
  }

  static get OPTION_INVALID(): string {
    return translate(MESSAGE_KEYS.OPTION_INVALID);
  }

  static get CANCELLED_ORDER_UPDATE(): string {
    return translate(MESSAGE_KEYS.CANCELLED_ORDER_UPDATE);
  }

  static get CANCELLED_ORDER_STATUS(): string {
    return translate(MESSAGE_KEYS.CANCELLED_ORDER_STATUS);
  }

  static get TABLE_NOT_FOUND(): string {
    return translate(MESSAGE_KEYS.TABLE_NOT_FOUND);
  }

  static get TABLE_SESSION_ALREADY_OPEN(): string {
    return translate(MESSAGE_KEYS.TABLE_SESSION_ALREADY_OPEN);
  }

  static get RESERVATION_END_BEFORE_START(): string {
    return translate(MESSAGE_KEYS.RESERVATION_END_BEFORE_START);
  }

  static get RESERVATION_CONFLICT(): string {
    return translate(MESSAGE_KEYS.RESERVATION_CONFLICT);
  }

  static get PRODUCT_NOT_FOUND(): string {
    return translate(MESSAGE_KEYS.PRODUCT_NOT_FOUND);
  }

  static get CATEGORY_NOT_FOUND(): string {
    return translate(MESSAGE_KEYS.CATEGORY_NOT_FOUND);
  }

  static get ORDER_CANCELLED_PAYMENT(): string {
    return translate(MESSAGE_KEYS.ORDER_CANCELLED_PAYMENT);
  }

  static get PAYMENT_EXCEEDS_REMAINING(): string {
    return translate(MESSAGE_KEYS.PAYMENT_EXCEEDS_REMAINING);
  }

  static get PAYMENT_LOAD_ERROR(): string {
    return translate(MESSAGE_KEYS.PAYMENT_LOAD_ERROR);
  }

  static get CASH_REGISTER_NOT_OPEN(): string {
    return translate(MESSAGE_KEYS.CASH_REGISTER_NOT_OPEN);
  }

  static get CASH_REGISTER_ALREADY_OPEN(): string {
    return translate(MESSAGE_KEYS.CASH_REGISTER_ALREADY_OPEN);
  }

  static get CASH_REGISTER_NEGATIVE_CLOSING(): string {
    return translate(MESSAGE_KEYS.CASH_REGISTER_NEGATIVE_CLOSING);
  }

  static get STAFF_INACTIVE_EMAIL(): string {
    return translate(MESSAGE_KEYS.STAFF_INACTIVE_EMAIL);
  }

  static get STAFF_ROLE_ALREADY_EXISTS(): string {
    return translate(MESSAGE_KEYS.STAFF_ROLE_ALREADY_EXISTS);
  }

  static get INVITE_PENDING_EXISTS(): string {
    return translate(MESSAGE_KEYS.INVITE_PENDING_EXISTS);
  }

  static get INVITE_NOT_FOUND(): string {
    return translate(MESSAGE_KEYS.INVITE_NOT_FOUND);
  }

  static get INVITE_NOT_PENDING(): string {
    return translate(MESSAGE_KEYS.INVITE_NOT_PENDING);
  }

  static get INVITE_EXPIRED(): string {
    return translate(MESSAGE_KEYS.INVITE_EXPIRED);
  }

  static get INVITE_INACTIVE_EMAIL(): string {
    return translate(MESSAGE_KEYS.INVITE_INACTIVE_EMAIL);
  }

  static get INVITE_NEW_USER_REQUIRES_NAME(): string {
    return translate(MESSAGE_KEYS.INVITE_NEW_USER_REQUIRES_NAME);
  }

  static get STAFF_NOT_FOUND(): string {
    return translate(MESSAGE_KEYS.STAFF_NOT_FOUND);
  }

  static get STAFF_ALREADY_ACTIVE(): string {
    return translate(MESSAGE_KEYS.STAFF_ALREADY_ACTIVE);
  }

  static get STAFF_ALREADY_INACTIVE(): string {
    return translate(MESSAGE_KEYS.STAFF_ALREADY_INACTIVE);
  }

  static get STAFF_SELF_DEACTIVATION_FORBIDDEN(): string {
    return translate(MESSAGE_KEYS.STAFF_SELF_DEACTIVATION_FORBIDDEN);
  }

  static get STAFF_OWNER_STATUS_FORBIDDEN(): string {
    return translate(MESSAGE_KEYS.STAFF_OWNER_STATUS_FORBIDDEN);
  }

  static get ROLE_ASSIGNMENT_FORBIDDEN(): string {
    return translate(MESSAGE_KEYS.ROLE_ASSIGNMENT_FORBIDDEN);
  }

  static get ASSIGNABLE_ROLES_REQUIRED(): string {
    return translate(MESSAGE_KEYS.ASSIGNABLE_ROLES_REQUIRED);
  }

  static get TENANT_CONTEXT_MISSING(): string {
    return translate(MESSAGE_KEYS.TENANT_CONTEXT_MISSING);
  }

  static get UNIT_NOT_IN_TENANT(): string {
    return translate(MESSAGE_KEYS.UNIT_NOT_IN_TENANT);
  }

  static get UNIT_SELECTION_REQUIRED(): string {
    return translate(MESSAGE_KEYS.UNIT_SELECTION_REQUIRED);
  }

  static get DB_UNIQUE_CONSTRAINT(): string {
    return translate(MESSAGE_KEYS.DB_UNIQUE_CONSTRAINT);
  }

  static get DB_FOREIGN_KEY(): string {
    return translate(MESSAGE_KEYS.DB_FOREIGN_KEY);
  }

  static get DB_RECORD_NOT_FOUND(): string {
    return translate(MESSAGE_KEYS.DB_RECORD_NOT_FOUND);
  }

  static get DB_RELATION_CONSTRAINT(): string {
    return translate(MESSAGE_KEYS.DB_RELATION_CONSTRAINT);
  }

  static get DB_INTERNAL(): string {
    return translate(MESSAGE_KEYS.DB_INTERNAL);
  }

  static get ORDER_CREATED(): string {
    return translate(MESSAGE_KEYS.ORDER_CREATED);
  }

  static get ORDER_CREATED_FROM_TABLE(): string {
    return translate(MESSAGE_KEYS.ORDER_CREATED_FROM_TABLE);
  }

  static PAYMENT_DESCRIPTION_FOR_ORDER(orderCode: number): string {
    return translate(MESSAGE_KEYS.PAYMENT_DESCRIPTION_FOR_ORDER, { orderCode });
  }
}
