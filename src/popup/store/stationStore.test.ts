import { beforeEach, describe, expect, it } from "vitest";
import { useStationStore } from "./stationStore";

describe("useStationStore", () => {
  beforeEach(() => {
    useStationStore.setState({
      searchResults: [],
      isSearchLoading: false,
      favouriteIds: [],
    });
  });

  it("toggleFavourite adds and removes", () => {
    useStationStore.getState().toggleFavourite("a");
    expect(useStationStore.getState().favouriteIds).toEqual(["a"]);
    useStationStore.getState().toggleFavourite("b");
    expect(useStationStore.getState().favouriteIds).toEqual(["a", "b"]);
    useStationStore.getState().toggleFavourite("a");
    expect(useStationStore.getState().favouriteIds).toEqual(["b"]);
  });

  it("clearSearch resets results and loading", () => {
    useStationStore.setState({
      searchResults: [{ stationuuid: "x", name: "N", url: "u" }],
      isSearchLoading: true,
      favouriteIds: [],
    });
    useStationStore.getState().clearSearch();
    expect(useStationStore.getState().searchResults).toEqual([]);
    expect(useStationStore.getState().isSearchLoading).toBe(false);
  });
});
