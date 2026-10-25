import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell, DesktopApp, SettingsApp } from '@tajdin/ui/app';
import { createWebPlatform } from './platform';
import './styles.css';

const route = (): 'settings' | 'desktop' =>
  location.hash.startsWith('#settings') ? 'settings' : 'desktop';

function App() {
  const [page, setPage] = useState(route);
  useEffect(() => {
    const onHash = () => setPage(route());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  // One platform (and one player) for the whole visit, so switching pages never stops the music.
  const base = useMemo(() => createWebPlatform('desktop', __APP_VERSION__), []);
  const platform = useMemo(() => ({ ...base, surface: page }), [base, page]);
  return (
    <AppShell platform={platform}>
      {page === 'settings' ? <SettingsApp hashPrefix="settings/" /> : <DesktopApp />}
    </AppShell>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
