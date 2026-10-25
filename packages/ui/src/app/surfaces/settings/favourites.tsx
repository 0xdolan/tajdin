import { toast } from 'sonner';
import { PlayIcon } from 'lucide-react';
import { moveFavourite, toggleFavourite, type Station } from '@tajdin/core';
import { Button } from '@tajdin/ui/components/button';
import { useLibrary, useSettings } from '../../data';
import { useStationFeed } from '../../feed';
import { usePlayer } from '../../hooks';
import { Section } from './common';
import { StationEditorList } from './station-editor-list';

/** Every station you've hearted, gathered automatically, in the order they play. */
export function FavouritesSettings() {
  const [library, updateLibrary] = useLibrary();
  const [settings] = useSettings();
  const { send } = usePlayer();
  const feed = useStationFeed({ kind: 'favourites' });

  const play = (station: Station, queue: Station[]) =>
    void send({
      type: settings.playOnSelect ? 'play' : 'load',
      station,
      queue,
      context: feed.context,
    });

  const remove = async (station: Station) => {
    const before = library;
    await updateLibrary((l) => toggleFavourite(l, station));
    toast(`Removed “${station.name}” from favourites`, {
      action: { label: 'Undo', onClick: () => void updateLibrary(() => before) },
    });
  };

  return (
    <Section
      title="Favourites"
      description="Every station you tap ♥ on lands here automatically. Drag to change the order they play in."
      action={
        <Button
          size="sm"
          disabled={feed.stations.length === 0}
          onClick={() => feed.stations[0] && play(feed.stations[0], feed.stations)}
        >
          <PlayIcon data-icon="inline-start" />
          Play all
        </Button>
      }
    >
      <StationEditorList
        stations={feed.stations}
        loading={feed.status === 'loading'}
        reorderable
        onMove={(from, to) => void updateLibrary((l) => moveFavourite(l, from, to))}
        onRemove={(s) => void remove(s)}
        onPlay={play}
        removeLabel="Remove from favourites"
        empty="No favourites yet. Tap ♥ on any station in the popup or desktop view and it shows up here."
      />
      {library.favourites.length > feed.stations.length && feed.status === 'ready' && (
        <p className="text-muted-foreground text-xs">
          {library.favourites.length - feed.stations.length} favourite(s) couldn’t be found any more
          and are hidden.
        </p>
      )}
    </Section>
  );
}
