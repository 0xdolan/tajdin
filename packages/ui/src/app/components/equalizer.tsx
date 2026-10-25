import { cn } from '@tajdin/ui/lib/utils';

/** Small animated bars marking the station that's playing. Freezes when paused or loading. */
export function Equalizer({ playing, className }: { playing: boolean; className?: string }) {
  return (
    <span className={cn('flex h-3 items-end gap-[2px]', className)} aria-hidden>
      {[0.9, 0.5, 0.75].map((delay, i) => (
        <span
          key={i}
          className="bg-live w-[3px] origin-bottom rounded-full"
          style={{
            height: '100%',
            transform: playing ? undefined : 'scaleY(0.35)',
            animation: playing
              ? `tajdin-eq ${0.7 + i * 0.15}s ease-in-out ${-delay}s infinite`
              : undefined,
          }}
        />
      ))}
    </span>
  );
}
