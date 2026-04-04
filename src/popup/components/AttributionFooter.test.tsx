/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  EXTENSION_AUTHOR_GITHUB_URL,
  TAJDIN_EXTENSION_REPO_URL,
} from "../../shared/constants/links";
import { AttributionFooter } from "./AttributionFooter";

describe("AttributionFooter", () => {
  beforeEach(() => {
    vi.stubGlobal("chrome", {
      runtime: {
        getManifest: () => ({ version: "1.0.0" }),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("links maintainer profile and Tajdîn source repo", () => {
    render(<AttributionFooter />);
    expect(screen.getByText(/made by/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^0xdolan$/i })).toHaveAttribute(
      "href",
      EXTENSION_AUTHOR_GITHUB_URL,
    );
    expect(screen.getByRole("link", { name: /^source$/i })).toHaveAttribute(
      "href",
      TAJDIN_EXTENSION_REPO_URL,
    );
  });

  it("shows manifest version when available", () => {
    render(<AttributionFooter />);
    expect(screen.getByText("v1.0.0")).toBeInTheDocument();
  });
});
