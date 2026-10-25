import { BITRATES, type Settings } from '@tajdin/core';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@tajdin/ui/components/select';
import { Switch } from '@tajdin/ui/components/switch';
import { ToggleGroup, ToggleGroupItem } from '@tajdin/ui/components/toggle-group';
import { useSettings } from '../../data';
import { usePlatform } from '../../platform';
import { Section, SettingRow } from './common';

const BITRATE_ITEMS = BITRATES.map((b) => ({ value: String(b), label: b === 'auto' ? 'Any quality' : `${b} kbps or better` }));

export function PlaybackSettings() {
  const [settings, update] = useSettings();
  const { kind } = usePlatform();
  return (
    <div className="flex flex-col gap-6">
      <Section title="Playing stations">
        <SettingRow id="play-on-select" label="Play when selected" description="Off: choosing a station only loads it into the player.">
          <Switch id="play-on-select" checked={settings.playOnSelect} onCheckedChange={(c) => void update({ playOnSelect: c })} />
        </SettingRow>
        <SettingRow
          id="autoplay-desktop"
          label="Start playing when the desktop view opens"
          description="Browsers may still ask for one click before sound is allowed."
        >
          <Switch id="autoplay-desktop" checked={settings.autoplayDesktop} onCheckedChange={(c) => void update({ autoplayDesktop: c })} />
        </SettingRow>
        <SettingRow id="bitrate" label="Stream quality" description="Prefer stations streaming at this bitrate or higher.">
          <Select
            items={BITRATE_ITEMS}
            value={String(settings.preferredBitrate)}
            onValueChange={(v) => void update({ preferredBitrate: (v === 'auto' ? 'auto' : Number(v)) as Settings['preferredBitrate'] })}
          >
            <SelectTrigger id="bitrate" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {BITRATE_ITEMS.map((b) => (
                  <SelectItem key={b.value} value={b.value}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </SettingRow>
      </Section>

      <Section title="Song information" description="Many stations send the artist and title of what’s on air.">
        <SettingRow
          id="now-playing"
          label="Show what’s playing"
          description={
            kind === 'web'
              ? 'On the website this works for SomaFM, laut.fm and streams that allow it.'
              : 'Read from the station’s stream or directory. Uses a little extra data.'
          }
        >
          <Switch id="now-playing" checked={settings.showNowPlaying} onCheckedChange={(c) => void update({ showNowPlaying: c })} />
        </SettingRow>
        <SettingRow label="Position" description="Show the song line above or below the player.">
          <ToggleGroup
            variant="outline"
            disabled={!settings.showNowPlaying}
            value={[settings.nowPlayingPosition]}
            onValueChange={(v: string[]) => v[0] && void update({ nowPlayingPosition: v[0] as 'top' | 'bottom' })}
          >
            <ToggleGroupItem value="top">Above</ToggleGroupItem>
            <ToggleGroupItem value="bottom">Below</ToggleGroupItem>
          </ToggleGroup>
        </SettingRow>
      </Section>

      {kind === 'extension' && (
        <Section title="Toolbar icon">
          <SettingRow id="animated-icon" label="Animate while playing" description="The Roj icon pulses green while a station plays, so you can tell at a glance.">
            <Switch id="animated-icon" checked={settings.animatedIcon} onCheckedChange={(c) => void update({ animatedIcon: c })} />
          </SettingRow>
        </Section>
      )}
    </div>
  );
}
