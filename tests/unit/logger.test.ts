/**
 * @module logger-test
 * @description Verifies generic credential URL redaction.
 */

import { describe, expect, it, vi } from 'vitest';
import { redact, warn } from '../../src/shared/logger';

describe('logger redaction', () => {
  it('removes access token values from URLs', () => {
    expect(redact('https://example.test/?access_token=secret-token&mode=read')).toBe(
      'https://example.test/?access_token=[REDACTED]&mode=read',
    );
  });
  it('redacts nested URL strings before passing values to the console', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    warn('Failed request', { url: 'https://example.test/?token=hidden' });
    expect(consoleWarn).toHaveBeenCalledWith('Failed request', { url: 'https://example.test/?token=[REDACTED]' });
    consoleWarn.mockRestore();
  });
});
