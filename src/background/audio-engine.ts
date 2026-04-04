import { ensureOffscreenDocument } from "./offscreen-document";
import type {
  ZengOffscreenCommand,
  ZengOffscreenGetStateResponse,
  ZengOffscreenLoadResponse,
  ZengOffscreenPlayResponse,
} from "../shared/messages/offscreen";
import {
  isPlayerCommand,
  type ZengPlayerCommand,
  type ZengPlayerCommandResult,
} from "../shared/messages/player";

/** ~20s between ticks (FR-003). Uses chained one-shot alarms so sub-minute delays work on older Chrome. */
export const ZENG_KEEP_ALIVE_ALARM = "zeng-keep-alive";

const KEEP_ALIVE_DELAY_MINUTES = 20 / 60;

/** When false, keep-alive ticks do not reschedule (avoids races after pause). */
let keepAliveEnabled = false;

async function dispatchToOffscreen<T>(command: ZengOffscreenCommand): Promise<T> {
  await ensureOffscreenDocument();
  return chrome.runtime.sendMessage(command) as Promise<T>;
}

function scheduleKeepAliveAlarm(): void {
  chrome.alarms.create(ZENG_KEEP_ALIVE_ALARM, { delayInMinutes: KEEP_ALIVE_DELAY_MINUTES });
}

export function clearKeepAliveAlarm(): void {
  void chrome.alarms.clear(ZENG_KEEP_ALIVE_ALARM);
}

function onKeepAliveAlarm(alarm: chrome.alarms.Alarm): void {
  if (alarm.name !== ZENG_KEEP_ALIVE_ALARM) {
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
  void chrome.alarms.clear(ZENG_KEEP_ALIVE_ALARM);
}

export async function executePlayerCommand(cmd: ZengPlayerCommand): Promise<ZengPlayerCommandResult> {
  switch (cmd.type) {
    case "zeng/player/load": {
      const data = await dispatchToOffscreen<ZengOffscreenLoadResponse>({
        type: "zeng/offscreen/load",
        url: cmd.url,
      });
      return { type: "zeng/player/load", data };
    }
    case "zeng/player/play": {
      const data = await dispatchToOffscreen<ZengOffscreenPlayResponse>({
        type: "zeng/offscreen/play",
      });
      if (data.ok) {
        keepAliveEnabled = true;
        scheduleKeepAliveAlarm();
      }
      return { type: "zeng/player/play", data };
    }
    case "zeng/player/pause": {
      keepAliveEnabled = false;
      clearKeepAliveAlarm();
      await dispatchToOffscreen<{ ok: true }>({ type: "zeng/offscreen/pause" });
      return { type: "zeng/player/pause", data: { ok: true } };
    }
    case "zeng/player/set-volume": {
      await dispatchToOffscreen<{ ok: true }>({
        type: "zeng/offscreen/set-volume",
        volumePercent: cmd.volumePercent,
      });
      return { type: "zeng/player/set-volume", data: { ok: true } };
    }
    case "zeng/player/get-state": {
      const data = await dispatchToOffscreen<ZengOffscreenGetStateResponse>({
        type: "zeng/offscreen/get-state",
      });
      return { type: "zeng/player/get-state", data };
    }
    default: {
      const _never: never = cmd;
      return _never;
    }
  }
}

/**
 * Handle `zeng/player/*` messages. Returns `false` if `message` is not a player command.
 */
export function tryHandlePlayerMessage(
  message: unknown,
  sendResponse: (response: { ok: true; result: ZengPlayerCommandResult } | { ok: false; error: string }) => void,
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
