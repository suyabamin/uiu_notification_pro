/**
 * @module shared-types
 * @description Shared domain models for settings, portal snapshots, and updates.
 */

export type UcamSection = 'notices' | 'routine' | 'results' | 'attendance' | 'materials';
export type UpdateKind = 'material' | 'notice' | 'assignment' | 'result' | 'attendance' | 'forum';

export type Settings = {
  intervalMinutes: number;
  runOnStartup: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  quietHours?: { enabled: boolean; start: number; end: number };
  notificationTypes: UpdateKind[];
  ucam: { enabled: boolean; sections: UcamSection[] };
  elms: { enabled: boolean };
};
export type SettingsPatch = Omit<Partial<Settings>, 'ucam' | 'elms'> & {
  ucam?: Partial<Settings['ucam']>;
  elms?: Partial<Settings['elms']>;
};

export type SnapshotItem = {
  id: string;
  kind: UpdateKind;
  title: string;
  url?: string;
  meta?: { course?: string; dueDate?: string; [key: string]: string | undefined };
};

export type PortalSnapshot = {
  adapterId: 'ucam' | 'elms';
  fetchedAt: number;
  items: SnapshotItem[];
  hash: string;
};

export type Update = SnapshotItem & {
  adapterId: 'ucam' | 'elms';
  createdAt: number;
  read: boolean;
};

export type LastCheck = { ucam: number; elms: number };
export type MonitorState = {
  settings: Settings;
  updates: Update[];
  lastCheck: LastCheck;
  statuses: { ucam: 'unknown' | 'connected' | 'logged-out'; elms: 'unknown' | 'connected' | 'logged-out' };
};

export const DEFAULT_SETTINGS: Settings = {
  intervalMinutes: 30,
  runOnStartup: true,
  notificationsEnabled: true,
  soundEnabled: false,
  notificationTypes: ['material', 'notice', 'assignment', 'result', 'attendance', 'forum'],
  ucam: { enabled: true, sections: ['notices', 'routine', 'results', 'attendance', 'materials'] },
  elms: { enabled: false },
};
