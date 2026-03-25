export function sanitizeTrimmedString(value?: string | null): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

export function sanitizeDigits(value?: string | null): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.replace(/\D/g, '');
  return normalized ? normalized : null;
}

export function sanitizePhone(value?: string | null): string | null {
  return sanitizeDigits(value);
}

export function sanitizeZipCode(value?: string | null): string | null {
  return sanitizeDigits(value);
}

export function sanitizeStateCode(value?: string | null): string | null {
  const normalized = sanitizeTrimmedString(value);
  return normalized ? normalized.toUpperCase() : null;
}
