import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  SettingsPartialSchema,
  SettingsSchema,
  parseSettingsWithDefaults,
} from "./settings";

describe("SettingsSchema", () => {
  it("parses a complete valid object", () => {
    const s = SettingsSchema.parse({
      ...DEFAULT_SETTINGS,
      theme: "dark",
      preferredBitrateKbps: 192,
      playbackAutostart: true,
    });
    expect(s.theme).toBe("dark");
    expect(s.preferredBitrateKbps).toBe(192);
  });

  it("parseSettingsWithDefaults fills missing keys", () => {
    const s = parseSettingsWithDefaults({});
    expect(s).toEqual(DEFAULT_SETTINGS);
  });

  it("parseSettingsWithDefaults overlays partial updates", () => {
    const s = parseSettingsWithDefaults({ theme: "light", popupWidthPx: 420 });
    expect(s.theme).toBe("light");
    expect(s.popupWidthPx).toBe(420);
    expect(s.popupHeightPx).toBe(DEFAULT_SETTINGS.popupHeightPx);
  });

  it("parseSettingsWithDefaults maps legacy fuzzy searchMode to exact", () => {
    const s = parseSettingsWithDefaults({ searchMode: "fuzzy" } as unknown);
    expect(s.searchMode).toBe("exact");
  });

  it("rejects invalid theme", () => {
    expect(() =>
      SettingsSchema.parse({
        ...DEFAULT_SETTINGS,
        theme: "neon",
      }),
    ).toThrow();
  });
});

describe("SettingsPartialSchema", () => {
  it("accepts single-field updates without applying defaults", () => {
    const p = SettingsPartialSchema.parse({ theme: "light" });
    expect(p.theme).toBe("light");
    expect(p.popupWidthPx).toBeUndefined();
  });

  it("accepts empty object", () => {
    expect(SettingsPartialSchema.parse({})).toEqual({});
  });
});
