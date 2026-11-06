/**
 * @module message-router
 * @description Validates and handles extension runtime messages.
 */

import { browser } from '../shared/browser';
import type { RuntimeMessage } from '../shared/messages';
import * as storage from './storage-manager';
import { runCheck } from './checker-orchestrator';
import { scheduleCheck } from './alarm-manager';
import { updateBadge } from './notification-dispatcher';
import { hasElmsSession } from '../adapters/elms';
import { MUTE_ALARM } from '../shared/constants';
import { getPortalLoginState, setPortalLoginState } from './connection-state';

/** Returns a type-safe extension state for popup and options pages. @returns Current monitor state. */
export async function getMonitorState() {
  const [settings, updates, lastCheck] = await Promise.all([
    storage.getSettings(), storage.getUpdates(), storage.getLastCheck(),
  ]);
  const elmsCookie = await hasElmsSession();
  return {
    settings, updates, lastCheck,
    statuses: {
      ucam: getPortalLoginState('ucam') === null ? 'unknown' as const : getPortalLoginState('ucam') ? 'connected' as const : 'logged-out' as const,
      elms: !elmsCookie || getPortalLoginState('elms') === false ? 'logged-out' as const : 'connected' as const,
    },
  };
}

/** Handles a validated runtime message. @param message Incoming message. @returns Result for the sender. */
export async function handleMessage(message: RuntimeMessage): Promise<unknown> {
  switch (message.type) {
    case 'GET_STATE': return getMonitorState();
    case 'SAVE_SETTINGS': {
      const settings = await storage.setSettings(message.settings);
      await scheduleCheck();
      return settings;
    }
    case 'CHECK_NOW': return runCheck();
    case 'CLEAR_HISTORY': await storage.replaceUpdates([]); await updateBadge(0); return { ok: true };
    case 'MARK_READ': {
      const updates = await storage.getUpdates();
      const saved = updates.map((update) => update.id === message.id ? { ...update, read: true } : update);
      await storage.replaceUpdates(saved);
      await updateBadge(saved.filter((update) => !update.read).length);
      return { ok: true };
    }
    case 'MARK_ALL_READ': {
      const updates = await storage.getUpdates();
      await storage.replaceUpdates(updates.map((update) => ({ ...update, read: true })));
      await updateBadge(0);
      return { ok: true };
    }
    case 'LOGIN_STATE_CHANGED':
      setPortalLoginState(message.portal, message.loggedIn);
      return { ok: true, loggedIn: message.loggedIn };
    case 'MUTE_30_MIN': {
      const settings = await storage.getSettings();
      if (!settings.notificationsEnabled) return { ok: false, reason: 'Notifications are already disabled.' };
      await storage.setSettings({ notificationsEnabled: false });
      await browser.alarms.create(MUTE_ALARM, { when: Date.now() + 30 * 60_000 });
      return { ok: true };
    }
  }
}

/** Registers the runtime message listener. @returns Nothing. */
export function registerMessageRouter(): void {
  browser.runtime.onMessage.addListener((rawMessage: unknown) => {
    if (!isRuntimeMessage(rawMessage)) return Promise.resolve({ error: 'Invalid message' });
    return handleMessage(rawMessage);
  });
}

function isRuntimeMessage(value: unknown): value is RuntimeMessage {
  if (typeof value !== 'object' || value === null || !('type' in value)) return false;
  return ['CHECK_NOW', 'GET_STATE', 'SAVE_SETTINGS',
    'CLEAR_HISTORY', 'MARK_READ', 'MARK_ALL_READ', 'LOGIN_STATE_CHANGED', 'MUTE_30_MIN'].includes(String(value.type));
}
