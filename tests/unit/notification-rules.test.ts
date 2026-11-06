import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, type Update } from '../../src/shared/types';
import { isQuietHours, makeNotificationGroups } from '../../src/background/notification-rules';

const updates: Update[] = Array.from({ length: 3 }, (_, index) => ({ id: String(index), adapterId: 'ucam', kind: 'notice', title: `Update ${index}`, createdAt: index, read: false }));

describe('notification rules', () => {
  it('coalesces three eligible updates', () => {
    expect(makeNotificationGroups(updates, DEFAULT_SETTINGS)).toHaveLength(1);
    expect(makeNotificationGroups(updates, DEFAULT_SETTINGS)[0]).toHaveLength(3);
  });
  it('respects overnight quiet hours', () => {
    const settings = { ...DEFAULT_SETTINGS, quietHours: { enabled: true, start: 23, end: 7 } };
    expect(isQuietHours(settings, new Date(2026, 0, 1, 23, 30))).toBe(true);
    expect(isQuietHours(settings, new Date(2026, 0, 1, 12, 0))).toBe(false);
  });
  it('filters disabled notification types', () => {
    const settings = { ...DEFAULT_SETTINGS, notificationTypes: ['result'] as const };
    expect(makeNotificationGroups(updates, settings)).toEqual([]);
  });
});
/**
 * @module notification-rules-test
 * @description Verifies notification grouping and quiet-hour rules.
 */
