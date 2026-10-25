import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckIcon,
  ChevronDownIcon,
  DicesIcon,
  FolderPlusIcon,
  GlobeIcon,
  HeartIcon,
  LanguagesIcon,
  ListMusicIcon,
  ListPlusIcon,
  RadioTowerIcon,
  RegexIcon,
  SearchIcon,
  ShapesIcon,
  SparklesIcon,
  XIcon,
} from 'lucide-react';
import { cleanText, LANGUAGES, type Library } from '@tajdin/core';
import { Button } from '@tajdin/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@tajdin/ui/components/dropdown-menu';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@tajdin/ui/components/input-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tajdin/ui/components/select';
import { Toggle } from '@tajdin/ui/components/toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@tajdin/ui/components/tooltip';
import { cn } from '@tajdin/ui/lib/utils';
import { useLibrary, useSettings } from '../data';
import { useDialogs } from '../dialogs';
import { isValidSearch, startViewToView, viewLabel, type View } from '../feed';
import { useDebounced, useSessionState } from '../hooks';
import { COLOUR_SWATCH } from './collection-dialog';

/** Search input, kept for the browser session so reopening the popup keeps what you typed. */
export interface SearchState {
  query: string;
  mode: 'exact' | 'regex';
  language: string;
  searchOpen: boolean;
  /** Search defaults from settings are applied once per browser session. */
  initialised: boolean;
}

const INITIAL: SearchState = {
  query: '',
  mode: 'exact',
  language: '',
  searchOpen: false,
  initialised: false,
};

/**
 * Browse state for the popup or desktop view. Every opening starts on the start view from
 * settings (by default a fresh random mix); the search box is restored for the session.
 */
export function useBrowse(key: string) {
  const [settings, , settingsReady] = useSettings();
  const [library, , libraryReady] = useLibrary();
  const [stored, setStored, sessionReady] = useSessionState<SearchState>(key, INITIAL);
  const [chosen, setChosen] = useState<View | null>(null);
  const ready = settingsReady && libraryReady && sessionReady;

  // Until the user picks something, the view and search defaults follow settings.
  const startView = useMemo(() => startViewToView(settings, library), [settings, library]);
  const view = chosen ?? startView;
  const withDefaults = useCallback(
    (s: SearchState): SearchState =>
      s.initialised
        ? s
        : {
            ...s,
            initialised: true,
            mode: settings.searchMode,
            language: settings.defaultLanguage,
          },
    [settings.searchMode, settings.defaultLanguage],
  );
  const state = withDefaults(stored);
  const setState = useCallback(
    (update: SearchState | ((s: SearchState) => SearchState)) =>
      setStored((prev) =>
        withDefaults(typeof update === 'function' ? update(withDefaults(prev)) : update),
      ),
    [setStored, withDefaults],
  );

  const query = useDebounced(cleanText(state.query, 200), 300);
  const validQuery = isValidSearch(query, state.mode);
  const effectiveView: View = useMemo(
    () =>
      query && validQuery
        ? { kind: 'search', text: query, mode: state.mode, language: state.language }
        : view,
    [query, validQuery, state.mode, state.language, view],
  );

  return {
    state,
    setState,
    ready,
    view: effectiveView,
    validQuery: isValidSearch(state.query.trim(), state.mode),
    setView: (next: View) => {
      setChosen(next);
      setState((s) => ({ ...s, query: '', searchOpen: false }));
    },
  };
}

function viewIcon(view: View, library: Library) {
  switch (view.kind) {
    case 'mix':
      return <SparklesIcon />;
    case 'favourites':
      return <HeartIcon />;
    case 'playlist':
      return <ListMusicIcon />;
    case 'group':
      return library.groups.find((g) => g.id === view.id)?.kind === 'language' ? (
        <LanguagesIcon />
      ) : (
        <ShapesIcon />
      );
    case 'language':
      return <GlobeIcon />;
    case 'custom':
      return <RadioTowerIcon />;
    case 'search':
      return <SearchIcon />;
  }
}

