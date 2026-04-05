/**
 * Normalize language tags and free-text labels to Radio Browser `language` search tokens
 * (English names, typically lowercase in API usage).
 */

/**
 * Browse filter value for the bundled Kurdish station list (not a Radio Browser `language` token).
 * {@link StationList} loads {@link KURDISH_CURATED_STATIONS} when this is selected.
 */
export const TAJDIN_KURDISH_CURATED_LANGUAGE_VALUE = "__tajdin_kurdish__" as const;

/** ISO 639-1 (primary subtag of BCP 47) → Radio Browser language token. */
export const ISO_639_1_TO_API_LANGUAGE: Readonly<Record<string, string>> = {
  ar: "arabic",
  zh: "chinese",
  nl: "dutch",
  en: "english",
  fr: "french",
  de: "german",
  el: "greek",
  he: "hebrew",
  hi: "hindi",
  hu: "hungarian",
  id: "indonesian",
  it: "italian",
  ja: "japanese",
  ko: "korean",
  no: "norwegian",
  nb: "norwegian",
  nn: "norwegian",
  fa: "persian",
  pl: "polish",
  pt: "portuguese",
  ro: "romanian",
  ru: "russian",
  es: "spanish",
  sv: "swedish",
  th: "thai",
  tr: "turkish",
  uk: "ukrainian",
  vi: "vietnamese",
  ku: TAJDIN_KURDISH_CURATED_LANGUAGE_VALUE,
  cs: "czech",
  da: "danish",
  fi: "finnish",
  hr: "croatian",
  sk: "slovak",
};

const API_LANGUAGE_SYNONYMS: Readonly<Record<string, string>> = {
  arabic: "arabic",
  chinese: "chinese",
  mandarin: "chinese",
  cantonese: "chinese",
  dutch: "dutch",
  english: "english",
  french: "french",
  francais: "french",
  german: "german",
  deutsch: "german",
  greek: "greek",
  hebrew: "hebrew",
  hindi: "hindi",
  hungarian: "hungarian",
  indonesian: "indonesian",
  italian: "italian",
  italiano: "italian",
  japanese: "japanese",
  korean: "korean",
  norwegian: "norwegian",
  bokmal: "norwegian",
  nynorsk: "norwegian",
  persian: "persian",
  farsi: "persian",
  polish: "polish",
  polski: "polish",
  portuguese: "portuguese",
  romanian: "romanian",
  russian: "russian",
  espanol: "spanish",
  spanish: "spanish",
  castilian: "spanish",
  swedish: "swedish",
  thai: "thai",
  turkish: "turkish",
  ukrainian: "ukrainian",
  vietnamese: "vietnamese",
  czech: "czech",
  cestina: "czech",
  danish: "danish",
  finnish: "finnish",
  croatian: "croatian",
  hrvatski: "croatian",
  slovak: "slovak",
  kurdish: TAJDIN_KURDISH_CURATED_LANGUAGE_VALUE,
  kurdi: TAJDIN_KURDISH_CURATED_LANGUAGE_VALUE,
};

function normalizeSynonymKey(s: string): string {
  return s.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

/** Curated browse filter options (value sent as Radio Browser `language`). */
export const BROWSE_LANGUAGE_OPTIONS: ReadonlyArray<{ apiValue: string; label: string }> = [
  { apiValue: "", label: "All languages" },
  { apiValue: "arabic", label: "Arabic" },
  { apiValue: "chinese", label: "Chinese" },
  { apiValue: "croatian", label: "Croatian" },
  { apiValue: "czech", label: "Czech" },
  { apiValue: "danish", label: "Danish" },
  { apiValue: "dutch", label: "Dutch" },
  { apiValue: "english", label: "English" },
  { apiValue: "finnish", label: "Finnish" },
  { apiValue: "french", label: "French" },
  { apiValue: "german", label: "German" },
  { apiValue: "greek", label: "Greek" },
  { apiValue: "hebrew", label: "Hebrew" },
  { apiValue: "hindi", label: "Hindi" },
  { apiValue: "hungarian", label: "Hungarian" },
  { apiValue: "indonesian", label: "Indonesian" },
  { apiValue: "italian", label: "Italian" },
  { apiValue: "japanese", label: "Japanese" },
  { apiValue: "korean", label: "Korean" },
  { apiValue: TAJDIN_KURDISH_CURATED_LANGUAGE_VALUE, label: "Kurdish" },
  { apiValue: "norwegian", label: "Norwegian" },
  { apiValue: "persian", label: "Persian" },
  { apiValue: "polish", label: "Polish" },
  { apiValue: "portuguese", label: "Portuguese" },
  { apiValue: "romanian", label: "Romanian" },
  { apiValue: "russian", label: "Russian" },
  { apiValue: "slovak", label: "Slovak" },
  { apiValue: "spanish", label: "Spanish" },
  { apiValue: "swedish", label: "Swedish" },
  { apiValue: "thai", label: "Thai" },
  { apiValue: "turkish", label: "Turkish" },
  { apiValue: "ukrainian", label: "Ukrainian" },
  { apiValue: "vietnamese", label: "Vietnamese" },
];

const ALLOWED_API_VALUES = new Set(
  BROWSE_LANGUAGE_OPTIONS.map((o) => o.apiValue).filter(Boolean),
);

/**
 * Map a BCP 47-style tag (e.g. `es-MX`, `en_GB`) to a Radio Browser language token, or `null` if unknown.
 */
export function languageTagToApiLanguage(tag: string): string | null {
  const t = tag.trim().toLowerCase();
  if (!t) return null;
  const primary = (t.split(/[-_]/)[0] ?? t).replace(/[^a-z]/g, "");
  if (primary.length >= 2) {
    const code2 = primary.slice(0, 2);
    const mapped = ISO_639_1_TO_API_LANGUAGE[code2];
    if (mapped) return mapped;
  }
  return null;
}

/**
 * Normalize free-text language strings (UI labels, API `language` fields) to a Radio Browser token.
 * Unknown strings are lowercased and trimmed; only values in {@link BROWSE_LANGUAGE_OPTIONS} should be sent as filters.
 */
export function normalizeLanguageStringToApi(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const fromTag = languageTagToApiLanguage(trimmed);
  if (fromTag) return fromTag;

  const key = normalizeSynonymKey(trimmed);
  const fromSyn = API_LANGUAGE_SYNONYMS[key];
  if (fromSyn) return fromSyn;

  const collapsed = key.replace(/\s+/g, " ");
  if (ALLOWED_API_VALUES.has(collapsed)) return collapsed;

  return collapsed;
}

/** Title-case label for a known API token (for tooltips / secondary UI). */
export function apiLanguageToDisplayName(apiToken: string): string {
  if (!apiToken) return "All languages";
  const opt = BROWSE_LANGUAGE_OPTIONS.find((o) => o.apiValue === apiToken);
  return opt?.label ?? apiToken.charAt(0).toUpperCase() + apiToken.slice(1);
}

/**
 * Map settings `defaultLanguageCode` (ISO-style) to browse `browseLanguageApiValue` (Radio Browser token or
 * {@link TAJDIN_KURDISH_CURATED_LANGUAGE_VALUE}).
 */
export function defaultLanguageCodeToBrowseApiValue(code: string | undefined): string {
  if (code !== undefined && code.trim() === "") return "";
  const effective = (code ?? "ku").trim().toLowerCase();
  if (effective === "all" || effective === "any") return "";
  const fromTag = languageTagToApiLanguage(effective);
  if (fromTag) return fromTag;
  return normalizeLanguageStringToApi(effective);
}
