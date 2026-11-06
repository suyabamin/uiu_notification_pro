/** @module connection-state @description In-memory portal login state learned from checks and page detectors. */

type Portal = 'ucam' | 'elms';
const loginState: Record<Portal, boolean | null> = { ucam: null, elms: null };

/** Stores the most recent observed authentication state. @param portal Portal name. @param loggedIn Authentication result. @returns Nothing. */
export function setPortalLoginState(portal: Portal, loggedIn: boolean): void {
  loginState[portal] = loggedIn;
}

/** Reads the most recent observed authentication state. @param portal Portal name. @returns State or null if unknown. */
export function getPortalLoginState(portal: Portal): boolean | null {
  return loginState[portal];
}