/** One dropdown to switch between the random mix, favourites, own stations, playlists, groups and languages. */
export function ViewPicker({
  view,
  onChange,
  className,
}: {
  view: View;
  onChange: (v: View) => void;
  className?: string;
}) {
  const [library] = useLibrary();
  const { openCollection } = useDialogs();
  const same = (v: View) => JSON.stringify(v) === JSON.stringify(view);
  const item = (v: View, label: string, icon: React.ReactNode, extra?: React.ReactNode) => (
    <DropdownMenuItem key={JSON.stringify(v)} onClick={() => onChange(v)}>
      {icon}
      <span className="flex-1 truncate" dir="auto">
        {label}
      </span>
      {extra}
      {same(v) && <CheckIcon className="text-live" />}
    </DropdownMenuItem>
  );
  const count = (n: number) => (
    <span className="text-muted-foreground text-xs tabular-nums">{n}</span>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className={cn('min-w-0 justify-start gap-2 px-2 font-semibold', className)}
          />
        }
      >
        {viewIcon(view, library)}
        <span className="truncate" dir="auto">
          {viewLabel(view, library)}
        </span>
        <ChevronDownIcon data-icon="inline-end" className="text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[70vh] w-64 overflow-y-auto">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Discover</DropdownMenuLabel>
          {item({ kind: 'mix', language: '' }, 'Random mix', <SparklesIcon />)}
          {item({ kind: 'language', language: 'ku' }, 'Kurdish stations', <GlobeIcon />)}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <LanguagesIcon />
              By language
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="max-h-80 w-64 overflow-y-auto">
              <DropdownMenuGroup>
                {LANGUAGES.map((l) =>
                  item(
                    { kind: 'language', language: l.code },
                    l.name,
                    <span className="w-4 text-[10px] font-semibold uppercase">{l.code}</span>,
                    <span className="text-muted-foreground truncate text-xs" dir="auto">
                      {l.native}
                    </span>,
                  ),
                )}
              </DropdownMenuGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Library</DropdownMenuLabel>
          {item(
            { kind: 'favourites' },
            'Favourites',
            <HeartIcon />,
            count(library.favourites.length),
          )}
          {item(
            { kind: 'custom' },
            'My stations',
            <RadioTowerIcon />,
            count(library.customStations.length),
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Playlists</DropdownMenuLabel>
          {library.playlists.map((p) =>
            item(
              { kind: 'playlist', id: p.id },
              p.name,
              <ListMusicIcon style={p.colour ? { color: COLOUR_SWATCH[p.colour] } : undefined} />,
              count(p.stationIds.length),
            ),
          )}
          <DropdownMenuItem onClick={() => openCollection({ mode: 'create', kind: 'playlist' })}>
            <ListPlusIcon />
            New playlist…
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Groups</DropdownMenuLabel>
          {library.groups.map((g) =>
            item(
              { kind: 'group', id: g.id },
              g.name,
              g.kind === 'language' ? (
                <LanguagesIcon style={g.colour ? { color: COLOUR_SWATCH[g.colour] } : undefined} />
              ) : (
                <ShapesIcon style={g.colour ? { color: COLOUR_SWATCH[g.colour] } : undefined} />
              ),
              g.kind === 'manual' ? (
                count(g.stationIds.length)
              ) : (
                <span className="text-muted-foreground text-[10px] font-semibold uppercase">
                  {g.language}
                </span>
              ),
            ),
          )}
          <DropdownMenuItem onClick={() => openCollection({ mode: 'create', kind: 'group' })}>
            <FolderPlusIcon />
            New group…
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const LANGUAGE_ITEMS = [
  { value: '', label: 'All languages' },
  ...LANGUAGES.map((l) => ({ value: l.code, label: l.name })),
];

export function LanguageSelect({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <Select
      items={LANGUAGE_ITEMS}
      value={value}
      onValueChange={(v) => onChange((v as string) ?? '')}
    >
      <SelectTrigger size="sm" className={className} aria-label="Language">
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
  );
}

/** Search across every enabled directory, by name (exact) or by regular expression. */
export function SearchBar({
  browse,
  autoFocus,
  className,
}: {
  browse: ReturnType<typeof useBrowse>;
  autoFocus?: boolean;
  className?: string;
}) {
  const { state, setState, validQuery } = browse;
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) input.current?.focus();
  }, [autoFocus]);
  const regex = state.mode === 'regex';
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <InputGroup className="flex-1" data-invalid={!validQuery ? true : undefined}>
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          ref={input}
          dir="auto"
          type="search"
          aria-label={regex ? 'Search by regular expression' : 'Search stations'}
          aria-invalid={!validQuery}
          placeholder={regex ? '^radio.*(kurd|roj)' : 'Search stations, tags…'}
          value={state.query}
          maxLength={200}
          onChange={(e) => setState((s) => ({ ...s, query: e.target.value }))}
          onKeyDown={(e) =>
            e.key === 'Escape' && setState((s) => ({ ...s, query: '', searchOpen: false }))
          }
          className={cn(regex && 'font-mono sm:text-xs')}
        />
        <InputGroupAddon align="inline-end">
          {state.query && (
            <InputGroupButton
              size="icon-xs"
              aria-label="Clear search"
              onClick={() => setState((s) => ({ ...s, query: '' }))}
            >
              <XIcon />
            </InputGroupButton>
          )}
          <Tooltip>
            <TooltipTrigger
              render={
                <Toggle
                  size="sm"
                  aria-label="Regular expression"
                  pressed={regex}
                  onPressedChange={(p) => setState((s) => ({ ...s, mode: p ? 'regex' : 'exact' }))}
                  className="h-6 min-w-6 px-1"
                />
              }
            >
              <RegexIcon />
            </TooltipTrigger>
            <TooltipContent>
              {regex ? 'Regex search (case-insensitive)' : 'Use a regular expression'}
            </TooltipContent>
          </Tooltip>
        </InputGroupAddon>
      </InputGroup>
      <LanguageSelect
        value={state.language}
        onChange={(language) => setState((s) => ({ ...s, language }))}
        className="w-32"
      />
      {!validQuery && (
        <span role="alert" className="sr-only">
          Invalid regular expression
        </span>
      )}
    </div>
  );
}

export function ShuffleButton({
  onClick,
  label = 'New random mix',
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={label} onClick={onClick} />}
      >
        <DicesIcon />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
