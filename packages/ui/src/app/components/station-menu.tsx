import type { ReactElement } from 'react';
import { toast } from 'sonner';
import {
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  FolderPlusIcon,
  ListMusicIcon,
  PencilIcon,
  PlusIcon,
  SaveIcon,
  ShapesIcon,
  Trash2Icon,
} from 'lucide-react';
import { addToCollection, deleteCustomStation, isLocalStation, removeFromCollection, type AnyStation, type Station } from '@tajdin/core';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@tajdin/ui/components/dropdown-menu';
import { useLibrary } from '../data';
import { useDialogs } from '../dialogs';

export async function copyStreamUrl(station: AnyStation) {
  if (isLocalStation(station)) {
    toast.error('Local files have no link to copy');
    return;
  }
  try {
    await navigator.clipboard.writeText(station.streamUrl);
    toast.success('Stream URL copied');
  } catch {
    toast.error('Couldn’t copy. Your browser blocked clipboard access.');
  }
}

/** Everything you can do with a station besides playing it. Shared by rows, cards and the player. */
export function StationMenu({ station, trigger }: { station: AnyStation; trigger: ReactElement }) {
  const [library, updateLibrary] = useLibrary();
  const { openCollection, openCustomStation } = useDialogs();
  if (isLocalStation(station)) return null;
  const s = station as Station;

  const toggleIn = async (kind: 'playlist' | 'group', id: string, name: string, included: boolean) => {
    await updateLibrary((l) => (included ? removeFromCollection(l, kind, id, s.id) : addToCollection(l, kind, id, [s])));
    toast.success(included ? `Removed from “${name}”` : `Added to “${name}”`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="truncate" dir="auto">
            {s.name}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <ListMusicIcon />
              Add to playlist
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="max-h-72 w-52 overflow-y-auto">
              <DropdownMenuGroup>
                {library.playlists.map((p) => {
                  const included = p.stationIds.includes(s.id);
                  return (
                    <DropdownMenuItem key={p.id} onClick={() => void toggleIn('playlist', p.id, p.name, included)}>
                      {included ? <CheckIcon /> : <span className="size-4" />}
                      <span className="truncate" dir="auto">
                        {p.name}
                      </span>
                    </DropdownMenuItem>
                  );
                })}
                {library.playlists.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem onClick={() => openCollection({ mode: 'create', kind: 'playlist', addStation: s })}>
                  <PlusIcon />
                  New playlist…
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <ShapesIcon />
              Add to group
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="max-h-72 w-52 overflow-y-auto">
              <DropdownMenuGroup>
                {library.groups.map((g) => {
                  const included = g.stationIds.includes(s.id);
                  return (
                    <DropdownMenuItem key={g.id} onClick={() => void toggleIn('group', g.id, g.name, included)}>
                      {included ? <CheckIcon /> : <span className="size-4" />}
                      <span className="truncate" dir="auto">
                        {g.name}
                      </span>
                    </DropdownMenuItem>
                  );
                })}
                {library.groups.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem onClick={() => openCollection({ mode: 'create', kind: 'group', addStation: s })}>
                  <FolderPlusIcon />
                  New group…
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => void copyStreamUrl(s)}>
            <CopyIcon />
            Copy stream URL
          </DropdownMenuItem>
          {s.homepage && (
            <DropdownMenuItem onClick={() => window.open(s.homepage, '_blank', 'noopener,noreferrer')}>
              <ExternalLinkIcon />
              Open website
            </DropdownMenuItem>
          )}
          {s.source === 'url' && (
            <DropdownMenuItem onClick={() => openCustomStation({ name: s.name, streamUrl: s.streamUrl })}>
              <SaveIcon />
              Save to my stations
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        {s.source === 'custom' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => openCustomStation(s)}>
                <PencilIcon />
                Edit station
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={async () => {
                  const before = library;
                  await updateLibrary((l) => deleteCustomStation(l, s.id));
                  toast(`Deleted “${s.name}”`, {
                    action: { label: 'Undo', onClick: () => void updateLibrary(() => before) },
                  });
                }}
              >
                <Trash2Icon />
                Delete station
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
