/**
 * @module elms-diff
 * @description Finds new and modified Moodle snapshot items.
 */

import type { SnapshotItem } from '../../shared/types';

/** Returns new or changed items by stable ID. @param previous Previous items. @param current Current items. @returns Added and modified items. */
export function diffElmsItems(previous: SnapshotItem[], current: SnapshotItem[]): SnapshotItem[] {
  const old = new Map(previous.map((item) => [item.id, item]));
  return current.filter((item) => {
    const prior = old.get(item.id);
    return prior === undefined || prior.meta?.timemodified !== item.meta?.timemodified;
  });
}
