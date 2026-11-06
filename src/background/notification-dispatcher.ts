/**
 * @module notification-dispatcher
 * @description Sends desktop notifications and maintains the unread badge.
 */

import { browser } from '../shared/browser';
import type { Update } from '../shared/types';
import type { Settings } from '../shared/types';
import { MAX_NOTIFIED_IDS, STORAGE_KEYS } from '../shared/constants';
import { isQuietHours, makeNotificationGroups } from './notification-rules';
import { warn } from '../shared/logger';
import { getUpdates, replaceUpdates } from './storage-manager';
import { playFirefoxSound } from './firefox-sound';

/** Displays one desktop notification for an update. @param update Update to announce. @returns Nothing. */
export async function notifyUpdate(update: Update): Promise<void> {
  await browser.notifications.create(update.id, {
    type: 'basic', iconUrl: browser.runtime.getURL('icons/icon-128.png'),
    title: update.title, message: `${update.adapterId.toUpperCase()} · ${update.kind}`,
  });
}

/** Dispatches eligible notifications once per browser session. @param updates New updates. @param settings Current notification settings. @returns Nothing. */
export async function dispatchUpdates(updates: Update[], settings: Settings): Promise<void> {
  if (!settings.notificationsEnabled || isQuietHours(settings)) return;
  const stored = await browser.storage.session.get(STORAGE_KEYS.notifiedIds);
  const notified = (stored[STORAGE_KEYS.notifiedIds] as string[] | undefined) ?? [];
  const notificationKey = (update: Update) => `${update.id}:${update.meta?.timemodified ?? ''}`;
  const fresh = updates.filter((update) => !notified.includes(notificationKey(update)));
  const groups = makeNotificationGroups(fresh, settings);
  if (settings.soundEnabled && groups.length > 0) await playNotificationSound();
  for (const group of groups) {
    const summary = group.length >= 3;
    const id = summary ? `summary:${group.map((update) => update.id).join('|')}` : group[0]?.id ?? '';
    if (!id) continue;
    await browser.notifications.create(id, {
      type: 'basic', iconUrl: browser.runtime.getURL('icons/icon-128.png'),
      title: summary ? `${group.length} new portal updates` : group[0]?.title ?? 'New portal update',
      message: summary ? group.slice(0, 3).map((update) => update.title).join(' · ') : `${group[0]?.adapterId.toUpperCase()} · ${group[0]?.kind}`,
    });
    notified.push(...group.map(notificationKey));
  }
  await browser.storage.session.set({ [STORAGE_KEYS.notifiedIds]: notified.slice(-MAX_NOTIFIED_IDS) });
}

async function playNotificationSound(): Promise<void> {
  if (await isFirefox()) {
    try {
      await playFirefoxSound();
    } catch (error) {
      // Desktop notifications remain enabled and can use the browser's normal notification sound.
      warn('Firefox custom sound was blocked; falling back to the system notification sound', error);
    }
    return;
  }
  if (typeof chrome === 'undefined' || !chrome.offscreen) return;
  try {
    if (!await chrome.offscreen.hasDocument()) {
      await chrome.offscreen.createDocument({
        url: 'sound-player.html',
        reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
        justification: 'Play the user-enabled notification sound.',
      });
    }
    await chrome.runtime.sendMessage({ type: 'PLAY_NOTIFICATION_SOUND' });
  } catch (error) {
    warn('Could not play notification sound', error);
  }
}

async function isFirefox(): Promise<boolean> {
  const runtime = browser.runtime as typeof browser.runtime & { getBrowserInfo?: () => Promise<{ name: string }> };
  if (!runtime.getBrowserInfo) return false;
  try { return (await runtime.getBrowserInfo()).name.toLowerCase().includes('firefox'); }
  catch { return false; }
}

/** Sets the red unread-count badge. @param count Unread update count. @returns Nothing. */
export async function updateBadge(count: number): Promise<void> {
  await browser.action.setBadgeBackgroundColor({ color: '#DC2626' });
  await browser.action.setBadgeText({ text: count === 0 ? '' : count > 9 ? '9+' : String(count) });
}

/** Opens an update URL when its notification is clicked. @returns Nothing. */
export function registerNotificationClicks(): void {
  browser.notifications.onClicked.addListener((id) => {
    void handleNotificationClick(id);
  });
}

async function handleNotificationClick(notificationId: string): Promise<void> {
  const ids = notificationId.startsWith('summary:') ? notificationId.slice('summary:'.length).split('|') : [notificationId];
  const updates = await getUpdates();
  const selected = updates.filter((update) => ids.includes(update.id));
  const target = selected.find((update) => update.url)?.url;
  if (target) await browser.tabs.create({ url: target });
  await replaceUpdates(updates.map((update) => ids.includes(update.id) ? { ...update, read: true } : update));
  await updateBadge(updates.filter((update) => !update.read && !ids.includes(update.id)).length);
  await browser.notifications.clear(notificationId);
}
