import { useEffect, useState } from "react";
import { useSurface } from "../SurfaceContext";

const REPO = "https://github.com/0xdolan/tajdin";
const AUTHOR = "https://github.com/0xdolan";

export function AttributionFooter() {
  const surface = useSurface();
  const [version, setVersion] = useState("");

  useEffect(() => {
    try {
      const v = chrome.runtime?.getManifest?.()?.version;
      setVersion(v ?? "");
    } catch {
      setVersion("");
    }
  }, []);

  const bar =
    surface === "light"
      ? "flex shrink-0 flex-wrap items-center justify-center gap-x-2 gap-y-0.5 border-t border-neutral-200 bg-white px-2 py-1.5 text-[11px] text-neutral-600"
      : "flex shrink-0 flex-wrap items-center justify-center gap-x-2 gap-y-0.5 border-t border-neutral-800 bg-neutral-950 px-2 py-1.5 text-[11px] text-neutral-500";

  return (
    <footer className={bar}>
      <span>
        Developed with{" "}
        <span className="text-rose-500" aria-hidden>
          ♥
        </span>{" "}
        by{" "}
        <a href={AUTHOR} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">
          0xdolan
        </a>
      </span>
      <span className="text-neutral-400" aria-hidden>
        ·
      </span>
      <a href={REPO} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">
        Source
      </a>
      {version ? (
        <>
          <span className="text-neutral-400" aria-hidden>
            ·
          </span>
          <span className="tabular-nums text-neutral-500">v{version}</span>
        </>
      ) : null}
    </footer>
  );
}
