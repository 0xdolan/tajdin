import { useSurface } from "../SurfaceContext";
import { useUiStore } from "../store/uiStore";

const TABS = [
  { id: "browse" as const, label: "Browse" },
  { id: "favourites" as const, label: "Favourites" },
  { id: "playlists" as const, label: "Playlists" },
  { id: "groups" as const, label: "Groups" },
];

function CogIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export function TabNav() {
  const surface = useSurface();
  const activeTab = useUiStore((s) => s.activeTab);
  const setActiveTab = useUiStore((s) => s.setActiveTab);
  const navBar =
    surface === "light"
      ? "flex h-12 shrink-0 items-stretch border-b border-neutral-200 bg-white px-1"
      : "flex h-12 shrink-0 items-stretch border-b border-neutral-800 bg-neutral-950 px-1";
  const tabIdle =
    surface === "light"
      ? "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
      : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200";
  const tabSel =
    surface === "light"
      ? "bg-neutral-200 text-neutral-900 shadow-sm"
      : "bg-neutral-800 text-neutral-50 shadow-sm";
  const gear =
    surface === "light"
      ? "ml-0.5 flex w-10 shrink-0 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
      : "ml-0.5 flex w-10 shrink-0 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100";

  return (
    <nav className={navBar} aria-label="Main">
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
                  selected ? tabSel : tabIdle,
                ].join(" ")}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className={gear}
        aria-label="Open settings"
        title="Settings"
        onClick={() => chrome.runtime.openOptionsPage()}
      >
        <CogIcon />
      </button>
    </nav>
  );
}
