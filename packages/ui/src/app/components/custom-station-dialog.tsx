import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import {
  CustomStationInputSchema,
  LANGUAGES,
  makeCustomStation,
  splitList,
  upsertCustomStation,
  type Station,
} from '@tajdin/core';
import { Button } from '@tajdin/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@tajdin/ui/components/dialog';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@tajdin/ui/components/field';
import { Input } from '@tajdin/ui/components/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tajdin/ui/components/select';
import { useLibrary } from '../data';
import { useSessionState } from '../hooks';
import { usePlatform } from '../platform';

interface Draft {
  name: string;
  streamUrl: string;
  favicon: string;
  homepage: string;
  language: string;
  tags: string;
}

const EMPTY: Draft = { name: '', streamUrl: '', favicon: '', homepage: '', language: '', tags: '' };
const LANGUAGE_ITEMS = [
  { value: '', label: 'Not set' },
  ...LANGUAGES.map((l) => ({ value: l.code, label: l.name })),
];

/**
 * Add or edit a station of the user's own. Unsaved input for a new station is kept for the
 * browser session, so closing the popup mid-way doesn't lose it.
 */
export function CustomStationDialog({
  open,
  initial,
  onClose,
}: {
  open: boolean;
  initial?: Partial<Station>;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        {open && <StationForm initial={initial} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function fromStation(initial: Partial<Station>): Draft {
  return {
    name: initial.name ?? '',
    streamUrl: initial.streamUrl ?? '',
    favicon: initial.favicon ?? '',
    homepage: initial.homepage ?? '',
    language: initial.languages?.[0] ?? '',
    tags: initial.tags?.join(', ') ?? '',
  };
}

function StationForm({ initial, onClose }: { initial?: Partial<Station>; onClose: () => void }) {
  const { surface } = usePlatform();
  const [, updateLibrary] = useLibrary();
  const editingId = initial?.source === 'custom' ? initial.id : undefined;
  const prefilled = !!(initial?.streamUrl || initial?.name);
  const [draft, setDraft, draftReady] = useSessionState<Draft>(`tajdin.v2.draft.${surface}`, EMPTY);
  const [edited, setEdited] = useState<Draft | null>(prefilled ? fromStation(initial!) : null);
  // Until the user types, a new station shows the saved draft (it loads asynchronously).
  const form = edited ?? draft;
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});

  const change = (key: keyof Draft, value: string) => {
    const next = { ...form, [key]: value };
    setEdited(next);
    if (!editingId) setDraft(next);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const input = {
      name: form.name,
      streamUrl: form.streamUrl,
      favicon: form.favicon,
      homepage: form.homepage,
      languages: form.language ? [form.language] : [],
      tags: splitList(form.tags),
    };
    const result = CustomStationInputSchema.safeParse(input);
    if (!result.success) {
      const next: typeof errors = {};
      for (const issue of result.error.issues) next[issue.path[0] as keyof Draft] ??= issue.message;
      setErrors(next);
      return;
    }
    const station = makeCustomStation(input, editingId);
    await updateLibrary((l) => upsertCustomStation(l, station));
    if (!editingId) setDraft(EMPTY);
    toast.success(
      editingId ? `Saved “${station.name}”` : `Added “${station.name}” to your stations`,
    );
    onClose();
  };

  const field = (
    key: keyof Draft,
    label: string,
    props: React.ComponentProps<typeof Input>,
    hint?: string,
  ) => (
    <Field data-invalid={errors[key] ? true : undefined}>
      <FieldLabel htmlFor={`station-${key}`}>{label}</FieldLabel>
      <Input
        id={`station-${key}`}
        value={form[key]}
        aria-invalid={!!errors[key]}
        onChange={(e) => change(key, e.target.value)}
        {...props}
      />
      {(errors[key] || hint) && <FieldDescription>{errors[key] ?? hint}</FieldDescription>}
    </Field>
  );

  if (!draftReady && !prefilled) return null;
  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <DialogHeader>
        <DialogTitle>{editingId ? 'Edit station' : 'Add a station'}</DialogTitle>
        <DialogDescription>
          Any stream that isn’t in the directories. It’s saved in this browser and included in
          backups.
        </DialogDescription>
      </DialogHeader>
      <FieldGroup>
        {field('name', 'Name', {
          dir: 'auto',
          autoFocus: true,
          maxLength: 200,
          placeholder: 'Dengê Welat',
        })}
        {field(
          'streamUrl',
          'Stream URL',
          { type: 'url', inputMode: 'url', placeholder: 'https://example.com/live.mp3' },
          'MP3, AAC, Ogg or HLS (.m3u8).',
        )}
        {field('favicon', 'Cover image URL', {
          type: 'url',
          inputMode: 'url',
          placeholder: 'Optional',
        })}
        {field('homepage', 'Website', { type: 'url', inputMode: 'url', placeholder: 'Optional' })}
        <Field>
          <FieldLabel>Language</FieldLabel>
          <Select
            items={LANGUAGE_ITEMS}
            value={form.language}
            onValueChange={(v) => change('language', (v as string) ?? '')}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {LANGUAGE_ITEMS.map((l) => (
                  <SelectItem key={l.value || 'none'} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        {field('tags', 'Tags', { placeholder: 'news, music' }, 'Comma-separated, used by search.')}
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">{editingId ? 'Save' : 'Add station'}</Button>
      </DialogFooter>
    </form>
  );
}
