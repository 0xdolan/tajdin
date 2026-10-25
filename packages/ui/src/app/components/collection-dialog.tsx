import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import {
  addToCollection,
  COLOURS,
  createGroup,
  createPlaylist,
  LANGUAGES,
  updateGroup,
  updatePlaylist,
  type Colour,
  type Station,
} from '@tajdin/core';
import { Button } from '@tajdin/ui/components/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@tajdin/ui/components/dialog';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@tajdin/ui/components/field';
import { Input } from '@tajdin/ui/components/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@tajdin/ui/components/select';
import { Textarea } from '@tajdin/ui/components/textarea';
import { ToggleGroup, ToggleGroupItem } from '@tajdin/ui/components/toggle-group';
import { cn } from '@tajdin/ui/lib/utils';
import { useLibrary } from '../data';

export type CollectionDialogState =
  | { mode: 'create'; kind: 'playlist' | 'group'; addStation?: Station; groupKind?: 'manual' | 'language' }
  | { mode: 'edit'; kind: 'playlist' | 'group'; id: string };

export const COLOUR_SWATCH: Record<Colour, string> = {
  slate: 'oklch(0.6 0.03 260)',
  red: 'oklch(0.63 0.21 25)',
  orange: 'oklch(0.7 0.18 50)',
  amber: 'oklch(0.8 0.16 80)',
  green: 'oklch(0.68 0.17 150)',
  teal: 'oklch(0.7 0.12 190)',
  sky: 'oklch(0.7 0.14 235)',
  violet: 'oklch(0.6 0.2 290)',
  pink: 'oklch(0.7 0.18 350)',
};

const LANGUAGE_ITEMS = LANGUAGES.map((l) => ({ value: l.code, label: `${l.name} · ${l.native}` }));

export function CollectionDialog({ state, onClose }: { state: CollectionDialogState | null; onClose: () => void }) {
  const [library, updateLibrary] = useLibrary();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [colour, setColour] = useState<Colour | undefined>();
  const [groupKind, setGroupKind] = useState<'manual' | 'language'>('manual');
  const [language, setLanguage] = useState('ku');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!state) return;
    setTouched(false);
    if (state.mode === 'edit') {
      const item = state.kind === 'playlist' ? library.playlists.find((p) => p.id === state.id) : library.groups.find((g) => g.id === state.id);
      setName(item?.name ?? '');
      setDescription(item && 'description' in item ? (item.description ?? '') : '');
      setColour(item?.colour);
      setGroupKind(item && 'kind' in item ? item.kind : 'manual');
      setLanguage(item && 'language' in item ? item.language : 'ku');
    } else {
      setName('');
      setDescription('');
      setColour(undefined);
      setGroupKind(state.groupKind ?? 'manual');
      setLanguage('ku');
    }
    // Only reset when the dialog opens for a new target.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (!state) return null;
  const isPlaylist = state.kind === 'playlist';
  const noun = isPlaylist ? 'playlist' : 'group';
  const invalid = !name.trim();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (invalid) return;
    if (state.mode === 'edit') {
      await updateLibrary((l) =>
        isPlaylist
          ? updatePlaylist(l, state.id, { name: name.trim(), description: description.trim() || undefined, colour })
          : updateGroup(l, state.id, { name: name.trim(), colour, language: groupKind === 'language' ? language : undefined }),
      );
      toast.success(`Saved “${name.trim()}”`);
    } else {
      await updateLibrary((l) => {
        const created = isPlaylist
          ? createPlaylist(l, { name, description, colour })
          : createGroup(l, groupKind === 'language' ? { kind: 'language', name, colour, language } : { kind: 'manual', name, colour });
        const id = 'playlist' in created ? created.playlist.id : created.group.id;
        return state.addStation ? addToCollection(created.library, state.kind, id, [state.addStation]) : created.library;
      });
      toast.success(state.addStation ? `Added to new ${noun} “${name.trim()}”` : `Created ${noun} “${name.trim()}”`);
    }
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{state.mode === 'edit' ? `Edit ${noun}` : `New ${noun}`}</DialogTitle>
            <DialogDescription>
              {isPlaylist
                ? 'Playlists keep their order and play through, skipping stations that are offline.'
                : 'Groups collect stations for browsing. A language group fills itself with every station in that language.'}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            {!isPlaylist && (
              <Field>
                <FieldLabel>Type</FieldLabel>
                <ToggleGroup
                  variant="outline"
                  value={[groupKind]}
                  onValueChange={(v: string[]) => v[0] && setGroupKind(v[0] as 'manual' | 'language')}
                  disabled={state.mode === 'edit'}
                >
                  <ToggleGroupItem value="manual">Hand-picked</ToggleGroupItem>
                  <ToggleGroupItem value="language">Language</ToggleGroupItem>
                </ToggleGroup>
              </Field>
            )}
            <Field data-invalid={touched && invalid ? true : undefined}>
              <FieldLabel htmlFor="collection-name">Name</FieldLabel>
              <Input
                id="collection-name"
                dir="auto"
                autoFocus
                maxLength={200}
                value={name}
                aria-invalid={touched && invalid}
                onChange={(e) => setName(e.target.value)}
                placeholder={isPlaylist ? 'Morning drive' : groupKind === 'language' ? 'Kurdish radio' : 'News'}
              />
              {touched && invalid && <FieldDescription>Give it a name.</FieldDescription>}
            </Field>
            {!isPlaylist && groupKind === 'language' && (
              <Field>
                <FieldLabel>Language</FieldLabel>
                <Select items={LANGUAGE_ITEMS} value={language} onValueChange={(v) => v && setLanguage(v as string)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {LANGUAGE_ITEMS.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            )}
            {isPlaylist && (
              <Field>
                <FieldLabel htmlFor="collection-description">Description</FieldLabel>
                <Textarea
                  id="collection-description"
                  dir="auto"
                  maxLength={2000}
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional"
                />
              </Field>
            )}
            <Field>
              <FieldLabel>Colour</FieldLabel>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Colour">
                {COLOURS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={colour === c}
                    aria-label={c}
                    onClick={() => setColour(colour === c ? undefined : c)}
                    className={cn(
                      'size-6 rounded-full ring-offset-2 ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                      colour === c && 'ring-2 ring-foreground',
                    )}
                    style={{ backgroundColor: COLOUR_SWATCH[c] }}
                  />
                ))}
              </div>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{state.mode === 'edit' ? 'Save' : `Create ${noun}`}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
