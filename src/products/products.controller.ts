import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiUnitHeader } from '../common/decorators/api-unit-header.decorator';
import { CurrentScope } from '../common/decorators/current-scope.decorator';
import { UnitScopeGuard } from '../common/guards/unit-scope.guard';
import { RequestScope } from '../common/models/request-scope.model';
import { PaginationResponse } from '../common/pagination';
import { ProductCategorySummaryResponseDto } from './dto/category-summary.response';
import { CreateProductInput } from './dto/create-product.input';
import { ProductDetailsResponseDto } from './dto/product-details.response';
import { ProductListItemResponseDto } from './dto/product-list-item.response';
import { ProductsListQueryDto } from './dto/products-list.query';
import { UpdateProductInput } from './dto/update-product.input';
import { ProductsService } from './products.service';

@ApiTags('Products')
@ApiBearerAuth()
@ApiUnitHeader()
@UseGuards(JwtAuthGuard, UnitScopeGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(
    @CurrentScope() scope: RequestScope,
    @Query() query: ProductsListQueryDto,
  ): Promise<PaginationResponse<ProductListItemResponseDto>> {
    return this.productsService.list(scope, query);
  }

  @Get('categories/summary')
  categoriesSummary(
    @CurrentScope() scope: RequestScope,
  ): Promise<ProductCategorySummaryResponseDto[]> {
    return this.productsService.categoriesSummary(scope);
  }

  @Get(':id')
  getById(
    @CurrentScope() scope: RequestScope,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ProductDetailsResponseDto> {
    return this.productsService.getById(scope, id);
  }

  @Post()
  create(
    @CurrentScope() scope: RequestScope,
    @Body() input: CreateProductInput,
  ): Promise<ProductDetailsResponseDto> {
    return this.productsService.create(scope, input);
  }

  @Patch(':id')
  update(
    @CurrentScope() scope: RequestScope,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: UpdateProductInput,
  ): Promise<ProductDetailsResponseDto> {
    return this.productsService.update(scope, id, input);
  }

  @Delete(':id')
  remove(
    @CurrentScope() scope: RequestScope,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<{ success: true; mode: 'hard-delete' | 'deactivated' }> {
    return this.productsService.remove(scope, id);
  }
}
