import { LaptopIcon, MoonIcon, SunIcon } from 'lucide-react';
import { DIRECTORY_SOURCES, LANGUAGES, type DirectorySourceId, type StartView, type Theme } from '@tajdin/core';
import { Button } from '@tajdin/ui/components/button';
import { Checkbox } from '@tajdin/ui/components/checkbox';
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@tajdin/ui/components/field';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@tajdin/ui/components/select';
import { Switch } from '@tajdin/ui/components/switch';
import { ToggleGroup, ToggleGroupItem } from '@tajdin/ui/components/toggle-group';
import { useLibrary, useSettings } from '../../data';
import { Section, SettingRow } from './common';

const SOURCE_INFO: Record<DirectorySourceId, { name: string; description: string }> = {
  curated: { name: 'Tajdîn Kurdish list', description: 'Hand-picked Kurdish stations bundled with Tajdîn.' },
  'radio-browser': { name: 'Radio Browser', description: 'The open community directory: 50,000+ stations worldwide.' },
  somafm: { name: 'SomaFM', description: '~50 listener-supported, commercial-free channels from San Francisco.' },
  lautfm: { name: 'laut.fm', description: '~17,000 user-run stations, mostly music, from Germany.' },
};

function encodeStartView(v: StartView): string {
  return v.kind === 'random' || v.kind === 'favourites' ? v.kind : v.kind === 'language' ? `language:${v.language}` : `${v.kind}:${v.id}`;
}

function decodeStartView(value: string): StartView {
  if (value === 'random' || value === 'favourites') return { kind: value };
  const split = value.indexOf(':');
  const kind = value.slice(0, split);
  const rest = value.slice(split + 1);
  if (kind === 'language') return { kind: 'language', language: rest };
  if (kind === 'playlist') return { kind: 'playlist', id: rest };
  if (kind === 'group') return { kind: 'group', id: rest };
  return { kind: 'random' };
}

const LANGUAGE_ITEMS = [{ value: '', label: 'All languages' }, ...LANGUAGES.map((l) => ({ value: l.code, label: `${l.name} · ${l.native}` }))];

export function GeneralSettings() {
  const [settings, update] = useSettings();
  const [library] = useLibrary();

  const startItems = [
    { value: 'random', label: 'A random mix (new every time)' },
    { value: 'favourites', label: 'Favourites' },
    ...LANGUAGES.map((l) => ({ value: `language:${l.code}`, label: `Language: ${l.name}` })),
    ...library.playlists.map((p) => ({ value: `playlist:${p.id}`, label: `Playlist: ${p.name}` })),
    ...library.groups.map((g) => ({ value: `group:${g.id}`, label: `Group: ${g.name}` })),
  ];

  const toggleSource = (id: DirectorySourceId, on: boolean) => {
    const next = on ? [...new Set([...settings.sources, id])] : settings.sources.filter((s) => s !== id);
    if (next.length) void update({ sources: DIRECTORY_SOURCES.filter((s) => next.includes(s)) });
  };

  return (
    <div className="flex flex-col gap-6">
      <Section title="Appearance">
        <SettingRow label="Theme" description="System follows your operating system’s light or dark mode.">
          <ToggleGroup variant="outline" value={[settings.theme]} onValueChange={(v: string[]) => v[0] && void update({ theme: v[0] as Theme })}>
            <ToggleGroupItem value="system" aria-label="System">
              <LaptopIcon data-icon="inline-start" />
              System
            </ToggleGroupItem>
            <ToggleGroupItem value="light" aria-label="Light">
              <SunIcon data-icon="inline-start" />
              Light
            </ToggleGroupItem>
            <ToggleGroupItem value="dark" aria-label="Dark">
              <MoonIcon data-icon="inline-start" />
              Dark
            </ToggleGroupItem>
          </ToggleGroup>
        </SettingRow>
        <SettingRow label="Welcome tips" description="Show the first-run tips in the popup again.">
          <Button variant="outline" size="sm" disabled={!settings.welcomeDismissed} onClick={() => void update({ welcomeDismissed: false })}>
            Show again
          </Button>
        </SettingRow>
      </Section>

      <Section title="Start screen" description="What the popup and desktop view show when they open.">
        <SettingRow id="start-view" label="Open on">
          <Select items={startItems} value={encodeStartView(settings.startView)} onValueChange={(v) => void update({ startView: decodeStartView(String(v)) })}>
            <SelectTrigger id="start-view" className="w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {startItems.slice(0, 2).map((i) => (
                  <SelectItem key={i.value} value={i.value}>
                    {i.label}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Languages</SelectLabel>
                {startItems.filter((i) => i.value.startsWith('language:')).map((i) => (
                  <SelectItem key={i.value} value={i.value}>
                    {i.label}
                  </SelectItem>
                ))}
              </SelectGroup>
              {library.playlists.length + library.groups.length > 0 && (
                <>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>Your lists</SelectLabel>
                    {startItems.filter((i) => i.value.startsWith('playlist:') || i.value.startsWith('group:')).map((i) => (
                      <SelectItem key={i.value} value={i.value}>
                        {i.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </>
              )}
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow id="default-language" label="Random mix language" description="Narrow the random mix and new searches to one language.">
          <Select items={LANGUAGE_ITEMS} value={settings.defaultLanguage} onValueChange={(v) => void update({ defaultLanguage: String(v ?? '') })}>
            <SelectTrigger id="default-language" className="w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {LANGUAGE_ITEMS.map((l) => (
                  <SelectItem key={l.value || 'all'} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </SettingRow>
      </Section>

      <Section title="Stations & search">
        <FieldSet>
          <FieldLegend variant="label">Directories</FieldLegend>
          <FieldDescription>Where the random mix and search look for stations. At least one stays on.</FieldDescription>
          <FieldGroup data-slot="checkbox-group" className="gap-3">
            {DIRECTORY_SOURCES.map((id) => (
              <Field key={id} orientation="horizontal">
                <Checkbox
                  id={`source-${id}`}
                  checked={settings.sources.includes(id)}
                  disabled={settings.sources.length === 1 && settings.sources.includes(id)}
                  onCheckedChange={(c) => toggleSource(id, c === true)}
                />
                <FieldContent>
                  <FieldLabel htmlFor={`source-${id}`}>{SOURCE_INFO[id].name}</FieldLabel>
                  <FieldDescription>{SOURCE_INFO[id].description}</FieldDescription>
                </FieldContent>
              </Field>
            ))}
          </FieldGroup>
        </FieldSet>
        <SettingRow label="Default search mode" description="Name search, or regular expressions for power users.">
          <ToggleGroup variant="outline" value={[settings.searchMode]} onValueChange={(v: string[]) => v[0] && void update({ searchMode: v[0] as 'exact' | 'regex' })}>
            <ToggleGroupItem value="exact">Name</ToggleGroupItem>
            <ToggleGroupItem value="regex">Regex</ToggleGroupItem>
          </ToggleGroup>
        </SettingRow>
        <SettingRow id="hide-broken" label="Hide offline stations" description="Skip stations that failed the directory’s last health check.">
          <Switch id="hide-broken" checked={settings.hideBroken} onCheckedChange={(c) => void update({ hideBroken: c })} />
        </SettingRow>
      </Section>
    </div>
  );
}
