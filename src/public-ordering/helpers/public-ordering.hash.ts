import { createHash } from 'crypto';
import { PublicCheckoutInput } from '../dto';

export const hashPublicOrderPayload = (input: PublicCheckoutInput): string => {
  const payload = {
    type: input.type,
    customer: {
      name: input.customer.name,
      phone: input.customer.phone,
      email: input.customer.email ?? null,
      document: input.customer.document ?? null,
    },
    address: input.address
      ? {
          street: input.address.street,
          number: input.address.number,
          complement: input.address.complement ?? null,
          neighborhood: input.address.neighborhood,
          city: input.address.city,
          state: input.address.state,
          zipCode: input.address.zipCode,
          reference: input.address.reference ?? null,
          latitude: input.address.latitude ?? null,
          longitude: input.address.longitude ?? null,
        }
      : null,
    notes: input.notes ?? null,
    paymentMethod: input.paymentMethod ?? null,
    sourceReference: input.sourceReference ?? null,
    items: input.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId ?? null,
      quantity: item.quantity,
      notes: item.notes ?? null,
      options: (item.options ?? [])
        .map((option) => ({
          productOptionId: option.productOptionId,
          quantity: option.quantity ?? 1,
        }))
        .sort((left, right) =>
          left.productOptionId.localeCompare(right.productOptionId),
        ),
    })),
  };

  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
};
