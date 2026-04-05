import { defaultRadioBrowserClient } from "../shared/api/radio-browser.api";
import { findNextPlayableInPlaylist, findPreviousPlayableInPlaylist } from "../popup/playlistAdvance";
import {
  loadFavouriteIds,
  resolveFavouriteStationsForLibrary,
  resolveStationForLibrary,
} from "../popup/stationLibraryApi";
import { STORAGE_KEYS, sessionPlayerStorage } from "../shared/storage/instances";
import type { Station } from "../shared/types/station";
import { executePlayerCommand } from "./audio-engine";

const DEFAULT_VOL = 75;

type SessionBlob = {
  stationuuid: string | null;
  isPlaying: boolean;
  volumePercent: number;
  playlistId: string | null;
  playlistStationIndex: number | null;
};

async function readSession(): Promise<SessionBlob> {
  const s = await sessionPlayerStorage.getWithDefault(
    STORAGE_KEYS.sessionPlayer,
    {
      stationuuid: null,
      isPlaying: false,
      volumePercent: DEFAULT_VOL,
      playlistId: null,
      playlistStationIndex: null,
    },
    { onInvalidStored: "default" },
  );
  return {
    stationuuid: s.stationuuid ?? null,
    isPlaying: s.isPlaying ?? false,
    volumePercent:
      typeof s.volumePercent === "number" ? s.volumePercent : DEFAULT_VOL,
    playlistId: s.playlistId ?? null,
    playlistStationIndex:
      typeof s.playlistStationIndex === "number" ? s.playlistStationIndex : null,
  };
}

async function writeSession(patch: Partial<SessionBlob>): Promise<void> {
  const cur = await readSession();
  await sessionPlayerStorage.set(STORAGE_KEYS.sessionPlayer, { ...cur, ...patch });
}

async function loadUrlVolumePlay(url: string, volumePercent: number): Promise<"ok" | "load-failed" | "play-failed"> {
  const loadR = await executePlayerCommand({ type: "tajdin/player/load", url });
  if (loadR.type !== "tajdin/player/load" || !loadR.data.ok) {
    return "load-failed";
  }
  await executePlayerCommand({ type: "tajdin/player/set-volume", volumePercent });
  const playR = await executePlayerCommand({ type: "tajdin/player/play" });
  if (playR.type !== "tajdin/player/play" || !playR.data.ok) {
    return "play-failed";
  }
  return "ok";
}

async function resolvePlayableStation(uuid: string | null): Promise<Station | null> {
  if (!uuid) return null;
  const st = await resolveStationForLibrary(defaultRadioBrowserClient, uuid);
  if (!st) return null;
  const url = (st.url_resolved || st.url || "").trim();
  if (!url) return null;
  return st;
}

async function pushMetadataForStation(st: Station): Promise<void> {
  const title = st.name.slice(0, 200);
  const artist = st.country || st.language || "Tajdîn";
  await executePlayerCommand({
    type: "tajdin/player/set-media-metadata",
    title,
    artist: String(artist).slice(0, 120),
  });
}

export async function sessionTogglePlayPause(): Promise<void> {
  const sess = await readSession();
  const state = await executePlayerCommand({ type: "tajdin/player/get-state" });
  if (state.type !== "tajdin/player/get-state") return;
  const paused = state.data.paused;

  if (!paused) {
    await executePlayerCommand({ type: "tajdin/player/pause" });
    await writeSession({ isPlaying: false });
    return;
  }

  const st = await resolvePlayableStation(sess.stationuuid);
  if (!st) return;
  const url = (st.url_resolved || st.url)!.trim();
  const r = await loadUrlVolumePlay(url, sess.volumePercent);
  if (r === "ok") {
    await writeSession({ isPlaying: true });
    await pushMetadataForStation(st);
  }
}

export async function sessionPauseIfPlaying(): Promise<void> {
  const state = await executePlayerCommand({ type: "tajdin/player/get-state" });
  if (state.type !== "tajdin/player/get-state") return;
  if (state.data.paused) return;
  await executePlayerCommand({ type: "tajdin/player/pause" });
  await writeSession({ isPlaying: false });
}

export async function sessionMediaPlay(): Promise<void> {
  const state = await executePlayerCommand({ type: "tajdin/player/get-state" });
  if (state.type !== "tajdin/player/get-state") return;
  if (!state.data.paused) return;
  const sess = await readSession();
  const st = await resolvePlayableStation(sess.stationuuid);
  if (!st) return;
  const url = (st.url_resolved || st.url)!.trim();
  const r = await loadUrlVolumePlay(url, sess.volumePercent);
  if (r === "ok") {
    await writeSession({ isPlaying: true });
    await pushMetadataForStation(st);
  }
}

