/**
 * sanitizeParams - Remove undefined, null, NaN, empty strings, empty arrays
 * Converte tipos para string quando necessário
 * NUNCA inclui "undefined" na URL
 */

export function sanitizeParams(params: Record<string, unknown>): Record<string, string> {
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(params)) {
    // Skip undefined, null
    if (value === undefined || value === null) {
      continue;
    }

    // Skip NaN
    if (typeof value === 'number' && isNaN(value)) {
      continue;
    }

    // Skip empty string
    if (value === '') {
      continue;
    }

    // Skip empty arrays
    if (Array.isArray(value) && value.length === 0) {
      continue;
    }

    // Convert to string
    if (typeof value === 'boolean') {
      sanitized[key] = value ? 'true' : 'false';
    } else if (typeof value === 'number') {
      sanitized[key] = value.toString();
    } else if (value instanceof Date) {
      sanitized[key] = value.toISOString();
    } else if (Array.isArray(value)) {
      // Join array with comma (ou outro separador conforme necessário)
      sanitized[key] = value.map(String).join(',');
    } else {
      sanitized[key] = String(value);
    }
  }

  return sanitized;
}

