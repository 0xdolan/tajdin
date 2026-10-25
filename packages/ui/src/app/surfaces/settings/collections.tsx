import { useState } from 'react';
import { toast } from 'sonner';
import {
  LanguagesIcon,
  ListMusicIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  ShapesIcon,
  Trash2Icon,
} from 'lucide-react';
import {
  addToCollection,
  cleanText,
  foldKey,
  deleteGroup,
  deletePlaylist,
  languageLabel,
  moveInPlaylist,
  removeFromCollection,
  type Group,
  type Playlist,
} from '@tajdin/core';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@tajdin/ui/components/alert-dialog';
import { Badge } from '@tajdin/ui/components/badge';
import { Button } from '@tajdin/ui/components/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@tajdin/ui/components/empty';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@tajdin/ui/components/input-group';
import { Item, ItemContent, ItemDescription, ItemTitle } from '@tajdin/ui/components/item';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tajdin/ui/components/select';
import { Spinner } from '@tajdin/ui/components/spinner';
import { StationArt } from '../../components/station-art';
import { COLOUR_SWATCH } from '../../components/collection-dialog';
import { useLibrary, useSettings } from '../../data';
import { useDialogs } from '../../dialogs';
import { useStationFeed } from '../../feed';
import { useDebounced, usePlayer } from '../../hooks';
import { usePlatform } from '../../platform';
import { Section } from './common';
import { StationEditorList } from './station-editor-list';

type Kind = 'playlist' | 'group';

const COLLECTION_ORDERS = [
  { value: 'created', label: 'Order created' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'updated', label: 'Recently changed' },
  { value: 'size', label: 'Most stations' },
] as const;
type CollectionOrder = (typeof COLLECTION_ORDERS)[number]['value'];

function sortCollections<T extends Playlist | Group>(items: T[], order: CollectionOrder): T[] {
  switch (order) {
    case 'name':
      return [...items].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
      );
    case 'updated':
      return [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    case 'size':
      return [...items].sort((a, b) => b.stationIds.length - a.stationIds.length);
    default:
      return items;
  }
}

/** Search all directories to add stations, independent of the popup's search. */
function AddStations({ kind, collection }: { kind: Kind; collection: Playlist | Group }) {
  const [library, updateLibrary] = useLibrary();
  const [query, setQuery] = useState('');
  const text = useDebounced(cleanText(query, 200), 300);
  const feed = useStationFeed(
    text ? { kind: 'search', text, mode: 'exact', language: '' } : { kind: 'custom' },
  );
  const included = new Set(collection.stationIds);
  const results = feed.stations.slice(0, 40);

  return (
    <div className="flex flex-col gap-2">
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          dir="auto"
          placeholder="Find stations to add…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Find stations to add"
        />
      </InputGroup>
      {!text && library.customStations.length > 0 && (
        <p className="text-muted-foreground text-xs">Your stations:</p>
      )}
      {feed.status === 'loading' && text ? (
        <div className="text-muted-foreground flex items-center gap-2 py-4 text-sm">
          <Spinner /> Searching…
        </div>
      ) : (
        <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto">
          {results.map((s) => {
            const has = included.has(s.id);
            return (
              <li
                key={s.id}
                className="hover:bg-accent flex items-center gap-2 rounded-md px-1 py-1"
              >
                <StationArt station={s} className="size-7" />
                <span className="min-w-0 flex-1 truncate text-sm" dir="auto">
                  {s.name}
                </span>
                <Button
                  variant={has ? 'secondary' : 'outline'}
                  size="xs"
                  disabled={has}
                  onClick={() =>
                    void updateLibrary((l) => addToCollection(l, kind, collection.id, [s]))
                  }
                >
                  {has ? (
                    'Added'
                  ) : (
                    <>
                      <PlusIcon data-icon="inline-start" />
                      Add
                    </>
                  )}
                </Button>
              </li>
            );
          })}
          {text && results.length === 0 && feed.status === 'ready' && (
            <li className="text-muted-foreground py-3 text-sm">No matches.</li>
          )}
        </ul>
      )}
    </div>
  );
}

