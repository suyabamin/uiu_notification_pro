/**
 * @module logger
 * @description Privacy-aware console logger that redacts credential URL parameters.
 */

const TOKEN_PATTERN = /([?&](?:access_token|token|api_key)=)[^&\s]+/gi;

/** Logs a safe informational message. @param message Message text. @param values Additional values. @returns Nothing. */
export function info(message: string, ...values: unknown[]): void {
  console.info(redact(message), ...values.map((value) => redactValue(value)));
}

/** Logs a safe warning. @param message Message text. @param values Additional values. @returns Nothing. */
export function warn(message: string, ...values: unknown[]): void {
  console.warn(redact(message), ...values.map((value) => redactValue(value)));
}

/** Removes credential-like URL parameters from a string. @param value Input text. @returns Redacted text. */
export function redact(value: string): string {
  return value.replace(TOKEN_PATTERN, '$1[REDACTED]');
}

function redactValue(value: unknown, seen = new WeakSet<object>()): unknown {
  if (typeof value === 'string') return redact(value);
  if (value instanceof URL) return redact(value.toString());
  if (value instanceof Error) return { name: value.name, message: redact(value.message) };
  if (typeof value === 'object' && value !== null) {
    if (seen.has(value)) return '[Circular]';
    seen.add(value);
    if (Array.isArray(value)) return value.map((entry) => redactValue(entry, seen));
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, redactValue(entry, seen)]));
  }
  return value;
}
