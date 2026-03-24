import { applyDecorators } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';

export function ApiUnitHeader(): MethodDecorator & ClassDecorator {
  return applyDecorators(
    ApiHeader({
      name: 'x-unit-id',
      required: false,
      description:
        'Unit identifier (UUID) within the authenticated tenant scope. Optional when the authenticated user has access to a single active unit.',
      example: '4f4f7db6-68de-4fa5-b512-6e4d56e9b8f8',
    }),
  );
}
