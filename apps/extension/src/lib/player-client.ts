import { browser } from 'wxt/browser';
import { INITIAL_PLAYER_STATE, KEYS, stationFromFile, uuid, type PlayerClient, type PlayerState } from '@tajdin/core';
import { FILE_CHANNEL, type BackgroundMessage, type FileChannelMessage } from './messages';
import { extensionArea } from './storage';

/** The queue is stored apart from the rest of the state, because it changes far less often. */
export const QUEUE_KEY = 'tajdin.v2.queue';

/**
 * Player for extension pages. Commands go to the background script; state comes back through
 * `storage.session`, so every open page (and the toolbar icon) stays in sync.
 */
export function createExtensionPlayerClient(): PlayerClient {
  const session = extensionArea('session');
  let state: PlayerState = INITIAL_PLAYER_STATE;
  const listeners = new Set<(s: PlayerState) => void>();
  const emit = () => listeners.forEach((l) => l(state));

  void session.get([KEYS.player, QUEUE_KEY]).then((items) => {
    state = {
      ...INITIAL_PLAYER_STATE,
      ...(items[KEYS.player] as Partial<PlayerState> | undefined),
      queue: (items[QUEUE_KEY] as PlayerState['queue'] | undefined) ?? [],
    };
    emit();
  });

  session.onChanged((changes) => {
    let changed = false;
    if (KEYS.player in changes) {
      state = { ...state, ...(changes[KEYS.player]?.newValue as Partial<PlayerState>) };
      changed = true;
    }
    if (QUEUE_KEY in changes) {
      state = { ...state, queue: (changes[QUEUE_KEY]?.newValue as PlayerState['queue']) ?? [] };
      changed = true;
    }
    if (changed) emit();
  });

  const send: PlayerClient['send'] = async (command) => {
    await browser.runtime.sendMessage({ type: 'player:command', command } satisfies BackgroundMessage);
  };

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    send,
    async playFile(file) {
      // The audio host must exist before it can receive the file.
      await browser.runtime.sendMessage({ type: 'player:ensure-host' } satisfies BackgroundMessage);
      const id = uuid();
      const channel = new BroadcastChannel(FILE_CHANNEL);
      try {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('The player didn’t receive the file')), 5000);
          channel.onmessage = (event: MessageEvent<FileChannelMessage>) => {
            if (event.data?.type === 'file-ack' && event.data.id === id) {
              clearTimeout(timeout);
              resolve();
            }
          };
          channel.postMessage({ type: 'file', id, file } satisfies FileChannelMessage);
        });
      } finally {
        channel.close();
      }
      const station = stationFromFile(file, id);
      await send({ type: 'play', station, context: { kind: 'single', label: station.name } });
    },
  };
}
