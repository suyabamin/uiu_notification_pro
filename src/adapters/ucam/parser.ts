/**
 * @module ucam-parser
 * @description Parses provisional UCAM section pages into normalized items.
 */

import type { SnapshotItem, UcamSection } from '../../shared/types';
import { warn } from '../../shared/logger';
import { sha256 } from '../../shared/hash';
import { SECTION_CONFIG } from './selectors';

/** Parses a UCAM section page. @param html Page HTML. @param section Section name. @returns Parsed items or an empty list on parse failure. */
export async function parseUcamSection(html: string, section: UcamSection): Promise<SnapshotItem[]> {
  try {
    const document = new DOMParser().parseFromString(html, 'text/html');
    const selector = SECTION_CONFIG[section];
    const rows = [...document.querySelectorAll(selector.row)].slice(1);
    const kind = section === 'materials' ? 'material' : section === 'results' ? 'result' : section === 'attendance' ? 'attendance' : 'notice';
    const items: SnapshotItem[] = [];
    for (const row of rows) {
      const titleNode = row.querySelector(selector.title);
      const title = titleNode?.textContent?.trim();
      if (!title) continue;
      const date = row.querySelector(selector.date)?.textContent?.trim() ?? 'unknown';
      const href = row.querySelector('a')?.getAttribute('href');
      let itemUrl: string | undefined;
      if (href) {
        try {
          const url = new URL(href, 'https://ucam.uiu.ac.bd/');
          if (url.protocol === 'https:' && url.hostname === 'ucam.uiu.ac.bd') itemUrl = url.toString();
        } catch { itemUrl = undefined; }
      }
      const hash = (await sha256(title)).slice(0, 8);
      const idPrefix = section === 'notices' ? 'notice' : section === 'results' ? 'result' : section === 'materials' ? 'material' : section;
      items.push({ id: `ucam:${idPrefix}:${date}:${hash}`, kind, title, url: itemUrl, meta: { section, date } });
    }
    return items;
  } catch (error) {
    warn(`UCAM ${section} parser failed`, error);
    return [];
  }
}
