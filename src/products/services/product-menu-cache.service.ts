import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { MemoryCacheService } from '../../common/services/memory-cache.service';

@Injectable()
export class ProductMenuCacheService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: MemoryCacheService,
  ) {}

  async invalidatePublicMenu(unitId: string): Promise<void> {
    const unit = await this.prisma.restaurantUnit.findUnique({
      where: { id: unitId },
      select: { slug: true },
    });

    if (unit?.slug) {
      this.cache.invalidate(`public-menu:${unit.slug}`);
    }
  }
}
