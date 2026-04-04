import { describe, expect, it } from "vitest";
import { sanitizeDisplayText, sanitizeHttpOrHttpsUrl, stationArtworkHttpUrl } from "./sanitize";

describe("sanitizeDisplayText", () => {
  it("strips script tags and leaves plain text", () => {
    expect(sanitizeDisplayText(`A<script>alert(1)</script>B`)).toBe("AB");
  });

  it("removes control characters", () => {
    expect(sanitizeDisplayText("a\x00b")).toBe("ab");
  });

  it("trims and enforces max length", () => {
    expect(sanitizeDisplayText("  hi  ")).toBe("hi");
    expect(sanitizeDisplayText("abcdef", { maxLength: 3 })).toBe("abc…");
  });

  it("allows angle brackets that are not tag-like", () => {
    expect(sanitizeDisplayText("3 < 4")).toBe("3 < 4");
  });
});

describe("sanitizeHttpOrHttpsUrl", () => {
  it("accepts http and https", () => {
    expect(sanitizeHttpOrHttpsUrl("https://example.com/x")).toBe("https://example.com/x");
    expect(sanitizeHttpOrHttpsUrl("http://example.com/")).toBe("http://example.com/");
  });

  it("rejects javascript and data URLs", () => {
    expect(sanitizeHttpOrHttpsUrl("javascript:alert(1)")).toBeUndefined();
    expect(sanitizeHttpOrHttpsUrl("data:text/html,<svg/onload=alert(1)>")).toBeUndefined();
  });

  it("returns undefined for empty or invalid", () => {
    expect(sanitizeHttpOrHttpsUrl("")).toBeUndefined();
    expect(sanitizeHttpOrHttpsUrl("   ")).toBeUndefined();
    expect(sanitizeHttpOrHttpsUrl("not a url")).toBeUndefined();
    expect(sanitizeHttpOrHttpsUrl(null)).toBeUndefined();
  });
});

describe("stationArtworkHttpUrl", () => {
  it("prefers coverUrl over favicon when both are valid", () => {
    expect(
      stationArtworkHttpUrl({
        coverUrl: "https://covers.example/a.png",
        favicon: "https://icons.example/f.ico",
      }),
    ).toBe("https://covers.example/a.png");
  });

  it("falls back to favicon when cover is missing or invalid", () => {
    expect(stationArtworkHttpUrl({ coverUrl: "javascript:evil", favicon: "https://x.test/i.png" })).toBe(
      "https://x.test/i.png",
    );
    expect(stationArtworkHttpUrl({ favicon: "https://x.test/i.png" })).toBe("https://x.test/i.png");
  });
});
