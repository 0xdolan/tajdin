import {
  BookMarkedIcon,
  BookOpenIcon,
  BugIcon,
  CodeIcon,
  GlobeIcon,
  HeartIcon,
  ShieldCheckIcon,
} from 'lucide-react';
import memUZinCover from '../../../../../../assets/images/mem-u-zin.webp';
import { Button } from '@tajdin/ui/components/button';
import { Separator } from '@tajdin/ui/components/separator';
import { RojMark } from '../../components/brand';
import { LINKS, usePlatform } from '../../platform';
import { Section } from './common';

export function AboutSettings() {
  const { version, storeLinks } = usePlatform();
  const links = [
    { href: LINKS.site, label: 'Website', icon: GlobeIcon },
    { href: LINKS.docs, label: 'User guide', icon: BookOpenIcon },
    { href: LINKS.source, label: 'Source code', icon: CodeIcon },
    { href: LINKS.issues, label: 'Report a problem', icon: BugIcon },
    { href: LINKS.privacy, label: 'Privacy policy', icon: ShieldCheckIcon },
  ];
  return (
    <div className="flex flex-col gap-6">
      <Section title="Tajdîn">
        <div className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-[oklch(0.22_0.06_282)]">
            <RojMark className="w-11" live />
          </div>
          <div>
            <p className="text-lg font-semibold">Tajdîn · always by your side</p>
            <p className="text-muted-foreground text-sm">
              Version {version} ·{' '}
              <a
                className="underline-offset-2 hover:underline"
                href={LINKS.changelog}
                target="_blank"
                rel="noreferrer"
              >
                What’s new
              </a>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {links.map(({ href, label, icon: Icon }) => (
            <Button
              key={href}
              variant="outline"
              size="sm"
              render={<a href={href} target="_blank" rel="noreferrer" />}
            >
              <Icon data-icon="inline-start" />
              {label}
            </Button>
          ))}
          {storeLinks.map((s) => (
            <Button
              key={s.href}
              variant="outline"
              size="sm"
              render={<a href={s.href} target="_blank" rel="noreferrer" />}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </Section>

      <Section title="Why Tajdîn?">
        <div className="text-muted-foreground flex max-w-prose flex-col gap-3 text-sm leading-relaxed">
          <p>
            Radio keeps people close to home. For Kurdish listeners spread across many countries,
            it’s often the easiest way to hear their own language, but Kurdish stations are hard to
            find in big global directories. Tajdîn puts a hand-picked Kurdish list next to the
            world’s open radio directories, in a player that keeps going while you browse. Its logo
            is the <em>Roj</em>, the sun from Kurdish <em>deq</em> tattoos, a sign of life and
            light, here broadcasting.
          </p>
          <p>
            No accounts. No tracking. No servers of our own. Everything you save stays in your
            browser.
          </p>
        </div>
      </Section>

      <Section title="The name: Tajdîn, from Mem û Zîn">
        <div className="flex flex-col gap-5 sm:flex-row">
          <figure className="shrink-0">
            <img
              src={memUZinCover}
              alt="Cover of Mem û Zîn: Mem and Zîn in Kurdish dress beneath the trees"
              width={160}
              height={160}
              loading="lazy"
              className="size-40 rounded-xl object-cover shadow-md"
            />
            <figcaption className="text-muted-foreground mt-1.5 text-center text-xs">
              <em>Mem û Zîn</em>, 1692
            </figcaption>
          </figure>
          <div className="text-muted-foreground flex max-w-prose flex-col gap-3 text-sm leading-relaxed">
            <p>
              The name comes from{' '}
              <a
                className="text-foreground font-medium underline-offset-2 hover:underline"
                href={LINKS.memUZinWiki}
                target="_blank"
                rel="noreferrer"
              >
                <em>Mem û Zîn</em>
              </a>
              , the great Kurdish love epic written in 1692 by{' '}
              <a
                className="text-foreground font-medium underline-offset-2 hover:underline"
                href={LINKS.ehmedeXaniWiki}
                target="_blank"
                rel="noreferrer"
              >
                Ehmedê Xanî
              </a>
              . It tells of Mem and Zîn, two lovers kept apart by the jealous Beko, and it is often
              called the national epic of Kurdish literature.
            </p>
            <p>
              <strong className="text-foreground">Tajdîn</strong> (Tacdîn) is Mem’s best friend. He
              stands by Mem to the very end, and when Beko’s treachery comes to light, it is Tajdîn
              who avenges him. A loyal companion who never leaves your side: that’s what this radio
              wants to be. Hence the motto, <em>always by your side</em>.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                render={<a href={LINKS.memUZinWiki} target="_blank" rel="noreferrer" />}
              >
                <GlobeIcon data-icon="inline-start" />
                Mem û Zîn on Wikipedia
              </Button>
              <Button
                variant="outline"
                size="sm"
                render={<a href={LINKS.memUZinBook} target="_blank" rel="noreferrer" />}
              >
                <BookMarkedIcon data-icon="inline-start" />
                Read the book
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Credits">
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            Station data from{' '}
            <a
              className="font-medium underline-offset-2 hover:underline"
              href={LINKS.radioBrowser}
              target="_blank"
              rel="noreferrer"
            >
              Radio Browser
            </a>
            , a free, community-run directory.
          </li>
          <li>
            Channels from{' '}
            <a
              className="font-medium underline-offset-2 hover:underline"
              href={LINKS.somafm}
              target="_blank"
              rel="noreferrer"
            >
              SomaFM
            </a>{' '}
            (listener-supported; please consider donating) and{' '}
            <a
              className="font-medium underline-offset-2 hover:underline"
              href={LINKS.lautfm}
              target="_blank"
              rel="noreferrer"
            >
              laut.fm
            </a>
            .
          </li>
          <li>
            Kurdish station list curated by the Tajdîn community. Missing a station? Open an issue.
          </li>
        </ul>
        <Separator />
        <p className="text-muted-foreground flex flex-wrap items-center gap-1 text-xs">
          Made with
          <HeartIcon
            className="fill-destructive text-destructive size-3.5"
            role="img"
            aria-label="love"
          />
          by
          <a
            className="underline-offset-2 hover:underline"
            href={LINKS.author}
            target="_blank"
            rel="noreferrer"
          >
            0xdolan
          </a>
          · Open source under the MIT licence.
        </p>
      </Section>
    </div>
  );
}
