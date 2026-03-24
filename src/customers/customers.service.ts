import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { RequestScope } from '../common/models/request-scope.model';
import { PaginationResponse } from '../common/pagination';
import { CustomerDetailsResponseDto } from './dto/customer-details.response';
import { CustomerListItemResponseDto } from './dto/customer-list-item.response';
import { CustomersListQueryDto } from './dto/customers-list.query';
import { CreateCustomerInput } from './dto/create-customer.input';
import { UpdateCustomerInput } from './dto/update-customer.input';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    scope: RequestScope,
    query: CustomersListQueryDto,
  ): Promise<PaginationResponse<CustomerListItemResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const where = this.buildWhere(scope, query.search);

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          document: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return new PaginationResponse(
      customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone ?? null,
        email: customer.email ?? null,
        document: customer.document ?? null,
        ordersCount: customer._count.orders,
        createdAt: customer.createdAt,
      })),
      total,
      page,
      limit,
    );
  }

  async getById(
    scope: RequestScope,
    id: string,
  ): Promise<CustomerDetailsResponseDto> {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id,
        ...this.buildTenantScope(scope),
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        document: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        addresses: {
          select: {
            id: true,
            label: true,
            street: true,
            number: true,
            complement: true,
            neighborhood: true,
            city: true,
            state: true,
            zipCode: true,
            reference: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Cliente nao encontrado neste restaurante.');
    }

    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone ?? null,
      email: customer.email ?? null,
      document: customer.document ?? null,
      notes: customer.notes ?? null,
      addresses: customer.addresses.map((address) => ({
        id: address.id,
        label: address.label ?? null,
        street: address.street,
        number: address.number,
        complement: address.complement ?? null,
        neighborhood: address.neighborhood ?? null,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        reference: address.reference ?? null,
      })),
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }

  async create(
    scope: RequestScope,
    input: CreateCustomerInput,
  ): Promise<CustomerDetailsResponseDto> {
    const customer = await this.prisma.customer.create({
      data: {
        tenantId: scope.tenantId,
        unitId: scope.unitId,
        name: input.name.trim(),
        phone: input.phone?.trim(),
        email: input.email?.trim().toLowerCase(),
        document: input.document?.trim(),
        notes: input.notes?.trim(),
        addresses: input.address
          ? {
              create: {
                label: input.address.label?.trim(),
                street: input.address.street.trim(),
                number: input.address.number.trim(),
                complement: input.address.complement?.trim(),
                neighborhood: input.address.neighborhood?.trim(),
                city: input.address.city.trim(),
                state: input.address.state.trim().toUpperCase(),
                zipCode: input.address.zipCode.trim(),
                reference: input.address.reference?.trim(),
              },
            }
          : undefined,
      },
      select: {
        id: true,
      },
    });

    return this.getById(scope, customer.id);
  }

  async update(
    scope: RequestScope,
    id: string,
    input: UpdateCustomerInput,
  ): Promise<CustomerDetailsResponseDto> {
    await this.getById(scope, id);

    await this.prisma.$transaction(async (tx) => {
      await tx.customer.update({
        where: { id },
        data: {
          name: input.name?.trim(),
          phone: input.phone?.trim(),
          email: input.email?.trim().toLowerCase(),
          document: input.document?.trim(),
          notes: input.notes?.trim(),
        },
      });

      if (input.address) {
        const existingAddress = await tx.address.findFirst({
          where: {
            customerId: id,
          },
          select: {
            id: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        });

        const addressData: Prisma.AddressUncheckedCreateInput = {
          customerId: id,
          label: input.address.label?.trim(),
          street: input.address.street.trim(),
          number: input.address.number.trim(),
          complement: input.address.complement?.trim(),
          neighborhood: input.address.neighborhood?.trim(),
          city: input.address.city.trim(),
          state: input.address.state.trim().toUpperCase(),
          zipCode: input.address.zipCode.trim(),
          reference: input.address.reference?.trim(),
        };

        if (existingAddress) {
          await tx.address.update({
            where: { id: existingAddress.id },
            data: addressData,
          });
        } else {
          await tx.address.create({
            data: addressData,
          });
        }
      }
    });

    return this.getById(scope, id);
  }

  private buildWhere(
    scope: RequestScope,
    search?: string,
  ): Prisma.CustomerWhereInput {
    return {
      ...this.buildTenantScope(scope),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { document: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
  }

  private buildTenantScope(scope: RequestScope): Prisma.CustomerWhereInput {
    return {
      tenantId: scope.tenantId,
      OR: [{ unitId: scope.unitId }, { unitId: null }],
    };
  }
}
