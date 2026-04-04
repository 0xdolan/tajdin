import type { UseSearchResult } from "../hooks/useSearch";

type StationSearchBarProps = Pick<
  UseSearchResult,
  "rawQuery" | "setRawQuery" | "mode" | "setMode" | "regexInvalid"
>;

export function StationSearchBar({
  rawQuery,
  setRawQuery,
  mode,
  setMode,
  regexInvalid,
}: StationSearchBarProps) {
  const invalid = mode === "regex" && regexInvalid;

  return (
    <div className="flex w-full shrink-0 flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor="zeng-station-search">
        Search stations
      </label>
      <input
        id="zeng-station-search"
        type="search"
        autoComplete="off"
        placeholder={mode === "fuzzy" ? "Search by name, tags, country…" : "Regular expression…"}
        className={`min-w-0 flex-1 basis-full rounded-md border bg-neutral-900 px-2.5 py-1.5 text-sm text-neutral-100 outline-none ring-offset-neutral-950 placeholder:text-neutral-500 focus:ring-2 focus:ring-offset-1 sm:basis-auto ${
          invalid
            ? "border-red-500 focus:border-red-400 focus:ring-red-500/40"
            : "border-neutral-600 focus:border-sky-500 focus:ring-sky-500/30"
        }`}
        value={rawQuery}
        onChange={(e) => setRawQuery(e.target.value)}
        aria-invalid={invalid}
        aria-describedby={invalid ? "zeng-search-regex-error" : undefined}
      />
      <div className="flex shrink-0 items-center gap-2">
        <label className="sr-only" htmlFor="zeng-search-mode">
          Search mode
        </label>
        <select
          id="zeng-search-mode"
          className="rounded-md border border-neutral-600 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-200 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
          value={mode}
          onChange={(e) => setMode(e.target.value as "fuzzy" | "regex")}
        >
          <option value="fuzzy">Fuzzy</option>
          <option value="regex">Regex</option>
        </select>
      </div>
      {invalid ? (
        <p id="zeng-search-regex-error" className="basis-full text-xs text-red-400" role="alert">
          Invalid regular expression
        </p>
      ) : null}
    </div>
  );
}
