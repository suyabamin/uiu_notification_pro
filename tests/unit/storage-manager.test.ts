import { beforeEach, describe, expect, it, vi } from 'vitest';

const values: Record<string, unknown> = {};
vi.mock('../../src/shared/browser', () => ({
  browser: { storage: { local: {
    get: vi.fn(async (key: string) => ({ [key]: values[key] })),
    set: vi.fn(async (record: Record<string, unknown>) => Object.assign(values, record)),
    remove: vi.fn(async (key: string) => { delete values[key]; }),
  } } },
}));

import { appendUpdates, getSettings, setSettings } from '../../src/background/storage-manager';

describe('storage manager', () => {
  beforeEach(() => { for (const key of Object.keys(values)) delete values[key]; });
  it('returns default settings when storage is empty', async () => {
    expect((await getSettings()).intervalMinutes).toBe(30);
  });
  it('merges settings and retains defaults', async () => {
    expect((await setSettings({ intervalMinutes: 60 })).intervalMinutes).toBe(60);
    expect((await getSettings()).notificationsEnabled).toBe(true);
  });
  it('persists ELMS monitoring as a session-based setting', async () => {
    await setSettings({ elms: { enabled: true } });
    expect(values['portal-monitor:settings']).toHaveProperty('elms', { enabled: true });
    expect(values).not.toHaveProperty('portal-monitor:elms-token');
  });
  it('stores updates newest first and enforces the history cap', async () => {
    const updates = Array.from({ length: 205 }, (_, index) => ({ id: String(index), adapterId: 'ucam' as const, kind: 'notice' as const, title: 'Notice', createdAt: index, read: false }));
    const saved = await appendUpdates(updates);
    expect(saved).toHaveLength(200);
    expect(saved[0]?.id).toBe('204');
  });
});
/**
 * @module storage-manager-test
 * @description Verifies default, merged, and bounded storage behavior.
 */
