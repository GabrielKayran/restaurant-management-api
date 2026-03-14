import { User } from '@prisma/client';

export type AuthenticatedUser = User & {
  auth: {
    tenantId?: string;
  };
};
