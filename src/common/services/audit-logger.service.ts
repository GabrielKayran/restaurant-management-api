import { Injectable, Logger } from '@nestjs/common';

export type AuditLogEvent = {
  readonly action: string;
  readonly actorUserId: string;
  readonly tenantId: string;
  readonly unitId?: string | null;
  readonly targetType?: string;
  readonly targetId?: string | null;
  readonly details?: Record<string, unknown>;
};

@Injectable()
export class AuditLoggerService {
  private readonly logger = new Logger('AuditLogger');

  log(event: AuditLogEvent): void {
    const payload = {
      timestamp: new Date().toISOString(),
      action: event.action,
      actorUserId: event.actorUserId,
      tenantId: event.tenantId,
      unitId: event.unitId ?? null,
      targetType: event.targetType ?? null,
      targetId: event.targetId ?? null,
      details: this.sanitizeDetails(event.details),
    };

    this.logger.log(JSON.stringify(payload));
  }

  private sanitizeDetails(
    details?: Record<string, unknown>,
  ): Record<string, unknown> | null {
    if (!details) {
      return null;
    }

    return Object.fromEntries(
      Object.entries(details).map(([key, value]) => [
        key,
        this.maskValue(key, value),
      ]),
    );
  }

  private maskValue(key: string, value: unknown): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.maskValue(key, item));
    }

    if (typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([nestedKey, nestedValue]) => [
          nestedKey,
          this.maskValue(nestedKey, nestedValue),
        ]),
      );
    }

    const normalizedKey = key.toLowerCase();

    if (
      normalizedKey.includes('password') ||
      normalizedKey.includes('token') ||
      normalizedKey.includes('secret') ||
      normalizedKey.includes('access') ||
      normalizedKey.includes('refresh')
    ) {
      return '[redacted]';
    }

    if (normalizedKey.includes('email') && typeof value === 'string') {
      return this.maskEmail(value);
    }

    if (normalizedKey.includes('document') && typeof value === 'string') {
      return this.maskDocument(value);
    }

    return value;
  }

  private maskEmail(email: string): string {
    const [localPart = '', domainPart = ''] = email.split('@');

    if (!domainPart) {
      return '[redacted-email]';
    }

    const visibleLocal = localPart.slice(0, 2);
    return `${visibleLocal}${'*'.repeat(
      Math.max(localPart.length - 2, 1),
    )}@${domainPart}`;
  }

  private maskDocument(document: string): string {
    const visibleTail = document.slice(-4);
    return `${'*'.repeat(Math.max(document.length - 4, 4))}${visibleTail}`;
  }
}
