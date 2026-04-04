/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  TAJDIN_EXTENSION_ISSUES_URL,
  TAJDIN_EXTENSION_REPO_URL,
} from "../../shared/constants/links";
import { AboutSection } from "./AboutSection";

describe("AboutSection", () => {
  beforeEach(() => {
    vi.stubGlobal("chrome", {
      runtime: {
        getURL: (p: string) => `chrome-extension://fake/${p}`,
        getManifest: () => ({ version: "9.8.7" }),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows manifest version", () => {
    render(<AboutSection />);
    expect(screen.getByText("9.8.7")).toBeInTheDocument();
  });

  it("links to GitHub repo, issues, and Wikipedia Mem and Zin", () => {
    render(<AboutSection />);
    const gh = screen.getByRole("link", { name: /source on github/i });
    expect(gh).toHaveAttribute("href", TAJDIN_EXTENSION_REPO_URL);
    const issues = screen.getByRole("link", { name: /report an issue/i });
    expect(issues).toHaveAttribute("href", TAJDIN_EXTENSION_ISSUES_URL);
    const wiki = screen.getByRole("link", { name: /mem û zîn/i });
    expect(wiki).toHaveAttribute("href", "https://en.wikipedia.org/wiki/Mem_and_Zin");
  });

  it("uses light-surface link styling when surface is light", () => {
    const { container } = render(<AboutSection surface="light" />);
    const gh = screen.getByRole("link", { name: /source on github/i });
    expect(gh.className).toContain("text-sky-700");
    expect(container.querySelector("h2")?.className).toContain("text-neutral-900");
  });
});
