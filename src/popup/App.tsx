import { useEffect } from "react";
import { PlayerDock } from "./components/PlayerDock";
import { TabNav } from "./components/TabNav";
import { TabPanel } from "./components/TabPanel";
import { startPopupStorageSync } from "./store";

export function App() {
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

  return (
    <div className="box-border flex h-[600px] w-[400px] flex-col bg-neutral-950 text-neutral-100 antialiased">
      <TabNav />
      <main className="flex min-h-0 flex-1 flex-col">
        <TabPanel />
      </main>
      <PlayerDock />
    </div>
  );
}
