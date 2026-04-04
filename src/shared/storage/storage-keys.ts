/** Stable keys for Tajdîn blobs in `chrome.storage`. Legacy `zeng.*` keys are migrated on startup. */
export const STORAGE_KEYS = {
  playlists: "tajdin.playlists.v1",
  customStations: "tajdin.customStations.v1",
  favouriteIds: "tajdin.favouriteIds.v1",
  settings: "tajdin.settings.v1",
  sessionPlayer: "tajdin.session.player.v1",
  sessionUi: "tajdin.session.ui.v1",
} as const;
