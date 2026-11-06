/**
 * @module ucam-adapter
 * @description UCAM session-cookie scraping adapter.
 */

import type { PortalAdapter } from '../base';
import { AppError } from '../../shared/errors';
import { sha256 } from '../../shared/hash';
import { getSettings } from '../../background/storage-manager';
import { registerAdapter } from '../registry';
import { hasUcamSession } from './cookies';
import { fetchUcamPage } from './fetcher';
import { parseUcamSection } from './parser';
import { SECTION_CONFIG } from './selectors';

export const ucamAdapter: PortalAdapter = {
  id: 'ucam',
  async fetchSnapshot() {
    if (!await hasUcamSession()) throw new AppError('NOT_AUTHENTICATED', 'Log in to UCAM to monitor updates.');
    const settings = await getSettings();
    const items = [];
    // TODO: Add randomized section jitter using a worker-safe scheduling mechanism.
    for (const section of settings.ucam.sections) {
      const html = await fetchUcamPage(SECTION_CONFIG[section].path);
      items.push(...await parseUcamSection(html, section));
    }
    const fetchedAt = Date.now();
    return { adapterId: 'ucam' as const, fetchedAt, items, hash: await sha256(JSON.stringify(items)) };
  },
};

registerAdapter(ucamAdapter);
