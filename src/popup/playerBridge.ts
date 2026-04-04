import type { ZengPlayerCommand, ZengPlayerCommandResult } from "../shared/messages/player";

export type PlayerBridgeSuccess = { ok: true; result: ZengPlayerCommandResult };
export type PlayerBridgeFailure = { ok: false; error: string };
export type PlayerBridgeResponse = PlayerBridgeSuccess | PlayerBridgeFailure;

/**
 * Send a typed playback command to the service worker (forwarded to offscreen audio).
 */
export function sendPlayerCommand(cmd: ZengPlayerCommand): Promise<PlayerBridgeResponse> {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(cmd, (response: unknown) => {
        const last = chrome.runtime.lastError;
        if (last?.message) {
          resolve({ ok: false, error: last.message });
          return;
        }
        if (
          response &&
          typeof response === "object" &&
          "ok" in response &&
          (response as { ok: boolean }).ok === true &&
          "result" in response
        ) {
          resolve({
            ok: true,
            result: (response as { result: ZengPlayerCommandResult }).result,
          });
          return;
        }
        if (
          response &&
          typeof response === "object" &&
          "ok" in response &&
          (response as { ok: boolean }).ok === false &&
          "error" in response
        ) {
          resolve({
            ok: false,
            error: String((response as { error: unknown }).error),
          });
          return;
        }
        resolve({ ok: false, error: "Unexpected response from background" });
      });
    } catch (e) {
      resolve({ ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  });
}
