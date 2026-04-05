import {
  STORAGE_KEYS,
  localFavouriteIdsStorage,
  localSettingsStorage,
  sessionPlayerStorage,
  sessionUiStorage,
} from "../../shared/storage/instances";
import { DEFAULT_SETTINGS } from "../../shared/types/settings";
import { defaultLanguageCodeToBrowseApiValue } from "../../shared/utils/language-mapper";
import { ensurePlayerStationResolved } from "../ensurePlayerStationResolved";
import { DEFAULT_PLAYER_VOLUME_PERCENT, usePlayerStore } from "./playerStore";
import { useStationStore } from "./stationStore";
import { useUiStore, type BrowseSearchMode } from "./uiStore";

const defaultSessionPlayer = {
  stationuuid: null as string | null,
  isPlaying: false,
  volumePercent: DEFAULT_PLAYER_VOLUME_PERCENT,
  playlistId: null as string | null,
  playlistStationIndex: null as number | null,
};

function pickPersistedPlayer(state: ReturnType<typeof usePlayerStore.getState>) {
  return {
    stationuuid: state.stationuuid,
    isPlaying: state.isPlaying,
    volumePercent: state.volumePercent,
    playlistId: state.playlistContext?.playlistId ?? null,
    playlistStationIndex: state.playlistContext?.stationIndex ?? null,
  };
}

function pickPersistedUi(state: ReturnType<typeof useUiStore.getState>) {
  return {
    activeTab: state.activeTab,
    browseQuery: state.browseRawQuery,
    browseSearchMode: state.browseSearchMode,
    browseLanguageApiValue: state.browseLanguageApiValue,
    browseCustomStationsOnly: state.browseCustomStationsOnly,
  };
}

function mapSettingsSearchToPopup(m: (typeof DEFAULT_SETTINGS)["searchMode"]): BrowseSearchMode {
  if (m === "regex") return "regex";
  return "exact";
}

export async function hydratePopupStoresFromChrome(): Promise<void> {
  const playerBlob = await sessionPlayerStorage.getWithDefault(
    STORAGE_KEYS.sessionPlayer,
    defaultSessionPlayer,
    { onInvalidStored: "default" },
  );
  usePlayerStore.getState().applySessionPlayer(playerBlob);
  await ensurePlayerStationResolved();

  const favs = await localFavouriteIdsStorage.getWithDefault(STORAGE_KEYS.favouriteIds, []);
  useStationStore.getState().setFavouriteIds(favs);

  const ui = await sessionUiStorage.getWithDefault(STORAGE_KEYS.sessionUi, {});
  useUiStore.getState().applySessionUi(ui);

  const settings = await localSettingsStorage.getWithDefault(STORAGE_KEYS.settings, DEFAULT_SETTINGS, {
    onInvalidStored: "default",
  });
  if (ui.browseSearchMode === undefined) {
    useUiStore.getState().setBrowseSearchMode(mapSettingsSearchToPopup(settings.searchMode));
  }
  if (ui.browseLanguageApiValue === undefined) {
    useUiStore
      .getState()
      .setBrowseLanguageApiValue(defaultLanguageCodeToBrowseApiValue(settings.defaultLanguageCode));
  }
}

/**
 * Attach `chrome.storage` watchers and persist Zustand changes. Call only after
 * {@link hydratePopupStoresFromChrome} completes.
 */
export function attachPopupStorageSyncListeners(): () => void {
  const unsubs: Array<() => void> = [];

  let lastPlayerJson = JSON.stringify(pickPersistedPlayer(usePlayerStore.getState()));
  let lastFavJson = JSON.stringify(useStationStore.getState().favouriteIds);
  let lastUiJson = JSON.stringify(pickPersistedUi(useUiStore.getState()));

  unsubs.push(
    sessionPlayerStorage.watch(STORAGE_KEYS.sessionPlayer, (ev) => {
      if (ev.kind === "removed") {
        usePlayerStore.getState().applySessionPlayer({
          stationuuid: null,
          isPlaying: false,
          volumePercent: DEFAULT_PLAYER_VOLUME_PERCENT,
          playlistId: null,
          playlistStationIndex: null,
        });
        return;
      }
      if (ev.kind === "updated") {
        usePlayerStore.getState().applySessionPlayer(ev.data);
        void ensurePlayerStationResolved();
      }
    }),
  );

  unsubs.push(
    localFavouriteIdsStorage.watch(STORAGE_KEYS.favouriteIds, (ev) => {
      if (ev.kind === "updated") {
        useStationStore.getState().setFavouriteIds(ev.data);
      }
      if (ev.kind === "removed") {
        useStationStore.getState().setFavouriteIds([]);
      }
    }),
  );

  unsubs.push(
    sessionUiStorage.watch(STORAGE_KEYS.sessionUi, (ev) => {
      if (ev.kind === "updated") {
        useUiStore.getState().applySessionUi(ev.data);
      }
    }),
  );

  unsubs.push(
    usePlayerStore.subscribe((state) => {
      const payload = pickPersistedPlayer(state);
      const json = JSON.stringify(payload);
      if (json === lastPlayerJson) {
        return;
      }
      lastPlayerJson = json;
      void sessionPlayerStorage.set(STORAGE_KEYS.sessionPlayer, payload);
    }),
  );

  unsubs.push(
    useStationStore.subscribe((state) => {
      const json = JSON.stringify(state.favouriteIds);
      if (json === lastFavJson) {
        return;
      }
      lastFavJson = json;
      void localFavouriteIdsStorage.set(STORAGE_KEYS.favouriteIds, state.favouriteIds);
    }),
  );

  unsubs.push(
    useUiStore.subscribe((state) => {
      const payload = pickPersistedUi(state);
      const json = JSON.stringify(payload);
      if (json === lastUiJson) {
        return;
      }
      lastUiJson = json;
      void sessionUiStorage.set(STORAGE_KEYS.sessionUi, payload);
    }),
  );

  return () => {
    for (const u of unsubs) {
      u();
    }
  };
}

export async function startPopupStorageSync(signal?: AbortSignal): Promise<() => void> {
  await hydratePopupStoresFromChrome();
  if (signal?.aborted) {
    return () => {};
  }
  return attachPopupStorageSyncListeners();
}
