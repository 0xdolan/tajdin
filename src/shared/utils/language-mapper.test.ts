import { describe, expect, it } from "vitest";
import {
  apiLanguageToDisplayName,
  defaultLanguageCodeToBrowseApiValue,
  languageTagToApiLanguage,
  normalizeLanguageStringToApi,
  TAJDIN_KURDISH_CURATED_LANGUAGE_VALUE,
} from "./language-mapper";

describe("languageTagToApiLanguage", () => {
  it("maps BCP 47 tags with region to ISO 639-1 language", () => {
    expect(languageTagToApiLanguage("es-MX")).toBe("spanish");
    expect(languageTagToApiLanguage("en-GB")).toBe("english");
    expect(languageTagToApiLanguage("pt_BR")).toBe("portuguese");
  });

  it("maps bare ISO 639-1 codes", () => {
    expect(languageTagToApiLanguage("de")).toBe("german");
    expect(languageTagToApiLanguage("FR")).toBe("french");
    expect(languageTagToApiLanguage("ku")).toBe(TAJDIN_KURDISH_CURATED_LANGUAGE_VALUE);
  });

  it("returns null for unknown codes", () => {
    expect(languageTagToApiLanguage("xx-YY")).toBeNull();
    expect(languageTagToApiLanguage("")).toBeNull();
  });
});

describe("normalizeLanguageStringToApi", () => {
  it("normalizes English endonyms and common labels", () => {
    expect(normalizeLanguageStringToApi("Spanish")).toBe("spanish");
    expect(normalizeLanguageStringToApi("  ENGLISH  ")).toBe("english");
    expect(normalizeLanguageStringToApi("Español")).toBe("spanish");
    expect(normalizeLanguageStringToApi("Deutsch")).toBe("german");
  });

  it("handles BCP 47 via tag path", () => {
    expect(normalizeLanguageStringToApi("es-MX")).toBe("spanish");
  });

  it("returns empty for whitespace-only input", () => {
    expect(normalizeLanguageStringToApi("  \t  ")).toBe("");
  });

  it("passes through allowed API tokens", () => {
    expect(normalizeLanguageStringToApi("norwegian")).toBe("norwegian");
  });

  it("maps Kurdish labels to curated browse token", () => {
    expect(normalizeLanguageStringToApi("Kurdish")).toBe(TAJDIN_KURDISH_CURATED_LANGUAGE_VALUE);
    expect(normalizeLanguageStringToApi("kurdi")).toBe(TAJDIN_KURDISH_CURATED_LANGUAGE_VALUE);
  });
});

describe("apiLanguageToDisplayName", () => {
  it("labels known tokens and all-languages", () => {
    expect(apiLanguageToDisplayName("")).toBe("All languages");
    expect(apiLanguageToDisplayName("spanish")).toBe("Spanish");
    expect(apiLanguageToDisplayName("english")).toBe("English");
    expect(apiLanguageToDisplayName(TAJDIN_KURDISH_CURATED_LANGUAGE_VALUE)).toBe("Kurdish");
  });

  it("title-cases unknown tokens", () => {
    expect(apiLanguageToDisplayName("foobar")).toBe("Foobar");
  });
});

describe("defaultLanguageCodeToBrowseApiValue", () => {
  it("defaults ku and undefined to Kurdish curated token", () => {
    expect(defaultLanguageCodeToBrowseApiValue("ku")).toBe(TAJDIN_KURDISH_CURATED_LANGUAGE_VALUE);
    expect(defaultLanguageCodeToBrowseApiValue(undefined)).toBe(TAJDIN_KURDISH_CURATED_LANGUAGE_VALUE);
  });

  it("maps en to english", () => {
    expect(defaultLanguageCodeToBrowseApiValue("en")).toBe("english");
  });

  it("treats explicit empty string as all languages", () => {
    expect(defaultLanguageCodeToBrowseApiValue("")).toBe("");
  });
});
