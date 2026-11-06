/**
 * @module constants
 * @description Persistent storage keys and operational limits.
 */

export const STORAGE_KEYS = {
  settings: 'portal-monitor:settings',
  snapshotUcam: 'portal-monitor:snapshots:ucam',
  snapshotElms: 'portal-monitor:snapshots:elms',
  updates: 'portal-monitor:updates',
  notifiedIds: 'portal-monitor:notified-ids',
  lastCheck: 'portal-monitor:last-check',
} as const;
export const CHECK_ALARM = 'portal-monitor-check';
export const MUTE_ALARM = 'portal-monitor-mute-expiry';
export const MAX_UPDATES = 200;
export const MAX_NOTIFIED_IDS = 500;
export const PORTAL_BASES = { ucam: 'https://ucam.uiu.ac.bd', elms: 'https://elms.uiu.ac.bd' } as const;
