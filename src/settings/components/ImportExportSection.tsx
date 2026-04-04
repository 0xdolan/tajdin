import { useCallback, useEffect, useState } from "react";
import {
  applyBackupMerge,
  applyBackupReplace,
  buildBackupFile,
  buildImportPreview,
  parseBackupJsonText,
  readLocalDataSnapshot,
  serializeBackupFile,
  type ZengBackupFile,
} from "../../shared/import-export/backup-io";

type ImportExportSectionProps = {
  reloadToken: number;
};

export function ImportExportSection({ reloadToken }: ImportExportSectionProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [parsedFile, setParsedFile] = useState<ZengBackupFile | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<ReturnType<typeof buildImportPreview> | null>(null);

  const clearImport = useCallback(() => {
    setParsedFile(null);
    setParseError(null);
    setPreview(null);
    setStatus(null);
  }, []);

  useEffect(() => {
    clearImport();
  }, [reloadToken, clearImport]);

  useEffect(() => {
    let cancelled = false;
    if (!parsedFile) {
      setPreview(null);
      return;
    }
    void readLocalDataSnapshot().then((local) => {
      if (cancelled) return;
      setPreview(buildImportPreview(local, parsedFile.data, importMode));
    });
    return () => {
      cancelled = true;
    };
  }, [parsedFile, importMode]);

  const exportJson = async () => {
    setStatus(null);
    setBusy(true);
    try {
      const snapshot = await readLocalDataSnapshot();
      const file = buildBackupFile(snapshot);
      const text = serializeBackupFile(file);
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const day = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `zeng-backup-${day}.json`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus("Export started — check your downloads.");
    } catch {
      setStatus("Export failed.");
    } finally {
      setBusy(false);
    }
  };

  const onPickFile = (f: File | null) => {
    setParseError(null);
    setParsedFile(null);
    setPreview(null);
    setStatus(null);
    if (!f) return;
    void (async () => {
      try {
        const text = await f.text();
        const r = parseBackupJsonText(text);
        if (!r.ok) {
          setParseError(r.error);
          return;
        }
        setParsedFile(r.file);
      } catch {
        setParseError("Could not read file.");
      }
    })();
  };

  const applyImport = async () => {
    if (!parsedFile) return;
    setBusy(true);
    setStatus(null);
    try {
      const ok =
        importMode === "replace"
          ? await applyBackupReplace(parsedFile.data)
          : await applyBackupMerge(parsedFile.data);
      setStatus(ok ? "Import completed." : "Import failed — storage rejected data.");
      if (ok) clearImport();
    } catch {
      setStatus("Import failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h2 className="text-base font-semibold text-neutral-100">Backup &amp; restore</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Export all local Zeng data (settings, playlists, groups, custom stations, favourites) as JSON. Import
          validates with the same schemas used for storage.
        </p>
      </div>

      <fieldset className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
        <legend className="text-sm font-medium text-neutral-200">Export</legend>
        <p className="text-sm text-neutral-500">
          Download a <code className="rounded bg-neutral-800 px-1 py-0.5 text-xs">.json</code> backup you can keep
          or move to another profile.
        </p>
        <button
          type="button"
          disabled={busy}
          className="rounded-md bg-amber-500 px-3 py-2 text-sm font-medium text-neutral-950 hover:bg-amber-400 disabled:opacity-50"
          onClick={() => void exportJson()}
        >
          Download backup
        </button>
      </fieldset>

      <fieldset className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
        <legend className="text-sm font-medium text-neutral-200">Import</legend>

        <div className="space-y-2 text-sm text-neutral-300" role="radiogroup" aria-label="Import mode">
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="radio"
              name="importMode"
              checked={importMode === "merge"}
              onChange={() => setImportMode("merge")}
              className="mt-1"
            />
            <span>
              <span className="font-medium text-neutral-100">Merge</span>
              <span className="mt-0.5 block text-neutral-500">
                Add new playlists, groups, and stations; same IDs are updated from the file. Favourites are unioned.
                Settings fields from the file override current values.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="radio"
              name="importMode"
              checked={importMode === "replace"}
              onChange={() => setImportMode("replace")}
              className="mt-1"
            />
            <span>
              <span className="font-medium text-neutral-100">Replace</span>
              <span className="mt-0.5 block text-neutral-500">
                Overwrite each category present in the file. Omitted sections are cleared (empty lists) or reset to
                defaults (settings).
              </span>
            </span>
          </label>
        </div>

        <div>
          <label className="block text-sm text-neutral-300">
            Backup file
            <input
              type="file"
              accept="application/json,.json"
              className="mt-1 block w-full text-sm text-neutral-400 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-700 file:px-3 file:py-2 file:text-sm file:text-neutral-100"
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {parseError ? <p className="text-sm text-red-400">{parseError}</p> : null}

        {parsedFile && preview ? (
          <div className="rounded-md border border-neutral-700 bg-neutral-950/60 p-3 text-sm">
            <p className="font-medium text-neutral-200">Summary ({preview.mode})</p>
            <p className="mt-1 text-xs text-neutral-500">Exported {parsedFile.exportedAt}</p>
            <ul className="mt-3 list-inside list-disc space-y-1.5 text-neutral-400">
              <li>
                <span className="text-neutral-300">Settings:</span> {preview.sections.settings.detail}
              </li>
              <li>
                <span className="text-neutral-300">Playlists:</span> {preview.sections.playlists.detail}
              </li>
              <li>
                <span className="text-neutral-300">Groups:</span> {preview.sections.groups.detail}
              </li>
              <li>
                <span className="text-neutral-300">Custom stations:</span> {preview.sections.customStations.detail}
              </li>
              <li>
                <span className="text-neutral-300">Favourites:</span> {preview.sections.favourites.detail}
              </li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                className="rounded-md bg-amber-500 px-3 py-2 text-sm font-medium text-neutral-950 hover:bg-amber-400 disabled:opacity-50"
                onClick={() => void applyImport()}
              >
                Apply import
              </button>
              <button
                type="button"
                disabled={busy}
                className="rounded-md border border-neutral-600 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800 disabled:opacity-50"
                onClick={clearImport}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {status ? <p className="text-sm text-neutral-400">{status}</p> : null}
      </fieldset>
    </div>
  );
}
