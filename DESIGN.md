# Tajdin Design System

> Design tokens, motion principles, and anti-slop rules for the Tajdin Chrome extension and web player.
> Based on principles from Impeccable, ibelick/ui-skills, and Emil Kowalski's design engineering philosophy.

---

## Color Tokens

### Primary Accent
- **amber-500** `#f59e0b` — primary accent for play button, focus rings, active states, volume thumb
- **amber-400** `#fbbf24` — hover state for primary accent (dark mode)
- **amber-600** `#d97706` — hover state for primary accent (light mode)

### Surface Colors
| Token | Light | Dark |
|-------|-------|------|
| Background | `neutral-100` | `neutral-950` |
| Elevated surface (cards, inputs) | `white` | `neutral-900` |
| Active tab / selected | `neutral-200` | `neutral-800` |
| Border (subtle) | `neutral-200/60` | `neutral-800/60` |
| Border (standard) | `neutral-200` | `neutral-700` |

### Text Colors
| Role | Light | Dark |
|------|-------|------|
| Primary (titles) | `neutral-900` | `neutral-100` |
| Secondary (meta, subtitles) | `neutral-600` | `neutral-500` |
| Tertiary (bitrate, hints) | `neutral-500` | `neutral-600` |
| Muted (placeholders) | `neutral-400` | `neutral-500` |

### Semantic Colors
- **Success**: `emerald-500` — equalizer bars, positive indicators
- **Error**: `red-500` — validation errors, failed states
- **Warning**: `amber-500/15` — current station ring (light), amber accent
- **Favourite**: `rose-500` (active), `rose-400` (dark active)

---

## Typography Scale

### Font Stacks
- **Latin UI**: Tailwind default (`ui-sans-serif, system-ui, sans-serif`)
- **Arabic**: `Vazirmatn` (OFL, self-hosted via `@fontsource/vazirmatn/arabic-400`)
- **Code/Monospace**: `ui-monospace, SFMono-Regular, monospace`

### Type Scale
| Element | Size | Weight | Line Height | Utility |
|---------|------|--------|-------------|---------|
| Station title (Player) | `text-sm` / `sm:text-[0.95rem]` | `font-semibold` | `leading-tight` | + `text-balance` |
| Station title (list) | `text-sm` | `font-medium` | `leading-tight` | + `text-balance` |
| Subtitle / meta | `text-xs` | `font-normal` | `leading-snug` | + `text-pretty` |
| Tab label | `text-[10px]` / `sm:text-[11px]` | `font-medium` | `leading-tight` | — |
| Data (bitrate, version) | `text-xs` | `font-normal` | `leading-snug` | + `tabular-nums` |
| Section heading (settings) | `text-lg` | `font-semibold` | `leading-tight` | + `text-balance` |
| Empty state text | `text-sm` | `font-normal` | `leading-normal` | + `text-pretty` |

### Rules
- Headings: always `text-balance` to prevent orphaned words
- Body/paragraph: always `text-pretty` for clean wrapping
- Data displays: always `tabular-nums` for aligned numbers
- Never modify `letter-spacing` (`tracking-*`) unless explicitly requested
- Arabic text: always `dir="auto"` with `tajdin-font-arabic` class

---

## Spacing Scale

Use Tailwind defaults exclusively:
- `0.25rem` per unit (1 = 4px, 1.5 = 6px, 2 = 8px, etc.)
- Consistent gaps: `gap-0.5` (2px) for tight groups, `gap-1` (4px) for standard, `gap-1.5` (6px) for loose
- Padding: `px-1 py-1` for compact rows, `px-1.5 py-1.5` for standard, `px-3 py-2` for spacious

---

## Motion Principles

### Easing Curves
```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);        /* Strong ease-out for UI interactions */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);    /* Strong ease-in-out for movement */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);     /* iOS-like drawer/sheet curve */
```

### Duration Tokens
```css
--duration-fast: 125ms;     /* Tooltips, small popovers, hover feedback */
--duration-normal: 200ms;   /* Dropdowns, modals, standard interactions */
--duration-slow: 300ms;     /* Complex transitions (max for UI elements) */
```

### The 10 Non-Negotiable Rules

1. **Justified motion** — Every animation must answer "why does this animate?" with: spatial consistency, state indication, feedback, explanation, or preventing a jarring change. "It looks cool" on a frequently-seen element is a block.

2. **Frequency-appropriate** — Keyboard-initiated and 100+/day actions get NO animation. Tens/day gets reduced motion. Occasional gets standard. Rare/first-time can have delight.

