type Settings = {
  intervalMinutes: number;                    // 30 default; min 15
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  quietHours?: { enabled: boolean; start: number; end: number }; // 0-23
  ucam: { enabled: boolean; sections: UcamSection[] };
  elms: { enabled: boolean; token: string | null; tokenExpired: boolean };
};

type UcamSection =
  | 'notices' | 'routine' | 'results' | 'attendance' | 'materials';

type PortalSnapshot = {
  adapterId: 'ucam' | 'elms';
  fetchedAt: number;
  items: SnapshotItem[];
  hash: string;      // SHA-256 of sorted item IDs
};

type SnapshotItem = {
  id: string;        // stable: e.g. "notice:2025-11-06:abc123"
  kind: 'material' | 'notice' | 'assignment' | 'result' | 'attendance';
  title: string;
  url?: string;
  meta?: { course?: string; dueDate?: string; [k: string]: string | undefined };
};

type Update = {
  id: string;        // uuid
  adapterId: 'ucam' | 'elms';
  kind: SnapshotItem['kind'];
  title: string;
  url?: string;
  meta?: SnapshotItem['meta'];
  createdAt: number;
  read: boolean;
};