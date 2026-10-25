import { browser } from 'wxt/browser';
import { createRepository, INITIAL_PLAYER_STATE, KEYS, parseSettings, type PlayerCommand, type PlayerHost, type PlayerState } from '@tajdin/core';
import { startAudioHost } from '../lib/audio-host';
import type { BackgroundMessage, HostHello, OffscreenMessage } from '../lib/messages';
import { QUEUE_KEY } from '../lib/player-client';
import { extensionArea } from '../lib/storage';
import { ToolbarIcon } from '../lib/toolbar-icon';

const COMMANDS: Record<string, PlayerCommand> = {
  'toggle-playback': { type: 'toggle' },
  'next-station': { type: 'next' },
  'previous-station': { type: 'previous' },
  'toggle-mute': { type: 'toggleMute' },
  'random-station': { type: 'random' },
};

const KEEPALIVE = 'tajdin-keepalive';
const OFFSCREEN_URL = '/offscreen.html';

export default defineBackground({
  // Firefox: a persistent page so the <audio> it hosts is never suspended.
  persistent: { firefox: true },
  type: { chrome: 'module' },
  main() {
    const local = extensionArea('local');
    const session = extensionArea('session');
    const repository = createRepository(local);
    const icon = new ToolbarIcon();
    const usesOffscreen = import.meta.env.CHROME || !!(browser as { offscreen?: unknown }).offscreen;
    let animatedIcon = true;
    let lastQueueKey = '';
    let lastState: PlayerState = INITIAL_PLAYER_STATE;

    void repository.migrate();
    void repository.getSettings().then((s) => {
      animatedIcon = s.animatedIcon;
      icon.update(lastState, animatedIcon);
    });

    /** Saves player state for the pages (queue separately, it rarely changes) and updates the icon. */
    async function onHostState(state: PlayerState) {
      lastState = state;
      icon.update(state, animatedIcon);
      const { queue, ...rest } = state;
      const items: Record<string, unknown> = { [KEYS.player]: rest };
      const queueKey = queue.map((s) => s.id).join('|');
      if (queueKey !== lastQueueKey) {
        lastQueueKey = queueKey;
        items[QUEUE_KEY] = queue;
      }
      await session.set(items);
      // While something plays, a periodic alarm wakes Chrome's service worker so shortcuts stay instant.
      if (state.status === 'playing') void browser.alarms.create(KEEPALIVE, { periodInMinutes: 0.5 });
      else void browser.alarms.clear(KEEPALIVE);
    }

    async function restoredState(): Promise<HostHello> {
      const [items, settings] = await Promise.all([session.get([KEYS.player, QUEUE_KEY]), repository.getSettings()]);
      const saved = items[KEYS.player] as Partial<PlayerState> | undefined;
      return {
        state: saved ? { ...saved, queue: (items[QUEUE_KEY] as PlayerState['queue']) ?? [] } : null,
        showNowPlaying: settings.showNowPlaying,
      };
    }

    // ---- Audio host -------------------------------------------------------------------------

    let firefoxHost: PlayerHost | null = null;
    let offscreenReady: Promise<void> | null = null;
    let resolveReady: (() => void) | null = null;

    async function offscreenExists(): Promise<boolean> {
      const contexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT' as chrome.runtime.ContextType],
        documentUrls: [browser.runtime.getURL(OFFSCREEN_URL)],
      });
      return contexts.length > 0;
    }

    /** Chrome closes a silent offscreen document after ~30 s, so it's (re)created on demand. */
    async function ensureHost(): Promise<void> {
      if (!usesOffscreen) {
        if (!firefoxHost) {
          const hello = await restoredState();
          firefoxHost = startAudioHost({ initial: hello.state, showNowPlaying: hello.showNowPlaying, publish: (s) => void onHostState(s) });
        }
        return;
      }
      if (await offscreenExists()) {
        if (offscreenReady) await offscreenReady;
        return;
      }
      offscreenReady = new Promise((resolve) => (resolveReady = resolve));
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
      await offscreenReady;
    }

    async function dispatch(command: PlayerCommand) {
      await ensureHost();
      if (firefoxHost) return firefoxHost.dispatch(command);
      await browser.runtime.sendMessage({ target: 'offscreen', type: 'player:command', command } satisfies OffscreenMessage);
    }

    // ---- Messages, shortcuts, settings ------------------------------------------------------

    browser.runtime.onMessage.addListener((raw, _sender, sendResponse) => {
      const message = raw as BackgroundMessage | OffscreenMessage;
      if ('target' in message) return undefined;
      switch (message.type) {
        case 'player:command':
          dispatch(message.command).then(() => sendResponse({ ok: true }), (e: Error) => sendResponse({ ok: false, error: e.message }));
          return true;
        case 'player:ensure-host':
          ensureHost().then(() => sendResponse({ ok: true }), (e: Error) => sendResponse({ ok: false, error: e.message }));
          return true;
        case 'host:hello':
          void restoredState().then((hello) => {
            sendResponse(hello);
            resolveReady?.();
          });
          return true;
        case 'host:state':
          void onHostState(message.state);
          return undefined;
      }
      return undefined;
    });

    browser.commands.onCommand.addListener((name) => {
      const command = COMMANDS[name];
      if (command) void dispatch(command);
    });

    browser.alarms.onAlarm.addListener(() => {
      /* waking up is the point */
    });

    local.onChanged((changes) => {
      if (!(KEYS.settings in changes)) return;
      const next = parseSettings(changes[KEYS.settings]?.newValue);
      const before = parseSettings(changes[KEYS.settings]?.oldValue);
      animatedIcon = next.animatedIcon;
      icon.update(lastState, animatedIcon);
      if (next.showNowPlaying !== before.showNowPlaying) {
        void (async () => {
          if (firefoxHost || (usesOffscreen && (await offscreenExists()))) await dispatch({ type: 'setNowPlaying', enabled: next.showNowPlaying });
        })();
      }
    });

    // Restore the icon after the service worker was stopped and started again. If Chrome closed
    // the offscreen document meanwhile, nothing is actually playing any more.
    void session.get([KEYS.player]).then(async (items) => {
      const saved = items[KEYS.player] as Partial<PlayerState> | undefined;
      if (!saved) return;
      const alive = !usesOffscreen || (await offscreenExists());
      lastState = { ...INITIAL_PLAYER_STATE, ...saved, ...(alive ? {} : { status: saved.station ? 'paused' : 'idle' }) };
      if (!alive) await session.set({ [KEYS.player]: { ...saved, status: lastState.status } });
      icon.update(lastState, animatedIcon);
    });
  },
});
