import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS, localSettingsStorage } from "../../shared/storage/instances";
import { DEFAULT_SETTINGS, parseSettingsWithDefaults, type Settings } from "../../shared/types/settings";
import { useUiStore } from "../store/uiStore";
import { useSurface } from "../SurfaceContext";

/**
 * One-time tips strip for Browse (Kurdish list), Favourites, and Playlists. Dismiss persists in settings.
 */
export function WelcomeOnboardingBanner() {
  const surface = useSurface();
  const setActiveTab = useUiStore((s) => s.setActiveTab);
  const [visible, setVisible] = useState(false);

  const load = useCallback(async () => {
    const s = await localSettingsStorage.getWithDefault(STORAGE_KEYS.settings, DEFAULT_SETTINGS, {
      onInvalidStored: "default",
    });
    setVisible(!s.welcomePanelDismissed);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onCh = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area !== "local" || !(STORAGE_KEYS.settings in changes)) return;
      void load();
    };
    chrome.storage.onChanged.addListener(onCh);
    return () => chrome.storage.onChanged.removeListener(onCh);
  }, [load]);

  const dismiss = async () => {
    const cur = await localSettingsStorage.getWithDefault(STORAGE_KEYS.settings, DEFAULT_SETTINGS, {
      onInvalidStored: "default",
    });
    const next: Settings = parseSettingsWithDefaults({ ...cur, welcomePanelDismissed: true });
    await localSettingsStorage.set(STORAGE_KEYS.settings, next);
    setVisible(false);
  };

  if (!visible) return null;

  const panel =
    surface === "light"
      ? "border-sky-200/90 bg-sky-50 text-sky-950"
      : "border-sky-500/35 bg-sky-950/35 text-sky-50";

  return (
    <div
      className={`shrink-0 border-b px-3 py-2 text-xs leading-snug ${surface === "light" ? "border-neutral-200" : "border-neutral-800"}`}
      role="region"
      aria-label="Getting started"
    >
      <div className={`rounded-md border px-2.5 py-2 ${panel}`}>
        <p className="mb-2 text-[0.8rem] leading-relaxed">
          <strong className="font-semibold">Welcome.</strong> Use <strong className="font-medium">Browse</strong> to search
          stations — the default language filter includes a curated Kurdish list. Save stations with the heart on{" "}
          <strong className="font-medium">Favourites</strong>, and build ordered lists on{" "}
          <strong className="font-medium">Lists</strong> (the player can skip ahead when a stream fails). Keyboard shortcuts
          and media keys work while the popup is closed; change them under{" "}
          <kbd className="rounded bg-black/10 px-1 font-mono text-[0.65rem] dark:bg-white/15">chrome://extensions/shortcuts</kbd>
          .
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`rounded-md px-2 py-1 text-[0.75rem] font-medium underline-offset-2 hover:underline ${
              surface === "light" ? "text-sky-900" : "text-sky-100"
            }`}
            onClick={() => {
              setActiveTab("about");
              void dismiss();
            }}
          >
            Open About
          </button>
          <button
            type="button"
            className={`rounded-md px-2 py-1 text-[0.75rem] font-medium underline-offset-2 hover:underline ${
              surface === "light" ? "text-sky-900" : "text-sky-100"
            }`}
            onClick={() => dismiss()}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
