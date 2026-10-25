import { foldKey } from '../util/text';

export interface Language {
  /** ISO 639-1 where one exists, otherwise ISO 639-3. */
  code: string;
  name: string;
  native: string;
  /** Names Radio Browser and other directories use for this language (lower-case). */
  aliases: string[];
}

/**
 * Languages people most often look for. Anything else coming from a directory is still kept,
 * using its raw name as the code (see {@link normaliseLanguage}).
 */
export const LANGUAGES: readonly Language[] = [
  {
    code: 'ku',
    name: 'Kurdish',
    native: 'Kurdî / کوردی',
    aliases: ['kurdish', 'kurdi', 'kurdî', 'kurmanji', 'kurmancî', 'sorani', 'soranî', 'کوردی', 'ckb', 'kmr'],
  },
  { code: 'ar', name: 'Arabic', native: 'العربية', aliases: ['arabic', 'arab'] },
  { code: 'fa', name: 'Persian', native: 'فارسی', aliases: ['persian', 'farsi', 'dari'] },
  { code: 'tr', name: 'Turkish', native: 'Türkçe', aliases: ['turkish', 'türkçe'] },
  { code: 'en', name: 'English', native: 'English', aliases: ['english', 'american english', 'british english'] },
  { code: 'de', name: 'German', native: 'Deutsch', aliases: ['german', 'deutsch'] },
  { code: 'fr', name: 'French', native: 'Français', aliases: ['french', 'français', 'francais'] },
  { code: 'es', name: 'Spanish', native: 'Español', aliases: ['spanish', 'español', 'espanol', 'castellano'] },
  { code: 'it', name: 'Italian', native: 'Italiano', aliases: ['italian', 'italiano'] },
  { code: 'pt', name: 'Portuguese', native: 'Português', aliases: ['portuguese', 'português', 'brazilian portuguese'] },
  { code: 'nl', name: 'Dutch', native: 'Nederlands', aliases: ['dutch', 'nederlands', 'flemish'] },
  { code: 'sv', name: 'Swedish', native: 'Svenska', aliases: ['swedish', 'svenska'] },
  { code: 'no', name: 'Norwegian', native: 'Norsk', aliases: ['norwegian', 'norsk', 'bokmål'] },
  { code: 'da', name: 'Danish', native: 'Dansk', aliases: ['danish', 'dansk'] },
  { code: 'fi', name: 'Finnish', native: 'Suomi', aliases: ['finnish', 'suomi'] },
  { code: 'pl', name: 'Polish', native: 'Polski', aliases: ['polish', 'polski'] },
  { code: 'cs', name: 'Czech', native: 'Čeština', aliases: ['czech', 'čeština'] },
  { code: 'el', name: 'Greek', native: 'Ελληνικά', aliases: ['greek', 'ελληνικά'] },
  { code: 'ru', name: 'Russian', native: 'Русский', aliases: ['russian', 'русский'] },
  { code: 'uk', name: 'Ukrainian', native: 'Українська', aliases: ['ukrainian', 'українська'] },
  { code: 'hy', name: 'Armenian', native: 'Հայերեն', aliases: ['armenian'] },
  { code: 'az', name: 'Azerbaijani', native: 'Azərbaycanca', aliases: ['azerbaijani', 'azeri'] },
  { code: 'he', name: 'Hebrew', native: 'עברית', aliases: ['hebrew'] },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', aliases: ['hindi'] },
  { code: 'ur', name: 'Urdu', native: 'اردو', aliases: ['urdu'] },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', aliases: ['bengali', 'bangla'] },
  { code: 'zh', name: 'Chinese', native: '中文', aliases: ['chinese', 'mandarin', 'cantonese'] },
  { code: 'ja', name: 'Japanese', native: '日本語', aliases: ['japanese'] },
  { code: 'ko', name: 'Korean', native: '한국어', aliases: ['korean'] },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', aliases: ['indonesian', 'bahasa indonesia'] },
  { code: 'sw', name: 'Swahili', native: 'Kiswahili', aliases: ['swahili', 'kiswahili'] },
];

const byCode = new Map(LANGUAGES.map((l) => [l.code, l]));
const byAlias = new Map<string, Language>();
for (const language of LANGUAGES) {
  byAlias.set(foldKey(language.code), language);
  for (const alias of language.aliases) byAlias.set(foldKey(alias), language);
}

/**
 * Maps a directory language name or code ("Kurmanji", "ku-IQ", "ckb", "ENGLISH") to one stable code.
 * Regional variants collapse into their parent language; unknown names become a lower-case slug.
 */
export function normaliseLanguage(raw: string): string {
  const key = foldKey(raw.trim());
  if (!key) return '';
  const known = byAlias.get(key) ?? byAlias.get(key.split(/[-_]/)[0] ?? '');
  return known ? known.code : key.replace(/\s+/g, '-');
}

export function getLanguage(code: string): Language | undefined {
  return byCode.get(code);
}

export function languageLabel(code: string): string {
  const known = byCode.get(code);
  if (known) return known.name;
  return code.replace(/-/g, ' ').replace(/\b\p{L}/gu, (c) => c.toUpperCase());
}

/** The name Radio Browser expects in its `language` filter. */
export function radioBrowserLanguageName(code: string): string {
  return byCode.get(code)?.aliases[0] ?? code.replace(/-/g, ' ');
}
