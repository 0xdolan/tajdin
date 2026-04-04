/** @vitest-environment jsdom */
import { act, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useUiStore } from "../store/uiStore";
import { TabNav } from "./TabNav";

describe("TabNav", () => {
  let host: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    useUiStore.setState({ activeTab: "browse" });
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  it("switches active tab in the store when a tab is clicked", async () => {
    await act(async () => {
      root.render(
        <StrictMode>
          <TabNav />
        </StrictMode>,
      );
    });

    const fav = host.querySelector<HTMLButtonElement>('[data-tab="favourites"]');
    expect(fav).toBeTruthy();

    await act(async () => {
      fav!.click();
    });

    expect(useUiStore.getState().activeTab).toBe("favourites");
  });

  it("switches to About tab when About is clicked", async () => {
    await act(async () => {
      root.render(
        <StrictMode>
          <TabNav />
        </StrictMode>,
      );
    });

    const about = host.querySelector<HTMLButtonElement>('[data-tab="about"]');
    expect(about).toBeTruthy();

    await act(async () => {
      about!.click();
    });

    expect(useUiStore.getState().activeTab).toBe("about");
  });
});
