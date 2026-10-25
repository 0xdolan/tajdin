import { useEffect, useRef, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { RadioIcon, RefreshCwIcon, WifiOffIcon } from 'lucide-react';
import type { Station } from '@tajdin/core';
import { Button } from '@tajdin/ui/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@tajdin/ui/components/empty';
import { Skeleton } from '@tajdin/ui/components/skeleton';
import { Spinner } from '@tajdin/ui/components/spinner';
import { cn } from '@tajdin/ui/lib/utils';
import type { Feed } from '../feed';
import { usePlayer } from '../hooks';
import { usePlatform } from '../platform';
import { StationRow } from './station-row';

interface StationListProps {
  feed: Feed;
  onPlay: (station: Station) => void;
  empty?: { title: string; description?: string; action?: ReactNode };
  className?: string;
  dense?: boolean;
}

/** Virtualised station list: smooth with thousands of rows, and loads the next page near the end. */
export function StationList({ feed, onPlay, empty, className, dense }: StationListProps) {
  const { state } = usePlayer();
  const { playsHttp } = usePlatform();
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowHeight = dense ? 48 : 56;
  const count = feed.stations.length + (feed.hasMore ? 1 : 0);
  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight + 2,
    overscan: 8,
  });
  const items = virtualizer.getVirtualItems();
  const last = items[items.length - 1];

  useEffect(() => {
    if (last && last.index >= feed.stations.length - 5 && feed.hasMore && !feed.loadingMore) feed.loadMore();
  }, [last, feed]);

  // A new feed starts at the top.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [feed.context.label]);

  if (feed.status === 'loading') {
    return (
      <div className={cn('flex flex-col gap-0.5 overflow-hidden px-2', className)} aria-busy="true" aria-label="Loading stations">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-2" style={{ height: rowHeight }}>
            <Skeleton className={dense ? 'size-9' : 'size-10'} />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3.5" style={{ width: `${45 + ((i * 17) % 40)}%` }} />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (feed.status === 'error') {
    return (
      <Empty className={className}>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <WifiOffIcon />
          </EmptyMedia>
          <EmptyTitle>Couldn’t load stations</EmptyTitle>
          <EmptyDescription>{feed.error ?? 'Check your connection and try again.'}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" size="sm" onClick={feed.reload}>
            <RefreshCwIcon data-icon="inline-start" />
            Try again
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  if (feed.stations.length === 0) {
    return (
      <Empty className={className}>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RadioIcon />
          </EmptyMedia>
          <EmptyTitle>{empty?.title ?? 'No stations here'}</EmptyTitle>
          {empty?.description && <EmptyDescription>{empty.description}</EmptyDescription>}
        </EmptyHeader>
        {empty?.action && <EmptyContent>{empty.action}</EmptyContent>}
      </Empty>
    );
  }

  return (
    <div ref={scrollRef} className={cn('overflow-y-auto overscroll-contain px-2', className)} role="list" aria-label={feed.context.label}>
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {items.map((item) => {
          const station = feed.stations[item.index];
          return (
            <div
              key={item.key}
              role="listitem"
              className="absolute top-0 left-0 w-full"
              style={{ transform: `translateY(${item.start}px)`, height: item.size }}
            >
              {station ? (
                <StationRow
                  station={station}
                  active={state.station?.id === station.id}
                  playing={state.status === 'playing'}
                  onPlay={onPlay}
                  warnInsecure={!playsHttp}
                  dense={dense}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground" aria-live="polite">
                  <Spinner className="mr-2" /> Loading more…
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
