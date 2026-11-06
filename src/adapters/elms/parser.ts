/** @module elms-parser @description Extracts monitorable activities from Moodle dashboard HTML. */

import { sha256 } from '../../shared/hash';
import type { SnapshotItem, UpdateKind } from '../../shared/types';

const ELMS_ORIGIN = 'https://elms.uiu.ac.bd';

/** Parses dashboard activity links into stable ELMS update items. @param html Dashboard HTML. @returns Parsed activities. */
export async function parseElmsActivities(html: string): Promise<SnapshotItem[]> {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const items: SnapshotItem[] = [];
  const seen = new Set<string>();
  const selectors: Array<{ selector: string; kind: UpdateKind }> = [
    { selector: 'a[href*="/mod/resource/view.php"], a[href*="/pluginfile.php"]', kind: 'material' },
    { selector: 'a[href*="/mod/assign/view.php"]', kind: 'assignment' },
    { selector: 'a[href*="/mod/forum/view.php"], a[href*="/mod/forum/discuss.php"]', kind: 'forum' },
  ];
  for (const entry of selectors) {
    for (const anchor of document.querySelectorAll<HTMLAnchorElement>(entry.selector)) {
      const title = anchor.textContent?.trim() || anchor.getAttribute('title')?.trim();
      const href = anchor.getAttribute('href');
      if (!title || !href) continue;
      const url = safeElmsUrl(href);
      if (!url || seen.has(`${entry.kind}:${url}`)) continue;
      seen.add(`${entry.kind}:${url}`);
      const stableHash = (await sha256(`${entry.kind}:${url}`)).slice(0, 20);
      const context = anchor.closest('.activity, .activity-item, .block, li, tr') ?? anchor.parentElement;
      const dueNode = context?.querySelector('time[datetime], [data-timestamp]');
      const dueDate = dueNode?.getAttribute('datetime') ?? dueNode?.getAttribute('data-timestamp') ?? undefined;
      const course = context?.closest('[data-courseid], .course')?.getAttribute('data-courseid') ?? undefined;
      items.push({
        id: `elms:${entry.kind}:${stableHash}`, kind: entry.kind, title, url,
        meta: { ...(course ? { course } : {}), ...(dueDate ? { dueDate } : {}) },
      });
    }
  }
  return items;
}

function safeElmsUrl(href: string): string | undefined {
  try {
    const url = new URL(href, `${ELMS_ORIGIN}/my/`);
    return url.protocol === 'https:' && url.hostname === 'elms.uiu.ac.bd' ? url.toString() : undefined;
  } catch { return undefined; }
}
