import { toast } from 'sonner';
import { CopyIcon, PencilIcon, PlayIcon, PlusIcon, RadioTowerIcon, Trash2Icon } from 'lucide-react';
import { deleteCustomStation } from '@tajdin/core';
import { Button } from '@tajdin/ui/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@tajdin/ui/components/empty';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@tajdin/ui/components/item';
import { useLibrary } from '../../data';
import { useDialogs } from '../../dialogs';
import { usePlayer } from '../../hooks';
import { StationArt } from '../../components/station-art';
import { copyStreamUrl } from '../../components/station-menu';
import { Section } from './common';

export function StationsSettings() {
  const [library, updateLibrary] = useLibrary();
  const { openCustomStation } = useDialogs();
  const { send } = usePlayer();
  const stations = library.customStations;

  return (
    <Section
      title="My stations"
      description="Streams you added yourself. They appear in search, favourites, playlists and groups like any other station."
      action={
        <Button size="sm" onClick={() => openCustomStation()}>
          <PlusIcon data-icon="inline-start" />
          Add station
        </Button>
      }
    >
      {stations.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RadioTowerIcon />
            </EmptyMedia>
            <EmptyTitle>No stations yet</EmptyTitle>
            <EmptyDescription>Paste a stream URL from your favourite station’s website to add it.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" variant="outline" onClick={() => openCustomStation()}>
              Add your first station
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <ItemGroup className="gap-1">
          {stations.map((s) => (
            <Item key={s.id} variant="outline" size="sm">
              <ItemMedia>
                <StationArt station={s} className="size-9" />
              </ItemMedia>
              <ItemContent className="min-w-0">
                <ItemTitle className="truncate" dir="auto">
                  {s.name}
                </ItemTitle>
                <ItemDescription className="truncate font-mono text-xs">{s.streamUrl}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button variant="ghost" size="icon-sm" aria-label={`Play ${s.name}`} onClick={() => void send({ type: 'play', station: s, queue: stations, context: { kind: 'search', label: 'My stations' } })}>
                  <PlayIcon />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label={`Copy URL of ${s.name}`} onClick={() => void copyStreamUrl(s)}>
                  <CopyIcon />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label={`Edit ${s.name}`} onClick={() => openCustomStation(s)}>
                  <PencilIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${s.name}`}
                  onClick={async () => {
                    const before = library;
                    await updateLibrary((l) => deleteCustomStation(l, s.id));
                    toast(`Deleted “${s.name}”`, { action: { label: 'Undo', onClick: () => void updateLibrary(() => before) } });
                  }}
                >
                  <Trash2Icon />
                </Button>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      )}
    </Section>
  );
}
