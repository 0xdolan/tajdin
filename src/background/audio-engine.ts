import { ensureOffscreenDocument } from "./offscreen-document";
import type {
  TajdinOffscreenCommand,
  TajdinOffscreenGetStateResponse,
  TajdinOffscreenLoadResponse,
  TajdinOffscreenPlayResponse,
} from "../shared/messages/offscreen";
import {
  isPlayerCommand,
  type TajdinPlayerCommand,
  type TajdinPlayerCommandResult,
} from "../shared/messages/player";

/** ~20s between ticks (FR-003). Uses chained one-shot alarms so sub-minute delays work on older Chrome. */
export const TAJDIN_KEEP_ALIVE_ALARM = "tajdin-keep-alive";

const KEEP_ALIVE_DELAY_MINUTES = 20 / 60;

/** When false, keep-alive ticks do not reschedule (avoids races after pause). */
let keepAliveEnabled = false;

async function dispatchToOffscreen<T>(command: TajdinOffscreenCommand): Promise<T> {
  await ensureOffscreenDocument();
  return chrome.runtime.sendMessage(command) as Promise<T>;
}

function scheduleKeepAliveAlarm(): void {
  chrome.alarms.create(TAJDIN_KEEP_ALIVE_ALARM, { delayInMinutes: KEEP_ALIVE_DELAY_MINUTES });
}

export function clearKeepAliveAlarm(): void {
  void chrome.alarms.clear(TAJDIN_KEEP_ALIVE_ALARM);
}

function onKeepAliveAlarm(alarm: chrome.alarms.Alarm): void {
  if (alarm.name !== TAJDIN_KEEP_ALIVE_ALARM) {
    return;
  }
  if (!keepAliveEnabled) {
    return;
  }
  scheduleKeepAliveAlarm();
}

/**
 * Register alarm listener (call once from service worker startup).
 * The alarm is only scheduled after a successful {@link executePlayerCommand} play.
 */
export function registerKeepAliveAlarmListener(): void {
  chrome.alarms.onAlarm.addListener(onKeepAliveAlarm);
}

/** Test helper: clears keep-alive intent and alarm state between Vitest cases. */
export function resetAudioEngineStateForTests(): void {
  keepAliveEnabled = false;
  void chrome.alarms.clear(TAJDIN_KEEP_ALIVE_ALARM);
}

export async function executePlayerCommand(cmd: TajdinPlayerCommand): Promise<TajdinPlayerCommandResult> {
  switch (cmd.type) {
    case "tajdin/player/load": {
      const data = await dispatchToOffscreen<TajdinOffscreenLoadResponse>({
        type: "tajdin/offscreen/load",
        url: cmd.url,
      });
      return { type: "tajdin/player/load", data };
    }
    case "tajdin/player/play": {
      const data = await dispatchToOffscreen<TajdinOffscreenPlayResponse>({
        type: "tajdin/offscreen/play",
      });
      if (data.ok) {
        keepAliveEnabled = true;
        scheduleKeepAliveAlarm();
      }
      return { type: "tajdin/player/play", data };
    }
    case "tajdin/player/pause": {
      keepAliveEnabled = false;
      clearKeepAliveAlarm();
      await dispatchToOffscreen<{ ok: true }>({ type: "tajdin/offscreen/pause" });
      return { type: "tajdin/player/pause", data: { ok: true } };
    }
    case "tajdin/player/set-volume": {
      await dispatchToOffscreen<{ ok: true }>({
        type: "tajdin/offscreen/set-volume",
        volumePercent: cmd.volumePercent,
      });
      return { type: "tajdin/player/set-volume", data: { ok: true } };
    }
    case "tajdin/player/get-state": {
      const data = await dispatchToOffscreen<TajdinOffscreenGetStateResponse>({
        type: "tajdin/offscreen/get-state",
      });
      return { type: "tajdin/player/get-state", data };
    }
    default: {
      const _never: never = cmd;
      return _never;
    }
  }
}

/**
 * Handle `tajdin/player/*` messages. Returns `false` if `message` is not a player command.
 */
export function tryHandlePlayerMessage(
  message: unknown,
  sendResponse: (response: { ok: true; result: TajdinPlayerCommandResult } | { ok: false; error: string }) => void,
): boolean {
  if (!isPlayerCommand(message)) {
    return false;
  }
  void executePlayerCommand(message).then(
    (result) => sendResponse({ ok: true, result }),
    (e: unknown) =>
      sendResponse({
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      }),
  );
  return true;
}