function Editor({ kind, collection }: { kind: Kind; collection: Playlist | Group }) {
  const [library, updateLibrary] = useLibrary();
  const [settings] = useSettings();
  const { openCollection } = useDialogs();
  const { send } = usePlayer();
  const feed = useStationFeed({ kind, id: collection.id } as { kind: 'playlist'; id: string });
  const [confirming, setConfirming] = useState(false);
  const isLanguage = kind === 'group' && (collection as Group).kind === 'language';
  const pinnedCount = collection.stationIds.length;
  // For language groups, the feed also contains the language's stations after the pinned ones.
  const pinned = feed.stations.slice(0, isLanguage ? pinnedCount : undefined);
  const move = (from: number, to: number) =>
    void updateLibrary((l) => moveInPlaylist(l, collection.id, from, to));

  const remove = async () => {
    const before = library;
    await updateLibrary((l) =>
      kind === 'playlist' ? deletePlaylist(l, collection.id) : deleteGroup(l, collection.id),
    );
    toast(`Deleted “${collection.name}”`, {
      action: { label: 'Undo', onClick: () => void updateLibrary(() => before) },
      duration: 8000,
    });
  };

  const play = () => {
    const first = feed.stations[0];
    if (first)
      void send({
        type: settings.playOnSelect ? 'play' : 'load',
        station: first,
        queue: feed.stations,
        context: feed.context,
      });
  };

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="flex items-center gap-2 text-lg font-semibold" dir="auto">
            {collection.colour && (
              <span
                className="size-3 rounded-full"
                style={{ backgroundColor: COLOUR_SWATCH[collection.colour] }}
                aria-hidden
              />
            )}
            <span className="truncate">{collection.name}</span>
            {isLanguage && (
              <Badge variant="secondary">
                {languageLabel((collection as Extract<Group, { kind: 'language' }>).language)}
              </Badge>
            )}
          </h3>
          {'description' in collection && collection.description && (
            <p className="text-muted-foreground text-sm" dir="auto">
              {collection.description}
            </p>
          )}
          {isLanguage && (
            <p className="text-muted-foreground text-sm">
              Fills itself with every station in this language. Stations you add below are pinned to
              the top.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          <Button size="sm" onClick={play} disabled={feed.stations.length === 0}>
            <PlayIcon data-icon="inline-start" />
            Play
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => openCollection({ mode: 'edit', kind, id: collection.id })}
          >
            <PencilIcon data-icon="inline-start" />
            Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setConfirming(true)}>
            <Trash2Icon data-icon="inline-start" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-medium">
            {isLanguage ? 'Pinned stations' : 'Stations'}{' '}
            <span className="text-muted-foreground tabular-nums">({pinnedCount})</span>
          </h4>
          <StationEditorList
            stations={pinned}
            loading={feed.status === 'loading'}
            reorderable={kind === 'playlist'}
            onMove={move}
            onRemove={(station) =>
              void updateLibrary((l) => removeFromCollection(l, kind, collection.id, station.id))
            }
            onPlay={(station, queue) =>
              void send({
                type: settings.playOnSelect ? 'play' : 'load',
                station,
                queue,
                context: feed.context,
              })
            }
            empty="Nothing here yet. Find stations on the right, or use any station’s ⋮ menu."
          />
          {pinned.length < pinnedCount && feed.status === 'ready' && (
            <p className="text-muted-foreground text-xs">
              {pinnedCount - pinned.length} station(s) couldn’t be found any more and are hidden.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-medium">Add stations</h4>
          <AddStations kind={kind} collection={collection} />
        </div>
      </div>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{collection.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              The stations stay in your favourites and other lists. You can undo for a few seconds.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void remove()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Playlists or groups: pick one on the left, edit it on the right. */
export function CollectionsSettings({ kind }: { kind: Kind }) {
  const [library] = useLibrary();
  const { openCollection } = useDialogs();
  const { surface } = usePlatform();
  const all: (Playlist | Group)[] = kind === 'playlist' ? library.playlists : library.groups;
  const [selected, setSelected] = useState<string | null>(null);
  const [find, setFind] = useState('');
  const [order, setOrder] = useState<CollectionOrder>('created');
  const items = sortCollections(
    all.filter((i) => foldKey(i.name).includes(foldKey(find.trim()))),
    order,
  );
  // A deleted selection falls back to the first item.
  const current = all.find((i) => i.id === selected) ?? items[0] ?? all[0];

  const noun = kind === 'playlist' ? 'playlist' : 'group';
  const Icon = kind === 'playlist' ? ListMusicIcon : ShapesIcon;

  return (
    <Section
      title={kind === 'playlist' ? 'Playlists' : 'Groups'}
      description={
        kind === 'playlist'
          ? 'Ordered lists that play through. Offline stations are skipped automatically.'
          : 'Collections for browsing. Make a language group to gather every station in a language.'
      }
      action={
        <div className="flex gap-1">
          {kind === 'group' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => openCollection({ mode: 'create', kind, groupKind: 'language' })}
            >
              <LanguagesIcon data-icon="inline-start" />
              Language group
            </Button>
          )}
          <Button size="sm" onClick={() => openCollection({ mode: 'create', kind })}>
            <PlusIcon data-icon="inline-start" />
            New {noun}
          </Button>
        </div>
      }
    >
      {all.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon />
            </EmptyMedia>
            <EmptyTitle>No {noun}s yet</EmptyTitle>
            <EmptyDescription>
              Create one here, or from any station’s ⋮ menu
              {surface === 'settings' ? ' in the popup' : ''}.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-6 md:grid-cols-[200px_minmax(0,1fr)]">
          <nav aria-label={`${noun}s`} className="flex flex-col gap-1">
            {all.length > 3 && (
              <div className="mb-1 flex flex-col gap-1.5">
                <InputGroup className="h-8">
                  <InputGroupAddon>
                    <SearchIcon />
                  </InputGroupAddon>
                  <InputGroupInput
                    dir="auto"
                    placeholder={`Find a ${noun}…`}
                    aria-label={`Find a ${noun}`}
                    value={find}
                    onChange={(e) => setFind(e.target.value)}
                  />
                </InputGroup>
                <Select
                  items={COLLECTION_ORDERS}
                  value={order}
                  onValueChange={(v) => setOrder(v as CollectionOrder)}
                >
                  <SelectTrigger size="sm" className="w-full" aria-label={`Sort ${noun}s`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {COLLECTION_ORDERS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}
            {items.length === 0 && (
              <p className="text-muted-foreground px-2 py-3 text-xs">No {noun}s match.</p>
            )}
            {items.map((item) => (
              <Item
                key={item.id}
                size="xs"
                variant={current?.id === item.id ? 'muted' : 'default'}
                render={
                  <button
                    type="button"
                    onClick={() => setSelected(item.id)}
                    aria-current={current?.id === item.id ? 'true' : undefined}
                  />
                }
                className="hover:bg-accent cursor-pointer text-left"
              >
                <ItemContent className="min-w-0">
                  <ItemTitle className="w-full truncate" dir="auto">
                    {'kind' in item && item.kind === 'language' ? (
                      <LanguagesIcon className="size-3.5 shrink-0" />
                    ) : null}
                    {item.name}
                  </ItemTitle>
                  <ItemDescription className="text-xs">
                    {'kind' in item && item.kind === 'language'
                      ? `${languageLabel(item.language)} · ${item.stationIds.length} pinned`
                      : `${item.stationIds.length} station${item.stationIds.length === 1 ? '' : 's'}`}
                  </ItemDescription>
                </ItemContent>
              </Item>
            ))}
          </nav>
          {current && <Editor key={current.id} kind={kind} collection={current} />}
        </div>
      )}
    </Section>
  );
}
