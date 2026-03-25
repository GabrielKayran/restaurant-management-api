import { Injectable } from '@nestjs/common';

type CacheEntry<T> = {
  readonly value: T;
  readonly expiresAt: number;
};

@Injectable()
export class MemoryCacheService {
  private readonly store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string, now: number = Date.now()): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= now) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number, now: number = Date.now()): T {
    this.store.set(key, {
      value,
      expiresAt: now + ttlMs,
    });

    return value;
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }
}
