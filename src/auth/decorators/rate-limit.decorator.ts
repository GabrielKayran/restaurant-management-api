import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rate_limit_config';

export type RateLimitConfig = {
  readonly key: string;
  readonly limit: number;
  readonly windowMs: number;
};

export const RateLimit = (config: RateLimitConfig) =>
  SetMetadata(RATE_LIMIT_KEY, config);