3. **Responsive easing** — Entering/exiting elements use `ease-out` or a strong custom curve. `ease-in` on UI is a block — it delays the moment the user watches most.

4. **Sub-300ms UI** — UI animations stay under 300ms. Interaction feedback stays under 200ms. Anything slower needs justification.

5. **Origin and physical correctness** — Popovers/dropdowns scale from their trigger (`transform-origin`), not center. Never animate from `scale(0)` — start from `scale(0.95)` + opacity. Modals are exempt (they stay centered).

6. **Interruptibility** — Rapidly-triggered or gesture-driven motion must be interruptible — CSS transitions or springs that retarget from current state, not keyframes that restart from zero.

7. **GPU-only properties** — Animate `transform` and `opacity` only. Never animate `width`, `height`, `margin`, `padding`, `top`, `left`.

8. **Accessibility** — `prefers-reduced-motion` is honored (gentler, not zero — keep opacity/color, drop movement). Hover animations gated behind `@media (hover: hover) and (pointer: fine)`.

9. **Asymmetric enter/exit** — Deliberate actions animate slower; system responses snap. Exit should be faster than enter (e.g., enter 200ms, exit 150ms).

10. **Cohesion** — Motion matches the component's personality and the rest of the product. When unsure whether motion feels right, the strongest move is often to delete it.

### Spring Configuration
- **Default UI**: critically damped, no overshoot — `damping: 1.0`, `response: 0.3-0.4`
- **Momentum/flick**: under-damped, slight bounce — `damping: 0.8`, `response: 0.3-0.4`
- **Keep bounce subtle** (0.1-0.3) when used. Avoid bounce in most UI contexts.

### Duration Budgets
| Element | Max Duration |
|---------|-------------|
| Button press feedback | 100-160ms |
| Tooltips, small popovers | 125-200ms |
| Dropdowns, selects | 150-250ms |
| Modals, drawers | 200-500ms |
| Marketing/explanatory | Can be longer |

---

## Component Inventory

### Buttons
- **Primary**: `bg-amber-500 text-neutral-950 rounded-full` (play button)
- **Secondary/Nav**: `rounded-md hover:bg-neutral-200/90` (light) / `hover:bg-neutral-800/90` (dark)
- **All buttons**: `active:scale-[0.97]` with `transition: transform 100ms ease-out`
- **Focus**: `focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2`

### Cards (Station rows)
- Border-bottom with surface-aware tokens
- Row hover: background shift with 150ms ease-out
- Current station: amber ring with `transition: box-shadow 200ms ease-out`
- Action icons: fade in/out on hover with `transition-opacity duration-150 ease-out`

### Inputs
- Height: `h-8`, `rounded-md`
- Border: `border-neutral-200` (light) / `border-neutral-700` (dark)
- Focus: `focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1`

### Modals
- Backdrop: `bg-black/40 backdrop-blur-sm`
- Panel entrance: `scale(0.95)` + opacity → `scale(1)` + opacity, 200ms ease-out
- Panel exit: `scale(0.95)` + opacity, 150ms (faster exit)
- `transform-origin: center` (modals are exempt from trigger-origin rule)

### Dropdowns
- Entrance: opacity 0 + `translateY(-4px)` → opacity 1 + `translateY(0)`, 125ms ease-out
- Exit: opacity 0, 75ms
- `transform-origin`: from trigger element

### Toasts
- Enter: slide in from bottom + opacity
- Exit: slide to bottom + opacity
- Spatial consistency: enter and exit from same direction

---

## Anti-Slop Rules (from Impeccable)

### Never
- Use AI beige backgrounds
- Use italic serif for headers
- Use generic CTAs ("Get started", "Learn more" without context)
- Put cards inside cards
- Use "everything equal" layouts (same size, same weight, no hierarchy)
- Use clipped labels
- Use side-tab borders as primary affordance
- Add gradient backgrounds unless explicitly requested
- Add purple or multicolor gradients
- Add glow effects as primary affordances

### Always
- Use direct, specific labels ("Browse stations" not "Browse")
- Create clear visual hierarchy (size, weight, color)
- Give empty states one clear next action
- Limit accent color usage to one per view
- Use existing theme tokens before introducing new ones
- Prefer light borders, minimal decoration, generous spacing

---

## Z-Index Scale
```css
--z-base: 0;
--z-dropdown: 100;
--z-modal: 200;
--z-toast: 300;
```

Use fixed z-index values only. No arbitrary `z-*` Tailwind classes.
