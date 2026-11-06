/**
 * @module elms-adapter
 * @description Moodle ELMS session-cookie scraper for dashboard activities.
 */

import { browser } from '../../shared/browser';
import { sha256 } from '../../shared/hash';
import type { PortalAdapter, PortalFetchResult } from '../base';
import { registerAdapter } from '../registry';
import { parseElmsActivities } from './parser';

const ELMS_ORIGIN = 'https://elms.uiu.ac.bd';

/** Checks for the Moodle browser session cookie. @returns Whether ELMS has a session. */
export async function hasElmsSession(): Promise<boolean> {
  const cookies = await browser.cookies.getAll({ domain: 'elms.uiu.ac.bd' });
  return cookies.some((cookie) => cookie.name === 'MoodleSession' && cookie.value.length > 0);
}

/** Fetches and parses the ELMS dashboard into monitorable activities. @returns Snapshot or authentication state. */
export async function fetchElmsSnapshot(): Promise<PortalFetchResult> {
  if (!await hasElmsSession()) return { adapterId: 'elms', notAuthenticated: true };
  const response = await fetch(`${ELMS_ORIGIN}/my/`, { credentials: 'include', redirect: 'follow' });
  if (!response.ok) throw new Error(`ELMS dashboard request failed (${response.status}).`);
  const html = await response.text();
  if (isLoginPage(response.url, html)) return { adapterId: 'elms', notAuthenticated: true };
  const items = await parseElmsActivities(html);
  const fetchedAt = Date.now();
  return { adapterId: 'elms', fetchedAt, items, hash: await sha256(JSON.stringify(items)) };
}

function isLoginPage(responseUrl: string, html: string): boolean {
  return new URL(responseUrl, ELMS_ORIGIN).pathname.startsWith('/login/') ||
    /<form[^>]+(?:id=["']login["']|action=["'][^"']*login)/i.test(html) ||
    /<input[^>]+name=["']password["']/i.test(html);
}

export const elmsAdapter: PortalAdapter = { id: 'elms', fetchSnapshot: fetchElmsSnapshot };
registerAdapter(elmsAdapter);
