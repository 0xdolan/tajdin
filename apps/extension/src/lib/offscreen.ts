import { browser } from 'wxt/browser';

const OFFSCREEN_URL = '/offscreen.html';

/**
 * Chrome only: the offscreen document that hosts the <audio> element. Chrome closes a silent
 * offscreen document after ~30 s, so it's (re)created on demand. `markReady` is called when the
 * new document says hello, so commands wait until it can take them.
 */
export function createOffscreenManager() {
  let ready: Promise<void> | null = null;
  let resolveReady: (() => void) | null = null;

  async function exists(): Promise<boolean> {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT' as chrome.runtime.ContextType],
      documentUrls: [browser.runtime.getURL(OFFSCREEN_URL)],
    });
    return contexts.length > 0;
  }

  async function ensure(): Promise<void> {
    if (await exists()) {
      if (ready) await ready;
      return;
    }
    ready = new Promise((resolve) => (resolveReady = resolve));
    await chrome.offscreen
      .createDocument({
        url: OFFSCREEN_URL,
        reasons: ['AUDIO_PLAYBACK' as chrome.offscreen.Reason],
        justification: 'Plays the radio station in the background after the popup closes.',
      })
      .catch((e: Error) => {
        // Two callers racing to create it is fine; anything else is real.
        if (!/single offscreen/i.test(e.message)) throw e;
      });
    await ready;
  }

  return { exists, ensure, markReady: () => resolveReady?.() };
}
