import { RateLimitService } from './rate-limit.service';

describe('RateLimitService', () => {
  let service: RateLimitService;

  beforeEach(() => {
    service = new RateLimitService();
  });

  it('allows requests until the configured limit is reached', () => {
    const first = service.consume('auth:login:127.0.0.1', 2, 60_000, 1_000);
    const second = service.consume('auth:login:127.0.0.1', 2, 60_000, 1_500);

    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(1);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(0);
  });

  it('blocks requests above the configured limit until the window expires', () => {
    service.consume('auth:login:127.0.0.1', 1, 60_000, 1_000);

    const blocked = service.consume('auth:login:127.0.0.1', 1, 60_000, 1_100);
    const reopened = service.consume('auth:login:127.0.0.1', 1, 60_000, 61_100);

    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(reopened.allowed).toBe(true);
    expect(reopened.remaining).toBe(0);
  });
});
