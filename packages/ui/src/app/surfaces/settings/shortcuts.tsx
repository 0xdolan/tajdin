import { useEffect, useState } from 'react';
import { KeyboardIcon } from 'lucide-react';
import { Button } from '@tajdin/ui/components/button';
import { Kbd, KbdGroup } from '@tajdin/ui/components/kbd';
import { usePlatform, type ShortcutInfo } from '../../platform';
import { Section } from './common';

const IN_APP: [string[], string][] = [
  [['Space'], 'Play / pause'],
  [['N'], 'Next station'],
  [['P'], 'Previous station'],
  [['R'], 'Random station from the list'],
  [['M'], 'Mute / unmute'],
  [['↑', '↓'], 'Volume up / down'],
];

export function ShortcutsSettings() {
  const { getShortcuts, openShortcutEditor, kind } = usePlatform();
  const [shortcuts, setShortcuts] = useState<ShortcutInfo[] | null>(null);
  useEffect(() => {
    void getShortcuts?.().then(setShortcuts);
  }, [getShortcuts]);

  return (
    <div className="flex flex-col gap-6">
      {kind === 'extension' && (
        <Section
          title="Browser-wide shortcuts"
          description="These work anywhere in the browser, even with the popup closed. Your keyboard’s media keys work too."
          action={
            openShortcutEditor && (
              <Button size="sm" variant="outline" onClick={openShortcutEditor}>
                <KeyboardIcon data-icon="inline-start" />
                Change shortcuts
              </Button>
            )
          }
        >
          <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-3 text-sm">
            {(shortcuts ?? []).map((s) => (
              <div key={s.name} className="contents">
                <dt>{s.description}</dt>
                <dd>{s.shortcut ? <Kbd>{s.shortcut}</Kbd> : <span className="text-muted-foreground">Not set</span>}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}
      <Section title="In Tajdîn" description="While the popup or desktop view is focused (not while typing).">
        <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-3 text-sm">
          {IN_APP.map(([keys, label]) => (
            <div key={label} className="contents">
              <dt>{label}</dt>
              <dd>
                <KbdGroup>
                  {keys.map((k) => (
                    <Kbd key={k}>{k}</Kbd>
                  ))}
                </KbdGroup>
              </dd>
            </div>
          ))}
        </dl>
      </Section>
    </div>
  );
}
