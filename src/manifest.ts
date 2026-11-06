/**
 * @module manifest
 * @description Builds the browser-specific Manifest V3 extension manifest.
 */

import type { ManifestV3Export } from '@crxjs/vite-plugin';

export type SupportedBrowser = 'chrome' | 'firefox' | 'edge' | 'opera';

/**
 * Builds the extension manifest for a supported browser.
 * @param browser Target browser.
 * @returns Manifest V3 configuration.
 */
export function getManifest(browser: SupportedBrowser): ManifestV3Export {
  const manifest: ManifestV3Export = {
    manifest_version: 3,
    name: 'UniPortal Monitor',
    version: '1.0.0',
    description: 'Monitor UIU portals and receive updates.',
    permissions: ['storage', 'alarms', 'notifications', 'cookies', 'scripting'],
    host_permissions: ['https://ucam.uiu.ac.bd/*', 'https://elms.uiu.ac.bd/*'],
    background: { service_worker: 'src/background/index.ts', type: 'module' },
    action: {
      default_popup: 'src/popup/index.html',
      default_icon: {
        '16': 'icons/icon-16.png',
        '32': 'icons/icon-32.png',
        '48': 'icons/icon-48.png',
      },
    },
    options_page: 'src/options/index.html',
    icons: {
      '16': 'icons/icon-16.png',
      '32': 'icons/icon-32.png',
      '48': 'icons/icon-48.png',
      '128': 'icons/icon-128.png',
    },
    content_scripts: [
      {
        matches: ['https://ucam.uiu.ac.bd/*'],
        js: ['src/content/ucam-login-detector.ts'],
      },
    ],
    web_accessible_resources: [
      { resources: ['sounds/notify.wav'], matches: ['<all_urls>'] },
    ],
    content_security_policy: {
      extension_pages:
        "script-src 'self'; object-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'",
    },
  };

  if (browser === 'firefox') {
    manifest.background = { scripts: ['src/background/index.ts'] };
    manifest.browser_specific_settings = {
      gecko: { id: 'uniportal-monitor@uiu.local', strict_min_version: '109.0' },
    };
  }
  else manifest.permissions = [...(manifest.permissions ?? []), 'offscreen'];

  return manifest;
}
