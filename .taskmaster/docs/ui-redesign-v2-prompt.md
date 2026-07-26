# Tajdîn UI/UX Redesign — Detailed Prompt

## Objective

Redesign the Tajdîn Chrome extension (and future web player) from the ground up with a modern, polished, and visually distinctive UI/UX. The redesign must preserve all existing functionality — audio playback, Radio Browser API integration, favourites, playlists, custom stations, settings, import/export, Kurdish curated stations, and the web player site — while delivering a brand-new visual identity, motion system, and interaction model informed by the latest industry-leading design skills:

- **Impeccable** (impeccable.style) — DESIGN.md token spec, anti-slop rules, surface awareness, component primitives
- **ibelick/ui-skills** — Baseline UI constraints (spacing, typography, animation, accessibility, performance)
- **emilkowalski/skills** — Emil Kowalski's animation philosophy, Apple-style spring animations, easing curves, review methodology
- **coreyhaines31/marketingskills** — Conversion-optimized copywriting, onboarding, landing page principles

## Design Principles (synthesized from all four skill sources)

### 1. Taste is trained, not innate
Every pixel, spacing value, and animation timing is a deliberate choice. Study why the best interfaces feel the way they do. Reverse-engineer interactions. Be curious.

### 2. Unseen details compound
Most details users never consciously notice — that is the point. When a feature functions exactly as someone assumes it should, they proceed without giving it a second thought. That is the goal.

### 3. Beauty is leverage
People select tools based on overall experience, not just functionality. Good defaults and good animations are real differentiators. Beauty is underutilized in software. Use it as leverage.

### 4. Anti-slop by design
No AI beige, no italic serif headers, no generic CTAs, no cards-in-cards, no clipped labels, no "everything equal" layouts. Every surface must earn its visual weight.

### 5. Motion as conversation
Animations are not decoration — they are a conversation between the user and the interface. Every animation must answer "why does this animate?" with one of: spatial consistency, state indication, feedback, explanation, or preventing a jarring change.

## Scope of Changes

### A. Design System Foundation
1. Create `DESIGN.md` at project root following Impeccable's token spec format
   - Define color tokens (primary accent, surface colors for light/dark, semantic colors)
   - Typography scale (headings: text-balance; body: text-pretty; data: tabular-nums)
   - Spacing scale aligned with Tailwind defaults
   - Easing curves as CSS custom properties (strong ease-out, ease-in-out, drawer curve)
   - Spring configuration defaults (critically damped for UI, under-damped for momentum)
   - Component inventory (buttons, cards, inputs, modals, dropdowns, tooltips)
2. Add CSS custom properties to `globals.css`:
   - `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` (strong ease-out for UI interactions)
   - `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)` (strong ease-in-out for movement)
   - `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)` (iOS-like drawer curve)
   - `--duration-fast: 125ms`, `--duration-normal: 200ms`, `--duration-slow: 300ms`
   - z-index scale tokens

### B. Animation & Motion Overhaul
3. Audit all existing `transition-*` usages and replace with specific property transitions:
   - Replace `transition-colors` → `transition-colors duration-150 ease-out` (explicit timing)
   - Never use `transition: all`
   - All UI animations ≤ 300ms; interaction feedback ≤ 200ms
4. Add `:active` scale feedback to all pressable elements:
   - Buttons: `active:scale-[0.97]` with `transition: transform 100ms ease-out`
   - Tab switches: no animation (high-frequency action — keyboard shortcut rule)
   - Dropdown/modal entrance: `ease-out` with scale from 0.95 + opacity
5. Implement `prefers-reduced-motion` globally:
   - Wrap movement animations in `@media (prefers-reduced-motion: no-preference)`
   - Reduced-motion: keep opacity/color transitions, drop transform/scale
   - Equalizer bars: reduce to static indicator in reduced-motion mode
6. Add stagger animations for station list items (30-80ms delays between items)
7. Modal/dropdown entrance: scale from `scale(0.95)` + opacity (never scale(0))
8. Toast notifications: spatial consistency (enter and exit from same direction)
9. Hover animations gated behind `@media (hover: hover) and (pointer: fine)`

### C. Component-Level Redesign
10. **StationCard**: 
    - Subtle border-bottom with surface-aware tokens
    - Row hover: background shift with 150ms ease-out (not instant)
    - Current station: amber ring with smooth transition on change
    - Action icons: consistent sizing, aria-labels, focus-visible ring
    - Favicon frame: border-radius refinement, shadow for depth
