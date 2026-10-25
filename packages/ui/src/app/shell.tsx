import type { ReactNode } from 'react';
import { LaptopIcon, MoonIcon, SunIcon } from 'lucide-react';
import type { Theme } from '@tajdin/core';
import { Button } from '@tajdin/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@tajdin/ui/components/dropdown-menu';
import { Toaster } from '@tajdin/ui/components/sonner';
import { TooltipProvider } from '@tajdin/ui/components/tooltip';
import { AppDataProvider, useSettings } from './data';
import { DialogProvider } from './dialogs';
import { useAppliedTheme } from './hooks';
import { PlatformProvider, type Platform } from './platform';

function Themed({ children }: { children: ReactNode }) {
  const [settings] = useSettings();
  const resolved = useAppliedTheme(settings.theme);
  return (
    <>
      {children}
      <Toaster theme={resolved} position="top-center" richColors closeButton duration={3500} />
    </>
  );
}

/** Every surface renders inside this: platform, data, theme, tooltips, dialogs and toasts. */
export function AppShell({ platform, children }: { platform: Platform; children: ReactNode }) {
  return (
    <PlatformProvider platform={platform}>
      <AppDataProvider>
        <Themed>
          <TooltipProvider delay={400}>
            <DialogProvider>{children}</DialogProvider>
          </TooltipProvider>
        </Themed>
      </AppDataProvider>
    </PlatformProvider>
  );
}

const THEME_ICON: Record<Theme, typeof SunIcon> = { system: LaptopIcon, light: SunIcon, dark: MoonIcon };

export function ThemeMenu() {
  const [settings, update] = useSettings();
  const Icon = THEME_ICON[settings.theme];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Theme: ${settings.theme}`} />}>
        <Icon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={settings.theme} onValueChange={(v) => void update({ theme: v as Theme })}>
            <DropdownMenuRadioItem value="system">
              <LaptopIcon />
              System
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="light">
              <SunIcon />
              Light
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">
              <MoonIcon />
              Dark
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
