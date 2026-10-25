import { createCatalog, createPlayerHost, type PlayerHost, type PlayerState } from '@tajdin/core';
import { FILE_CHANNEL, type FileChannelMessage } from './messages';

/** Only the position changed: a timeupdate tick from a local file. */
function onlyTimeChanged(a: PlayerState, b: PlayerState): boolean {
  return (
    a.position !== b.position &&
    a.station === b.station &&
    a.status === b.status &&
    a.volume === b.volume &&
    a.muted === b.muted &&
    a.rate === b.rate &&
    a.repeat === b.repeat &&
    a.queue === b.queue &&
    a.index === b.index &&
    a.nowPlaying === b.nowPlaying &&
    a.error === b.error
  );
}

/**
 * Runs the player next to its <audio> element: in Chrome's offscreen document or Firefox's
 * background page. State changes are published (position ticks at most once a second) and
 * local files arrive over a BroadcastChannel.
 */
export function startAudioHost(options: {
  initial: Partial<PlayerState> | null;
  showNowPlaying: boolean;
  publish: (state: PlayerState) => void;
}): PlayerHost {
  let last: PlayerState | null = null;
  let lastTimePublish = 0;
  const host = createPlayerHost({
    catalog: createCatalog(),
    initial: options.initial ?? undefined,
    canReadIcy: true,
    onState: (state) => {
      const now = Date.now();
      if (last && onlyTimeChanged(last, state) && now - lastTimePublish < 1000) {
        last = state;
        return;
      }
      last = state;
      lastTimePublish = now;
      options.publish(state);
    },
  });
  void host.dispatch({ type: 'setNowPlaying', enabled: options.showNowPlaying });

  const channel = new BroadcastChannel(FILE_CHANNEL);
  channel.onmessage = (event: MessageEvent<FileChannelMessage>) => {
    const msg = event.data;
    if (msg?.type !== 'file' || !(msg.file instanceof Blob)) return;
    host.files.add(msg.id, msg.file);
    channel.postMessage({ type: 'file-ack', id: msg.id } satisfies FileChannelMessage);
  };

  options.publish(host.service.getState());
  return host;
}
