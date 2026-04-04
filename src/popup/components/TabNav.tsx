import { useUiStore } from "../store/uiStore";

const TABS = [
  { id: "browse" as const, label: "Browse" },
  { id: "favourites" as const, label: "Favourites" },
  { id: "playlists" as const, label: "Playlists" },
  { id: "groups" as const, label: "Groups" },
];

export function TabNav() {
  const activeTab = useUiStore((s) => s.activeTab);
  const setActiveTab = useUiStore((s) => s.setActiveTab);

  return (
    <nav
      className="flex h-12 shrink-0 items-stretch border-b border-neutral-800 bg-neutral-950 px-1"
      aria-label="Main"
    >
      <ul className="flex min-w-0 flex-1 items-stretch gap-0.5" role="tablist">
        {TABS.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <li key={tab.id} className="min-w-0 flex-1" role="presentation">
              <button
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                data-tab={tab.id}
                className={[
                  "h-full w-full rounded-md px-1.5 text-center text-xs font-medium transition-colors",
                  selected
                    ? "bg-neutral-800 text-neutral-50 shadow-sm"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200",
                ].join(" ")}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
