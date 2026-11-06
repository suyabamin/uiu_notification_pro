/**
 * @module ucam-cookies
 * @description Reads UCAM session-cookie presence without exposing values.
 */

import { browser } from '../../shared/browser';

/** Checks whether the browser has a UCAM cookie. @returns True when at least one cookie exists. */
export async function hasUcamSession(): Promise<boolean> {
  const cookies = await browser.cookies.getAll({ domain: 'ucam.uiu.ac.bd' });
  return cookies.length > 0;
}
