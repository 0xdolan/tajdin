import { useCallback, useEffect, useState } from "react";
import {
  defaultRadioBrowserClient,
  type RadioBrowserClient,
} from "../../shared/api/radio-browser.api";
import type { Group } from "../../shared/types/group";
import type { Station } from "../../shared/types/station";
import { sanitizeDisplayText } from "../../shared/utils/sanitize";
import {
  DEFAULT_GROUP_ICON_KEY,
  GROUP_ICON_KEYS,
  groupIconLabel,
  isValidGroupIconKey,
} from "../../shared/utils/group-icon-keys";
import { startPlaybackWithPlaylistSkip } from "../playerPlayback";
import {
  createGroup,
  deleteGroup,
  loadPlaylistsAndGroups,
  removeStationFromGroup,
  renameGroup,
  resolveStationForLibrary,
  setGroupIconKey,
} from "../stationLibraryApi";
import { usePlayerStore } from "../store/playerStore";
import { GroupIcon } from "./GroupIcon";

function GroupStationRow({
  uuid,
  groupId,
  client,
  onRemoved,
  onPlay,
}: {
  uuid: string;
  groupId: string;
  client: RadioBrowserClient;
  onRemoved: () => void;
  onPlay: (station: Station) => void;
}) {
  const [station, setStation] = useState<Station | null>(null);

  useEffect(() => {
    let cancelled = false;
    void resolveStationForLibrary(client, uuid).then((s) => {
      if (!cancelled) setStation(s);
    });
    return () => {
      cancelled = true;
    };
  }, [client, uuid]);

  const title = station ? sanitizeDisplayText(station.name, { maxLength: 200 }) : uuid;
  const canPlay = Boolean(station && (station.url_resolved || station.url));

  return (
    <div className="flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900/60 px-2 py-1.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-neutral-100">{title}</p>
        {!station ? <p className="truncate text-xs text-neutral-500">Loading…</p> : null}
      </div>
      <button
        type="button"
        disabled={!canPlay || !station}
        className="shrink-0 rounded px-2 py-1 text-xs font-medium text-sky-400 hover:bg-neutral-800 disabled:opacity-40"
        onClick={() => station && canPlay && onPlay(station)}
      >
        Play
      </button>
      <button
        type="button"
        className="shrink-0 rounded px-2 py-1 text-xs text-red-400 hover:bg-neutral-800"
        onClick={() =>
          void removeStationFromGroup(groupId, uuid).then((ok) => {
            if (ok) onRemoved();
          })
        }
      >
        Remove
      </button>
    </div>
  );
}

function GroupSection({
  group,
  client,
  onLibraryChange,
}: {
  group: Group;
  client: RadioBrowserClient;
  onLibraryChange: () => void;
}) {
  const [nameDraft, setNameDraft] = useState(group.name);

  useEffect(() => {
    setNameDraft(group.name);
  }, [group.name]);

  const applyRename = () => {
    void renameGroup(group.id, nameDraft).then((ok) => {
      if (ok) onLibraryChange();
    });
  };

  const onPlayStation = async (station: Station) => {
    usePlayerStore.getState().setStation(station);
    await startPlaybackWithPlaylistSkip();
  };

  return (
    <details className="rounded-lg border border-neutral-800 bg-neutral-950/40">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-200 [&::-webkit-details-marker]:hidden">
        <span className="text-neutral-500" aria-hidden>
          ▸
        </span>
        <GroupIcon iconKey={group.iconKey} className="h-5 w-5 text-amber-400/90" />
        <span className="min-w-0 truncate">
          {sanitizeDisplayText(group.name, { maxLength: 200 })}
        </span>
        <span className="ml-auto shrink-0 text-xs font-normal text-neutral-500">
          ({group.stationUuids.length} stations)
        </span>
      </summary>
      <div className="border-t border-neutral-800 px-3 py-3">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="block min-w-0 flex-1 text-xs text-neutral-400">
            Name
            <input
              className="mt-0.5 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-100"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={() => {
                if (nameDraft.trim() !== group.name) applyRename();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  (e.target as HTMLInputElement).blur();
                }
              }}
            />
          </label>
          <label className="block shrink-0 text-xs text-neutral-400">
            Icon
            <select
              className="mt-0.5 block w-full min-w-[10rem] rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-100"
              value={
                group.iconKey && isValidGroupIconKey(group.iconKey)
                  ? group.iconKey
                  : DEFAULT_GROUP_ICON_KEY
              }
              onChange={(e) =>
                void setGroupIconKey(group.id, e.target.value).then((ok) => {
                  if (ok) onLibraryChange();
                })
              }
            >
              {GROUP_ICON_KEYS.map((k) => (
                <option key={k} value={k}>
                  {groupIconLabel(k)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="rounded-md border border-red-900/60 px-2 py-1.5 text-xs text-red-400 hover:bg-red-950/40"
            onClick={() =>
              void deleteGroup(group.id).then((ok) => {
                if (ok) onLibraryChange();
              })
            }
          >
            Delete group
          </button>
        </div>
        {group.stationUuids.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No stations yet. Add some from Browse via the station menu.
          </p>
        ) : (
          <ul
            className="flex flex-col gap-2"
            aria-label={`Stations in ${sanitizeDisplayText(group.name, { maxLength: 200 })}`}
          >
            {group.stationUuids.map((uuid) => (
              <li key={uuid}>
                <GroupStationRow
                  uuid={uuid}
                  groupId={group.id}
                  client={client}
                  onRemoved={onLibraryChange}
                  onPlay={(st) => void onPlayStation(st)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}

export function GroupsPage({ client = defaultRadioBrowserClient }: { client?: RadioBrowserClient }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState<string>(GROUP_ICON_KEYS[0]!);

  const refresh = useCallback(() => {
    void loadPlaylistsAndGroups().then((r) => setGroups(r.groups));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          const name = newName.trim();
          if (!name) return;
          void createGroup(name, newIcon).then((gr) => {
            if (gr) {
              setNewName("");
              refresh();
            }
          });
        }}
      >
        <label className="min-w-0 flex-1 text-xs text-neutral-400">
          New group
          <input
            className="mt-0.5 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-100"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
            maxLength={200}
          />
        </label>
        <label className="shrink-0 text-xs text-neutral-400">
          Icon
          <select
            className="mt-0.5 block w-full min-w-[10rem] rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-100"
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
          >
            {GROUP_ICON_KEYS.map((k) => (
              <option key={k} value={k}>
                {groupIconLabel(k)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="shrink-0 rounded-md bg-sky-700 px-3 py-2 text-sm font-medium text-white hover:bg-sky-600"
        >
          Create
        </button>
      </form>
      {groups.length === 0 ? (
        <p className="text-sm text-neutral-500">No groups yet. Create one above.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {groups.map((g) => (
            <GroupSection key={g.id} group={g} client={client} onLibraryChange={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}
