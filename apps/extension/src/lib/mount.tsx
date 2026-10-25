import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell, type Surface } from '@tajdin/ui/app';
import { createExtensionPlatform } from './platform';
import '../styles.css';

export function mount(surface: Surface, app: ReactNode) {
  const root = document.getElementById('root');
  if (!root) throw new Error('Missing #root');
  createRoot(root).render(
    <StrictMode>
      <AppShell platform={createExtensionPlatform(surface)}>{app}</AppShell>
    </StrictMode>,
  );
}
