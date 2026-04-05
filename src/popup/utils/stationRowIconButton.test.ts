import { describe, expect, it } from "vitest";
import { stationRowHeartIconButtonClass, stationRowIconButtonClass } from "./stationRowIconButton";

describe("stationRowIconButton", () => {
  it("shares chrome tokens across default and heart (light)", () => {
    const a = stationRowIconButtonClass("light");
    const h = stationRowHeartIconButtonClass("light", false);
    expect(a).toContain("rounded-md");
    expect(a).toContain("border-neutral-300/80");
    expect(a).toContain("bg-neutral-200/90");
    expect(h).toContain("border-neutral-300/80");
    expect(h).toContain("bg-neutral-200/90");
  });

  it("uses rose when favourite (dark)", () => {
    const h = stationRowHeartIconButtonClass("dark", true);
    expect(h).toContain("text-rose-400");
  });
});
