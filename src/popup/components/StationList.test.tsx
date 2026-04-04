/** @vitest-environment jsdom */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RadioBrowserClient } from "../../shared/api/radio-browser.api";
import { useStationStore } from "../store/stationStore";
import { BROWSE_PAGE_SIZE, StationList } from "./StationList";

vi.mock("../stationLibraryApi", () => ({
  loadPlaylistsAndGroups: vi.fn().mockResolvedValue({ playlists: [], groups: [] }),
}));

describe("StationList", () => {
  let host: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    useStationStore.setState({
      searchResults: [],
      isSearchLoading: false,
      favouriteIds: [],
    });
    host = document.createElement("div");
    host.style.height = "400px";
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  it("requests the first browse page on mount", async () => {
    const searchStations = vi.fn().mockResolvedValue([]);
    const client = { searchStations } as unknown as RadioBrowserClient;

    await act(async () => {
      root.render(<StationList client={client} />);
    });

    await vi.waitFor(() => expect(searchStations).toHaveBeenCalled());
    expect(searchStations).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: BROWSE_PAGE_SIZE,
        offset: 0,
        order: "clickcount",
        reverse: true,
      }),
    );
  });

  it("passes name to the API when fuzzy mode has a debounced query", async () => {
    const searchStations = vi.fn().mockResolvedValue([]);
    const client = { searchStations } as unknown as RadioBrowserClient;

    await act(async () => {
      root.render(
        <StationList client={client} searchQuery="bbc" searchMode="fuzzy" />,
      );
    });

    await vi.waitFor(() => expect(searchStations).toHaveBeenCalled());
    expect(searchStations).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "bbc",
        offset: 0,
      }),
    );
  });
});
