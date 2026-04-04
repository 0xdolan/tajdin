import type { UseSearchResult } from "../hooks/useSearch";
import { useSurface } from "../SurfaceContext";

type StationSearchBarProps = Pick<
  UseSearchResult,
  "rawQuery" | "setRawQuery" | "mode" | "setMode" | "regexInvalid"
>;

function RegexModeIcon() {
  return (
    <span
      className="select-none font-mono text-[13px] font-semibold leading-none tracking-tight"
      aria-hidden
    >
      .*
    </span>
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
  const regexOn = mode === "regex";

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

  const toggleWrap = surface === "light" ? "flex shrink-0 items-center pr-1" : "flex shrink-0 items-center pr-1";
  const btnBase =
    "flex h-8 min-w-[2.25rem] items-center justify-center rounded-md px-1.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1";
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
      <label className="sr-only" htmlFor="tajdin-station-search">
        Search stations
      </label>
      <div className={`${shell} ${borderInvalid}`}>
        <input
          id="tajdin-station-search"
          type="search"
          autoComplete="off"
          placeholder={
            regexOn
              ? "Regular expression on loaded stations…"
              : "Station name (Radio Browser search)…"
          }
          className={inputCls}
          value={rawQuery}
          onChange={(e) => setRawQuery(e.target.value)}
          aria-invalid={invalid}
          aria-describedby={invalid ? "tajdin-search-regex-error" : undefined}
        />
        <div className={toggleWrap}>
          <button
            type="button"
            className={regexOn ? btnOn : btnIdle}
            aria-pressed={regexOn}
            aria-label={
              regexOn
                ? "Regex mode on — click to use exact station name search"
                : "Regex mode off — click to filter loaded stations by pattern"
            }
            title={regexOn ? "Regex: pattern on loaded results (click for exact name search)" : "Exact: API name search (click for regex)"}
            onClick={() => setMode(regexOn ? "exact" : "regex")}
          >
            <RegexModeIcon />
          </button>
        </div>
      </div>
      {invalid ? (
        <p id="tajdin-search-regex-error" className="text-xs text-red-500" role="alert">
          Invalid regular expression
        </p>
      ) : null}
    </div>
  );
}
