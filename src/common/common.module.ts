import { Global, Module } from '@nestjs/common';
import { NormalizationService } from './services/normalization.service';
import { CommonI18nModule } from './i18n/i18n.module';

@Global()
@Module({
  imports: [CommonI18nModule],
  providers: [NormalizationService],
  exports: [NormalizationService],
})
export class CommonModule {}
