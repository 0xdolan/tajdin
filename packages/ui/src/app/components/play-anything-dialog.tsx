import { useRef, useState, type FormEvent } from 'react';
import { FileAudioIcon, LinkIcon, PlayIcon } from 'lucide-react';
import { AUDIO_FILE_ACCEPT, isInsecureUrl, stationFromUrl, type Station } from '@tajdin/core';
import { Button } from '@tajdin/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@tajdin/ui/components/dialog';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@tajdin/ui/components/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@tajdin/ui/components/input-group';
import { usePlayer } from '../hooks';
import { usePlatform } from '../platform';

/** Paste any stream link or pick an audio file from disk, and it plays. Files are kept for this session only. */
export function PlayAnythingDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (station: Station) => void;
}) {
  const { send, playFile } = usePlayer();
  const { playsHttp } = usePlatform();
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<Station | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const playUrl = async (event: FormEvent) => {
    event.preventDefault();
    const station = stationFromUrl(url);
    if (!station) {
      setError('Paste a link that starts with http:// or https://');
      return;
    }
    setError(null);
    setLast(station);
    await send({ type: 'play', station, context: { kind: 'single', label: station.name } });
  };

  const pickFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    await playFile(file);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setError(null);
          setLast(null);
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Play a link or file</DialogTitle>
          <DialogDescription>
            Tajdîn plays any audio stream URL or audio file on your computer.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={playUrl}>
          <FieldGroup>
            <Field data-invalid={error ? true : undefined}>
              <FieldLabel htmlFor="play-url">Stream link</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <LinkIcon />
                </InputGroupAddon>
                <InputGroupInput
                  id="play-url"
                  type="url"
                  inputMode="url"
                  autoFocus
                  placeholder="https://… .mp3, .aac, .m3u8"
                  value={url}
                  aria-invalid={!!error}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <InputGroupAddon align="inline-end">
                  <Button type="submit" size="sm" disabled={!url.trim()}>
                    <PlayIcon data-icon="inline-start" />
                    Play
                  </Button>
                </InputGroupAddon>
              </InputGroup>
              {error ? (
                <FieldDescription>{error}</FieldDescription>
              ) : !playsHttp && isInsecureUrl(url.trim()) ? (
                <FieldDescription>
                  This site is https, so http:// links are tried over https. If that fails, use the
                  extension.
                </FieldDescription>
              ) : null}
            </Field>
            {last && (
              <Button type="button" variant="outline" onClick={() => onSave(last)}>
                Save “{last.name}” to my stations
              </Button>
            )}
            <FieldSeparator>or</FieldSeparator>
            <Field>
              <input
                ref={fileInput}
                type="file"
                accept={AUDIO_FILE_ACCEPT}
                className="sr-only"
                tabIndex={-1}
                onChange={(e) => void pickFile(e.target.files)}
              />
              <Button type="button" variant="secondary" onClick={() => fileInput.current?.click()}>
                <FileAudioIcon data-icon="inline-start" />
                Choose an audio file…
              </Button>
              <FieldDescription>
                Files play for this session only and aren’t saved or uploaded anywhere.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