11. **Player dock**:
    - Metadata section: title with text-balance, subtitle with text-pretty
    - Transport controls: consistent 44px minimum touch targets
    - Play button: distinctive accent fill, scale on press
    - Volume slider: custom track with smooth thumb transitions
    - Equalizer overlay: refined bars with staggered animation delays
12. **TabNav**:
    - Active tab: subtle background pill with smooth color transition
    - Hover: background tint only on fine pointer
    - Settings gear: separated with subtle border
    - Icons: consistent stroke-width (1.5), proper sizing
13. **Search bar**:
    - Focus ring: 2px offset with accent color
    - Regex toggle: clear monospace `.*` with selected state
    - Placeholder text: neutral-400/500 with proper contrast
14. **Modals (AddStation, EditStation)**:
    - Backdrop: blur + dark overlay
    - Panel: scale-in from 0.95 + fade, exit reverse
    - Form inputs: consistent border-radius, focus ring, error states
    - Submit button: primary accent, disabled state
15. **Playlists**:
    - Picker list: role="listbox" with aria-selected
    - Editor card: clear rename/delete affordances
    - DnD: visual feedback during drag (shadow, scale)
    - Empty state: illustration + clear CTA
16. **Settings**:
    - Sidebar navigation: consistent with popup TabNav
    - Section headers: text-balance
    - Form controls: consistent with popup inputs
    - About page: marketing-optimized copy, clear CTAs

### D. Typography & Readability
17. Headings: `text-balance` for all h1/h2/h3
18. Body/paragraph text: `text-pretty`
19. Data displays (bitrate, version): `tabular-nums`
20. Dense UI text: `truncate` or `line-clamp-*`
21. Never modify `letter-spacing` unless explicitly requested
22. Arabic script: maintain Vazirmatn with `dir="auto"` detection

### E. Accessibility
23. All icon-only buttons must have `aria-label`
24. Focus-visible rings on all interactive elements (2px offset, accent color)
25. Keyboard navigation: logical tab order, no focus traps (except modals)
26. Modal focus management: trap focus, restore on close
27. Color contrast: minimum 4.5:1 for text, 3:1 for large text
28. Screen reader announcements for dynamic content (play state, search results)

### F. Performance
29. Never animate `width`, `height`, `margin`, `padding`, `top`, `left`
30. Only animate `transform` and `opacity` (GPU-composited properties)
31. Never apply `will-change` outside active animations
32. Never animate large `blur()` or `backdrop-filter` surfaces
33. Structural skeletons for loading states (not spinners)
34. React-virtuoso for long lists (already in place — verify performance)

### G. Marketing & Conversion (Web Player)
35. Landing/About: clear value proposition ("Always by your side · Radio Browser")
36. CTA: "Get the Chrome extension" with store link
37. Social proof: GitHub stars, user count if available
38. Footer: Made by 0xdolan · Source · Version
39. Onboarding: welcome banner with clear first action

## Constraints

- **No new runtime dependencies** unless absolutely necessary (prefer CSS/Tailwind solutions)
- **Preserve all existing functionality** — this is a visual/interaction redesign, not a feature rewrite
- **Maintain backward compatibility** with existing chrome.storage data
- **All changes must pass** `npm run ci` (lint, typecheck, test, build, verify:dist)
- **Branch from develop** as `feat/ui-redesign-v2` per git-flow rules
- **Each subtask should be a small, self-contained PR** (single concern)
- **Update `docs/development.md`** when behaviour, layout, or copy changes

## Success Criteria

1. All 59+ Impeccable anti-slop rules pass (no AI beige, no generic CTAs, no cards-in-cards)
2. All baseline-ui constraints satisfied (Tailwind defaults, specific transitions, a11y)
3. Animation review passes Emil Kowalski's 10 non-negotiable standards
4. No `transition: all`, no `scale(0)`, no `ease-in` on UI, no layout property animation
5. `prefers-reduced-motion` handled on all movement animations
6. All interactive elements have `:active` feedback
7. Typography uses `text-balance`/`text-pretty`/`tabular-nums` where appropriate
8. Empty states have one clear next action
9. `npm run ci` green; manual smoke test in Chrome light/dark
10. Visual comparison: before/after screenshots for key surfaces
