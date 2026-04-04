import { useCallback, useEffect, useMemo, useState } from "react";
import { StationFavicon } from "../../popup/components/StationArtwork";
import { updateCustomStation } from "../../popup/stationLibraryApi";
import type { Station } from "../../shared/types/station";
import { sanitizeDisplayText, stationArtworkHttpUrl } from "../../shared/utils/sanitize";
import { isValidHttpOrHttpsStreamUrl } from "../../shared/utils/validate-stream-url";

type EditCustomStationModalProps = {
  open: boolean;
  station: Station | null;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
};

export function EditCustomStationModal({ open, station, onOpenChange, onSaved }: EditCustomStationModalProps) {
  const [name, setName] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !station) return;
    setName(station.name);
    setStreamUrl(station.url_resolved || station.url);
    setCoverUrl(station.coverUrl ?? "");
    setError(null);
  }, [open, station?.stationuuid]);

  useEffect(() => {
    if (!open) {
      setError(null);
      setBusy(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const previewUrlLine = useMemo(() => {
    const t = streamUrl.trim();
    if (!t) return "Enter a stream URL…";
    try {
      return new URL(t).host || t.slice(0, 48);
    } catch {
      return t.length > 48 ? `${t.slice(0, 48)}…` : t;
    }
  }, [streamUrl]);

  const submit = useCallback(() => {
    if (!station) return;
    setError(null);
    const n = name.trim();
    const u = streamUrl.trim();
    const c = coverUrl.trim();
    if (!n) {
      setError("Enter a station name.");
      return;
    }
    if (!isValidHttpOrHttpsStreamUrl(u)) {
      setError("Stream URL must start with http:// or https://");
      return;
    }
    if (c && !stationArtworkHttpUrl({ coverUrl: c, favicon: undefined })) {
      setError("Cover image URL must be a valid http:// or https:// link.");
      return;
    }
    setBusy(true);
    void updateCustomStation(station.stationuuid, {
      displayName: n,
      streamUrl: u,
      coverImageUrl: coverUrl,
    }).then((st) => {
      setBusy(false);
      if (st) {
        onSaved?.();
        onOpenChange(false);
      } else {
        setError("Could not save changes. Try again.");
      }
    });
  }, [coverUrl, name, onOpenChange, onSaved, station, streamUrl]);

  if (!open || !station) return null;

  const previewTitle = sanitizeDisplayText(name.trim() || "Station name", { maxLength: 200 });

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tajdin-edit-station-title"
        className="relative z-10 w-full max-w-md rounded-t-xl border border-neutral-700 bg-neutral-950 p-4 shadow-2xl sm:rounded-xl"
      >
        <h2 id="tajdin-edit-station-title" className="mb-3 text-base font-semibold text-neutral-100">
          Edit custom station
        </h2>
        <p className="mb-2 font-mono text-[10px] text-neutral-500">{station.stationuuid}</p>
        <p className="mb-3 text-xs text-neutral-500">
          Stream and cover must use HTTP or HTTPS. Clear the cover field to remove artwork.
        </p>
        <div
          className="mb-4 flex h-[72px] items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900/80 px-2 py-1.5"
          aria-hidden
        >
          <StationFavicon coverUrl={coverUrl.trim() || undefined} favicon={undefined} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-neutral-100" dir="auto">
              {previewTitle}
            </p>
            <p className="truncate text-xs text-neutral-500">Custom stream</p>
            <p className="truncate text-xs text-neutral-600">{previewUrlLine}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <label className="text-xs text-neutral-400">
            Name
            <input
              className="mt-0.5 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-2 text-sm text-neutral-100"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              autoComplete="off"
              disabled={busy}
            />
          </label>
          <label className="text-xs text-neutral-400">
            Stream URL
            <input
              className="mt-0.5 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-2 text-sm text-neutral-100"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="https://…"
              autoComplete="off"
              disabled={busy}
            />
          </label>
          <label className="text-xs text-neutral-400">
            Cover image URL (optional)
            <input
              className="mt-0.5 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-2 text-sm text-neutral-100"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://… or leave empty"
              autoComplete="off"
              disabled={busy}
            />
          </label>
          {error ? (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-md px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md bg-sky-700 px-3 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50"
            disabled={busy}
            onClick={submit}
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
