/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Station } from "../../shared/types/station";
import { useStationStore } from "../store/stationStore";
import { StationCard } from "./StationCard";

vi.mock("../stationLibraryApi", () => ({
  appendStationToPlaylist: vi.fn().mockResolvedValue(true),
  appendStationToGroup: vi.fn().mockResolvedValue(true),
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
    useStationStore.setState({
      searchResults: [],
      isSearchLoading: false,
      favouriteIds: [],
    });
  });

  it("matches snapshot for core layout", () => {
    const { container } = render(
      <StationCard station={sampleStation} playlists={[]} groups={[]} />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("toggles favourite when heart is clicked", async () => {
    const user = userEvent.setup();
    render(<StationCard station={sampleStation} playlists={[]} groups={[]} />);
    const heart = screen.getByTestId("station-favourite-heart");
    await user.click(heart);
    expect(useStationStore.getState().favouriteIds).toContain("abc-1");
    await user.click(heart);
    expect(useStationStore.getState().favouriteIds).not.toContain("abc-1");
  });

  it("opens context menu on right-click", async () => {
    const user = userEvent.setup();
    render(<StationCard station={sampleStation} playlists={[]} groups={[]} />);
    const card = screen.getByTestId("station-card");
    fireEvent.contextMenu(card);
    expect(await screen.findByRole("menu")).toBeInTheDocument();
    expect(screen.getByText("Add to playlist")).toBeInTheDocument();
    expect(screen.getByText("Add to group")).toBeInTheDocument();
    await user.keyboard("{Escape}");
  });
});
