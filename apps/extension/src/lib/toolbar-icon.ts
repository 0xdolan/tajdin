import { browser } from 'wxt/browser';
import type { PlayerState } from '@tajdin/core';

type Frame = 'idle' | 'paused' | 'play-1' | 'play-2';

const FRAME_MS = 650;
const action = () =>
  browser.action ?? (browser as unknown as { browserAction: typeof browser.action }).browserAction;

function setFrame(frame: Frame) {
  void action().setIcon({
    path: { 16: `/icon/toolbar-${frame}-16.png`, 32: `/icon/toolbar-${frame}-32.png` },
  });
}

/**
 * The Roj toolbar icon tells you what's happening without opening anything: grey when idle,
 * amber when paused, and a pulsing green wave while a station plays.
 */
export class ToolbarIcon {
  private timer: ReturnType<typeof setInterval> | undefined;
  private current: Frame | 'animating' | null = null;
  private title = '';

  update(state: PlayerState, animated: boolean) {
    const { status, station } = state;
    const title = !station
      ? 'Tajdîn'
      : status === 'playing'
        ? `Tajdîn · Playing ${station.name}`
        : status === 'loading'
          ? `Tajdîn · Connecting to ${station.name}`
          : status === 'error'
            ? `Tajdîn · Couldn’t play ${station.name}`
            : `Tajdîn · Paused: ${station.name}`;
    if (title !== this.title) {
      this.title = title;
      void action().setTitle({ title });
    }

    if (status === 'playing' || status === 'loading') {
      if (animated) this.animate();
      else this.show('play-2');
    } else {
      this.show(station && status !== 'error' ? 'paused' : 'idle');
    }
  }

  private show(frame: Frame) {
    this.stop();
    if (this.current === frame) return;
    this.current = frame;
    setFrame(frame);
  }

  private animate() {
    if (this.current === 'animating') return;
    this.stop();
    this.current = 'animating';
    let on = true;
    setFrame('play-2');
    // Each setIcon call also keeps Chrome's service worker awake while playing.
    this.timer = setInterval(() => {
      on = !on;
      setFrame(on ? 'play-2' : 'play-1');
    }, FRAME_MS);
  }

  private stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    if (this.current === 'animating') this.current = null;
  }
}
