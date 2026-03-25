import { Injectable } from '@nestjs/common';

export type RateLimitResult = {
  readonly allowed: boolean;
  readonly limit: number;
  readonly remaining: number;
  readonly resetAt: number;
  readonly retryAfterSeconds: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

@Injectable()
export class RateLimitService {
  private readonly buckets = new Map<string, RateLimitEntry>();

  consume(
    key: string,
    limit: number,
    windowMs: number,
    now: number = Date.now(),
  ): RateLimitResult {
    const existing = this.buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      const resetAt = now + windowMs;
      this.buckets.set(key, {
        count: 1,
        resetAt,
      });

      return {
        allowed: true,
        limit,
        remaining: Math.max(limit - 1, 0),
        resetAt,
        retryAfterSeconds: Math.max(Math.ceil(windowMs / 1000), 1),
      };
    }

    if (existing.count >= limit) {
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetAt: existing.resetAt,
        retryAfterSeconds: Math.max(
          Math.ceil((existing.resetAt - now) / 1000),
          1,
        ),
      };
    }

    existing.count += 1;

    return {
      allowed: true,
      limit,
      remaining: Math.max(limit - existing.count, 0),
      resetAt: existing.resetAt,
      retryAfterSeconds: Math.max(
        Math.ceil((existing.resetAt - now) / 1000),
        1,
      ),
    };
  }

  reset(): void {
    this.buckets.clear();
  }
}
