/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Station } from "../../shared/types/station";
import { useStationStore } from "../store/stationStore";
import { StationCard } from "./StationCard";

const playStationFromList = vi.fn().mockResolvedValue(true);
vi.mock("../browseNavigation", () => ({
  playStationFromList: (...a: unknown[]) => playStationFromList(...a),
}));

const loadPlaylistsForLibrary = vi.fn().mockResolvedValue({ playlists: [] });

const appendStationToPlaylist = vi.fn().mockResolvedValue(true);

vi.mock("../stationLibraryApi", () => ({
  appendStationToPlaylist: (...a: unknown[]) => appendStationToPlaylist(...a),
  loadPlaylistsForLibrary: (...a: unknown[]) => loadPlaylistsForLibrary(...a),
}));

const TEST_PLAYLIST_ID = "550e8400-e29b-41d4-a716-446655440000";

const sampleStation: Station = {
  stationuuid: "abc-1",
  name: "Test Radio",
  url: "http://stream.example/radio",
  url_resolved: "http://stream.example/radio",
  favicon: "",
  country: "Testland",
  countrycode: "TL",
  language: "English",
  languagecodes: "en",
  bitrate: 128,
};

describe("StationCard", () => {
  beforeEach(() => {
    playStationFromList.mockClear();
    appendStationToPlaylist.mockClear();
    loadPlaylistsForLibrary.mockClear();
    loadPlaylistsForLibrary.mockResolvedValue({ playlists: [] });
    useStationStore.setState({
      searchResults: [],
      isSearchLoading: false,
      favouriteIds: [],
    });
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("matches snapshot for core layout", () => {
    const { container } = render(
      <StationCard station={sampleStation} playlists={[]} />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("strips simple HTML from displayed station name", () => {
    const st = { ...sampleStation, name: "A<script>x</script>B" };
    render(<StationCard station={st} playlists={[]} />);
    expect(screen.getByText("AB")).toBeInTheDocument();
  });

  it("appends to playlist when appendToPlaylistOnActivate is set", async () => {
    const user = userEvent.setup();
    render(
      <StationCard
        station={sampleStation}
        playlists={[]}
        appendToPlaylistOnActivate={{ playlistId: TEST_PLAYLIST_ID }}
      />,
    );
    await user.click(screen.getByTestId("station-card"));
    expect(appendStationToPlaylist).toHaveBeenCalledWith("abc-1", TEST_PLAYLIST_ID);
    expect(playStationFromList).not.toHaveBeenCalled();
  });

  it("starts playback when the row is clicked", async () => {
    const user = userEvent.setup();
    render(<StationCard station={sampleStation} playlists={[]} />);
    await user.click(screen.getByTestId("station-card"));
    expect(playStationFromList).toHaveBeenCalledWith(
      expect.objectContaining({ stationuuid: "abc-1", name: "Test Radio" }),
    );
  });

  it("blurs a pointer-focused control when the pointer leaves the row (fine pointer)", async () => {
    const user = userEvent.setup();
    render(<StationCard station={sampleStation} playlists={[]} />);
    const card = screen.getByTestId("station-card");
    const heart = screen.getByTestId("station-favourite-heart");
    await user.click(heart);
    const blurSpy = vi.spyOn(heart, "blur");
    fireEvent.mouseLeave(card);
    expect(blurSpy).toHaveBeenCalledTimes(1);
    blurSpy.mockRestore();
  });

  it("add-to-playlist control does not start playback", async () => {
    const user = userEvent.setup();
    render(<StationCard station={sampleStation} playlists={[]} />);
    await user.click(screen.getByTestId("station-add-to-playlist"));
    expect(playStationFromList).not.toHaveBeenCalled();
  });

  it("copy stream does not start playback", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    try {
      render(<StationCard station={sampleStation} playlists={[]} />);
      await user.click(screen.getByTestId("station-copy-stream"));
      expect(playStationFromList).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("toggles favourite when heart is clicked", async () => {
    const user = userEvent.setup();
    render(<StationCard station={sampleStation} playlists={[]} />);
    const heart = screen.getByTestId("station-favourite-heart");
    await user.click(heart);
    expect(useStationStore.getState().favouriteIds).toContain("abc-1");
    await user.click(heart);
    expect(useStationStore.getState().favouriteIds).not.toContain("abc-1");
  });

  it("opens context menu on right-click", async () => {
    const user = userEvent.setup();
    render(<StationCard station={sampleStation} playlists={[]} />);
    const card = screen.getByTestId("station-card");
    fireEvent.contextMenu(card);
    expect(await screen.findByRole("menu")).toBeInTheDocument();
    expect(screen.getByText("Add to playlist")).toBeInTheDocument();
    await user.keyboard("{Escape}");
  });
});
