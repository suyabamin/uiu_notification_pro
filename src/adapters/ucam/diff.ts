/**
 * @module ucam-diff
 * @description Detects new UCAM items by stable ID.
 */

import type { SnapshotItem } from '../../shared/types';

/** Finds items absent from the previous snapshot. @param previous Previous items. @param current Current items. @returns New items. */
export function diffUcamItems(previous: SnapshotItem[], current: SnapshotItem[]): SnapshotItem[] {
  const previousIds = new Set(previous.map((item) => item.id));
  return current.filter((item) => !previousIds.has(item.id));
}
