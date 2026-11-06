/**
 * @module alarm-manager
 * @description Creates and updates the persistent browser check alarm.
 */

import { browser } from '../shared/browser';
import { CHECK_ALARM, MUTE_ALARM } from '../shared/constants';
import { getSettings, setSettings } from './storage-manager';
import { runCheck } from './checker-orchestrator';

/** Schedules the periodic alarm from current settings. @returns Nothing. */
export async function scheduleCheck(): Promise<void> {
  const settings = await getSettings();
  await browser.alarms.clear(CHECK_ALARM);
  await browser.alarms.create(CHECK_ALARM, { periodInMinutes: settings.intervalMinutes });
}

/** Initializes startup/install scheduling. @returns Nothing. */
export function registerAlarmManager(): void {
  browser.runtime.onInstalled.addListener(() => { void scheduleCheck(); });
  browser.runtime.onStartup.addListener(() => {
    void scheduleCheck();
    void getSettings().then((settings) => { if (settings.runOnStartup) void runCheck(); });
  });
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === CHECK_ALARM) void runCheck();
    if (alarm.name === MUTE_ALARM) void setSettings({ notificationsEnabled: true });
  });
}
