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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiUnauthorizedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiUnitHeader } from '../common/decorators/api-unit-header.decorator';
import { CurrentScope } from '../common/decorators/current-scope.decorator';
import { UnitScopeGuard } from '../common/guards/unit-scope.guard';
import { RequestScope } from '../common/models/request-scope.model';
import { PaginationResponse } from '../common/pagination';
import {
  CategoryDetailsResponseDto,
  CreateCategoryInput,
  CreateProductInput,
  ProductCategorySummaryResponseDto,
  ProductDetailsResponseDto,
  ProductListItemResponseDto,
  ProductsListQueryDto,
  UpdateCategoryInput,
  UpdateProductInput,
} from './dto';
import { ProductsService } from './services';

@ApiTags('Products')
@ApiBearerAuth()
@ApiUnitHeader()
@UseGuards(JwtAuthGuard, UnitScopeGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'List products',
    description:
      'Returns paginated products for the selected unit with optional filters and search.',
  })
  @ApiOkResponse({
    description: 'Products listed successfully.',
    type: PaginationResponse,
    schema: {
      example: {
        data: [
          {
            id: 'f25e1775-5f30-4f22-b7c1-4be7862f249a',
            name: 'Cheeseburger',
            category: 'Burgers',
            salePrice: 29.9,
            cost: 12.4,
            margin: 17.5,
            marginPercentage: 58.53,
            stock: 24,
            isActive: true,
          },
        ],
        total: 84,
        page: 1,
        limit: 10,
        totalPages: 9,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User has no access to the selected unit scope.',
  })
  list(
    @CurrentScope() scope: RequestScope,
    @Query() query: ProductsListQueryDto,
  ): Promise<PaginationResponse<ProductListItemResponseDto>> {
    return this.productsService.list(scope, query);
  }

  @Get('categories/summary')
  @ApiOperation({
    summary: 'Get product categories summary',
    description:
      'Returns category-level metrics including total products and active products.',
  })
  @ApiOkResponse({
    description: 'Category summary fetched successfully.',
    type: ProductCategorySummaryResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User has no access to the selected unit scope.',
  })
  categoriesSummary(
    @CurrentScope() scope: RequestScope,
  ): Promise<ProductCategorySummaryResponseDto[]> {
    return this.productsService.categoriesSummary(scope);
  }

  @Get('categories')
  @ApiOperation({
    summary: 'List product categories',
    description:
      'Returns all categories available for the selected unit ordered by sortOrder and name.',
  })
  @ApiOkResponse({
    description: 'Categories listed successfully.',
    type: CategoryDetailsResponseDto,
    isArray: true,
  })
  listCategories(
    @CurrentScope() scope: RequestScope,
  ): Promise<CategoryDetailsResponseDto[]> {
    return this.productsService.listCategories(scope);
  }

  @Get('categories/:id')
  @ApiOperation({
    summary: 'Get category details',
    description: 'Returns one category and aggregated product counts.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category unique identifier.',
    example: 'ae849d70-eef7-47f8-bf59-c52b32523f8f',
  })
  @ApiOkResponse({
    description: 'Category fetched successfully.',
    type: CategoryDetailsResponseDto,
  })
  getCategoryById(
    @CurrentScope() scope: RequestScope,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<CategoryDetailsResponseDto> {
    return this.productsService.getCategoryById(scope, id);
  }

  @Post('categories')
  @ApiOperation({
    summary: 'Create category',
    description: 'Creates a new product category for the selected unit.',
  })
  @ApiCreatedResponse({
    description: 'Category created successfully.',
    type: CategoryDetailsResponseDto,
  })
  createCategory(
    @CurrentScope() scope: RequestScope,
    @Body() input: CreateCategoryInput,
  ): Promise<CategoryDetailsResponseDto> {
    return this.productsService.createCategory(scope, input);
  }

  @Patch('categories/:id')
  @ApiOperation({
    summary: 'Update category',
    description: 'Updates an existing category in the selected unit.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category unique identifier.',
    example: 'ae849d70-eef7-47f8-bf59-c52b32523f8f',
  })
  @ApiOkResponse({
    description: 'Category updated successfully.',
    type: CategoryDetailsResponseDto,
  })
  updateCategory(
    @CurrentScope() scope: RequestScope,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: UpdateCategoryInput,
  ): Promise<CategoryDetailsResponseDto> {
    return this.productsService.updateCategory(scope, id, input);
  }

  @Delete('categories/:id')
  @ApiOperation({
    summary: 'Remove category',
    description:
      'Removes a category when it has no linked products in the selected unit.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category unique identifier.',
    example: 'ae849d70-eef7-47f8-bf59-c52b32523f8f',
  })
  @ApiOkResponse({
    description: 'Category removed successfully.',
    schema: {
      example: {
        success: true,
      },
    },
  })
  removeCategory(
    @CurrentScope() scope: RequestScope,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<{ success: true }> {
    return this.productsService.removeCategory(scope, id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get product details',
    description:
      'Returns full product details by identifier in the current unit scope.',
  })
  @ApiParam({
    name: 'id',
    description: 'Product unique identifier.',
    example: 'f25e1775-5f30-4f22-b7c1-4be7862f249a',
  })
  @ApiOkResponse({
    description: 'Product details fetched successfully.',
    type: ProductDetailsResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User has no access to the selected unit scope.',
  })
  @ApiNotFoundResponse({
    description: 'Product not found for the selected unit.',
  })
  getById(
    @CurrentScope() scope: RequestScope,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ProductDetailsResponseDto> {
    return this.productsService.getById(scope, id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create product',
    description: 'Creates a new product for the selected unit.',
  })
  @ApiCreatedResponse({
    description: 'Product created successfully.',
    type: ProductDetailsResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User has no access to the selected unit scope.',
  })
  create(
    @CurrentScope() scope: RequestScope,
    @Body() input: CreateProductInput,
  ): Promise<ProductDetailsResponseDto> {
    return this.productsService.create(scope, input);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update product',
    description: 'Updates an existing product in the selected unit.',
  })
  @ApiParam({
    name: 'id',
    description: 'Product unique identifier.',
    example: 'f25e1775-5f30-4f22-b7c1-4be7862f249a',
  })
  @ApiOkResponse({
    description: 'Product updated successfully.',
    type: ProductDetailsResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User has no access to the selected unit scope.',
  })
  @ApiNotFoundResponse({
    description: 'Product not found for the selected unit.',
  })
  update(
    @CurrentScope() scope: RequestScope,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: UpdateProductInput,
  ): Promise<ProductDetailsResponseDto> {
    return this.productsService.update(scope, id, input);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remove product',
    description:
      'Removes a product permanently when possible or deactivates it when hard-delete is restricted.',
  })
  @ApiParam({
    name: 'id',
    description: 'Product unique identifier.',
    example: 'f25e1775-5f30-4f22-b7c1-4be7862f249a',
  })
  @ApiOkResponse({
    description: 'Product removed or deactivated successfully.',
    schema: {
      example: {
        success: true,
        mode: 'hard-delete',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User has no access to the selected unit scope.',
  })
  @ApiNotFoundResponse({
    description: 'Product not found for the selected unit.',
  })
  remove(
    @CurrentScope() scope: RequestScope,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<{ success: true; mode: 'hard-delete' | 'deactivated' }> {
    return this.productsService.remove(scope, id);
  }
}
