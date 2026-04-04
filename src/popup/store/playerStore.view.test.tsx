/** @vitest-environment jsdom */
import { act, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { usePlayerStore } from "./playerStore";

function VolumeReadout() {
  const v = usePlayerStore((s) => s.volumePercent);
  return <span data-testid="vol">{v}</span>;
}

describe("usePlayerStore + React", () => {
  let host: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    usePlayerStore.getState().resetPlayer();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
  });

  it("re-renders when volume changes from outside React", async () => {
    await act(async () => {
      root.render(
        <StrictMode>
          <VolumeReadout />
        </StrictMode>,
      );
    });
    expect(host.querySelector("[data-testid=\"vol\"]")?.textContent).toBe("100");

    await act(async () => {
      usePlayerStore.getState().setVolumePercent(33);
    });
    expect(host.querySelector("[data-testid=\"vol\"]")?.textContent).toBe("33");
  });
});
