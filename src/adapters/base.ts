/**
 * @module adapter-base
 * @description Common portal adapter contract.
 */

import type { PortalSnapshot } from '../shared/types';

export type PortalFetchResult = PortalSnapshot | { adapterId: 'ucam' | 'elms'; notAuthenticated: true };

export interface PortalAdapter {
  readonly id: 'ucam' | 'elms';
  fetchSnapshot(): Promise<PortalFetchResult>;
}
