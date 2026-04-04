/** @vitest-environment jsdom */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RadioBrowserClient } from "../../shared/api/radio-browser.api";
import { useStationStore } from "../store/stationStore";
import { BROWSE_PAGE_SIZE, StationList } from "./StationList";

const { mockLoadCustom } = vi.hoisted(() => ({
  mockLoadCustom: vi.fn().mockResolvedValue([]),
}));

vi.mock("../stationLibraryApi", () => ({
  loadPlaylistsForLibrary: vi.fn().mockResolvedValue({ playlists: [] }),
  loadCustomStations: mockLoadCustom,
}));

describe("StationList", () => {
  let host: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    mockLoadCustom.mockResolvedValue([]);
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
        order: "random",
        reverse: false,
      }),
    );
  });

  it("passes name to the API when exact mode has a debounced query", async () => {
    const searchStations = vi.fn().mockResolvedValue([]);
    const client = { searchStations } as unknown as RadioBrowserClient;

    await act(async () => {
      root.render(
        <StationList client={client} searchQuery="bbc" searchMode="exact" />,
      );
    });

    await vi.waitFor(() => expect(searchStations).toHaveBeenCalled());
    expect(searchStations).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "bbc",
        offset: 0,
        order: "clickcount",
        reverse: true,
      }),
    );
  });

  it("passes language to the API when languageFilter is set", async () => {
    const searchStations = vi.fn().mockResolvedValue([]);
    const client = { searchStations } as unknown as RadioBrowserClient;

    await act(async () => {
      root.render(
        <StationList client={client} languageFilter="german" />,
      );
    });

    await vi.waitFor(() => expect(searchStations).toHaveBeenCalled());
    expect(searchStations).toHaveBeenCalledWith(
      expect.objectContaining({
        language: "german",
        offset: 0,
        order: "random",
        reverse: false,
      }),
    );
  });

  it("uses ranked browse pages when building a regex corpus", async () => {
    const searchStations = vi.fn().mockResolvedValue([]);
    const client = { searchStations } as unknown as RadioBrowserClient;

    await act(async () => {
      root.render(
        <StationList client={client} searchQuery="news" searchMode="regex" regexInvalid={false} />,
      );
    });

    await vi.waitFor(() => expect(searchStations).toHaveBeenCalled());
    expect(searchStations).toHaveBeenCalledWith(
      expect.objectContaining({
        offset: 0,
        order: "clickcount",
        reverse: true,
      }),
    );
  });

  it("does not refetch when toggling search mode with an empty query", async () => {
    const searchStations = vi.fn().mockResolvedValue([]);
    const client = { searchStations } as unknown as RadioBrowserClient;

    await act(async () => {
      root.render(<StationList client={client} searchMode="exact" />);
    });

    await vi.waitFor(() => expect(searchStations).toHaveBeenCalledTimes(1));

    await act(async () => {
      root.render(<StationList client={client} searchMode="regex" />);
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(searchStations).toHaveBeenCalledTimes(1);
  });

  it("refetches when switching from exact to regex with a non-empty query", async () => {
    const searchStations = vi.fn().mockResolvedValue([]);
    const client = { searchStations } as unknown as RadioBrowserClient;

    await act(async () => {
      root.render(<StationList client={client} searchQuery="bbc" searchMode="exact" />);
    });

    await vi.waitFor(() => expect(searchStations).toHaveBeenCalledTimes(1));

    await act(async () => {
      root.render(<StationList client={client} searchQuery="bbc" searchMode="regex" regexInvalid={false} />);
    });

    await vi.waitFor(() => expect(searchStations).toHaveBeenCalledTimes(2));
  });

  it("merges custom stations into the first page", async () => {
    mockLoadCustom.mockResolvedValue([
      {
        stationuuid: "custom:test-1",
        name: "Custom FM",
        url: "https://c.example/s",
        url_resolved: "https://c.example/s",
      },
    ]);
    const searchStations = vi.fn().mockResolvedValue([]);
    const client = { searchStations } as unknown as RadioBrowserClient;

    await act(async () => {
      root.render(<StationList client={client} />);
    });

    await vi.waitFor(() =>
      expect(useStationStore.getState().searchResults.some((s) => s.stationuuid === "custom:test-1")).toBe(
        true,
      ),
    );
  });
});
