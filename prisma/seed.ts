import {
  FulfillmentMethod,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  TableReservationStatus,
  TableSessionStatus,
  OrderStatus,
  OrderType,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.payment.deleteMany();
  await prisma.orderItemOption.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.deliveryZoneCoverageRule.deleteMany();
  await prisma.deliveryFeeRule.deleteMany();
  await prisma.deliveryZone.deleteMany();
  await prisma.tableReservation.deleteMany();
  await prisma.tableSession.deleteMany();
  await prisma.restaurantTable.deleteMany();
  await prisma.productAvailabilityWindow.deleteMany();
  await prisma.unitOperatingHour.deleteMany();
  await prisma.productPrice.deleteMany();
  await prisma.productOption.deleteMany();
  await prisma.productOptionGroup.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.recipeItem.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.stockItem.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.address.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.userUnitRole.deleteMany();
  await prisma.userTenantRole.deleteMany();
  await prisma.restaurantUnit.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('123456', 10);

  const owner = await prisma.user.create({
    data: {
      name: 'Ana Paula Souza',
      email: 'ana@sabormineiro.com',
      passwordHash,
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: 'Carlos Henrique Lima',
      email: 'carlos@sabormineiro.com',
      passwordHash,
    },
  });

  const tenant = await prisma.tenant.create({
    data: {
      name: 'Grupo Sabor Mineiro',
      slug: 'grupo-sabor-mineiro',
      phone: '34999990000',
      userRoles: {
        create: [
          {
            userId: owner.id,
            role: UserRole.OWNER,
          },
          {
            userId: manager.id,
            role: UserRole.MANAGER,
          },
        ],
      },
      units: {
        create: [
          {
            name: 'Loja Centro',
            slug: 'loja-centro',
            phone: '3433310001',
            publicDescription:
              'Hamburguer artesanal com retirada e delivery proprio.',
            latitude: -18.9141,
            longitude: -48.2749,
          },
          {
            name: 'Loja Shopping',
            slug: 'loja-shopping',
            phone: '3433310002',
          },
        ],
      },
    },
    include: {
      units: true,
    },
  });

  const [unitCentro] = tenant.units;

  await prisma.userUnitRole.createMany({
    data: [
      {
        userId: owner.id,
        unitId: unitCentro.id,
        role: UserRole.OWNER,
      },
      {
        userId: manager.id,
        unitId: unitCentro.id,
        role: UserRole.MANAGER,
      },
    ],
  });

  await prisma.unitOperatingHour.createMany({
    data: [
      {
        unitId: unitCentro.id,
        fulfillmentType: FulfillmentMethod.TAKEAWAY,
        dayOfWeek: 1,
        opensAtMinutes: 660,
        closesAtMinutes: 1380,
      },
      {
        unitId: unitCentro.id,
        fulfillmentType: FulfillmentMethod.DELIVERY,
        dayOfWeek: 1,
        opensAtMinutes: 690,
        closesAtMinutes: 1380,
      },
      {
        unitId: unitCentro.id,
        fulfillmentType: FulfillmentMethod.TAKEAWAY,
        dayOfWeek: 5,
        opensAtMinutes: 660,
        closesAtMinutes: 1439,
      },
      {
        unitId: unitCentro.id,
        fulfillmentType: FulfillmentMethod.DELIVERY,
        dayOfWeek: 5,
        opensAtMinutes: 690,
        closesAtMinutes: 1439,
      },
    ],
  });

  await prisma.deliveryZone.create({
    data: {
      unitId: unitCentro.id,
      name: 'Centro',
      description: 'Area central e bairros proximos.',
      coverageRules: {
        create: [
          {
            zipCodePrefix: '38400',
            sortOrder: 0,
          },
        ],
      },
      feeRules: {
        create: [
          {
            fee: 8,
            minimumOrder: 0,
          },
          {
            fee: 5,
            minimumOrder: 60,
          },
        ],
      },
    },
  });

  const burgers = await prisma.category.create({
    data: {
      unitId: unitCentro.id,
      name: 'Burgers',
      sortOrder: 1,
    },
  });

  const drinks = await prisma.category.create({
    data: {
      unitId: unitCentro.id,
      name: 'Bebidas',
      sortOrder: 2,
    },
  });

  const burger = await prisma.product.create({
    data: {
      unitId: unitCentro.id,
      categoryId: burgers.id,
      name: 'X-Burger',
      description: 'Hamburguer artesanal com queijo e salada',
      basePrice: 28.9,
      costPrice: 12.6,
      costUpdatedAt: new Date(),
      variants: {
        create: [
          { name: 'Normal', isDefault: true, priceDelta: 0 },
          { name: 'Combo', priceDelta: 9.9 },
        ],
      },
      optionGroups: {
        create: [
          {
            name: 'Adicionais',
            minSelect: 0,
            maxSelect: 3,
            options: {
              create: [
                { name: 'Bacon', priceDelta: 4.5 },
                { name: 'Cheddar', priceDelta: 3.5 },
                { name: 'Ovo', priceDelta: 2.5 },
              ],
            },
          },
        ],
      },
      availabilityWindows: {
        create: [
          {
            fulfillmentType: FulfillmentMethod.DELIVERY,
            dayOfWeek: 5,
            startsAtMinutes: 1080,
            endsAtMinutes: 1439,
          },
        ],
      },
    },
    include: {
      variants: true,
      optionGroups: {
        include: {
          options: true,
        },
      },
    },
  });

  await prisma.product.create({
    data: {
      unitId: unitCentro.id,
      categoryId: drinks.id,
      name: 'Refrigerante Lata',
      basePrice: 6.5,
      costPrice: 2.2,
      costUpdatedAt: new Date(),
    },
  });

  const customer = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      unitId: unitCentro.id,
      name: 'Mariana Alves',
      phone: '34988887777',
      addresses: {
        create: {
          label: 'Casa',
          street: 'Rua das Flores',
          number: '123',
          neighborhood: 'Centro',
          city: 'Uberlandia',
          state: 'MG',
          zipCode: '38400000',
        },
      },
    },
    include: {
      addresses: true,
    },
  });

  const table = await prisma.restaurantTable.create({
    data: {
      unitId: unitCentro.id,
      name: 'Mesa 01',
      seats: 4,
    },
  });

  const session = await prisma.tableSession.create({
    data: {
      tableId: table.id,
      unitId: unitCentro.id,
      guestCount: 2,
      status: TableSessionStatus.OPEN,
    },
  });

  await prisma.tableReservation.create({
    data: {
      unitId: unitCentro.id,
      tableId: table.id,
      customerId: customer.id,
      name: customer.name,
      phone: customer.phone,
      guestCount: 2,
      reservedForStart: new Date(Date.now() + 60 * 60 * 1000),
      reservedForEnd: new Date(Date.now() + 90 * 60 * 1000),
      status: TableReservationStatus.CONFIRMED,
    },
  });

  const order = await prisma.order.create({
    data: {
      unitId: unitCentro.id,
      customerId: customer.id,
      tableId: table.id,
      tableSessionId: session.id,
      createdByUserId: manager.id,
      code: 1,
      type: OrderType.DINE_IN,
      status: OrderStatus.CONFIRMED,
      confirmedAt: new Date(),
      subtotal: 32.4,
      discount: 0,
      deliveryFee: 0,
      total: 32.4,
      items: {
        create: [
          {
            productId: burger.id,
            variantId: burger.variants[0].id,
            productName: burger.name,
            variantName: burger.variants[0].name,
            quantity: 1,
            unitPrice: 32.4,
            totalPrice: 32.4,
            options: {
              create: [
                {
                  productOptionId: burger.optionGroups[0].options[0].id,
                  optionName: 'Bacon',
                  priceDelta: 4.5,
                },
              ],
            },
          },
        ],
      },
      payments: {
        create: {
          userId: manager.id,
          method: PaymentMethod.PIX,
          amount: 32.4,
          paidAt: new Date(),
          status: PaymentStatus.PAID,
        },
      },
    },
  });

  console.log('Seed executado com sucesso.');
  console.log(`Tenant: ${tenant.name}`);
  console.log(`Unidade principal: ${unitCentro.name}`);
  console.log(`Pedido inicial: #${order.code}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
