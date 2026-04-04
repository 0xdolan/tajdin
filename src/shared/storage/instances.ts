import { ChromeStorageWrapper, chromeStorageAreaAdapter } from "./chrome-storage";
import {
  LocalCustomStationsSchema,
  LocalFavouriteIdsSchema,
  LocalGroupsSchema,
  LocalPlaylistsSchema,
  LocalSettingsSchema,
  SessionPlayerSchema,
  SessionUiSchema,
} from "./schemas";

/** Stable keys for Zeng blobs in `chrome.storage`. */
export const STORAGE_KEYS = {
  playlists: "zeng.playlists.v1",
  groups: "zeng.groups.v1",
  customStations: "zeng.customStations.v1",
  favouriteIds: "zeng.favouriteIds.v1",
  settings: "zeng.settings.v1",
  sessionPlayer: "zeng.session.player.v1",
  sessionUi: "zeng.session.ui.v1",
} as const;

/**
 * Adapter for `chrome.storage.local` (persistent). Use with {@link ChromeStorageWrapper} or the
 * pre-built `local*Storage` exports below.
 */
export const storageLocal = chromeStorageAreaAdapter(chrome.storage.local, "local");

/**
 * Adapter for `chrome.storage.session` (transient). Use with {@link ChromeStorageWrapper} or the
 * pre-built `session*Storage` exports below.
 */
export const storageSession = chromeStorageAreaAdapter(chrome.storage.session, "session");

export const localPlaylistsStorage = new ChromeStorageWrapper(storageLocal, LocalPlaylistsSchema);
export const localGroupsStorage = new ChromeStorageWrapper(storageLocal, LocalGroupsSchema);
export const localCustomStationsStorage = new ChromeStorageWrapper(
  storageLocal,
  LocalCustomStationsSchema,
);
export const localFavouriteIdsStorage = new ChromeStorageWrapper(
  storageLocal,
  LocalFavouriteIdsSchema,
);
export const localSettingsStorage = new ChromeStorageWrapper(storageLocal, LocalSettingsSchema);

export const sessionPlayerStorage = new ChromeStorageWrapper(storageSession, SessionPlayerSchema);
export const sessionUiStorage = new ChromeStorageWrapper(storageSession, SessionUiSchema);
