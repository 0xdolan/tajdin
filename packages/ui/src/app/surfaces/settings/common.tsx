import type { ReactNode } from 'react';
import { cn } from '@tajdin/ui/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@tajdin/ui/components/card';
import { Field, FieldContent, FieldDescription, FieldLabel } from '@tajdin/ui/components/field';

export function Section({
  title,
  description,
  children,
  action,
}: {
  title: ReactNode;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent className="flex flex-col gap-5">{children}</CardContent>
    </Card>
  );
}

/**
 * A label + description with its control. On wide screens the control sits on the right; on
 * phones it drops below the text and takes the full width. `inline` keeps small controls
 * (switches) beside the text at every size.
 */
export function SettingRow({
  id,
  label,
  description,
  children,
  inline = false,
}: {
  id?: string;
  label: string;
  description?: ReactNode;
  children: ReactNode;
  inline?: boolean;
}) {
  return (
    <Field
      orientation="vertical"
      className={cn(
        'gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:*:w-auto',
        inline && 'flex-row items-center justify-between gap-4 *:w-auto',
      )}
    >
      <FieldContent className="min-w-0">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FieldContent>
      <div className={cn('min-w-0', inline ? 'shrink-0' : 'w-full sm:w-auto sm:shrink-0')}>
        {children}
      </div>
    </Field>
  );
}
