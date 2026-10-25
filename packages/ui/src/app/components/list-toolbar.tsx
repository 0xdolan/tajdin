import { FilterIcon, ListFilterIcon, RotateCcwIcon, XIcon } from 'lucide-react';
import { Button } from '@tajdin/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
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
import { cn } from '@tajdin/ui/lib/utils';
import { SORTS, type ListTools, type SortKey, type useListTools } from '../list-tools';

type Tools = ReturnType<typeof useListTools>;

/** Sort and filter menu for any station list. The button shows how many filters are on. */
export function SortFilterMenu({ list, align = 'end' }: { list: Tools; align?: 'start' | 'end' }) {
  const { tools, setTools, available, active } = list;
  const set = (patch: Partial<ListTools>) => setTools({ ...tools, ...patch });
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant={active ? 'secondary' : 'ghost'}
            size="sm"
            aria-label={active ? `Sort and filter, ${active} active` : 'Sort and filter'}
            className="relative gap-1.5"
          />
        }
      >
        <ListFilterIcon data-icon="inline-start" />
        <span className="hidden sm:inline">Sort &amp; filter</span>
        {active > 0 && (
          <span className="bg-primary text-primary-foreground rounded-full px-1.5 text-[10px] leading-4 font-semibold tabular-nums">
            {active}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={tools.sort}
            onValueChange={(v) => set({ sort: v as SortKey })}
          >
            {SORTS.map((s) => (
              <DropdownMenuRadioItem key={s.value} value={s.value}>
                {s.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Filter</DropdownMenuLabel>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled={available.languages.length === 0}>
              <FilterIcon />
              Language
              {tools.language
                ? `: ${available.languages.find((l) => l.code === tools.language)?.label ?? tools.language}`
                : ''}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="max-h-72 w-52 overflow-y-auto">
              <DropdownMenuRadioGroup
                value={tools.language}
                onValueChange={(v) => set({ language: String(v) })}
              >
                <DropdownMenuRadioItem value="">All languages</DropdownMenuRadioItem>
                {available.languages.map((l) => (
                  <DropdownMenuRadioItem key={l.code} value={l.code}>
                    <span className="flex-1 truncate">{l.label}</span>
                    <span className="text-muted-foreground text-xs tabular-nums">{l.count}</span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled={available.sources.length < 2 && !tools.source}>
              <FilterIcon />
              Source
              {tools.source
                ? `: ${available.sources.find((s) => s.id === tools.source)?.label ?? tools.source}`
                : ''}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-52">
              <DropdownMenuRadioGroup
                value={tools.source}
                onValueChange={(v) => set({ source: v as ListTools['source'] })}
              >
                <DropdownMenuRadioItem value="">All sources</DropdownMenuRadioItem>
                {available.sources.map((s) => (
                  <DropdownMenuRadioItem key={s.id} value={s.id}>
                    <span className="flex-1 truncate">{s.label}</span>
                    <span className="text-muted-foreground text-xs tabular-nums">{s.count}</span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        {active > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={list.reset}>
                <RotateCcwIcon />
                Reset sort and filters
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Filter box + sort/filter menu, used above every station list. */
export function ListToolbar({
  list,
  placeholder = 'Filter this list…',
  className,
  count,
}: {
  list: Tools;
  placeholder?: string;
  className?: string;
  /** Shown as "12 of 40" when filters hide stations. */
  count?: { shown: number; total: number };
}) {
  const { tools, setTools } = list;
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <InputGroup className="h-8 flex-1">
        <InputGroupAddon>
          <FilterIcon />
        </InputGroupAddon>
        <InputGroupInput
          dir="auto"
          aria-label={placeholder}
          placeholder={placeholder}
          value={tools.text}
          maxLength={100}
          onChange={(e) => setTools({ ...tools, text: e.target.value })}
          onKeyDown={(e) => e.key === 'Escape' && setTools({ ...tools, text: '' })}
        />
        {tools.text && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              aria-label="Clear filter"
              onClick={() => setTools({ ...tools, text: '' })}
            >
              <XIcon />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
      {count && count.shown !== count.total && (
        <span className="text-muted-foreground shrink-0 text-xs tabular-nums" aria-live="polite">
          {count.shown} of {count.total}
        </span>
      )}
      <SortFilterMenu list={list} />
    </div>
  );
}
