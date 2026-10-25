import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  GripVerticalIcon,
  LanguagesIcon,
  ListMusicIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  ShapesIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import {
  addToCollection,
  cleanText,
  deleteGroup,
  deletePlaylist,
  languageLabel,
  moveInPlaylist,
  removeFromCollection,
  type Group,
  type Playlist,
  type Station,
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
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@tajdin/ui/components/empty';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@tajdin/ui/components/input-group';
import { Item, ItemContent, ItemDescription, ItemTitle } from '@tajdin/ui/components/item';
import { Spinner } from '@tajdin/ui/components/spinner';
import { cn } from '@tajdin/ui/lib/utils';
import { StationArt } from '../../components/station-art';
import { stationMeta } from '../../components/station-row';
import { COLOUR_SWATCH } from '../../components/collection-dialog';
import { useLibrary, useSettings } from '../../data';
import { useDialogs } from '../../dialogs';
import { useStationFeed } from '../../feed';
import { useDebounced, usePlayer } from '../../hooks';
import { usePlatform } from '../../platform';
import { Section } from './common';

type Kind = 'playlist' | 'group';

function SortableStation({
  station,
  index,
  total,
  sortable,
  onMove,
  onRemove,
}: {
  station: Station;
  index: number;
  total: number;
  sortable: boolean;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: station.id, disabled: !sortable });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('flex items-center gap-2 rounded-lg border bg-card px-2 py-1.5', isDragging && 'relative z-10 shadow-lg ring-2 ring-ring')}
    >
      {sortable && (
        <button
          type="button"
          className="cursor-grab touch-none rounded p-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
          aria-label={`Reorder ${station.name}. Press space, then arrow keys to move.`}
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="size-4" />
        </button>
      )}
      <span className="w-6 text-right text-xs tabular-nums text-muted-foreground">{index + 1}</span>
      <StationArt station={station} className="size-8" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium" dir="auto">
          {station.name}
        </span>
        <span className="truncate text-xs text-muted-foreground" dir="auto">
          {stationMeta(station)}
        </span>
      </div>
      {sortable && (
        <>
          <Button variant="ghost" size="icon-xs" aria-label="Move up" disabled={index === 0} onClick={() => onMove(index, index - 1)}>
            <ArrowUpIcon />
          </Button>
          <Button variant="ghost" size="icon-xs" aria-label="Move down" disabled={index === total - 1} onClick={() => onMove(index, index + 1)}>
            <ArrowDownIcon />
          </Button>
        </>
      )}
      <Button variant="ghost" size="icon-xs" aria-label={`Remove ${station.name}`} onClick={onRemove}>
        <XIcon />
      </Button>
    </li>
  );
}

