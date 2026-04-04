import { describe, expect, it } from "vitest";
import { isValidHttpOrHttpsStreamUrl } from "./validate-stream-url";

describe("isValidHttpOrHttpsStreamUrl", () => {
  it("accepts http and https URLs", () => {
    expect(isValidHttpOrHttpsStreamUrl("https://stream.example/radio.mp3")).toBe(true);
    expect(isValidHttpOrHttpsStreamUrl("http://192.168.1.1:8000/live")).toBe(true);
  });

  it("rejects other schemes and junk", () => {
    expect(isValidHttpOrHttpsStreamUrl("ftp://x")).toBe(false);
    expect(isValidHttpOrHttpsStreamUrl("javascript:alert(1)")).toBe(false);
    expect(isValidHttpOrHttpsStreamUrl("not a url")).toBe(false);
    expect(isValidHttpOrHttpsStreamUrl("")).toBe(false);
  });
});
