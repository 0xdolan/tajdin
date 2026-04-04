import { ChromeStorageWrapper, chromeStorageAreaAdapter } from "./chrome-storage";
import {
  LocalCustomStationsSchema,
  LocalFavouriteIdsSchema,
  LocalPlaylistsSchema,
  LocalSettingsSchema,
  SessionPlayerSchema,
  SessionUiSchema,
} from "./schemas";
import { STORAGE_KEYS } from "./storage-keys";

export { STORAGE_KEYS };

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
