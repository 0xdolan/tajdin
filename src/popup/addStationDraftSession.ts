import {
  STORAGE_KEYS,
  sessionAddStationDraftPopupStorage,
  sessionAddStationDraftSettingsStorage,
} from "../shared/storage/instances";
import type { SessionAddStationDraft } from "../shared/storage/schemas";

export type AddStationDraftScope = "popup" | "settings";

const EMPTY: SessionAddStationDraft = {};

function bucket(scope: AddStationDraftScope) {
  return scope === "popup"
    ? { storage: sessionAddStationDraftPopupStorage, key: STORAGE_KEYS.sessionAddStationDraftPopup }
    : { storage: sessionAddStationDraftSettingsStorage, key: STORAGE_KEYS.sessionAddStationDraftSettings };
}

export async function readAddStationDraft(scope: AddStationDraftScope): Promise<SessionAddStationDraft> {
  const { storage, key } = bucket(scope);
  return storage.getWithDefault(key, EMPTY, { onInvalidStored: "default" });
}

export async function mergeAddStationDraft(
  scope: AddStationDraftScope,
  patch: Partial<SessionAddStationDraft>,
): Promise<void> {
  const { storage, key } = bucket(scope);
  const prev = await readAddStationDraft(scope);
  await storage.set(key, { ...prev, ...patch });
}

export async function clearAddStationDraft(scope: AddStationDraftScope): Promise<void> {
  const { storage, key } = bucket(scope);
  await storage.remove(key);
}
