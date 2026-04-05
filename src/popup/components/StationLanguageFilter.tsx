import { BROWSE_LANGUAGE_OPTIONS } from "../../shared/utils/language-mapper";
import { useSurface } from "../SurfaceContext";

type StationLanguageFilterProps = {
  value: string;
  onChange: (apiValue: string) => void;
  /** When true, control is inert (e.g. Browse “Custom only” uses local list only). */
  disabled?: boolean;
};

export function StationLanguageFilter({ value, onChange, disabled = false }: StationLanguageFilterProps) {
  const surface = useSurface();
  const selectClass =
    surface === "light"
      ? "max-w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-800 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 disabled:cursor-not-allowed disabled:opacity-50"
      : "max-w-full rounded-md border border-neutral-600 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-200 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="flex min-w-0 shrink-0 items-center gap-2">
      <label htmlFor="tajdin-browse-language" className="sr-only">
        Filter by language
      </label>
      <select
        id="tajdin-browse-language"
        className={selectClass}
        value={value}
        disabled={disabled}
        aria-disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {BROWSE_LANGUAGE_OPTIONS.map((o) => (
          <option key={o.apiValue || "__all__"} value={o.apiValue}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
