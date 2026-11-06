/**
 * @module adapter-registry
 * @description Registers enabled portal adapters.
 */

import type { PortalAdapter } from './base';

const adapters = new Map<'ucam' | 'elms', PortalAdapter>();

/** Registers or replaces an adapter. @param adapter Portal adapter. @returns Nothing. */
export function registerAdapter(adapter: PortalAdapter): void { adapters.set(adapter.id, adapter); }
/** Returns a registered adapter. @param id Portal identifier. @returns Adapter or undefined. */
export function getAdapter(id: 'ucam' | 'elms'): PortalAdapter | undefined { return adapters.get(id); }
