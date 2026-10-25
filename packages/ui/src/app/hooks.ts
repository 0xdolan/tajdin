import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { AnyStation, PlayerState, Theme } from '@tajdin/core';
import { usePlatform } from './platform';

export { useLibrary, useSettings } from './data';

export function usePlayer() {
  const { player } = usePlatform();
  const state = useSyncExternalStore(
    useCallback((cb: () => void) => player.subscribe(cb), [player]),
    () => player.getState(),
  );
  return { state, send: player.send, playFile: player.playFile };
}

export function isActive(state: PlayerState, station: AnyStation): boolean {
  return state.station?.id === station.id;
}

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

/** Applies the theme to <html> and returns what is actually shown. */
export function useAppliedTheme(theme: Theme): 'light' | 'dark' {
  const systemDark = useSyncExternalStore(
    (cb) => {
      const mq = darkQuery();
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => darkQuery().matches,
  );
  const resolved = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }, [resolved]);
  return resolved;
}

/**
 * State kept for the browser session: it survives closing the popup and is cleared when the
 * browser closes. Reads are async, so `ready` says when the restored value is in.
 */
export function useSessionState<T extends object>(
  key: string,
  initial: T,
): [T, (value: T | ((v: T) => T)) => void, boolean] {
  const { session } = usePlatform();
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  const latest = useRef(value);
  const initialRef = useRef(initial);
  useEffect(() => {
    let alive = true;
    void session.get([key]).then((items) => {
      if (!alive) return;
      const stored = items[key];
      if (stored && typeof stored === 'object') {
        latest.current = { ...initialRef.current, ...(stored as T) };
        setValue(latest.current);
      }
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [key, session]);
  const set = useCallback(
    (next: T | ((v: T) => T)) => {
      const resolved = typeof next === 'function' ? (next as (v: T) => T)(latest.current) : next;
      latest.current = resolved;
      setValue(resolved);
      void session.set({ [key]: resolved });
    },
    [key, session],
  );
  return [value, set, ready];
}

export function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/** True while a CSS media query matches (e.g. `(min-width: 768px)`), kept in sync as it changes. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
