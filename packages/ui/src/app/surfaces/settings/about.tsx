import { BookOpenIcon, BugIcon, CodeIcon, GlobeIcon, ShieldCheckIcon } from 'lucide-react';
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
            <p className="text-sm text-muted-foreground">
              Version {version} ·{' '}
              <a className="underline-offset-2 hover:underline" href={LINKS.changelog} target="_blank" rel="noreferrer">
                What’s new
              </a>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {links.map(({ href, label, icon: Icon }) => (
            <Button key={href} variant="outline" size="sm" render={<a href={href} target="_blank" rel="noreferrer" />}>
              <Icon data-icon="inline-start" />
              {label}
            </Button>
          ))}
          {storeLinks.map((s) => (
            <Button key={s.href} variant="outline" size="sm" render={<a href={s.href} target="_blank" rel="noreferrer" />}>
              {s.label}
            </Button>
          ))}
        </div>
      </Section>

      <Section title="Why Tajdîn?">
        <div className="flex max-w-prose flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Radio keeps people close to home. For Kurdish listeners spread across many countries, it’s often the easiest way to hear
            their own language, news and music, but Kurdish stations are hard to find in big global directories.
          </p>
          <p>
            Tajdîn puts a hand-picked Kurdish station list next to the world’s open radio directories, in a player that stays with
            you while you browse. Its logo is the <em>Roj</em>, the sun from Kurdish <em>deq</em> tattoos, a sign of life and light.
          </p>
          <p>No accounts, no tracking, no servers of our own. Everything you save stays in your browser.</p>
        </div>
      </Section>

      <Section title="Credits">
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            Station data from{' '}
            <a className="font-medium underline-offset-2 hover:underline" href={LINKS.radioBrowser} target="_blank" rel="noreferrer">
              Radio Browser
            </a>
            , a free, community-run directory.
          </li>
          <li>
            Channels from{' '}
            <a className="font-medium underline-offset-2 hover:underline" href={LINKS.somafm} target="_blank" rel="noreferrer">
              SomaFM
            </a>{' '}
            (listener-supported; please consider donating) and{' '}
            <a className="font-medium underline-offset-2 hover:underline" href={LINKS.lautfm} target="_blank" rel="noreferrer">
              laut.fm
            </a>
            .
          </li>
          <li>Kurdish station list curated by the Tajdîn community. Missing a station? Open an issue.</li>
        </ul>
        <Separator />
        <p className="text-xs text-muted-foreground">
          Made with love by{' '}
          <a className="underline-offset-2 hover:underline" href={LINKS.author} target="_blank" rel="noreferrer">
            0xdolan
          </a>
          . Open source under the MIT licence.
        </p>
      </Section>
    </div>
  );
}
