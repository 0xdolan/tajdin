import type { Surface } from "../../SurfaceContext";

/** Central Tailwind tokens for playlist UI (popup Lists + settings). */
export type PlaylistSurfaceCx = {
  intro: string;
  muted: string;
  labelSm: string;
  sectionTitle: string;
  sectionHeading: string;
  panel: string;
  labelBlock: string;
  textInput: string;
  monoInput: string;
  primaryButton: string;
  dangerButton: string;
  addRowButton: string;
  detailsBorder: string;
  summary: string;
  chevronMuted: string;
  h4: string;
  sepBorderT: string;
  sortRow: string;
  rowTitle: string;
  rowSub: string;
  grip: string;
  playBtn: string;
  removeBtn: string;
  codeMuted: string;
  statusWarn: string;
  pickerRow: string;
  pickerRowCurrent: string;
  pickerName: string;
  pickerMeta: string;
};

export function playlistSurfaceCx(surface: Surface): PlaylistSurfaceCx {
  const L = surface === "light";
  return {
    intro: L ? "text-xs leading-snug text-neutral-600" : "text-xs leading-snug text-neutral-400",
    muted: L ? "text-sm text-neutral-600" : "text-sm text-neutral-500",
    labelSm: L ? "text-xs font-medium text-neutral-700" : "text-xs font-medium text-neutral-300",
    sectionTitle: L ? "text-sm font-semibold text-neutral-800" : "text-sm font-semibold text-neutral-100",
    sectionHeading: L ? "text-xs font-semibold text-neutral-700" : "text-xs font-semibold text-neutral-300",
    panel: L
      ? "rounded-lg border border-neutral-200 bg-white p-3 shadow-sm"
      : "rounded-lg border border-neutral-800 bg-neutral-950/40 p-3",
    labelBlock: L ? "block text-xs text-neutral-600" : "block text-xs text-neutral-400",
    textInput: L
      ? "mt-0.5 w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900"
      : "mt-0.5 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-100",
    monoInput: L
      ? "mt-0.5 w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 font-mono text-sm text-neutral-900"
      : "mt-0.5 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 font-mono text-sm text-neutral-100",
    primaryButton: L
      ? "shrink-0 rounded-md bg-sky-700 px-3 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-40"
      : "shrink-0 rounded-md bg-sky-800 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-40",
    dangerButton: L
      ? "rounded-md border border-red-200 px-2 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
      : "rounded-md border border-red-900/60 px-2 py-1.5 text-xs font-medium text-red-400 hover:bg-red-950/40",
    addRowButton: L
      ? "shrink-0 rounded px-2 py-1 text-xs font-medium text-sky-700 hover:bg-neutral-200"
      : "shrink-0 rounded px-2 py-1 text-xs font-medium text-sky-400 hover:bg-neutral-800",
    detailsBorder: L
      ? "rounded-md border border-neutral-200 bg-white/80"
      : "rounded-md border border-neutral-800/80 bg-neutral-950/30",
    summary: L
      ? "cursor-pointer list-none px-2 py-2 text-sm text-neutral-700 [&::-webkit-details-marker]:hidden"
      : "cursor-pointer list-none px-2 py-2 text-sm text-neutral-300 [&::-webkit-details-marker]:hidden",
    chevronMuted: L ? "text-neutral-400" : "text-neutral-500",
    h4: L ? "mb-1 text-xs font-medium text-neutral-600" : "mb-1 text-xs font-medium text-neutral-400",
    sepBorderT: L ? "border-neutral-200" : "border-neutral-800",
    sortRow: L
      ? "flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-2 py-1.5 shadow-sm"
      : "flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900/60 px-2 py-1.5",
    rowTitle: L ? "truncate text-sm text-neutral-900" : "truncate text-sm text-neutral-100",
    rowSub: L ? "truncate text-xs text-neutral-500" : "truncate text-xs text-neutral-500",
    grip: L
      ? "shrink-0 cursor-grab touch-none rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 active:cursor-grabbing disabled:opacity-30"
      : "shrink-0 cursor-grab touch-none rounded p-1 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300 active:cursor-grabbing disabled:opacity-30",
    playBtn: L
      ? "shrink-0 rounded px-2 py-1 text-xs font-medium text-sky-700 hover:bg-neutral-100 disabled:opacity-40"
      : "shrink-0 rounded px-2 py-1 text-xs font-medium text-sky-400 hover:bg-neutral-800 disabled:opacity-40",
    removeBtn: L
      ? "shrink-0 rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
      : "shrink-0 rounded px-2 py-1 text-xs font-medium text-red-400 hover:bg-neutral-800 disabled:opacity-40",
    codeMuted: L ? "text-neutral-600" : "text-neutral-500",
    statusWarn: L ? "text-xs text-amber-700" : "text-xs text-amber-400",
    pickerRow: L
      ? "flex w-full items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-left transition hover:bg-neutral-50"
      : "flex w-full items-center justify-between gap-2 rounded-lg border border-neutral-800 bg-neutral-900/40 px-3 py-2.5 text-left transition hover:bg-neutral-800/50",
    pickerRowCurrent: L
      ? "border-sky-400 bg-sky-50 ring-2 ring-sky-200/80"
      : "border-sky-600 bg-sky-950/40 ring-2 ring-sky-800/80",
    pickerName: L ? "truncate text-sm font-medium text-neutral-900" : "truncate text-sm font-medium text-neutral-100",
    pickerMeta: L ? "shrink-0 text-xs text-neutral-500" : "shrink-0 text-xs text-neutral-500",
  };
}
