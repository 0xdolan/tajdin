import { waitUntilOffscreenReady } from "./offscreen-document";
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
const OFFSCREEN_MESSAGE_RETRIES = 3;

/** When false, keep-alive ticks do not reschedule (avoids races after pause). */
let keepAliveEnabled = false;

async function dispatchToOffscreen<T>(command: TajdinOffscreenCommand): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < OFFSCREEN_MESSAGE_RETRIES; attempt++) {
    await waitUntilOffscreenReady();
    try {
      const res = await chrome.runtime.sendMessage(command);
      if (res === undefined) {
        throw new Error("No response from offscreen audio page");
      }
      return res as T;
    } catch (e) {
      lastError = e;
      if (attempt < OFFSCREEN_MESSAGE_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, 50 * (attempt + 1)));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
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
    case "tajdin/player/set-media-metadata": {
      await dispatchToOffscreen<{ ok: true }>({
        type: "tajdin/offscreen/set-media-metadata",
        title: cmd.title,
        artist: cmd.artist,
      });
      return { type: "tajdin/player/set-media-metadata", data: { ok: true } };
    }
    case "tajdin/player/clear-media-metadata": {
      await dispatchToOffscreen<{ ok: true }>({ type: "tajdin/offscreen/clear-media-metadata" });
      return { type: "tajdin/player/clear-media-metadata", data: { ok: true } };
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
