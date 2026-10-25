import { HeartIcon } from 'lucide-react';
import { cn } from '@tajdin/ui/lib/utils';
import { LINKS, usePlatform } from '../platform';

const link = 'rounded-sm underline-offset-2 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';

/** "Made with ♥ by 0xdolan · Source · Docs · Site · v0.2.1" */
export function Footer({ className }: { className?: string }) {
  const { version } = usePlatform();
  return (
    <footer className={cn('flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground', className)}>
      <span className="flex items-center gap-1">
        Made with
        <HeartIcon className="size-3 fill-destructive text-destructive" aria-label="love" role="img" />
        by
        <a className={cn(link, 'font-medium')} href={LINKS.author} target="_blank" rel="noreferrer">
          0xdolan
        </a>
      </span>
      <span aria-hidden>·</span>
      <a className={link} href={LINKS.source} target="_blank" rel="noreferrer">
        Source
      </a>
      <span aria-hidden>·</span>
      <a className={link} href={LINKS.docs} target="_blank" rel="noreferrer">
        Docs
      </a>
      <span aria-hidden>·</span>
      <a className={link} href={LINKS.site} target="_blank" rel="noreferrer">
        Site
      </a>
      <span aria-hidden>·</span>
      <a className={cn(link, 'tabular-nums')} href={LINKS.changelog} target="_blank" rel="noreferrer">
        v{version}
      </a>
    </footer>
  );
}
