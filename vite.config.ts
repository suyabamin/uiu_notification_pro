import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import { getManifest } from './src/manifest';

export default defineConfig(({ mode }) => {
  const browser = mode === 'firefox' ? 'firefox' : 'chrome';
  return {
  plugins: [react(), crx({ manifest: getManifest(browser), browser })],
  build: {
    rollupOptions: {
      input: {
        popup: 'src/popup/index.html',
        options: 'src/options/index.html',
        ...(browser === 'firefox' ? { firefoxSoundPage: 'src/background/firefox-sound.html' } : {}),
      },
    },
  },
  };
});
/**
 * @module vite-config
 * @description Configures extension builds for Chrome and Firefox.
 */
