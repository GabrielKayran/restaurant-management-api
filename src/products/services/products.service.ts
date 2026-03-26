import { Injectable } from '@nestjs/common';
import { RequestScope } from '../../common/models/request-scope.model';
import { PaginationResponse } from '../../common/pagination';
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
} from '../dto';
import { ProductCategoriesService } from './product-categories.service';
import { ProductsMutationService } from './products-mutation.service';
import { ProductsQueryService } from './products-query.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly queryService: ProductsQueryService,
    private readonly mutationService: ProductsMutationService,
    private readonly categoriesService: ProductCategoriesService,
  ) {}

  async list(
    scope: RequestScope,
    query: ProductsListQueryDto,
  ): Promise<PaginationResponse<ProductListItemResponseDto>> {
    return this.queryService.list(scope, query);
  }

  async categoriesSummary(
    scope: RequestScope,
  ): Promise<ProductCategorySummaryResponseDto[]> {
    return this.categoriesService.categoriesSummary(scope);
  }

  async listCategories(
    scope: RequestScope,
  ): Promise<CategoryDetailsResponseDto[]> {
    return this.categoriesService.listCategories(scope);
  }

  async getCategoryById(
    scope: RequestScope,
    id: string,
  ): Promise<CategoryDetailsResponseDto> {
    return this.categoriesService.getCategoryById(scope, id);
  }

  async createCategory(
    scope: RequestScope,
    input: CreateCategoryInput,
  ): Promise<CategoryDetailsResponseDto> {
    return this.categoriesService.createCategory(scope, input);
  }

  async updateCategory(
    scope: RequestScope,
    id: string,
    input: UpdateCategoryInput,
  ): Promise<CategoryDetailsResponseDto> {
    return this.categoriesService.updateCategory(scope, id, input);
  }

  async removeCategory(
    scope: RequestScope,
    id: string,
  ): Promise<{ success: true }> {
    return this.categoriesService.removeCategory(scope, id);
  }

  async getById(
    scope: RequestScope,
    id: string,
  ): Promise<ProductDetailsResponseDto> {
    return this.queryService.getById(scope, id);
  }

  async create(
    scope: RequestScope,
    input: CreateProductInput,
  ): Promise<ProductDetailsResponseDto> {
    return this.mutationService.create(scope, input);
  }

  async update(
    scope: RequestScope,
    id: string,
    input: UpdateProductInput,
  ): Promise<ProductDetailsResponseDto> {
    return this.mutationService.update(scope, id, input);
  }

  async remove(
    scope: RequestScope,
    id: string,
  ): Promise<{ success: true; mode: 'hard-delete' | 'deactivated' }> {
    return this.mutationService.remove(scope, id);
  }
}
