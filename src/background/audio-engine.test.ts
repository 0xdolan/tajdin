import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  executePlayerCommand,
  registerKeepAliveAlarmListener,
  resetAudioEngineStateForTests,
  tryHandlePlayerMessage,
  TAJDIN_KEEP_ALIVE_ALARM,
} from "./audio-engine";

vi.mock("./offscreen-document", () => ({
  ensureOffscreenDocument: vi.fn().mockResolvedValue(undefined),
}));

describe("audio-engine", () => {
  const create = vi.fn();
  const clear = vi.fn();
  let alarmListener: ((a: chrome.alarms.Alarm) => void) | undefined;

  beforeEach(() => {
    create.mockReset();
    clear.mockReset();
    alarmListener = undefined;
    vi.stubGlobal("chrome", {
      alarms: {
        create,
        clear,
        onAlarm: {
          addListener(cb: (a: chrome.alarms.Alarm) => void) {
            alarmListener = cb;
          },
        },
      },
      runtime: {
        sendMessage: vi.fn(),
      },
    });
    resetAudioEngineStateForTests();
    registerKeepAliveAlarmListener();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("schedules keep-alive after successful play", async () => {
    vi.mocked(chrome.runtime.sendMessage).mockResolvedValueOnce({ ok: true });
    await executePlayerCommand({ type: "tajdin/player/play" });
    expect(create).toHaveBeenCalledWith(TAJDIN_KEEP_ALIVE_ALARM, { delayInMinutes: 20 / 60 });
  });

  it("does not schedule keep-alive when play fails", async () => {
    vi.mocked(chrome.runtime.sendMessage).mockResolvedValueOnce({
      ok: false,
      error: "blocked",
    });
    await executePlayerCommand({ type: "tajdin/player/play" });
    expect(create).not.toHaveBeenCalled();
  });

  it("clears keep-alive on pause", async () => {
    vi.mocked(chrome.runtime.sendMessage).mockResolvedValueOnce({ ok: true });
    await executePlayerCommand({ type: "tajdin/player/play" });
    vi.mocked(chrome.runtime.sendMessage).mockResolvedValueOnce({ ok: true });
    await executePlayerCommand({ type: "tajdin/player/pause" });
    expect(clear).toHaveBeenCalledWith(TAJDIN_KEEP_ALIVE_ALARM);
  });

  it("reschedules from alarm tick only while playback keep-alive is armed", async () => {
    vi.mocked(chrome.runtime.sendMessage).mockResolvedValue({ ok: true });
    await executePlayerCommand({ type: "tajdin/player/play" });
    create.mockClear();
    expect(alarmListener).toBeDefined();
    alarmListener!({ name: TAJDIN_KEEP_ALIVE_ALARM, scheduledTime: Date.now() });
    expect(create).toHaveBeenCalledTimes(1);
    await executePlayerCommand({ type: "tajdin/player/pause" });
    create.mockClear();
    alarmListener!({ name: TAJDIN_KEEP_ALIVE_ALARM, scheduledTime: Date.now() });
    expect(create).not.toHaveBeenCalled();
  });

  it("tryHandlePlayerMessage returns false for unrelated payloads", () => {
    const sendResponse = vi.fn();
    expect(tryHandlePlayerMessage({ type: "other" }, sendResponse)).toBe(false);
    expect(sendResponse).not.toHaveBeenCalled();
  });

  it("tryHandlePlayerMessage resolves load via offscreen", async () => {
    vi.mocked(chrome.runtime.sendMessage).mockResolvedValueOnce({ ok: true });
    const sendResponse = vi.fn();
    expect(
      tryHandlePlayerMessage({ type: "tajdin/player/load", url: "https://stream.example/a" }, sendResponse),
    ).toBe(true);
    await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());
    expect(sendResponse).toHaveBeenCalledWith({
      ok: true,
      result: { type: "tajdin/player/load", data: { ok: true } },
    });
  });
});
