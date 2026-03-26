import { Module } from '@nestjs/common';
import { UnitScopeGuard } from '../common/guards/unit-scope.guard';
import { ProductsController } from './products.controller';
import {
  ProductCategoriesService,
  ProductMenuCacheService,
  ProductsMutationService,
  ProductsQueryService,
  ProductsService,
} from './services';

@Module({
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ProductsQueryService,
    ProductsMutationService,
    ProductCategoriesService,
    ProductMenuCacheService,
    UnitScopeGuard,
  ],
})
export class ProductsModule {}
