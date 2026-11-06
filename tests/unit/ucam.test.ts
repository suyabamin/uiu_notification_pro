import { describe, expect, it } from 'vitest';
import { diffUcamItems } from '../../src/adapters/ucam/diff';

describe('UCAM diff', () => {
  it('returns only items not present in the previous snapshot', () => {
    const previous = [{ id: 'ucam:notice:fixture:a', kind: 'notice' as const, title: 'Existing' }];
    const current = [
      ...previous,
      { id: 'ucam:notice:fixture:b', kind: 'notice' as const, title: 'New sanitized notice' },
    ];
    expect(diffUcamItems(previous, current).map((item) => item.id)).toEqual(['ucam:notice:fixture:b']);
  });
});
/**
 * @module ucam-test
 * @description Verifies UCAM new-item detection.
 */
