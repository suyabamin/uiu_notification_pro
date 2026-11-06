/**
 * @module ucam-fetcher
 * @description Fetches authenticated UCAM pages with host restrictions and login detection.
 */

import { AppError } from '../../shared/errors';
import { PORTAL_BASES } from '../../shared/constants';
import { warn } from '../../shared/logger';

/** Retrieves one UCAM page using the current browser session. @param path Relative UCAM path. @returns HTML response text. */
export async function fetchUcamPage(path: string): Promise<string> {
  const url = new URL(path, `${PORTAL_BASES.ucam}/`);
  if (url.protocol !== 'https:' || url.hostname !== 'ucam.uiu.ac.bd') throw new AppError('UNSAFE_HOST', 'UCAM request host is not allowed.');
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, { credentials: 'include', signal: AbortSignal.timeout(15_000) });
      if (response.status >= 500 && attempt < 2) continue;
      if (!response.ok) throw new AppError(`HTTP_${response.status}`, `UCAM returned HTTP ${response.status}.`);
      const html = await response.text();
      if (html.includes('id="ctl00_ContentPlaceHolder1_txtUserName"')) throw new AppError('NOT_AUTHENTICATED', 'Log in to UCAM to monitor updates.');
      return html;
    } catch (error) {
      if (error instanceof AppError && error.code !== 'HTTP_500' && error.code !== 'HTTP_502' && error.code !== 'HTTP_503') throw error;
      if (attempt === 2) throw new AppError('UCAM_UNAVAILABLE', 'UCAM could not be reached.');
      warn('Retrying a transient UCAM request failure');
    }
  }
  throw new AppError('UCAM_UNAVAILABLE', 'UCAM could not be reached.');
}
