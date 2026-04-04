import type { UseSearchResult } from "../hooks/useSearch";
import { useSurface } from "../SurfaceContext";

type StationSearchBarProps = Pick<
  UseSearchResult,
  "rawQuery" | "setRawQuery" | "mode" | "setMode" | "regexInvalid"
>;

function FuzzyModeIcon({ active: _active }: { active: boolean }) {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
      />
    </svg>
  );
}

function RegexModeIcon({ active: _active }: { active: boolean }) {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 12h15m-6.75-6.75l3 3m-3-3l-3 3m3 12l3-3m-3 3l-3-3"
      />
    </svg>
  );
}

export function StationSearchBar({
  rawQuery,
  setRawQuery,
  mode,
  setMode,
  regexInvalid,
}: StationSearchBarProps) {
  const surface = useSurface();
  const invalid = mode === "regex" && regexInvalid;

  const shell =
    surface === "light"
      ? "relative flex w-full min-w-0 items-stretch rounded-md border bg-white shadow-sm"
      : "relative flex w-full min-w-0 items-stretch rounded-md border bg-neutral-900 shadow-sm";
  const borderInvalid = invalid ? "border-red-500" : surface === "light" ? "border-neutral-300" : "border-neutral-600";
  const inputCls =
    surface === "light"
      ? `min-w-0 flex-1 rounded-md border-0 bg-transparent py-2 pl-2.5 pr-1 text-sm text-neutral-900 outline-none ring-0 placeholder:text-neutral-500 focus:ring-0 ${
          invalid ? "text-red-900" : ""
        }`
      : `min-w-0 flex-1 rounded-md border-0 bg-transparent py-2 pl-2.5 pr-1 text-sm text-neutral-100 outline-none ring-0 placeholder:text-neutral-500 focus:ring-0 ${
          invalid ? "text-red-300" : ""
        }`;

  const toggleWrap = surface === "light" ? "flex shrink-0 items-center gap-0.5 pr-1" : "flex shrink-0 items-center gap-0.5 pr-1";
  const btnBase =
    "flex h-8 w-8 items-center justify-center rounded-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1";
  const btnIdle =
    surface === "light"
      ? `${btnBase} text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800`
      : `${btnBase} text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100`;
  const btnOn =
    surface === "light"
      ? `${btnBase} bg-amber-100 text-amber-900`
      : `${btnBase} bg-amber-500/20 text-amber-300`;

  return (
    <div className="flex w-full shrink-0 flex-col gap-1">
      <label className="sr-only" htmlFor="zeng-station-search">
        Search stations
      </label>
      <div className={`${shell} ${borderInvalid}`}>
        <input
          id="zeng-station-search"
          type="search"
          autoComplete="off"
          placeholder={
            mode === "fuzzy"
              ? "Search by name, tags, country… (fuzzy)"
              : "Regular expression on results…"
          }
          className={inputCls}
          value={rawQuery}
          onChange={(e) => setRawQuery(e.target.value)}
          aria-invalid={invalid}
          aria-describedby={invalid ? "zeng-search-regex-error" : undefined}
        />
        <div className={toggleWrap} role="group" aria-label="Search mode">
          <button
            type="button"
            className={mode === "fuzzy" ? btnOn : btnIdle}
            aria-pressed={mode === "fuzzy"}
            aria-label="Fuzzy search — typo-tolerant, matches name, tags, country"
            title="Fuzzy: typos & multi-field"
            onClick={() => setMode("fuzzy")}
          >
            <FuzzyModeIcon active={mode === "fuzzy"} />
          </button>
          <button
            type="button"
            className={mode === "regex" ? btnOn : btnIdle}
            aria-pressed={mode === "regex"}
            aria-label="Regular expression search on loaded stations"
            title="Regex: pattern match"
            onClick={() => setMode("regex")}
          >
            <RegexModeIcon active={mode === "regex"} />
          </button>
        </div>
      </div>
      {invalid ? (
        <p id="zeng-search-regex-error" className="text-xs text-red-500" role="alert">
          Invalid regular expression
        </p>
      ) : null}
    </div>
  );
}
