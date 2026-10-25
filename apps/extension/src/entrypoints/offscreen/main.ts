import { browser } from 'wxt/browser';
import type { PlayerHost } from '@tajdin/core';
import { startAudioHost } from '../../lib/audio-host';
import type { BackgroundMessage, HostHello, OffscreenMessage } from '../../lib/messages';

/**
 * Chrome only. Offscreen documents can use just `runtime` messaging, so the background script
 * owns storage and the icon; this page owns the <audio> element and the player.
 */
const { promise: hostReady, resolve: resolveHost } = Promise.withResolvers<PlayerHost>();

// Listen before saying hello, so a command sent right after start-up is never missed.
browser.runtime.onMessage.addListener((raw, _sender, sendResponse) => {
  const message = raw as OffscreenMessage;
  if (message?.target !== 'offscreen') return undefined;
  hostReady
    .then((host) => host.dispatch(message.command))
    .then(
      () => sendResponse({ ok: true }),
      () => sendResponse({ ok: false }),
    );
  return true;
});

void (async () => {
  const hello = (await browser.runtime.sendMessage({ type: 'host:hello' } satisfies BackgroundMessage)) as HostHello;
  resolveHost(
    startAudioHost({
      initial: hello.state,
      showNowPlaying: hello.showNowPlaying,
      publish: (state) =>
        void browser.runtime.sendMessage({ type: 'host:state', state } satisfies BackgroundMessage).catch(() => undefined),
    }),
  );
})();
