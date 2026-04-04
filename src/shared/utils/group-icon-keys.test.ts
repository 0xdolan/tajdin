import { describe, expect, it } from "vitest";
import { DEFAULT_GROUP_ICON_KEY, isValidGroupIconKey } from "./group-icon-keys";

describe("isValidGroupIconKey", () => {
  it("accepts known keys", () => {
    expect(isValidGroupIconKey("folder")).toBe(true);
    expect(isValidGroupIconKey("musical-note")).toBe(true);
    expect(isValidGroupIconKey(DEFAULT_GROUP_ICON_KEY)).toBe(true);
  });

  it("rejects unknown keys", () => {
    expect(isValidGroupIconKey("")).toBe(false);
    expect(isValidGroupIconKey("not-an-icon")).toBe(false);
  });
});
