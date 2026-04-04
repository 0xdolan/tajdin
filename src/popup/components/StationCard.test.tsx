/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Station } from "../../shared/types/station";
import { useStationStore } from "../store/stationStore";
import { StationCard } from "./StationCard";

const playStationFromList = vi.fn().mockResolvedValue(true);
vi.mock("../browseNavigation", () => ({
  playStationFromList: (...a: unknown[]) => playStationFromList(...a),
}));

vi.mock("../stationLibraryApi", () => ({
  appendStationToPlaylist: vi.fn().mockResolvedValue(true),
}));

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
    useStationStore.setState({
      searchResults: [],
      isSearchLoading: false,
      favouriteIds: [],
    });
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

  it("starts playback when the row is clicked", async () => {
    const user = userEvent.setup();
    render(<StationCard station={sampleStation} playlists={[]} />);
    await user.click(screen.getByTestId("station-card"));
    expect(playStationFromList).toHaveBeenCalledWith(
      expect.objectContaining({ stationuuid: "abc-1", name: "Test Radio" }),
    );
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
