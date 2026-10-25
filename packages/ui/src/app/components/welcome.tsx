import { XIcon } from 'lucide-react';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@tajdin/ui/components/alert';
import { Button } from '@tajdin/ui/components/button';
import { Kbd } from '@tajdin/ui/components/kbd';
import { useSettings } from '../data';

/** First-run tips. Dismissed once, remembered in settings (and so in backups). */
export function WelcomeTips({ className }: { className?: string }) {
  const [, update] = useSettings();
  return (
    <Alert className={className}>
      <AlertTitle>Bi xêr hatî · Welcome to Tajdîn</AlertTitle>
      <AlertDescription className="text-xs">
        A new random mix every time you open me. Pick a list from the menu above, tap ♥ to keep a station, and press <Kbd>Space</Kbd> to play or pause. Music keeps playing when this window closes.
      </AlertDescription>
      <AlertAction>
        <Button variant="ghost" size="icon-xs" aria-label="Dismiss tips" onClick={() => void update({ welcomeDismissed: true })}>
          <XIcon />
        </Button>
      </AlertAction>
    </Alert>
  );
}
