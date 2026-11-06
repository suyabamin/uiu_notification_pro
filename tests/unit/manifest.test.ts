import { describe, expect, it } from 'vitest';
import { getManifest } from '../../src/manifest';

describe('getManifest', () => {
  it('returns a Manifest V3 configuration for Chrome', () => {
    const manifest = getManifest('chrome');
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.permissions).toContain('alarms');
    expect(manifest.host_permissions).toEqual([
      'https://ucam.uiu.ac.bd/*',
      'https://elms.uiu.ac.bd/*',
    ]);
    expect(manifest.browser_specific_settings).toBeUndefined();
  });

  it('adds Firefox metadata only for the Firefox build', () => {
    const manifest = getManifest('firefox');
    expect(manifest.browser_specific_settings?.gecko?.id).toBe('uniportal-monitor@uiu.local');
    expect(manifest.background).toEqual({ scripts: ['src/background/index.ts'] });
  });
});
/**
 * @module manifest-test
 * @description Verifies browser-specific manifest fields.
 */
