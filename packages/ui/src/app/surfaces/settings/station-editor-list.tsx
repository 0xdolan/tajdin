import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDownIcon, ArrowUpIcon, GripVerticalIcon, PlayIcon, XIcon } from 'lucide-react';
import type { Station } from '@tajdin/core';
import { Button } from '@tajdin/ui/components/button';
import { Spinner } from '@tajdin/ui/components/spinner';
import { cn } from '@tajdin/ui/lib/utils';
import { ListToolbar } from '../../components/list-toolbar';
import { StationArt } from '../../components/station-art';
import { stationMeta } from '../../components/station-row';
import { useListTools } from '../../list-tools';

function StationItem({
  station,
  index,
  total,
  sortable,
  onMove,
  onRemove,
  onPlay,
  removeLabel,
}: {
  station: Station;
  index: number;
  total: number;
  sortable: boolean;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
  onPlay: () => void;
  removeLabel: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: station.id,
    disabled: !sortable,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'bg-card flex items-center gap-2 rounded-lg border px-2 py-1.5',
        isDragging && 'ring-ring relative z-10 shadow-lg ring-2',
      )}
    >
      {sortable && (
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring cursor-grab touch-none rounded p-1 outline-none focus-visible:ring-2 active:cursor-grabbing"
          aria-label={`Reorder ${station.name}. Press space, then arrow keys to move.`}
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="size-4" />
        </button>
      )}
      <span className="text-muted-foreground w-6 text-right text-xs tabular-nums">{index + 1}</span>
      <StationArt station={station} className="size-8" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium" dir="auto">
          {station.name}
        </span>
        <span className="text-muted-foreground truncate text-xs" dir="auto">
          {stationMeta(station)}
        </span>
      </div>
      <Button variant="ghost" size="icon-xs" aria-label={`Play ${station.name}`} onClick={onPlay}>
        <PlayIcon />
      </Button>
      {sortable && (
        <>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Move up"
            disabled={index === 0}
            onClick={() => onMove(index, index - 1)}
          >
            <ArrowUpIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Move down"
            disabled={index === total - 1}
            onClick={() => onMove(index, index + 1)}
          >
            <ArrowDownIcon />
          </Button>
        </>
      )}
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={`${removeLabel}: ${station.name}`}
        onClick={onRemove}
      >
        <XIcon />
      </Button>
    </li>
  );
}

/**
 * A library list in Options (favourites, a playlist, a group) with filter, sort and, when the
 * order matters, drag-and-drop or keyboard reordering. Reordering pauses while a sort or filter
 * is on, because moving items in a filtered view would be ambiguous.
 */
export function StationEditorList({
  stations,
  loading,
  reorderable,
  onMove,
  onRemove,
  onPlay,
  removeLabel = 'Remove',
  empty,
}: {
  stations: Station[];
  loading: boolean;
  reorderable: boolean;
  onMove: (from: number, to: number) => void;
  onRemove: (station: Station) => void;
  onPlay: (station: Station, queue: Station[]) => void;
  removeLabel?: string;
  empty: string;
}) {
  const list = useListTools(stations);
  const sortable = reorderable && list.active === 0;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const ids = stations.map((s) => s.id);
    onMove(ids.indexOf(String(e.active.id)), ids.indexOf(String(e.over.id)));
  };

  if (loading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
        <Spinner /> Loading…
      </div>
    );
  }
  if (stations.length === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
        {empty}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <ListToolbar list={list} count={{ shown: list.shown.length, total: stations.length }} />
      {reorderable && list.active > 0 && (
        <p className="text-muted-foreground text-xs">
          Reset sort and filters to reorder by dragging.
        </p>
      )}
      {list.shown.length === 0 ? (
        <p className="text-muted-foreground py-4 text-center text-sm">No stations match.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext
            items={list.shown.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <ol className="flex flex-col gap-1">
              {list.shown.map((s, i) => (
                <StationItem
                  key={s.id}
                  station={s}
                  index={i}
                  total={list.shown.length}
                  sortable={sortable}
                  onMove={onMove}
                  onRemove={() => onRemove(s)}
                  onPlay={() => onPlay(s, list.shown)}
                  removeLabel={removeLabel}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