export async function sessionToggleMute(): Promise<void> {
  const sess = await readSession();
  const gs = await executePlayerCommand({ type: "tajdin/player/get-state" });
  if (gs.type !== "tajdin/player/get-state") return;
  const actual = gs.data.volumePercent;
  if (actual === 0) {
    await executePlayerCommand({
      type: "tajdin/player/set-volume",
      volumePercent: sess.volumePercent || DEFAULT_VOL,
    });
  } else {
    await executePlayerCommand({ type: "tajdin/player/set-volume", volumePercent: 0 });
  }
}

export async function sessionNextStation(): Promise<void> {
  const sess = await readSession();
  const currentUuid = sess.stationuuid;
  if (!currentUuid) return;

  if (sess.playlistId != null && sess.playlistStationIndex != null) {
    const next = await findNextPlayableInPlaylist(
      defaultRadioBrowserClient,
      sess.playlistId,
      sess.playlistStationIndex,
    );
    if (next) {
      const url = (next.station.url_resolved || next.station.url || "").trim();
      if (!url) return;
      await writeSession({
        stationuuid: next.station.stationuuid,
        playlistId: sess.playlistId,
        playlistStationIndex: next.index,
        isPlaying: true,
      });
      const r = await loadUrlVolumePlay(url, sess.volumePercent);
      if (r === "ok") await pushMetadataForStation(next.station);
      return;
    }
    await writeSession({ playlistId: null, playlistStationIndex: null });
  }


  const favIds = await loadFavouriteIds();
  const favs = await resolveFavouriteStationsForLibrary(defaultRadioBrowserClient, favIds);
  if (favs.length === 0) return;
  const idx = favs.findIndex((s) => s.stationuuid === currentUuid);
  const nextIdx = idx < 0 ? 0 : (idx + 1) % favs.length;
  const next = favs[nextIdx]!;
  const url = (next.url_resolved || next.url || "").trim();
  if (!url) return;
  await writeSession({
    stationuuid: next.stationuuid,
    playlistId: null,
    playlistStationIndex: null,
    isPlaying: true,
  });
  const r = await loadUrlVolumePlay(url, sess.volumePercent);
  if (r === "ok") await pushMetadataForStation(next);
}

export async function sessionPreviousStation(): Promise<void> {
  const sess = await readSession();
  const currentUuid = sess.stationuuid;
  if (!currentUuid) return;

  if (sess.playlistId != null && sess.playlistStationIndex != null) {
    const prev = await findPreviousPlayableInPlaylist(
      defaultRadioBrowserClient,
      sess.playlistId,
      sess.playlistStationIndex,
    );
    if (prev) {
      const url = (prev.station.url_resolved || prev.station.url || "").trim();
      if (!url) return;
      await writeSession({
        stationuuid: prev.station.stationuuid,
        playlistId: sess.playlistId,
        playlistStationIndex: prev.index,
        isPlaying: true,
      });
      const r = await loadUrlVolumePlay(url, sess.volumePercent);
      if (r === "ok") await pushMetadataForStation(prev.station);
      return;
    }
    await writeSession({ playlistId: null, playlistStationIndex: null });
  }

  const favIds = await loadFavouriteIds();
  const favs = await resolveFavouriteStationsForLibrary(defaultRadioBrowserClient, favIds);
  if (favs.length === 0) return;
  const idx = favs.findIndex((s) => s.stationuuid === currentUuid);
  const prevIdx = idx <= 0 ? favs.length - 1 : idx - 1;
  const prev = favs[prevIdx]!;
  const url = (prev.url_resolved || prev.url || "").trim();
  if (!url) return;
  await writeSession({
    stationuuid: prev.stationuuid,
    playlistId: null,
    playlistStationIndex: null,
    isPlaying: true,
  });
  const r = await loadUrlVolumePlay(url, sess.volumePercent);
  if (r === "ok") await pushMetadataForStation(prev);
}

export async function handleMediaSessionAction(action: "play" | "pause" | "next" | "previous"): Promise<void> {
  switch (action) {
    case "play":
      await sessionMediaPlay();
      break;
    case "pause":
      await sessionPauseIfPlaying();
      break;
    case "next":
      await sessionNextStation();
      break;
    case "previous":
      await sessionPreviousStation();
      break;
    default:
      break;
  }
}
