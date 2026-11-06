/**
 * @module notification-rules
 * @description Pure notification filtering, quiet-hours, and coalescing rules.
 */

import type { Settings, Update } from '../shared/types';

/** Checks whether the current local hour falls in quiet hours. @param settings User settings. @param date Current date/time. @returns True when notifications are suppressed. */
export function isQuietHours(settings: Settings, date = new Date()): boolean {
  const quiet = settings.quietHours;
  if (!quiet?.enabled) return false;
  const hour = date.getHours() + date.getMinutes() / 60;
  return quiet.start <= quiet.end ? hour >= quiet.start && hour < quiet.end : hour >= quiet.start || hour < quiet.end;
}

/** Filters updates by notification type and coalesces groups of three or more. @param updates Candidate updates. @param settings User notification settings. @returns Notification groups. */
export function makeNotificationGroups(updates: Update[], settings: Settings): Update[][] {
  const eligible = updates.filter((update) => settings.notificationTypes.includes(update.kind));
  if (eligible.length >= 3) return [eligible];
  return eligible.map((update) => [update]);
}
