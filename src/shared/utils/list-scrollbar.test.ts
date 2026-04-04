import { describe, expect, it } from "vitest";
import { listScrollbarClass } from "./list-scrollbar";

describe("listScrollbarClass", () => {
  it("maps surface to globals.css utility class names", () => {
    expect(listScrollbarClass("dark")).toBe("tajdin-scrollbar-dark");
    expect(listScrollbarClass("light")).toBe("tajdin-scrollbar-light");
  });
});
