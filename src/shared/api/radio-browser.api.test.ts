import { afterEach, describe, expect, it, vi } from "vitest";
import {
  RadioBrowserClient,
  RadioBrowserRequestError,
  defaultRadioBrowserClient,
  mapApiStationRow,
} from "./radio-browser.api";

const validRow = {
  stationuuid: "db93a00f-9191-46ab-9e87-ec9b373b3eee",
  name: "Test FM",
  url: "http://stream.example/radio",
  url_resolved: "http://stream.example/radio",
  tags: "",
  country: "Testland",
  votes: 1,
  bitrate: 128,
  lastcheckok: 1,
  hls: 0,
};

describe("mapApiStationRow", () => {
  it("returns null for invalid rows", () => {
    expect(mapApiStationRow({})).toBeNull();
    expect(mapApiStationRow(null)).toBeNull();
  });

  it("returns Station for minimal valid API row", () => {
    const s = mapApiStationRow(validRow);
    expect(s).not.toBeNull();
    expect(s!.name).toBe("Test FM");
    expect(s!.stationuuid).toBe(validRow.stationuuid);
  });
});

describe("RadioBrowserClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses array and drops invalid entries", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [validRow, { broken: true }, { stationuuid: "", name: "x", url: "y" }],
    });
    const client = new RadioBrowserClient({
      bases: ["https://a.test"],
      minIntervalMs: 0,
      fetch: fetchMock as unknown as typeof fetch,
    });
    const stations = await client.searchStations({ limit: 2 });
    expect(stations).toHaveLength(1);
    expect(stations[0]!.name).toBe("Test FM");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://a.test/json/stations/search?limit=2",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
  });

  it("defaults limit to 50 in query string", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    const client = new RadioBrowserClient({
      bases: ["https://a.test"],
      minIntervalMs: 0,
      fetch: fetchMock as unknown as typeof fetch,
    });
    await client.searchStations({});
    expect(fetchMock).toHaveBeenCalledWith(
      "https://a.test/json/stations/search?limit=50",
      expect.anything(),
    );
  });

  it("retries on 503 using next base", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [validRow],
      });
    const client = new RadioBrowserClient({
      bases: ["https://primary.test", "https://fallback.test"],
      minIntervalMs: 0,
      fetch: fetchMock as unknown as typeof fetch,
    });
    const stations = await client.searchStations({ name: "jazz" });
    expect(stations).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]![0]).toContain("https://primary.test");
    expect(fetchMock.mock.calls[1]![0]).toContain("https://fallback.test");
  });

  it("throws when all bases fail", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    const client = new RadioBrowserClient({
      bases: ["https://a.test", "https://b.test"],
      minIntervalMs: 0,
      fetch: fetchMock as unknown as typeof fetch,
    });
    await expect(client.searchStations({})).rejects.toBeInstanceOf(RadioBrowserRequestError);
  });

  it("does not retry non-retryable 4xx", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 400 });
    const client = new RadioBrowserClient({
      bases: ["https://a.test", "https://b.test"],
      minIntervalMs: 0,
      fetch: fetchMock as unknown as typeof fetch,
    });
    await expect(client.searchStations({})).rejects.toMatchObject({ status: 400 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries on network throw", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [validRow],
      });
    const client = new RadioBrowserClient({
      bases: ["https://a.test", "https://b.test"],
      minIntervalMs: 0,
      fetch: fetchMock as unknown as typeof fetch,
    });
    const stations = await client.searchStations({});
    expect(stations).toHaveLength(1);
  });
});

describe("defaultRadioBrowserClient", () => {
  it("is a RadioBrowserClient instance", () => {
    expect(defaultRadioBrowserClient).toBeInstanceOf(RadioBrowserClient);
  });
});
