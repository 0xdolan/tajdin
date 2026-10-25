import { useState } from 'react';
import { foldKey, type AnyStation } from '@tajdin/core';
import { cn } from '@tajdin/ui/lib/utils';
import { Music4Icon } from 'lucide-react';

const HUES = [20, 55, 85, 150, 200, 250, 290, 330];

function initials(name: string): string {
  const words = name.replace(/^(radio|radyo|fm)\s+/i, '').split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0]![0]! + words[1]![0]! : (words[0] ?? '?').slice(0, 2)).toUpperCase();
}

function hueFor(id: string): number {
  let h = 0;
  for (const ch of foldKey(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return HUES[h % HUES.length]!;
}

/** Station logo with a stable coloured monogram when there's no logo or it fails to load. */
export function StationArt({ station, className }: { station: AnyStation | null; className?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  const src = station?.favicon;
  const showImage = !!src && failed !== src;
  if (!station) {
    return (
      <div className={cn('flex shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground', className)}>
        <Music4Icon className="size-1/2" aria-hidden />
      </div>
    );
  }
  const hue = hueFor(station.id);
  return (
    <div
      className={cn('relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg text-xs font-semibold', className)}
      style={{
        backgroundColor: showImage ? 'var(--muted)' : `oklch(0.62 0.12 ${hue} / 0.18)`,
        color: `oklch(0.62 0.14 ${hue})`,
      }}
      aria-hidden
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="size-full object-cover"
          onError={() => setFailed(src)}
        />
      ) : (
        <span dir="auto">{initials(station.name)}</span>
      )}
    </div>
  );
}
