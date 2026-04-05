/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExtensionBranding } from "./ExtensionBranding";

describe("ExtensionBranding", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders title and tagline", () => {
    vi.stubGlobal("chrome", {
      runtime: { getURL: (path: string) => `chrome-extension://test/${path}` },
    });
    render(<ExtensionBranding titleClassName="text-base" subtitleClassName="text-xs" />);
    expect(screen.getByText("Tajdîn")).toBeInTheDocument();
    expect(screen.getByText("always by your side; Radio Browser.")).toBeInTheDocument();
    const img = document.querySelector("img");
    expect(img?.getAttribute("src")).toContain("logo/tajdin-logo-black.svg");
  });
});
