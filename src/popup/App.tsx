import { useEffect, useState } from "react";
import { STORAGE_KEYS, localSettingsStorage } from "../shared/storage/instances";
import { DEFAULT_SETTINGS, type Settings } from "../shared/types/settings";
import { AttributionFooter } from "./components/AttributionFooter";
import { PlayerDock } from "./components/PlayerDock";
import { PopupHeader } from "./components/PopupHeader";
import { TabNav } from "./components/TabNav";
import { TabPanel } from "./components/TabPanel";
import { SurfaceProvider, type Surface } from "./SurfaceContext";
import { startPopupStorageSync } from "./store";

function resolveSurface(theme: Settings["theme"]): Surface {
  if (theme === "light") return "light";
  if (theme === "dark") return "dark";
  if (typeof globalThis.matchMedia === "function") {
    return globalThis.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "dark";
}

export function App() {
  const [popupSize, setPopupSize] = useState({
    w: DEFAULT_SETTINGS.popupWidthPx,
    h: DEFAULT_SETTINGS.popupHeightPx,
  });
  const [surface, setSurface] = useState<Surface>(() => resolveSurface(DEFAULT_SETTINGS.theme));

  useEffect(() => {
    const ac = new AbortController();
    let dispose: (() => void) | undefined;
    void startPopupStorageSync(ac.signal).then((fn) => {
      if (ac.signal.aborted) {
        fn();
        return;
      }
      dispose = fn;
    });
    return () => {
      ac.abort();
      dispose?.();
    };
  }, []);

  useEffect(() => {
    const apply = async () => {
      const s = await localSettingsStorage.getWithDefault(STORAGE_KEYS.settings, DEFAULT_SETTINGS, {
        onInvalidStored: "default",
      });
      setPopupSize({ w: s.popupWidthPx, h: s.popupHeightPx });
      setSurface(resolveSurface(s.theme));
    };
    void apply();
    const onCh = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area !== "local") return;
      if (STORAGE_KEYS.settings in changes) void apply();
    };
    chrome.storage.onChanged.addListener(onCh);
    const mq = globalThis.matchMedia?.("(prefers-color-scheme: dark)");
    const onMq = () => {
      void localSettingsStorage
        .getWithDefault(STORAGE_KEYS.settings, DEFAULT_SETTINGS, { onInvalidStored: "default" })
        .then((s) => {
          if (s.theme === "system") setSurface(resolveSurface("system"));
        });
    };
    mq?.addEventListener?.("change", onMq);
    return () => {
      chrome.storage.onChanged.removeListener(onCh);
      mq?.removeEventListener?.("change", onMq);
    };
  }, []);

  const rootClass =
    surface === "light"
      ? "box-border flex flex-col bg-neutral-100 text-neutral-900 antialiased"
      : "box-border flex flex-col bg-neutral-950 text-neutral-100 antialiased";

  return (
    <SurfaceProvider value={surface}>
      <div
        className={`${rootClass} h-full min-h-0 overflow-hidden`}
        style={{ width: popupSize.w, height: popupSize.h }}
      >
        <PopupHeader />
        <TabNav />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <TabPanel />
        </main>
        <PlayerDock />
        <AttributionFooter />
      </div>
    </SurfaceProvider>
  );
}
