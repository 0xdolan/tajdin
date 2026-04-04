import { describe, expect, it } from "vitest";
import { z } from "zod";
import { StationSchema } from "./station";
import { parseWithSchema } from "./validate";

describe("parseWithSchema", () => {
  it("returns data on success", () => {
    const r = parseWithSchema(
      StationSchema,
      { stationuuid: "x", name: "N", url: "https://u.test" },
    );
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.name).toBe("N");
  });

  it("returns formatted error on failure", () => {
    const r = parseWithSchema(z.object({ a: z.number() }), { a: "bad" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error).toBeDefined();
      expect(r.formatted.length).toBeGreaterThan(0);
    }
  });
});
