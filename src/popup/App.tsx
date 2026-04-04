import { useEffect } from "react";
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
    <div className="box-border flex h-[600px] w-[400px] flex-col bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 px-3 py-2">
        <h1 className="text-base font-semibold tracking-tight">Zeng</h1>
        <p className="text-xs text-neutral-400">Radio browser extension</p>
      </header>
      <main className="flex flex-1 items-center justify-center px-3 text-sm text-neutral-500">
        Browse UI lands in later tasks.
      </main>
    </div>
  );
}
