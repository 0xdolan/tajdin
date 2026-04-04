import { useEffect, useState } from "react";
import { PlaylistsPage } from "../popup/components/PlaylistsPage";
import { CustomStationsTable } from "./components/CustomStationsTable";
import { GeneralSettingsSection } from "./components/GeneralSettingsSection";
import { ImportExportSection } from "./components/ImportExportSection";

type SettingsSectionId = "general" | "stations" | "playlists" | "backup";

const NAV: { id: SettingsSectionId; label: string; description: string }[] = [
  { id: "general", label: "General", description: "Theme, popup size, playback" },
  { id: "stations", label: "Stations", description: "Custom streams (table)" },
  { id: "playlists", label: "Playlists", description: "Create, reorder, delete" },
  { id: "backup", label: "Backup", description: "Export / import JSON" },
];

function isAppLocalStorageKey(key: string): boolean {
  return key.startsWith("tajdin.") || key.startsWith("zeng.");
}

export function App() {
  const [section, setSection] = useState<SettingsSectionId>("general");
  const [storageRev, setStorageRev] = useState(0);

  useEffect(() => {
    const onStorageChanged = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName !== "local") return;
      if (Object.keys(changes).some(isAppLocalStorageKey)) {
        setStorageRev((n) => n + 1);
      }
    };
    chrome.storage.onChanged.addListener(onStorageChanged);
    return () => chrome.storage.onChanged.removeListener(onStorageChanged);
  }, []);

  return (
    <div className="flex min-h-screen bg-neutral-950 text-neutral-100 antialiased">
      <aside className="flex w-56 shrink-0 flex-col border-r border-neutral-800 bg-neutral-950 px-3 py-5">
        <div className="mb-6 px-2">
          <h1 className="text-lg font-semibold tracking-tight text-neutral-50">Zeng</h1>
          <p className="text-xs text-neutral-500">Extension settings</p>
        </div>
        <nav className="flex flex-col gap-0.5" aria-label="Settings sections">
          {NAV.map((item) => {
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={[
                  "rounded-md px-3 py-2 text-left text-sm transition-colors",
                  active
                    ? "bg-neutral-800 font-medium text-neutral-50"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200",
                ].join(" ")}
              >
                <span className="block">{item.label}</span>
                <span className="mt-0.5 block text-xs font-normal text-neutral-500">{item.description}</span>
              </button>
            );
          })}
        </nav>
      </aside>
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-6">
        {section === "general" ? (
          <GeneralSettingsSection reloadToken={storageRev} />
        ) : null}
        {section === "stations" ? <CustomStationsTable reloadToken={storageRev} /> : null}
        {section === "playlists" ? (
          <div className="flex h-[min(70vh,800px)] min-h-[320px] flex-col">
            <h2 className="mb-3 shrink-0 text-base font-semibold text-neutral-100">Playlists</h2>
            <div className="min-h-0 flex-1">
              <PlaylistsPage key={storageRev} />
            </div>
          </div>
        ) : null}
        {section === "backup" ? <ImportExportSection reloadToken={storageRev} /> : null}
      </main>
    </div>
  );
}
