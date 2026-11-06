/**
 * @module checker-orchestrator
 * @description Fetches enabled portal snapshots, finds new updates, and dispatches results.
 */

import { getAdapter } from '../adapters/registry';
import { info, warn } from '../shared/logger';
import type { PortalSnapshot, Update } from '../shared/types';
import { appendUpdates, getSettings, getSnapshot, getUpdates, setLastCheck, setSnapshot } from './storage-manager';
import { dispatchUpdates, updateBadge } from './notification-dispatcher';
import { diffElmsItems } from '../adapters/elms/diff';
import { setPortalLoginState } from './connection-state';

/** Runs one monitoring cycle across enabled adapters. @returns Newly discovered updates. */
export async function runCheck(): Promise<Update[]> {
  const settings = await getSettings();
  const found: Update[] = [];
  for (const id of ['ucam', 'elms'] as const) {
    if (!settings[id].enabled) continue;
    const adapter = getAdapter(id);
    if (!adapter) { warn(`No adapter registered for ${id}`); continue; }
    try {
      const result = await adapter.fetchSnapshot();
      if ('notAuthenticated' in result) {
        setPortalLoginState(id, false);
        info(`${id.toUpperCase()} check skipped because the session is not authenticated`);
        await setLastCheck(id, Date.now());
        continue;
      }
      const next: PortalSnapshot = result;
      setPortalLoginState(id, true);
      const previous = await getSnapshot(id);
      const previousIds = new Set(previous?.items.map((item) => item.id) ?? []);
      const currentIds = new Set(next.items.map((item) => item.id));
      const previousIsMissing = previous === null;
      const additions = previousIsMissing ? [] : id === 'elms'
        ? diffElmsItems(previous?.items ?? [], next.items)
        : next.items.filter((item) => !previousIds.has(item.id));
      const oldItems = new Map((previous?.items ?? []).map((item) => [item.id, item]));
      const updates: Update[] = additions.map((item) => ({ ...item, adapterId: id, createdAt: Date.now(), read: false }));
      await setSnapshot(next);
      await setLastCheck(id, next.fetchedAt);
      found.push(...updates);
      info(`Completed ${id} check`, { removed: [...previousIds].filter((itemId) => !currentIds.has(itemId)).length, changed: oldItems.size });
    } catch (error) {
      warn(`Skipped ${id} during this check`, error);
      await setLastCheck(id, Date.now());
    }
  }
  if (found.length > 0) await appendUpdates(found);
  const all = await getUpdates();
  await updateBadge(all.filter((update) => !update.read).length);
  await dispatchUpdates(found, settings);
  return found;
}
