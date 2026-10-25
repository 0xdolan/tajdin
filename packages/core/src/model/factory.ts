import { z } from 'zod';
import { cleanText } from '../util/text';
import { hostOf, toHttpUrl } from '../util/url';
import { uuid } from '../util/random';
import { stationId, StationSchema, type LocalStation, type Station } from './station';

export const CustomStationInputSchema = z.object({
  name: z.string().trim().min(1, 'Give the station a name').max(200),
  streamUrl: z
    .string()
    .trim()
    .refine((v) => !!toHttpUrl(v), 'Use an http:// or https:// stream URL'),
  favicon: z
    .string()
    .trim()
    .refine((v) => !v || !!toHttpUrl(v), 'Use an http:// or https:// image URL')
    .optional(),
  homepage: z
    .string()
    .trim()
    .refine((v) => !v || !!toHttpUrl(v), 'Use an http:// or https:// URL')
    .optional(),
  languages: z.array(z.string()).max(12).optional(),
  tags: z.array(z.string()).max(12).optional(),
});
export type CustomStationInput = z.input<typeof CustomStationInputSchema>;

/** Validates form input into a custom station. Keeps the ID when editing an existing one. */
export function makeCustomStation(input: CustomStationInput, existingId?: string): Station {
  const v = CustomStationInputSchema.parse(input);
  return StationSchema.parse({
    id: existingId ?? stationId('custom', uuid()),
    source: 'custom',
    name: cleanText(v.name, 200),
    streamUrl: v.streamUrl,
    favicon: v.favicon || undefined,
    homepage: v.homepage || undefined,
    languages: v.languages ?? [],
    tags: (v.tags ?? []).map((t) => cleanText(t, 40).toLowerCase()).filter(Boolean),
  });
}

/** A one-off station for "play any link". It can be saved as a custom station afterwards. */
export function stationFromUrl(url: string): Station | undefined {
  const href = toHttpUrl(url);
  if (!href) return undefined;
  const name =
    decodeURIComponent(new URL(href).pathname.split('/').filter(Boolean).pop() ?? '') ||
    hostOf(href);
  return StationSchema.parse({
    id: stationId('url', href),
    source: 'url',
    name: cleanText(`${hostOf(href)}${name && name !== hostOf(href) ? ` · ${name}` : ''}`, 200),
    streamUrl: href,
  });
}

export function stationFromFile(file: File, id: string = uuid()): LocalStation {
  return {
    id: stationId('local', id),
    source: 'local',
    name: cleanText(file.name.replace(/\.[a-z0-9]{2,5}$/i, ''), 200) || 'Local file',
    fileName: file.name,
    streamUrl: `local:${id}`,
    languages: [],
    tags: [],
  };
}

/** Audio types the picker offers. Browsers decide what they can actually decode. */
export const AUDIO_FILE_ACCEPT = 'audio/*,.mp3,.m4a,.aac,.ogg,.oga,.opus,.flac,.wav,.weba,.webm';
