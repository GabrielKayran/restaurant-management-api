import { Global, Module } from '@nestjs/common';
import { NormalizationService } from './services/normalization.service';
import { CommonI18nModule } from './i18n/i18n.module';
import { RateLimitService } from './services/rate-limit.service';
import { AuditLoggerService } from './services/audit-logger.service';

@Global()
@Module({
  imports: [CommonI18nModule],
  providers: [NormalizationService, RateLimitService, AuditLoggerService],
  exports: [NormalizationService, RateLimitService, AuditLoggerService],
})
export class CommonModule {}
