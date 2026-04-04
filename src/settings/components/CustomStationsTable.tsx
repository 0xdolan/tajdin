import { useCallback, useEffect, useState } from "react";
import type { Station } from "../../shared/types/station";
import { loadCustomStations, removeCustomStation } from "../../popup/stationLibraryApi";

type CustomStationsTableProps = {
  reloadToken: number;
};

export function CustomStationsTable({ reloadToken }: CustomStationsTableProps) {
  const [rows, setRows] = useState<Station[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    void loadCustomStations().then(setRows);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, reloadToken]);

  if (rows.length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <h2 className="text-base font-semibold text-neutral-100">Custom stations</h2>
        <p className="mt-2 text-sm text-neutral-500">
          No custom stations yet. Add one from the popup Browse tab (“Add station”).
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h2 className="text-base font-semibold text-neutral-100">Custom stations</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Streams you added manually (<code className="text-neutral-400">custom:</code> ids). Removing a row
        only deletes this entry—not Radio Browser metadata.
      </p>
      <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-800">
        <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900/60">
              <th className="px-3 py-2 font-medium text-neutral-300">Name</th>
              <th className="px-3 py-2 font-medium text-neutral-300">Stream URL</th>
              <th className="px-3 py-2 font-medium text-neutral-300">Id</th>
              <th className="px-3 py-2 font-medium text-neutral-300" />
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.stationuuid} className="border-b border-neutral-800/80 last:border-0">
                <td className="max-w-[10rem] truncate px-3 py-2 text-neutral-100">{s.name}</td>
                <td className="max-w-xs truncate px-3 py-2 font-mono text-xs text-neutral-400">
                  {s.url_resolved ?? s.url}
                </td>
                <td className="max-w-[12rem] truncate px-3 py-2 font-mono text-xs text-neutral-500">
                  {s.stationuuid}
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-950/40 disabled:opacity-40"
                    disabled={busyId === s.stationuuid}
                    onClick={() => {
                      setBusyId(s.stationuuid);
                      void removeCustomStation(s.stationuuid).then((ok) => {
                        setBusyId(null);
                        if (ok) refresh();
                      });
                    }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
