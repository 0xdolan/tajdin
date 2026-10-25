import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { DownloadIcon, FileJsonIcon, UploadIcon } from 'lucide-react';
import {
  applyImport,
  backupFileName,
  BackupError,
  createBackup,
  parseBackup,
  presentSections,
  previewImport,
  SECTION_LABELS,
  SECTIONS,
  type BackupContents,
  type ImportMode,
  type Section as BackupSection,
} from '@tajdin/core';
import { Alert, AlertDescription, AlertTitle } from '@tajdin/ui/components/alert';
import { Button } from '@tajdin/ui/components/button';
import { Checkbox } from '@tajdin/ui/components/checkbox';
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@tajdin/ui/components/field';
import { RadioGroup, RadioGroupItem } from '@tajdin/ui/components/radio-group';
import { useLibrary, useSettings } from '../../data';
import { usePlatform } from '../../platform';
import { Section } from './common';

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function SectionChecklist({
  available,
  selected,
  onChange,
  counts,
  idPrefix,
}: {
  available: readonly BackupSection[];
  selected: Set<BackupSection>;
  onChange: (s: Set<BackupSection>) => void;
  counts?: Partial<Record<BackupSection, string>>;
  idPrefix: string;
}) {
  return (
    <FieldGroup data-slot="checkbox-group" className="gap-2.5">
      {available.map((s) => (
        <Field key={s} orientation="horizontal">
          <Checkbox
            id={`${idPrefix}-${s}`}
            checked={selected.has(s)}
            onCheckedChange={(c) => {
              const next = new Set(selected);
              if (c === true) next.add(s);
              else next.delete(s);
              onChange(next);
            }}
          />
          <FieldContent>
            <FieldLabel htmlFor={`${idPrefix}-${s}`}>{SECTION_LABELS[s]}</FieldLabel>
            {counts?.[s] && <FieldDescription>{counts[s]}</FieldDescription>}
          </FieldContent>
        </Field>
      ))}
    </FieldGroup>
  );
}

