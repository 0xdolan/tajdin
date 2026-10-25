import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Station } from '@tajdin/core';
import { CollectionDialog, type CollectionDialogState } from './components/collection-dialog';
import { CustomStationDialog } from './components/custom-station-dialog';
import { PlayAnythingDialog } from './components/play-anything-dialog';

interface Dialogs {
  /** Create or rename a playlist or group; `addStation` is added to a newly created one. */
  openCollection: (state: CollectionDialogState) => void;
  /** Add a custom station (optionally pre-filled) or edit an existing one. */
  openCustomStation: (station?: Partial<Station> & { name?: string; streamUrl?: string }) => void;
  openPlayAnything: () => void;
}

const DialogContext = createContext<Dialogs | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [collection, setCollection] = useState<CollectionDialogState | null>(null);
  const [custom, setCustom] = useState<{ station?: Partial<Station> } | null>(null);
  const [playAnything, setPlayAnything] = useState(false);

  const openCollection = useCallback((s: CollectionDialogState) => setCollection(s), []);
  const openCustomStation = useCallback((station?: Partial<Station>) => setCustom({ station }), []);
  const openPlayAnything = useCallback(() => setPlayAnything(true), []);
  const value = useMemo(() => ({ openCollection, openCustomStation, openPlayAnything }), [openCollection, openCustomStation, openPlayAnything]);

  return (
    <DialogContext.Provider value={value}>
      {children}
      <CollectionDialog state={collection} onClose={() => setCollection(null)} />
      <CustomStationDialog
        open={!!custom}
        initial={custom?.station}
        onClose={() => setCustom(null)}
      />
      <PlayAnythingDialog
        open={playAnything}
        onClose={() => setPlayAnything(false)}
        onSave={(station) => {
          setPlayAnything(false);
          setCustom({ station: { name: station.name, streamUrl: station.streamUrl } });
        }}
      />
    </DialogContext.Provider>
  );
}

export function useDialogs(): Dialogs {
  const dialogs = useContext(DialogContext);
  if (!dialogs) throw new Error('Wrap the app in <DialogProvider>');
  return dialogs;
}
