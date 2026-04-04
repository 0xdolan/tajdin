import { useEffect, useState } from "react";

export type SearchMode = "fuzzy" | "regex";

const DEFAULT_DEBOUNCE_MS = 300;

export type UseSearchResult = {
  rawQuery: string;
  setRawQuery: (q: string) => void;
  debouncedQuery: string;
  mode: SearchMode;
  setMode: (m: SearchMode) => void;
  regexInvalid: boolean;
};

/**
 * Debounced search query (300ms) plus fuzzy/regex mode and regex syntax validity for the UI.
 */
export function useSearch(debounceMs: number = DEFAULT_DEBOUNCE_MS): UseSearchResult {
  const [rawQuery, setRawQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("fuzzy");
  const [regexInvalid, setRegexInvalid] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(rawQuery), debounceMs);
    return () => window.clearTimeout(t);
  }, [rawQuery, debounceMs]);

  useEffect(() => {
    if (mode !== "regex") {
      setRegexInvalid(false);
      return;
    }
    const p = debouncedQuery.trim();
    if (!p) {
      setRegexInvalid(false);
      return;
    }
    try {
      new RegExp(p, "iu");
      setRegexInvalid(false);
    } catch {
      setRegexInvalid(true);
    }
  }, [mode, debouncedQuery]);

  return {
    rawQuery,
    setRawQuery,
    debouncedQuery,
    mode,
    setMode,
    regexInvalid,
  };
}
