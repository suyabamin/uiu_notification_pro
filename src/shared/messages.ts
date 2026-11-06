/**
 * @module messages
 * @description Runtime message contract between extension pages and background.
 */

import type { SettingsPatch } from './types';

export type RuntimeMessage =
  | { type: 'CHECK_NOW' }
  | { type: 'GET_STATE' }
  | { type: 'SAVE_SETTINGS'; settings: SettingsPatch }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'MARK_READ'; id: string }
  | { type: 'MARK_ALL_READ' }
  | { type: 'LOGIN_STATE_CHANGED'; portal: 'ucam' | 'elms'; loggedIn: boolean }
  | { type: 'MUTE_30_MIN' };
