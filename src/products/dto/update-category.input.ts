import { PartialType } from '@nestjs/swagger';
import { CreateCategoryInput } from './create-category.input';

export class UpdateCategoryInput extends PartialType(CreateCategoryInput) {}