/** Search all directories to add stations, independent of the popup's search. */
function AddStations({ kind, collection }: { kind: Kind; collection: Playlist | Group }) {
  const [library, updateLibrary] = useLibrary();
  const [query, setQuery] = useState('');
  const text = useDebounced(cleanText(query, 200), 300);
  const feed = useStationFeed(text ? { kind: 'search', text, mode: 'exact', language: '' } : { kind: 'custom' });
  const included = new Set(collection.stationIds);
  const results = feed.stations.slice(0, 40);

  return (
    <div className="flex flex-col gap-2">
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput dir="auto" placeholder="Find stations to add…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Find stations to add" />
      </InputGroup>
      {!text && library.customStations.length > 0 && <p className="text-xs text-muted-foreground">Your stations:</p>}
      {feed.status === 'loading' && text ? (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Spinner /> Searching…
        </div>
      ) : (
        <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto">
          {results.map((s) => {
            const has = included.has(s.id);
            return (
              <li key={s.id} className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-accent">
                <StationArt station={s} className="size-7" />
                <span className="min-w-0 flex-1 truncate text-sm" dir="auto">
                  {s.name}
                </span>
                <Button
                  variant={has ? 'secondary' : 'outline'}
                  size="xs"
                  disabled={has}
                  onClick={() => void updateLibrary((l) => addToCollection(l, kind, collection.id, [s]))}
                >
                  {has ? 'Added' : (
                    <>
                      <PlusIcon data-icon="inline-start" />
                      Add
                    </>
                  )}
                </Button>
              </li>
            );
          })}
          {text && results.length === 0 && feed.status === 'ready' && <li className="py-3 text-sm text-muted-foreground">No matches.</li>}
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
  const sortable = kind === 'playlist';
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const move = (from: number, to: number) => void updateLibrary((l) => moveInPlaylist(l, collection.id, from, to));
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const ids = collection.stationIds;
    move(ids.indexOf(String(e.active.id)), ids.indexOf(String(e.over.id)));
  };

  const remove = async () => {
    const before = library;
    await updateLibrary((l) => (kind === 'playlist' ? deletePlaylist(l, collection.id) : deleteGroup(l, collection.id)));
    toast(`Deleted “${collection.name}”`, { action: { label: 'Undo', onClick: () => void updateLibrary(() => before) }, duration: 8000 });
  };

  const play = () => {
    const first = feed.stations[0];
    if (first) void send({ type: settings.playOnSelect ? 'play' : 'load', station: first, queue: feed.stations, context: feed.context });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="flex items-center gap-2 text-lg font-semibold" dir="auto">
            {collection.colour && <span className="size-3 rounded-full" style={{ backgroundColor: COLOUR_SWATCH[collection.colour] }} aria-hidden />}
            <span className="truncate">{collection.name}</span>
            {isLanguage && <Badge variant="secondary">{languageLabel((collection as Extract<Group, { kind: 'language' }>).language)}</Badge>}
          </h3>
          {'description' in collection && collection.description && (
            <p className="text-sm text-muted-foreground" dir="auto">
              {collection.description}
            </p>
          )}
          {isLanguage && (
            <p className="text-sm text-muted-foreground">
              Fills itself with every station in this language. Stations you add below are pinned to the top.
            </p>
          )}
        </div>
        <div className="flex gap-1">
          <Button size="sm" onClick={play} disabled={feed.stations.length === 0}>
            <PlayIcon data-icon="inline-start" />
            Play
          </Button>
          <Button size="sm" variant="outline" onClick={() => openCollection({ mode: 'edit', kind, id: collection.id })}>
            <PencilIcon data-icon="inline-start" />
            Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setConfirming(true)}>
            <Trash2Icon data-icon="inline-start" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-medium">
            {isLanguage ? 'Pinned stations' : 'Stations'} <span className="text-muted-foreground tabular-nums">({pinnedCount})</span>
          </h4>
          {feed.status === 'loading' ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Spinner /> Loading…
            </div>
          ) : pinned.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nothing here yet. Find stations on the right, or use any station’s ⋮ menu.
            </p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={pinned.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <ol className="flex flex-col gap-1">
                  {pinned.map((s, i) => (
                    <SortableStation
                      key={s.id}
                      station={s}
                      index={i}
                      total={pinned.length}
                      sortable={sortable}
                      onMove={move}
                      onRemove={() => void updateLibrary((l) => removeFromCollection(l, kind, collection.id, s.id))}
                    />
                  ))}
                </ol>
              </SortableContext>
            </DndContext>
          )}
          {pinned.length < pinnedCount && feed.status === 'ready' && (
            <p className="text-xs text-muted-foreground">{pinnedCount - pinned.length} station(s) couldn’t be found any more and are hidden.</p>
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
            <AlertDialogDescription>The stations stay in your favourites and other lists. You can undo for a few seconds.</AlertDialogDescription>
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
  const items: (Playlist | Group)[] = kind === 'playlist' ? library.playlists : library.groups;
  const [selected, setSelected] = useState<string | null>(null);
  const current = items.find((i) => i.id === selected) ?? items[0];

  useEffect(() => {
    if (selected && !items.some((i) => i.id === selected)) setSelected(null);
  }, [items, selected]);

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
            <Button size="sm" variant="outline" onClick={() => openCollection({ mode: 'create', kind, groupKind: 'language' })}>
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
      {items.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon />
            </EmptyMedia>
            <EmptyTitle>No {noun}s yet</EmptyTitle>
            <EmptyDescription>Create one here, or from any station’s ⋮ menu{surface === 'settings' ? ' in the popup' : ''}.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <nav aria-label={`${noun}s`} className="flex flex-col gap-1">
            {items.map((item) => (
              <Item
                key={item.id}
                size="xs"
                variant={current?.id === item.id ? 'muted' : 'default'}
                render={<button type="button" onClick={() => setSelected(item.id)} aria-current={current?.id === item.id ? 'true' : undefined} />}
                className="cursor-pointer text-left hover:bg-accent"
              >
                <ItemContent className="min-w-0">
                  <ItemTitle className="w-full truncate" dir="auto">
                    {'kind' in item && item.kind === 'language' ? <LanguagesIcon className="size-3.5 shrink-0" /> : null}
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
