import type { PlayerCommand, PlayerState } from '@tajdin/core';

/** Pages → background. */
export type BackgroundMessage =
  | { type: 'player:command'; command: PlayerCommand }
  | { type: 'player:ensure-host' }
  /** Audio host → background: it booted and wants its starting state. */
  | { type: 'host:hello' }
  /** Audio host → background: the player changed. */
  | { type: 'host:state'; state: PlayerState };

/** Background → Chrome offscreen document. */
export type OffscreenMessage = {
  target: 'offscreen';
  type: 'player:command';
  command: PlayerCommand;
};

export interface HostHello {
  state: Partial<PlayerState> | null;
  showNowPlaying: boolean;
}

/** Local files go straight from the page to the audio host; runtime messages can't carry Blobs. */
export const FILE_CHANNEL = 'tajdin-local-files';

export type FileChannelMessage =
  { type: 'file'; id: string; file: File } | { type: 'file-ack'; id: string };
