import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

/**
 * One codebase, two stores:
 * - Chrome (MV3): service worker + offscreen document for audio.
 * - Firefox (MV2): persistent background page that plays audio itself. Firefox's MV3 background
 *   is suspended after ~30 s idle even while audio plays, which would cut the radio off.
 */
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  vite: () => ({ plugins: [tailwindcss()] }),
  zip: {
    artifactTemplate: 'tajdin-{{version}}-{{browser}}.zip',
    sourcesTemplate: 'tajdin-{{version}}-sources.zip',
    sourcesRoot: '../..',
    excludeSources: ['**/node_modules/**', '**/.output/**', '**/.wxt/**', '**/.turbo/**', '**/dist/**', '.claude/**', '.git/**', 'assets/store/screenshots/**'],
  },
  manifest: ({ browser, manifestVersion }) => ({
    name: 'Tajdîn',
    description: 'Internet radio, always by your side: Kurdish stations and 50,000+ more, playing in the background.',
    homepage_url: 'https://0xdolan.github.io/tajdin/',
    permissions: [
      'storage',
      'alarms',
      ...(browser === 'chrome' ? ['offscreen'] : []),
      ...(manifestVersion === 2 ? ['http://*/*', 'https://*/*'] : []),
    ],
    // Streams and station logos can be on any host; directory APIs need CORS-free fetches.
    ...(manifestVersion === 3 ? { host_permissions: ['http://*/*', 'https://*/*'] } : {}),
    content_security_policy:
      manifestVersion === 3
        ? { extension_pages: "script-src 'self'; object-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'none';" }
        : ("script-src 'self'; object-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'none';" as unknown as undefined),
    minimum_chrome_version: browser === 'chrome' ? '116' : undefined,
    browser_specific_settings:
      browser === 'firefox'
        ? {
            gecko: {
              id: 'tajdin@0xdolan.github.io',
              strict_min_version: '128.0',
              data_collection_permissions: { required: ['none'] },
            },
          }
        : undefined,
    icons: { 16: '/icon/16.png', 32: '/icon/32.png', 48: '/icon/48.png', 96: '/icon/96.png', 128: '/icon/128.png' },
    [manifestVersion === 3 ? 'action' : 'browser_action']: {
      default_title: 'Tajdîn',
      default_icon: { 16: '/icon/toolbar-idle-16.png', 32: '/icon/toolbar-idle-32.png' },
    },
    commands: {
      'toggle-playback': {
        description: 'Play / pause',
        suggested_key: { default: 'MediaPlayPause' },
      },
      'next-station': {
        description: 'Next station',
        suggested_key: { default: 'MediaNextTrack' },
      },
      'previous-station': {
        description: 'Previous station',
        suggested_key: { default: 'MediaPrevTrack' },
      },
      'toggle-mute': {
        description: 'Mute / unmute',
        suggested_key: { default: 'Ctrl+Shift+9', mac: 'Command+Shift+9' },
      },
      'random-station': { description: 'Random station from the current list' },
      [manifestVersion === 3 ? '_execute_action' : '_execute_browser_action']: { description: 'Open Tajdîn' },
    },
  }),
});
