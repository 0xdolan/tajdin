import { useEffect, useState } from "react";
import type { BrowseSearchMode } from "../store/uiStore";
import { useUiStore } from "../store/uiStore";

const DEFAULT_DEBOUNCE_MS = 300;

export type SearchMode = BrowseSearchMode;

export type UseSearchResult = {
  rawQuery: string;
  setRawQuery: (q: string) => void;
  debouncedQuery: string;
  mode: SearchMode;
  setMode: (m: SearchMode) => void;
  regexInvalid: boolean;
};

/**
 * Debounced search query plus exact (API name) vs regex mode; state lives in {@link useUiStore} for session persistence.
 */
export function useSearch(debounceMs: number = DEFAULT_DEBOUNCE_MS): UseSearchResult {
  const rawQuery = useUiStore((s) => s.browseRawQuery);
  const setBrowseRawQuery = useUiStore((s) => s.setBrowseRawQuery);
  const mode = useUiStore((s) => s.browseSearchMode);
  const setBrowseSearchMode = useUiStore((s) => s.setBrowseSearchMode);

  const [debouncedQuery, setDebouncedQuery] = useState(rawQuery);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(rawQuery), debounceMs);
    return () => window.clearTimeout(t);
  }, [rawQuery, debounceMs]);

  const [regexInvalid, setRegexInvalid] = useState(false);

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
    setRawQuery: setBrowseRawQuery,
    debouncedQuery,
    mode,
    setMode: setBrowseSearchMode,
    regexInvalid,
  };
}
