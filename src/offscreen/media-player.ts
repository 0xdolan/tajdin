/** Wait until the element can accept {@link HTMLMediaElement.play} for live streams. */
export function assignAudioSource(player: HTMLMediaElement, url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutMs = 12_000;
    let settled = false;
    const finishResolve = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };
    const finishReject = (err: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };
    const timeout = window.setTimeout(() => {
      if (player.readyState >= HTMLMediaElement.HAVE_METADATA) {
        finishResolve();
        return;
      }
      finishReject(new Error("Stream load timed out"));
    }, timeoutMs);

    const onReady = () => finishResolve();
    const onError = () => finishReject(new Error("Stream failed to load"));
    const cleanup = () => {
      clearTimeout(timeout);
      player.removeEventListener("canplay", onReady);
      player.removeEventListener("loadedmetadata", onReady);
      player.removeEventListener("error", onError);
    };

    player.addEventListener("canplay", onReady, { once: true });
    player.addEventListener("loadedmetadata", onReady, { once: true });
    player.addEventListener("error", onError, { once: true });
    try {
      player.src = url;
      player.load();
    } catch (e) {
      finishReject(e instanceof Error ? e : new Error(String(e)));
    }
  });
}

export async function playAudioWithRetry(player: HTMLMediaElement, attempts = 3): Promise<void> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      await player.play();
      return;
    } catch (e) {
      last = e;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 80 * (i + 1)));
      }
    }
  }
  throw last instanceof Error ? last : new Error(String(last));
}
