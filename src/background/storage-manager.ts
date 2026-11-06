/**
 * @module storage-manager
 * @description Typed storage operations for extension settings and portal state.
 */

import { browser } from '../shared/browser';
import { MAX_UPDATES, STORAGE_KEYS } from '../shared/constants';
import { DEFAULT_SETTINGS, type LastCheck, type PortalSnapshot, type Settings, type SettingsPatch, type Update } from '../shared/types';

/** Reads persisted settings with defaults. @returns Current settings. */
export async function getSettings(): Promise<Settings> {
  const stored = await browser.storage.local.get(STORAGE_KEYS.settings);
  const saved = stored[STORAGE_KEYS.settings] as Partial<Settings> | undefined;
  return { ...DEFAULT_SETTINGS, ...saved, ucam: { ...DEFAULT_SETTINGS.ucam, ...saved?.ucam }, elms: { ...DEFAULT_SETTINGS.elms, enabled: saved?.elms?.enabled ?? false } };
}

/** Persists merged settings. @param patch Partial settings to save. @returns Saved settings. */
export async function setSettings(patch: SettingsPatch): Promise<Settings> {
  const current = await getSettings();
  const settings: Settings = {
    ...current, ...patch,
    ucam: { ...current.ucam, ...patch.ucam },
    elms: { ...current.elms, ...patch.elms },
  };
  await browser.storage.local.set({ [STORAGE_KEYS.settings]: settings });
  return settings;
}

/** Reads a portal snapshot. @param portal Portal identifier. @returns Snapshot or null. */
export async function getSnapshot(portal: 'ucam' | 'elms'): Promise<PortalSnapshot | null> {
  const key = portal === 'ucam' ? STORAGE_KEYS.snapshotUcam : STORAGE_KEYS.snapshotElms;
  const stored = await browser.storage.local.get(key);
  return (stored[key] as PortalSnapshot | undefined) ?? null;
}

/** Persists a portal snapshot. @param snapshot Snapshot to save. @returns Nothing. */
export async function setSnapshot(snapshot: PortalSnapshot): Promise<void> {
  const key = snapshot.adapterId === 'ucam' ? STORAGE_KEYS.snapshotUcam : STORAGE_KEYS.snapshotElms;
  await browser.storage.local.set({ [key]: snapshot });
}

/** Reads recent updates. @returns Updates newest first. */
export async function getUpdates(): Promise<Update[]> {
  const stored = await browser.storage.local.get(STORAGE_KEYS.updates);
  return (stored[STORAGE_KEYS.updates] as Update[] | undefined) ?? [];
}

/** Adds updates while retaining at most 200. @param updates New updates. @returns Saved list. */
export async function appendUpdates(updates: Update[]): Promise<Update[]> {
  const current = await getUpdates();
  const replacements = new Map(updates.map((update) => [update.id, update]));
  const merged = [...updates, ...current.filter((update) => !replacements.has(update.id))];
  const saved = merged.sort((left, right) => right.createdAt - left.createdAt).slice(0, MAX_UPDATES);
  await browser.storage.local.set({ [STORAGE_KEYS.updates]: saved });
  return saved;
}

/** Reads last-check timestamps. @returns Per-portal timestamps. */
export async function getLastCheck(): Promise<LastCheck> {
  const stored = await browser.storage.local.get(STORAGE_KEYS.lastCheck);
  return (stored[STORAGE_KEYS.lastCheck] as LastCheck | undefined) ?? { ucam: 0, elms: 0 };
}

/** Persists one portal's last-check timestamp. @param portal Portal identifier. @param time Check timestamp. @returns Nothing. */
export async function setLastCheck(portal: 'ucam' | 'elms', time: number): Promise<void> {
  await browser.storage.local.set({ [STORAGE_KEYS.lastCheck]: { ...(await getLastCheck()), [portal]: time } });
}

/** Replaces the current update list. @param updates New list. @returns Nothing. */
export async function replaceUpdates(updates: Update[]): Promise<void> {
  await browser.storage.local.set({ [STORAGE_KEYS.updates]: updates.slice(0, MAX_UPDATES) });
}
