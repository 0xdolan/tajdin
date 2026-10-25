import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_SETTINGS, EMPTY_LIBRARY, type Library, type Settings } from '@tajdin/core';
import { usePlatform } from './platform';

interface AppData {
  settings: Settings;
  library: Library;
  ready: boolean;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  updateLibrary: (update: (l: Library) => Library) => Promise<Library>;
}

const DataContext = createContext<AppData | null>(null);

/** Loads settings and library once per page and keeps them in sync with every other open page. */
export function AppDataProvider({ children }: { children: ReactNode }) {
  const { repository } = usePlatform();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [library, setLibrary] = useState<Library>(EMPTY_LIBRARY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      await repository.migrate();
      const [s, l] = await Promise.all([repository.getSettings(), repository.getLibrary()]);
      if (!alive) return;
      setSettings(s);
      setLibrary(l);
      setReady(true);
    })();
    const offSettings = repository.onSettings(setSettings);
    const offLibrary = repository.onLibrary(setLibrary);
    return () => {
      alive = false;
      offSettings();
      offLibrary();
    };
  }, [repository]);

  const updateSettings = useCallback(
    async (patch: Partial<Settings>) => {
      setSettings((s) => ({ ...s, ...patch }));
      setSettings(await repository.updateSettings(patch));
    },
    [repository],
  );

  const updateLibrary = useCallback(
    async (fn: (l: Library) => Library) => {
      const next = await repository.updateLibrary(fn);
      setLibrary(next);
      return next;
    },
    [repository],
  );

  const value = useMemo(
    () => ({ settings, library, ready, updateSettings, updateLibrary }),
    [settings, library, ready, updateSettings, updateLibrary],
  );
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

function useData(): AppData {
  const data = useContext(DataContext);
  if (!data) throw new Error('Wrap the app in <AppDataProvider>');
  return data;
}

export function useSettings(): [Settings, (patch: Partial<Settings>) => Promise<void>, boolean] {
  const { settings, updateSettings, ready } = useData();
  return [settings, updateSettings, ready];
}

export function useLibrary(): [
  Library,
  (update: (l: Library) => Library) => Promise<Library>,
  boolean,
] {
  const { library, updateLibrary, ready } = useData();
  return [library, updateLibrary, ready];
}
