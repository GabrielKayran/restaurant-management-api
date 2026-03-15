import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { UnitScopeGuard } from '../common/guards/unit-scope.guard';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, UnitScopeGuard],
})
export class ProductsModule {}