export function BackupSettings() {
  const { version } = usePlatform();
  const [settings] = useSettings();
  const [library] = useLibrary();
  const { repository } = usePlatform();
  const [exportSections, setExportSections] = useState(new Set<BackupSection>(SECTIONS));
  const [imported, setImported] = useState<{ name: string; contents: BackupContents } | null>(null);
  const [importSections, setImportSections] = useState(new Set<BackupSection>());
  const [mode, setMode] = useState<ImportMode>('merge');
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const counts: Record<BackupSection, string> = {
    settings: 'Theme, start screen, playback and search preferences',
    favourites: `${library.favourites.length} stations`,
    playlists: `${library.playlists.length} playlists`,
    groups: `${library.groups.length} groups (including language groups)`,
    customStations: `${library.customStations.length} stations you added`,
  };

  const doExport = () => {
    const backup = createBackup({ settings, library, sections: [...exportSections], appVersion: version });
    download(backupFileName(), JSON.stringify(backup, null, 2));
    toast.success('Backup downloaded');
  };

  const onFile = async (file: File | undefined) => {
    setError(null);
    setImported(null);
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setError('That file is too large to be a Tajdîn backup.');
      return;
    }
    try {
      const contents = parseBackup(await file.text());
      setImported({ name: file.name, contents });
      setImportSections(new Set(presentSections(contents)));
    } catch (e) {
      setError(e instanceof BackupError ? e.message : 'Couldn’t read that file.');
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const doImport = async () => {
    if (!imported) return;
    const result = applyImport(imported.contents, { settings, library }, mode, [...importSections]);
    // One write for everything, so a failure can't leave half an import behind.
    // Every open page (this one included) picks the change up from storage events.
    await repository.replaceAll(result);
    toast.success(mode === 'merge' ? 'Backup merged into your library' : 'Library replaced from backup');
    setImported(null);
  };

  const preview = imported ? previewImport(imported.contents, library) : [];

  return (
    <div className="flex flex-col gap-6">
      <Section title="Export" description="Everything is stored only in this browser. Export a backup to keep it safe or move it to another browser or computer.">
        <FieldSet>
          <FieldLegend variant="label">Include</FieldLegend>
          <SectionChecklist available={SECTIONS} selected={exportSections} onChange={setExportSections} counts={counts} idPrefix="export" />
        </FieldSet>
        <div>
          <Button onClick={doExport} disabled={exportSections.size === 0}>
            <DownloadIcon data-icon="inline-start" />
            Download backup (.json)
          </Button>
        </div>
      </Section>

      <Section title="Import" description="Restore a backup from Tajdîn (any version), the website or another browser. Nothing changes until you confirm.">
        <input ref={fileInput} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} onChange={(e) => void onFile(e.target.files?.[0])} />
        <div>
          <Button variant="outline" onClick={() => fileInput.current?.click()}>
            <UploadIcon data-icon="inline-start" />
            Choose backup file…
          </Button>
        </div>
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertTitle>Can’t import this file</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {imported && (
          <div className="flex flex-col gap-5 rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm">
              <FileJsonIcon className="size-4 text-muted-foreground" />
              <span className="font-medium">{imported.name}</span>
              <span className="text-muted-foreground">
                · exported {new Date(imported.contents.exportedAt).toLocaleString()}
                {imported.contents.fileVersion === 1 && ' · from Tajdîn 0.0.x'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">What the import will change</caption>
                <thead className="text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="py-1 font-medium">Section</th>
                    <th className="py-1 text-right font-medium">New</th>
                    <th className="py-1 text-right font-medium">Updated</th>
                    <th className="py-1 text-right font-medium">Same</th>
                    <th className="py-1 text-right font-medium">{mode === 'merge' ? 'Kept (only here)' : 'Removed'}</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {preview.map((p) => (
                    <tr key={p.section} className="border-t">
                      <td className="py-1.5">{SECTION_LABELS[p.section]}</td>
                      <td className="py-1.5 text-right">{p.section === 'settings' ? '—' : p.added}</td>
                      <td className="py-1.5 text-right">{p.section === 'settings' ? 'replaced' : p.updated}</td>
                      <td className="py-1.5 text-right">{p.section === 'settings' ? '—' : p.unchanged}</td>
                      <td className="py-1.5 text-right">{p.section === 'settings' ? '—' : p.localOnly}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <FieldSet>
              <FieldLegend variant="label">Sections to import</FieldLegend>
              <SectionChecklist available={presentSections(imported.contents)} selected={importSections} onChange={setImportSections} idPrefix="import" />
            </FieldSet>
            <FieldSet>
              <FieldLegend variant="label">How</FieldLegend>
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as ImportMode)}>
                <Field orientation="horizontal">
                  <RadioGroupItem value="merge" id="mode-merge" />
                  <FieldContent>
                    <FieldLabel htmlFor="mode-merge">Merge</FieldLabel>
                    <FieldDescription>Add what’s new and update matching items. Nothing on this device is removed.</FieldDescription>
                  </FieldContent>
                </Field>
                <Field orientation="horizontal">
                  <RadioGroupItem value="replace" id="mode-replace" />
                  <FieldContent>
                    <FieldLabel htmlFor="mode-replace">Replace</FieldLabel>
                    <FieldDescription>Make the chosen sections exactly like the backup.</FieldDescription>
                  </FieldContent>
                </Field>
              </RadioGroup>
            </FieldSet>
            <div className="flex gap-2">
              <Button onClick={() => void doImport()} disabled={importSections.size === 0} variant={mode === 'replace' ? 'destructive' : 'default'}>
                {mode === 'merge' ? 'Merge backup' : 'Replace with backup'}
              </Button>
              <Button variant="ghost" onClick={() => setImported(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
