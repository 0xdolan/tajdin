import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_SETTINGS,
  type Settings,
  type Theme,
  parseSettingsWithDefaults,
} from "../../shared/types/settings";
import { STORAGE_KEYS, localSettingsStorage } from "../../shared/storage/instances";

type GeneralSettingsSectionProps = {
  /** Bumps when `chrome.storage.local` changes so this tab can stay in sync with the popup. */
  reloadToken: number;
};

export function GeneralSettingsSection({ reloadToken }: GeneralSettingsSectionProps) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState<string | null>(null);
  const [widthDraft, setWidthDraft] = useState(String(DEFAULT_SETTINGS.popupWidthPx));
  const [heightDraft, setHeightDraft] = useState(String(DEFAULT_SETTINGS.popupHeightPx));

  const reload = useCallback(async () => {
    const s = await localSettingsStorage.getWithDefault(STORAGE_KEYS.settings, DEFAULT_SETTINGS, {
      onInvalidStored: "default",
    });
    setSettings(s);
    setWidthDraft(String(s.popupWidthPx));
    setHeightDraft(String(s.popupHeightPx));
  }, []);

  useEffect(() => {
    void reload();
  }, [reload, reloadToken]);

  const persist = async (patch: Partial<Settings>) => {
    setStatus(null);
    const next = parseSettingsWithDefaults({ ...settings, ...patch });
    const r = await localSettingsStorage.set(STORAGE_KEYS.settings, next);
    if (r.success) {
      setSettings(next);
      setWidthDraft(String(next.popupWidthPx));
      setHeightDraft(String(next.popupHeightPx));
      setStatus("Saved.");
    } else {
      setStatus("Could not save settings.");
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h2 className="text-base font-semibold text-neutral-100">General</h2>
        <p className="mt-1 text-sm text-neutral-500">Theme and default behaviour (stored locally).</p>
      </div>

      <fieldset className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
        <legend className="sr-only">Appearance</legend>
        <label className="block text-sm text-neutral-300">
          Theme
          <select
            className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-2 text-neutral-100"
            value={settings.theme}
            onChange={(e) => void persist({ theme: e.target.value as Theme })}
          >
            <option value="system">System</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </label>
      </fieldset>

      <fieldset className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
        <legend className="sr-only">Popup & playback</legend>
        <label className="block text-sm text-neutral-300">
          Default browse search
          <select
            className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-2 text-neutral-100"
            value={settings.searchMode}
            onChange={(e) =>
              void persist({
                searchMode: e.target.value as Settings["searchMode"],
              })
            }
          >
            <option value="exact">Exact (station name via API)</option>
            <option value="regex">Regex (filter loaded stations)</option>
          </select>
          <span className="mt-1 block text-xs text-neutral-500">
            Matches the popup: off = exact name search; on = regex on the current result set.
          </span>
        </label>

        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input
            type="checkbox"
            className="rounded border-neutral-600 bg-neutral-900"
            checked={settings.playbackAutostart}
            onChange={(e) => void persist({ playbackAutostart: e.target.checked })}
          />
          Start playback immediately when a station is selected
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm text-neutral-300">
            Popup width (px)
            <input
              type="number"
              min={200}
              max={800}
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-2 text-neutral-100"
              value={widthDraft}
              onChange={(e) => setWidthDraft(e.target.value)}
              onBlur={() => {
                const v = Number(widthDraft);
                if (Number.isFinite(v) && v >= 200 && v <= 800) {
                  void persist({ popupWidthPx: Math.round(v) });
                } else {
                  setWidthDraft(String(settings.popupWidthPx));
                }
              }}
            />
          </label>
          <label className="text-sm text-neutral-300">
            Popup height (px)
            <input
              type="number"
              min={300}
              max={900}
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-2 text-neutral-100"
              value={heightDraft}
              onChange={(e) => setHeightDraft(e.target.value)}
              onBlur={() => {
                const v = Number(heightDraft);
                if (Number.isFinite(v) && v >= 300 && v <= 900) {
                  void persist({ popupHeightPx: Math.round(v) });
                } else {
                  setHeightDraft(String(settings.popupHeightPx));
                }
              }}
            />
          </label>
        </div>

        <label className="block text-sm text-neutral-300">
          Preferred bitrate
          <select
            className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-2 text-neutral-100"
            value={settings.preferredBitrateKbps === "auto" ? "auto" : String(settings.preferredBitrateKbps)}
            onChange={(e) => {
              const v = e.target.value;
              void persist({
                preferredBitrateKbps: v === "auto" ? "auto" : Number(v),
              });
            }}
          >
            <option value="auto">Auto</option>
            <option value="64">64 kbps</option>
            <option value="128">128 kbps</option>
            <option value="192">192 kbps</option>
            <option value="256">256 kbps</option>
            <option value="320">320 kbps</option>
          </select>
        </label>
      </fieldset>

      {status ? <p className="text-sm text-neutral-400">{status}</p> : null}
    </div>
  );
}
