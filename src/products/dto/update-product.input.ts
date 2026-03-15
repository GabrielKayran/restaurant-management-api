import { PartialType } from '@nestjs/swagger';
import { CreateProductInput } from './create-product.input';

export class UpdateProductInput extends PartialType(CreateProductInput) {}
