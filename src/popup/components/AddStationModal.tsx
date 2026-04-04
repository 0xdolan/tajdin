import { useCallback, useEffect, useMemo, useState } from "react";
import { sanitizeDisplayText, stationArtworkHttpUrl } from "../../shared/utils/sanitize";
import { isValidHttpOrHttpsStreamUrl } from "../../shared/utils/validate-stream-url";
import { addCustomStation } from "../stationLibraryApi";
import { StationFavicon } from "./StationArtwork";

type AddStationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded?: () => void;
};

export function AddStationModal({ open, onOpenChange, onAdded }: AddStationModalProps) {
  const [name, setName] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const resetForm = useCallback(() => {
    setName("");
    setStreamUrl("");
    setCoverUrl("");
    setError(null);
  }, []);

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

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

  if (!open) return null;

  const previewTitle = sanitizeDisplayText(name.trim() || "Station name", { maxLength: 200 });

  const submit = () => {
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
    void addCustomStation(n, u, c || undefined).then((st) => {
      setBusy(false);
      if (st) {
        onAdded?.();
        onOpenChange(false);
      } else {
        setError("Could not save the station. Try again.");
      }
    });
  };

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
        aria-labelledby="tajdin-add-station-title"
        className="relative z-10 w-full max-w-md rounded-t-xl border border-neutral-700 bg-neutral-950 p-4 shadow-2xl sm:rounded-xl"
      >
        <h2 id="tajdin-add-station-title" className="mb-3 text-base font-semibold text-neutral-100">
          Add custom station
        </h2>
        <p className="mb-3 text-xs text-neutral-500">
          Stream URL must use HTTP or HTTPS. Optional cover is an image URL (HTTP/HTTPS) shown in lists and
          the player when stopped. The station is stored on this device and appears in Browse search with a{" "}
          <code className="text-neutral-400">custom:</code> id.
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
              placeholder="https://… (JPEG/PNG/WebP …)"
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
