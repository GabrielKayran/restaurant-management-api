import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class ProductsListQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'validation.common.pageMustBeInteger' })
  @Min(1, { message: 'validation.common.pageMin' })
  page: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'validation.common.limitMustBeInteger' })
  @Min(1, { message: 'validation.common.limitMin' })
  @Max(100, { message: 'validation.common.limitMax100' })
  limit: number = 10;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'validation.common.searchMustBeString' })
  search: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4', { message: 'validation.products.categoryIdInvalid' })
  categoryId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'validation.products.isActiveFilterBoolean' })
  isActive: boolean;
}
